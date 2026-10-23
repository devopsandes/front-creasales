// Campanias.tsx — pestaña "Campañas" de Emisivos: el equipo de Andes arma y manda campañas de push, mail y banner a afiliados
// o prestadores, y ve las estadísticas por persona y por canal. Pedido de Gino (09/10/2026).
// Backend: rutas /campanias de emisivos (docs/campanias.md en el repo de Emisivos).

import { useCallback, useEffect, useState } from 'react';
import {
  FaChartBar,
  FaCheckCircle,
  FaEdit,
  FaPause,
  FaPlay,
  FaPlus,
  FaRedo,
  FaStepForward,
  FaSync,
  FaTimesCircle,
  FaTrash,
  FaBan,
} from 'react-icons/fa';
import CampaniaAsistente from './CampaniaAsistente';
import CampaniaEstadisticas from './CampaniaEstadisticas';
import CampaniaReenvio from './CampaniaReenvio';
import { borrarCampania, cancelarCampania, listarCampanias, pausarCampania, reanudarCampania } from './campanias.api';
import type { Campania } from './campanias.api';
import {
  anchoBarra,
  canalesActivos,
  claseEstado,
  esEditable,
  etiquetaEstado,
  etiquetaTipo,
  fechaCorta,
  fechaHora,
  numero,
} from './campaniasOpciones';
import './Campanias.css';
import { useConfirmacion } from '../useConfirmacion';

/** Qué modal está abierto (uno solo a la vez). */
type Modal =
  | { tipo: 'ninguno' }
  /** campania null = campaña nueva */
  | { tipo: 'asistente'; campania: Campania | null; paso: number }
  | { tipo: 'estadisticas'; campania: Campania }
  | { tipo: 'reenvio'; campania: Campania };

/** Cada cuánto se refresca el listado si hay campañas en movimiento. */
const REFRESCO_MS = 10000;

/** Paso del asistente al que lleva "Continuar": lo siguiente que falta hacer. */
const pasoParaContinuar = (campania: Campania): number => {
  // Si no está en LISTA (procesando, o volvió a BORRADOR con errorLista) o falló un "Agregar personas", se abre en el paso
  // de la lista, donde se ve el error.
  if (campania.estado !== 'LISTA' || !campania.resumen || campania.errorLista) return 3;
  return campania.pruebaVigente ? 5 : 4;
};

