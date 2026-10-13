// BannerListaDnis.tsx — ventana "Lista de DNIs" de un banner (pedido de Nico 13/10): agregar y quitar DNIs pegados y
// buscar si un DNI está, sin resubir el archivo. La lista completa NUNCA se muestra (sale de emisivos solo la cantidad):
// las rutas son abiertas y la lista no tiene que poder bajarse (decisión del 28/09, ver docs/banners.md en Emisivos).

import { useState } from 'react';
import type { FormEvent } from 'react';
import { FaMinus, FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { buscarDniBanner, cambiarDnisBanner } from './banner.api';
import type { Banner } from './banner.api';
import { useConfirmacion } from './useConfirmacion';

interface ListaDnisProps {
  banner: Banner;
  onCerrar: () => void;
  /** Se llama con el banner actualizado (cantidadDnis nueva) y el mensaje de lo que cambió. */
  onCambiado: (banner: Banner, mensaje: string) => void;
}

const lineasCon = (texto: string) => texto.split(/\r?\n/).filter((linea) => linea.trim() !== '').length;

const BannerListaDnis = ({ banner, onCerrar, onCambiado }: ListaDnisProps) => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [cantidad, setCantidad] = useState(banner.cantidadDnis);
  const [dniBuscado, setDniBuscado] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState<{ dni: string; esta: boolean } | null>(null);
  const [textoAgregar, setTextoAgregar] = useState('');
  const [textoQuitar, setTextoQuitar] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    if (!dniBuscado.trim()) return;
    setOcupado(true);
    setError(null);
    try {
      setResultadoBusqueda({ dni: dniBuscado.trim(), esta: await buscarDniBanner(banner.id, dniBuscado) });
    } catch (err) {
      setResultadoBusqueda(null);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setOcupado(false);
    }
  };

  const cambiar = async (accion: 'agregar' | 'quitar') => {
    const texto = accion === 'agregar' ? textoAgregar : textoQuitar;
    if (!texto.trim()) return;
    const n = lineasCon(texto);
    // Agregar a un banner SIN lista cambia a quién le sale: de todos a solo esos DNIs. Emisivos lo exige con crearLista
    // (si otra operadora quitó la lista mientras esta ventana estaba abierta, responde 409 en vez de crearla sola).
    const crearLista = accion === 'agregar' && cantidad === 0;
    if (crearLista) {
      const ok = await confirmar({
        titulo: 'Crear la lista de DNIs',
        mensaje: 'Hoy este banner le sale a todos los que cumplan el plan, la provincia y la edad. Con la lista, le va a salir SOLO a esos DNIs.',
        textoConfirmar: 'Crear la lista',
      });
      if (!ok) return;
    }
    if (accion === 'quitar') {
      const ok = await confirmar({
        titulo: 'Quitar DNIs',
        mensaje: `Se van a quitar de la lista ${n === 1 ? 'el DNI pegado' : `los ${n} DNIs pegados`}: dejan de ver este banner.`,
        textoConfirmar: 'Quitar',
      });
      if (!ok) return;
    }
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const respuesta = await cambiarDnisBanner(banner.id, accion === 'agregar' ? { agregar: texto, crearLista } : { quitar: texto });
      if (respuesta.data) {
        setCantidad(respuesta.data.cantidadDnis);
        onCambiado(respuesta.data, respuesta.meta?.message || 'Lista actualizada');
      }
      setAviso(respuesta.meta?.message || 'Lista actualizada');
      if (accion === 'agregar') setTextoAgregar('');
      else setTextoQuitar('');
      setResultadoBusqueda(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="banner-modal-overlay">
      {ventanaConfirmacion}
      <div className="banner-modal banner-modal-chico" role="dialog" aria-modal="true" aria-labelledby="banner-lista-titulo">
        <div className="banner-modal-header">
          <h2 id="banner-lista-titulo">
            Lista de DNIs · Banner #{banner.id} {banner.titulo ? `· ${banner.titulo}` : ''}
          </h2>
          <button type="button" className="banner-btn banner-btn-secundario banner-btn-chico" onClick={onCerrar} aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="banner-form banner-lista-dnis">
          <p className="banner-lista-cantidad">
            {cantidad > 0 ? (
              <>
                Este banner le sale a <strong>{cantidad.toLocaleString('es-AR')}</strong> {cantidad === 1 ? 'DNI' : 'DNIs'}.
              </>
            ) : (
              <>Este banner no tiene lista: le sale a todos los que cumplan el plan, la provincia y la edad.</>
            )}
          </p>
          <p className="banner-ayuda">
            Por seguridad la lista completa no se muestra. Podés buscar un DNI, agregar o quitar pegándolos (uno por línea; sirven con
            puntos o el CUIL).
          </p>

          {error && <p className="banner-error">{error}</p>}
          {aviso && !error && <p className="banner-exito">{aviso}</p>}

          {cantidad > 0 && (
            <form className="banner-lista-seccion" onSubmit={buscar}>
              <span className="banner-sublabel">Buscar un DNI</span>
              <div className="banner-lista-buscar">
                <input
                  className="banner-input"
                  value={dniBuscado}
                  onChange={(e) => {
                    setDniBuscado(e.target.value);
                    setResultadoBusqueda(null);
                  }}
                  placeholder="30111222"
                  aria-label="DNI a buscar"
                />
                <button type="submit" className="banner-btn banner-btn-secundario" disabled={ocupado || !dniBuscado.trim()}>
                  <FaSearch /> Buscar
                </button>
              </div>
              {resultadoBusqueda && (
                <p className={resultadoBusqueda.esta ? 'banner-exito' : 'banner-aviso'} role="status">
                  {resultadoBusqueda.esta ? `Sí, ${resultadoBusqueda.dni} está en la lista.` : `No, ${resultadoBusqueda.dni} no está en la lista.`}
                </p>
              )}
            </form>
          )}

          <div className="banner-lista-seccion">
            <span className="banner-sublabel">Agregar DNIs</span>
            <textarea
              className="banner-input banner-textarea"
              rows={4}
              placeholder={'30111222\n30.111.223'}
              value={textoAgregar}
              onChange={(e) => setTextoAgregar(e.target.value)}
              disabled={ocupado}
            />
            <div className="banner-modal-acciones">
              <button type="button" className="banner-btn banner-btn-primario" onClick={() => void cambiar('agregar')} disabled={ocupado || !textoAgregar.trim()}>
                <FaPlus /> Agregar a la lista
              </button>
            </div>
          </div>

          {cantidad > 0 && (
            <div className="banner-lista-seccion">
              <span className="banner-sublabel">Quitar DNIs</span>
              <textarea
                className="banner-input banner-textarea"
                rows={4}
                placeholder="30111222"
                value={textoQuitar}
                onChange={(e) => setTextoQuitar(e.target.value)}
                disabled={ocupado}
              />
              <div className="banner-modal-acciones">
                <button type="button" className="banner-btn banner-btn-peligro" onClick={() => void cambiar('quitar')} disabled={ocupado || !textoQuitar.trim()}>
                  <FaMinus /> Quitar de la lista
                </button>
              </div>
              <p className="banner-ayuda">
                La lista no puede quedar vacía (el banner le saldría a todos). Si ya no va, pausalo o borralo; para que le salga a todos, usá
                "Quitar la lista de DNIs" en Editar.
              </p>
            </div>
          )}

          <div className="banner-modal-acciones">
            <button type="button" className="banner-btn banner-btn-secundario" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerListaDnis;
