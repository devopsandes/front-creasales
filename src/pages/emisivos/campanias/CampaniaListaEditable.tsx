// CampaniaListaEditable.tsx — tabla de la lista en el paso "Destinatarios" (pedido de Nico 13/10): buscar, quitar o volver
// a poner a una persona y agregar DNIs/CUILs/mails sin resubir el Excel. Solo con la campaña en LISTA (sin enviar).
// Quitar no borra: la persona queda "quitada a mano" y no le llega nada. Ninguna de estas acciones pide prueba nueva.

import { useState } from 'react';
import type { FormEvent } from 'react';
import { FaPlus, FaUndo, FaUserMinus } from 'react-icons/fa';
import { agregarDestinatarios, obtenerCampania, quitarDestinatario, restaurarDestinatario } from './campanias.api';
import type { Campania, DestinatarioFila } from './campanias.api';
import { FILTROS_LISTA, MAX_AGREGAR, cruzaConPadron, numero } from './campaniasOpciones';
import { useListaPersonas } from './useListaPersonas';
import { BuscadorPersonas, PaginadoPersonas } from './ListaPersonasControles';

interface ListaEditableProps {
  campania: Campania;
  onCampania: (campania: Campania) => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
}

const estadoEnCriollo = (fila: DestinatarioFila): string => {
  if (fila.estadoLista === 'OK') return fila.motivo ? `No recibe el mail: ${fila.motivo}` : 'Recibe';
  return fila.motivo ?? 'No recibe';
};

const CampaniaListaEditable = ({ campania, onCampania, onAviso }: ListaEditableProps) => {
  const lista = useListaPersonas(campania.id, campania.updatedAt);
  const { filas, buscar, filtro, cargando, error } = lista;
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);
  const [textoAgregar, setTextoAgregar] = useState('');
  const [agregando, setAgregando] = useState(false);

  const esAfiliados = campania.tipoDestinatario === 'afiliados';
  // Ex afiliados: se cruzan con el padrón como afiliados (no encontrados = descartados), pero sin la columna de la app.
  const conPadron = cruzaConPadron(campania.tipoDestinatario);

  const cambiar = async (fila: DestinatarioFila, accion: 'quitar' | 'restaurar') => {
    setOcupadoId(fila.id);
    try {
      const respuesta = accion === 'quitar' ? await quitarDestinatario(campania.id, fila.id) : await restaurarDestinatario(campania.id, fila.id);
      onAviso('success', respuesta.meta?.message || (accion === 'quitar' ? 'Quitada de la lista' : 'Vuelve a estar en la lista'));
      onCampania(await obtenerCampania(campania.id));
    } catch (err) {
      onAviso('error', err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      lista.recargar();
      setOcupadoId(null);
    }
  };

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    const lineas = textoAgregar.split(/\r?\n/).filter((linea) => linea.trim() !== '').length;
    if (lineas === 0) return;
    if (lineas > MAX_AGREGAR + 1) {
      onAviso('error', `Se pueden agregar hasta ${numero(MAX_AGREGAR)} personas por vez. Para más, subí el Excel completo.`);
      return;
    }
    setAgregando(true);
    try {
      const respuesta = await agregarDestinatarios(campania.id, textoAgregar);
      if (respuesta.data) onCampania(respuesta.data);
      onAviso('success', respuesta.meta?.message || 'Agregando personas');
      setTextoAgregar('');
    } catch (err) {
      onAviso('error', err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="campanias-lista-editable">
      <strong className="campanias-tabla-titulo">Personas de la lista</strong>
      <p className="campanias-ayuda">
        Podés quitar a alguien (no le llega nada y lo podés volver a poner) o agregar personas sin volver a subir el Excel. No hace falta
        mandar otra prueba.
      </p>

      <BuscadorPersonas
        valor={lista.buscarEscrito}
        onCambiar={lista.setBuscarEscrito}
        filtros={FILTROS_LISTA.filter((f) => conPadron || f.valor !== 'descartados')}
        filtro={filtro}
        onFiltro={lista.setFiltro}
      />

      {error && <p className="campanias-error">{error}</p>}

      <div className="campanias-tabla-marco">
        <table className="campanias-tabla">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Mail</th>
              {esAfiliados && <th>App</th>}
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id} className={fila.estadoLista === 'OK' ? '' : 'campanias-fila-apagada'}>
                <td>{fila.dni ?? fila.cuil ?? '—'}</td>
                <td>{fila.nombre ?? '—'}</td>
                <td>{fila.email ?? '—'}</td>
                {esAfiliados && <td>{fila.tieneApp ? 'Sí' : 'No'}</td>}
                <td className="campanias-celda-estado">{estadoEnCriollo(fila)}</td>
                <td>
                  {fila.estadoLista === 'OK' && (
                    <button
                      type="button"
                      className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                      onClick={() => void cambiar(fila, 'quitar')}
                      disabled={ocupadoId !== null}
                    >
                      <FaUserMinus /> Quitar
                    </button>
                  )}
                  {fila.estadoLista === 'QUITADO' && (
                    <button
                      type="button"
                      className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                      onClick={() => void cambiar(fila, 'restaurar')}
                      disabled={ocupadoId !== null}
                    >
                      <FaUndo /> Volver a poner
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan={esAfiliados ? 6 : 5}>{buscar || filtro !== 'todos' ? 'Nadie coincide con la búsqueda.' : 'La lista está vacía.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginadoPersonas total={lista.total} pagina={lista.pagina} paginas={lista.paginas} cargando={cargando} onPagina={lista.setPagina} />

      <form className="campanias-lista-agregar" onSubmit={agregar}>
        <label className="campanias-label">
          Agregar personas{' '}
          <span className="campanias-ayuda">
            (una por línea: DNI, CUIL o mail; hasta {numero(MAX_AGREGAR)}.{' '}
            {conPadron
              ? 'Se cruzan con el padrón igual que la lista. Si alguien ya estaba de baja, no encontrado o quitado, se lo vuelve a cruzar.'
              : 'A prestadores, cada una necesita su mail. Si ya está en la lista (por CUIT o por mail), no se repite.'}
            )
          </span>
          <textarea
            className="campanias-input campanias-textarea"
            rows={3}
            placeholder={'30111222\n20-30111223-4\nalguien@gmail.com'}
            value={textoAgregar}
            onChange={(e) => setTextoAgregar(e.target.value)}
            disabled={agregando}
          />
        </label>
        <div className="campanias-modal-acciones">
          <button type="submit" className="campanias-btn campanias-btn-secundario" disabled={agregando || textoAgregar.trim() === ''}>
            <FaPlus /> {agregando ? 'Enviando...' : 'Agregar a la lista'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaniaListaEditable;
