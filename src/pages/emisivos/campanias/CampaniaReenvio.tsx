// CampaniaReenvio.tsx — ventana "¿A quiénes se lo reenviás?" (pedido de Nico 13/10). Muestra cuántas personas entran en
// cada opción (emisivos trae antes aperturas, clicks y bajas del tracker) y crea la campaña nueva, solo de mail, en LISTA.
// Las bajas quedan afuera siempre. La campaña nueva se abre en el paso Destinatarios para revisarla, probarla y enviarla.

import { useEffect, useState } from 'react';
import { FaRedo, FaTimes } from 'react-icons/fa';
import { crearReenvio, opcionesReenvio } from './campanias.api';
import type { Campania, OpcionReenvio, SegmentoReenvio } from './campanias.api';
import { SEGMENTOS_REENVIO, numero } from './campaniasOpciones';

interface ReenvioProps {
  campania: Campania;
  onCerrar: () => void;
  onCreado: (nueva: Campania, mensaje: string) => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
}

const CampaniaReenvio = ({ campania, onCerrar, onCreado, onAviso }: ReenvioProps) => {
  const [opciones, setOpciones] = useState<OpcionReenvio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState<SegmentoReenvio | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    let vigente = true;
    opcionesReenvio(campania.id)
      .then((datos) => {
        if (!vigente) return;
        setOpciones(datos);
        // Queda elegida la primera opción que tenga gente (en el orden de la lista).
        const primera = SEGMENTOS_REENVIO.find((s) => datos.some((o) => o.segmento === s.valor && o.disponible && o.cantidad > 0));
        setElegido(primera?.valor ?? null);
      })
      .catch((err: unknown) => {
        if (vigente) setError(err instanceof Error ? err.message : 'Error de conexión');
      });
    return () => {
      vigente = false;
    };
  }, [campania.id]);

  const crear = async () => {
    if (!elegido) return;
    setCreando(true);
    try {
      const respuesta = await crearReenvio(campania.id, elegido);
      if (!respuesta.data) throw new Error('Emisivos no devolvió la campaña nueva');
      onCreado(respuesta.data, respuesta.meta?.message || 'Reenvío creado');
    } catch (err) {
      onAviso('error', err instanceof Error ? err.message : 'Error de conexión');
      setCreando(false);
    }
  };

  return (
    <div className="campanias-modal-overlay">
      <div className="campanias-modal" role="dialog" aria-modal="true" aria-labelledby="campanias-reenvio-titulo">
        <div className="campanias-modal-header">
          <h2 id="campanias-reenvio-titulo">
            ¿A quiénes se lo reenviás? <span className="campanias-modal-subtitulo">#{campania.id} {campania.nombre}</span>
          </h2>
          <button type="button" className="campanias-btn campanias-btn-secundario campanias-btn-chico" onClick={onCerrar} aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="campanias-form">
          <p className="campanias-ayuda">
            Se crea una campaña nueva, solo de mail, con el mismo contenido. Los que se dieron de baja quedan afuera siempre. Después podés
            revisar la lista, quitar o agregar gente, y mandar la prueba antes de enviar.
          </p>

          {error && <p className="campanias-error">{error}</p>}
          {!error && !opciones && <p className="campanias-estado">Trayendo aperturas y bajas del seguimiento de mails...</p>}

          {opciones && (
            <div className="campanias-reenvio-opciones" role="radiogroup" aria-label="A quiénes reenviar">
              {SEGMENTOS_REENVIO.map((segmento) => {
                const opcion = opciones.find((o) => o.segmento === segmento.valor);
                const cantidad = opcion?.cantidad ?? 0;
                const habilitada = Boolean(opcion?.disponible) && cantidad > 0;
                const motivo = !opcion?.disponible ? segmento.noDisponible : cantidad === 0 ? 'No hay nadie en este grupo.' : '';
                return (
                  <label
                    key={segmento.valor}
                    className={`campanias-reenvio-opcion ${elegido === segmento.valor ? 'campanias-reenvio-opcion-activa' : ''} ${habilitada ? '' : 'campanias-reenvio-opcion-apagada'}`}
                  >
                    <input
                      type="radio"
                      name="segmento-reenvio"
                      value={segmento.valor}
                      checked={elegido === segmento.valor}
                      onChange={() => setElegido(segmento.valor)}
                      disabled={!habilitada || creando}
                    />
                    <span className="campanias-reenvio-texto">
                      <strong>
                        {segmento.titulo}
                        {opcion?.disponible ? ` (${numero(cantidad)})` : ''}
                      </strong>
                      <span className="campanias-ayuda">{motivo || segmento.ayuda}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="campanias-modal-acciones">
            <button type="button" className="campanias-btn campanias-btn-secundario" onClick={onCerrar} disabled={creando}>
              Cancelar
            </button>
            <button type="button" className="campanias-btn campanias-btn-primario" onClick={() => void crear()} disabled={!elegido || creando}>
              <FaRedo /> {creando ? 'Creando...' : 'Crear el reenvío'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaniaReenvio;