const Campanias = () => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState<Modal>({ tipo: 'ninguno' });

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const showToastMessage = useCallback((type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }, []);

  /** silencioso = refresco automático: no muestra "Cargando" ni pisa el error con otro. */
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setCargando(true);
      setError(null);
    }
    try {
      setCampanias(await listarCampanias());
    } catch (err) {
      if (!silencioso) setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Con campañas enviándose o procesando la lista, el listado se actualiza solo (si no hay un modal que las esté mirando).
  const hayMovimiento = campanias.some((c) => c.estado === 'ENVIANDO' || c.estado === 'PROCESANDO_LISTA');
  const sinModal = modal.tipo === 'ninguno';
  useEffect(() => {
    if (!hayMovimiento || !sinModal) return;
    const temporizador = setInterval(() => void cargar(true), REFRESCO_MS);
    return () => clearInterval(temporizador);
  }, [hayMovimiento, sinModal, cargar]);

  /** Corre una acción sobre emisivos, avisa el resultado (el mensaje del backend, si vino) y vuelve a cargar el listado. */
  const ejecutar = async (accion: () => Promise<{ meta?: { message?: string } }>, mensajeOk: string) => {
    setOcupado(true);
    try {
      const respuesta = await accion();
      showToastMessage('success', respuesta?.meta?.message || mensajeOk);
      await cargar(true);
    } catch (err) {
      showToastMessage('error', err instanceof Error ? err.message : 'Error de conexión');
      // Como en Banner: la lista pudo quedar vieja (otra persona la cambió), se recarga igual.
      await cargar(true);
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = async (campania: Campania) => {
    const confirmado = await confirmar({
      titulo: `Cancelar la campaña #${campania.id}`,
      mensaje: 'No se manda nada más (lo que ya salió queda en las estadísticas) y no se puede reanudar.',
      textoConfirmar: 'Cancelar la campaña',
      textoCancelar: 'Volver',
    });
    if (!confirmado) return;
    void ejecutar(() => cancelarCampania(campania.id), 'Campaña cancelada');
  };

  const borrar = async (campania: Campania) => {
    const confirmado = await confirmar({
      titulo: `Borrar la campaña #${campania.id}`,
      mensaje: `"${campania.nombre}" se borra y no se puede recuperar.`,
      textoConfirmar: 'Borrar',
    });
    if (!confirmado) return;
    void ejecutar(() => borrarCampania(campania.id), 'Campaña borrada');
  };

  /** Reenvío creado (en la ventana CampaniaReenvio): se abre en el paso Destinatarios para revisar la lista y después probar. */
  const alCrearReenvio = (nueva: Campania, mensaje: string) => {
    showToastMessage('success', mensaje);
    setModal({ tipo: 'asistente', campania: nueva, paso: 3 });
    void cargar(true);
  };

  const cerrarModal = () => {
    setModal({ tipo: 'ninguno' });
    void cargar(true);
  };

  const alEnviar = (campania: Campania) => {
    showToastMessage('success', 'Enviando la campaña. Mirá cómo va en las estadísticas.');
    setModal({ tipo: 'estadisticas', campania });
    void cargar(true);
  };

  return (
    <div className="campanias-container">
      {ventanaConfirmacion}
      <div className="campanias-header">
        <div>
          <h1 className="campanias-title">Campañas</h1>
          <p className="campanias-subtitle">
            Mandá push, mail y banner a afiliados (o mail a prestadores y ex afiliados) con una lista de DNIs, CUILs o mails. Antes de enviar a todos hay
            que mandar una prueba del mismo contenido. Después ves cuántos lo recibieron, lo leyeron y lo abrieron.
          </p>
        </div>
        <div className="campanias-header-acciones">
          <button className="campanias-btn campanias-btn-secundario" onClick={() => void cargar()} disabled={cargando || ocupado}>
            <FaSync /> Actualizar
          </button>
          <button
            className="campanias-btn campanias-btn-primario"
            onClick={() => setModal({ tipo: 'asistente', campania: null, paso: 1 })}
            disabled={ocupado}
          >
            <FaPlus /> Nueva campaña
          </button>
        </div>
      </div>

      {error && <div className="campanias-error">{error}</div>}
      {cargando && campanias.length === 0 && <p className="campanias-estado">Cargando campañas...</p>}
      {!cargando && !error && campanias.length === 0 && (
        <p className="campanias-estado">Todavía no hay campañas. Creá la primera con "Nueva campaña".</p>
      )}

      <ul className="campanias-lista">
        {campanias.map((campania) => {
          const { estado } = campania;
          const sinEnviar = !campania.enviadaAt;
          const puedeEditar = esEditable(estado);
          const verEstadisticas = !puedeEditar && estado !== 'PROCESANDO_LISTA';
          const puedeReenviar = campania.canales.mail && Boolean(campania.enviadaAt) && ['TERMINADA', 'PAUSADA', 'CANCELADA'].includes(estado);
          const progreso = campania.progresoLista;
          return (
            <li key={campania.id} className={`campanias-item ${estado === 'CANCELADA' ? 'campanias-item-apagada' : ''}`}>
              <div className="campanias-info">
                <div className="campanias-info-titulo">
                  <span>
                    #{campania.id} {campania.nombre}
                  </span>
                  <span className={`campanias-badge campanias-badge-${claseEstado(estado)}`}>{etiquetaEstado(estado)}</span>
                </div>
                <div className="campanias-chips" aria-label="Canales">
                  {canalesActivos(campania).map((canal) => (
                    <span key={canal.valor} className={`campanias-chip campanias-chip-${canal.valor}`}>
                      {canal.etiqueta}
                    </span>
                  ))}
                </div>
                <div className="campanias-info-linea">
                  {etiquetaTipo(campania.tipoDestinatario)}
                  {campania.resumen?.personas !== undefined
                    ? ` · ${numero(campania.resumen.personas)} ${campania.resumen.personas === 1 ? 'persona' : 'personas'}`
                    : ' · Sin lista todavía'}
                  {campania.enviadaAt
                    ? ` · Enviada el ${fechaHora(campania.enviadaAt)}`
                    : fechaCorta(campania.createdAt)
                      ? ` · Creada el ${fechaCorta(campania.createdAt)}`
                      : ''}
                  {campania.campaniaOrigenId ? ` · Reenvío de #${campania.campaniaOrigenId}` : ''}
                </div>
                {estado === 'PROCESANDO_LISTA' && progreso && (
                  <div className="campanias-avance">
                    <div
                      className="campanias-barra"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={anchoBarra(progreso.hechos, progreso.total)}
                      aria-label="Avance de la lista"
                    >
                      <div className="campanias-barra-relleno" style={{ width: `${anchoBarra(progreso.hechos, progreso.total)}%` }} />
                    </div>
                    <span className="campanias-info-linea">
                      {numero(progreso.hechos)} de {numero(progreso.total)}
                    </span>
                  </div>
                )}
                {campania.errorLista && (estado === 'PAUSADA' || estado === 'BORRADOR' || estado === 'LISTA') && (
                  <div className="campanias-info-linea campanias-info-aviso">{campania.errorLista}</div>
                )}
              </div>

              <div className="campanias-acciones">
                {puedeEditar && (
                  <>
                    <button
                      className="campanias-btn campanias-btn-primario campanias-btn-chico"
                      onClick={() => setModal({ tipo: 'asistente', campania, paso: pasoParaContinuar(campania) })}
                      disabled={ocupado}
                    >
                      <FaStepForward /> Continuar
                    </button>
                    <button
                      className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                      onClick={() => setModal({ tipo: 'asistente', campania, paso: 1 })}
                      disabled={ocupado}
                    >
                      <FaEdit /> Editar
                    </button>
                  </>
                )}
                {estado === 'PROCESANDO_LISTA' && (
                  <button
                    className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                    onClick={() => setModal({ tipo: 'asistente', campania, paso: 3 })}
                    disabled={ocupado}
                  >
                    <FaSync /> Ver avance
                  </button>
                )}
                {verEstadisticas && (
                  <button
                    className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                    onClick={() => setModal({ tipo: 'estadisticas', campania })}
                    disabled={ocupado}
                  >
                    <FaChartBar /> Ver estadísticas
                  </button>
                )}
                {estado === 'ENVIANDO' && (
                  <button
                    className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                    onClick={() => void ejecutar(() => pausarCampania(campania.id), 'Campaña pausada')}
                    disabled={ocupado}
                  >
                    <FaPause /> Pausar
                  </button>
                )}
                {estado === 'PAUSADA' && (
                  <button
                    className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                    onClick={() => void ejecutar(() => reanudarCampania(campania.id), 'Campaña reanudada')}
                    disabled={ocupado}
                  >
                    <FaPlay /> Reanudar
                  </button>
                )}
                {(estado === 'ENVIANDO' || estado === 'PAUSADA') && (
                  <button className="campanias-btn campanias-btn-peligro campanias-btn-chico" onClick={() => cancelar(campania)} disabled={ocupado}>
                    <FaBan /> Cancelar
                  </button>
                )}
                {puedeReenviar && (
                  <button
                    className="campanias-btn campanias-btn-secundario campanias-btn-chico"
                    onClick={() => setModal({ tipo: 'reenvio', campania })}
                    disabled={ocupado}
                    title="Campaña nueva de mail: elegís a quiénes (no abrieron, todos, sin click o sin app)"
                  >
                    <FaRedo /> Reenviar…
                  </button>
                )}
                {sinEnviar && estado !== 'PROCESANDO_LISTA' && (
                  <button className="campanias-btn campanias-btn-peligro campanias-btn-chico" onClick={() => borrar(campania)} disabled={ocupado}>
                    <FaTrash /> Borrar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {modal.tipo === 'asistente' && (
        <CampaniaAsistente
          campania={modal.campania}
          pasoInicial={modal.paso}
          onCerrar={cerrarModal}
          onAviso={showToastMessage}
          onEnviada={alEnviar}
        />
      )}
      {modal.tipo === 'estadisticas' && (
        <CampaniaEstadisticas campania={modal.campania} onCerrar={cerrarModal} onAviso={showToastMessage} />
      )}
      {modal.tipo === 'reenvio' && (
        <CampaniaReenvio campania={modal.campania} onCerrar={cerrarModal} onCreado={alCrearReenvio} onAviso={showToastMessage} />
      )}

      {showToast && (
        <div className={`emisivos-toast ${toastType === 'success' ? 'emisivos-toast-success' : 'emisivos-toast-error'}`}>
          <div className="emisivos-toast-content">
            {toastType === 'success' ? <FaCheckCircle className="emisivos-toast-icon" /> : <FaTimesCircle className="emisivos-toast-icon" />}
            <span className="emisivos-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campanias;
