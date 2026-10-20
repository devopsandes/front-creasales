// Encuestas.tsx — pestaña "Encuestas" de Emisivos: encuestas para los afiliados de Andes Salud.
// Pedido de Karen (08/10/2026). El afiliado responde en la app (tarjeta + banner con pantalla "encuesta") o en la web.
// Backend: rutas /encuestas de emisivos (docs/encuestas.md en el repo de Emisivos).

import { useCallback, useEffect, useState } from 'react';
import {
  FaChartBar,
  FaCheckCircle,
  FaClone,
  FaEdit,
  FaExternalLinkAlt,
  FaLink,
  FaListUl,
  FaPause,
  FaPlay,
  FaPlus,
  FaSync,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import EncuestaForm from './EncuestaForm';
import EncuestaLista from './EncuestaLista';
import EncuestaResultados from './EncuestaResultados';
import {
  borrarEncuesta,
  cambiarActivaEncuesta,
  duplicarEncuesta,
  listarEncuestas,
  obtenerEncuesta,
} from './encuestas.api';
import type { Encuesta, ResumenEncuesta } from './encuestas.api';
import { audienciaDe, fechaCorta, linkEncuestaWeb, nombreAudiencia, porcentaje, textoAvance } from './encuestasOpciones';
import './Encuestas.css';
import { useConfirmacion } from '../useConfirmacion';

/** Qué modal está abierto (uno solo a la vez). */
type Modal =
  | { tipo: 'ninguno' }
  /** encuesta null = encuesta nueva */
  | { tipo: 'formulario'; encuesta: Encuesta | null }
  | { tipo: 'lista'; encuesta: ResumenEncuesta }
  | { tipo: 'resultados'; encuesta: ResumenEncuesta };

const Encuestas = () => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [encuestas, setEncuestas] = useState<ResumenEncuesta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState<Modal>({ tipo: 'ninguno' });

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEncuestas(await listarEncuestas());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Corre una acción sobre emisivos, avisa el resultado (el mensaje del backend, si vino) y vuelve a cargar el listado. */
  const ejecutar = async (accion: () => Promise<{ meta?: { message?: string } }>, mensajeOk: string) => {
    setOcupado(true);
    try {
      const respuesta = await accion();
      showToastMessage('success', respuesta?.meta?.message || mensajeOk);
      await cargar();
    } catch (err) {
      showToastMessage('error', err instanceof Error ? err.message : 'Error de conexión');
      // Como en Banner: la lista pudo quedar vieja (otra operadora la cambió), se recarga igual.
      await cargar();
    } finally {
      setOcupado(false);
    }
  };

  const alternarActiva = (encuesta: ResumenEncuesta) => {
    void ejecutar(
      () => cambiarActivaEncuesta(encuesta.id, !encuesta.activa),
      encuesta.activa ? 'Encuesta pausada' : 'Encuesta activada',
    );
  };

  const duplicar = (encuesta: ResumenEncuesta) => {
    void ejecutar(() => duplicarEncuesta(encuesta.id), 'Encuesta duplicada (pausada y sin lista)');
  };

  const borrar = async (encuesta: ResumenEncuesta) => {
    const confirmado = await confirmar({
      titulo: `Borrar la encuesta #${encuesta.id}`,
      mensaje: 'Deja de verse en la app y en la web, y no se puede recuperar.',
      textoConfirmar: 'Borrar',
    });
    if (!confirmado) return;
    void ejecutar(() => borrarEncuesta(encuesta.id), 'Encuesta borrada');
  };

  /** Para editar hace falta la encuesta completa (el listado no trae las preguntas). */
  const abrirEdicion = async (encuesta: ResumenEncuesta) => {
    setOcupado(true);
    try {
      setModal({ tipo: 'formulario', encuesta: await obtenerEncuesta(encuesta.id) });
    } catch (err) {
      showToastMessage('error', err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setOcupado(false);
    }
  };

  const alGuardar = (mensaje: string) => {
    setModal({ tipo: 'ninguno' });
    showToastMessage('success', mensaje);
    void cargar();
  };

  const cerrarModal = () => setModal({ tipo: 'ninguno' });

  /** Copia el link de la web para pegarlo en el WhatsApp de Pixi o en un mail. */
  const copiarLink = async (encuesta: ResumenEncuesta) => {
    try {
      await navigator.clipboard.writeText(linkEncuestaWeb(encuesta.id));
      showToastMessage(
        'success',
        encuesta.activa ? 'Link copiado' : 'Link copiado. Ojo: la encuesta está pausada, la web va a decir que no está disponible',
      );
    } catch {
      showToastMessage('error', `No se pudo copiar. El link es ${linkEncuestaWeb(encuesta.id)}`);
    }
  };

  return (
    <div className="encuestas-container">
      {ventanaConfirmacion}
      <div className="encuestas-header">
        <div>
          <h1 className="encuestas-title">Encuestas</h1>
          <p className="encuestas-subtitle">
            Encuestas para los afiliados de Andes Salud. Cada una la responde la gente de una lista de DNIs, todos los afiliados (en la
            app, tarjeta "Tenemos una encuesta para vos") o cualquiera con el link (pública, solo en la web: andessalud.com.ar/encuesta/).
            Cada afiliado responde una sola vez.
          </p>
        </div>
        <div className="encuestas-header-acciones">
          <button className="encuestas-btn encuestas-btn-secundario" onClick={() => void cargar()} disabled={cargando || ocupado}>
            <FaSync /> Actualizar
          </button>
          <button
            className="encuestas-btn encuestas-btn-primario"
            onClick={() => setModal({ tipo: 'formulario', encuesta: null })}
            disabled={ocupado}
          >
            <FaPlus /> Nueva encuesta
          </button>
        </div>
      </div>

      {error && <div className="encuestas-error">{error}</div>}
      {cargando && encuestas.length === 0 && <p className="encuestas-estado">Cargando encuestas...</p>}
      {!cargando && !error && encuestas.length === 0 && (
        <p className="encuestas-estado">Todavía no hay encuestas. Creá la primera con "Nueva encuesta".</p>
      )}

      <ul className="encuestas-lista">
        {encuestas.map((encuesta) => {
          const conRespuestas = encuesta.respondieron > 0;
          const audiencia = audienciaDe(encuesta);
          const esLista = audiencia === 'lista';
          // Para activar una de lista hace falta la lista de DNIs (el backend devuelve 409 si no tiene). Las de todos los afiliados y las
          // públicas se activan sin lista. Pausarla se puede siempre.
          const sinLista = esLista && encuesta.asignados === 0;
          const noSePuedeActivar = !encuesta.activa && sinLista;
          const avance = porcentaje(encuesta.respondieron, encuesta.asignados);
          // El link de la web sirve para las de lista (el afiliado pone su DNI) y las públicas; las de "todos los afiliados" van por la app.
          const tieneLink = audiencia !== 'afiliados';
          return (
            <li key={encuesta.id} className={`encuestas-item ${encuesta.activa ? '' : 'encuestas-item-pausada'}`}>
              <div className="encuestas-info">
                <div className="encuestas-info-titulo">
                  {tieneLink ? (
                    <a
                      className="encuestas-info-link"
                      href={linkEncuestaWeb(encuesta.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir la encuesta en la web (así la ve quien la responde)"
                    >
                      #{encuesta.id} {encuesta.titulo} <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  ) : (
                    <span>
                      #{encuesta.id} {encuesta.titulo}
                    </span>
                  )}
                  <span className={`encuestas-badge ${encuesta.activa ? 'encuestas-badge-activa' : 'encuestas-badge-pausada'}`}>
                    {encuesta.activa ? 'Activa' : 'Pausada'}
                  </span>
                  <span className={`encuestas-badge encuestas-badge-audiencia encuestas-badge-audiencia-${audiencia}`}>
                    {nombreAudiencia(audiencia)}
                  </span>
                </div>
                <div className="encuestas-info-linea">
                  {encuesta.cantidadPreguntas} {encuesta.cantidadPreguntas === 1 ? 'pregunta' : 'preguntas'}
                  {encuesta.createdAt && fechaCorta(encuesta.createdAt) ? ` · Creada el ${fechaCorta(encuesta.createdAt)}` : ''}
                </div>
                {esLista && encuesta.asignados > 0 ? (
                  <div className="encuestas-avance">
                    <div
                      className="encuestas-barra"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={avance}
                      aria-label="Avance de respuestas"
                    >
                      <div className="encuestas-barra-relleno" style={{ width: `${avance}%` }} />
                    </div>
                    <span className="encuestas-info-linea">
                      {textoAvance(encuesta.respondieron, encuesta.asignados, audiencia)} ({avance}%)
                    </span>
                  </div>
                ) : esLista ? (
                  <div className="encuestas-info-linea encuestas-info-aviso">
                    Sin lista de DNIs: cargala con "Lista de DNIs" para poder activarla.
                  </div>
                ) : (
                  <div className="encuestas-info-linea">{textoAvance(encuesta.respondieron, encuesta.asignados, audiencia)}</div>
                )}
              </div>

              <div className="encuestas-acciones">
                <span title={conRespuestas ? 'Ya tiene respuestas: podés corregir textos y el mail, pero no las preguntas ni quién la responde' : undefined}>
                  <button
                    className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
                    onClick={() => void abrirEdicion(encuesta)}
                    disabled={ocupado}
                  >
                    <FaEdit /> Editar
                  </button>
                </span>
                <span title={noSePuedeActivar ? 'No tiene lista de DNIs: cargala con "Lista de DNIs" para poder activarla' : undefined}>
                  <button
                    className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
                    onClick={() => alternarActiva(encuesta)}
                    disabled={ocupado || noSePuedeActivar}
                  >
                    {encuesta.activa ? (
                      <>
                        <FaPause /> Pausar
                      </>
                    ) : (
                      <>
                        <FaPlay /> Activar
                      </>
                    )}
                  </button>
                </span>
                {esLista && (
                  <button
                    className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
                    onClick={() => setModal({ tipo: 'lista', encuesta })}
                    disabled={ocupado}
                  >
                    <FaListUl /> Lista de DNIs
                  </button>
                )}
                <button
                  className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
                  onClick={() => setModal({ tipo: 'resultados', encuesta })}
                  disabled={ocupado}
                >
                  <FaChartBar /> Resultados
                </button>
                {tieneLink && (
                  <button
                    className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
                    onClick={() => void copiarLink(encuesta)}
                    title={linkEncuestaWeb(encuesta.id)}
                  >
                    <FaLink /> Copiar link
                  </button>
                )}
                <button
                  className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico"
                  onClick={() => duplicar(encuesta)}
                  disabled={ocupado}
                >
                  <FaClone /> Duplicar
                </button>
                <span title={conRespuestas ? 'Ya tiene respuestas: no se puede borrar' : undefined}>
                  <button
                    className="encuestas-btn encuestas-btn-peligro encuestas-btn-chico"
                    onClick={() => borrar(encuesta)}
                    disabled={ocupado || conRespuestas}
                  >
                    <FaTrash /> Borrar
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {modal.tipo === 'formulario' && <EncuestaForm encuesta={modal.encuesta} onCerrar={cerrarModal} onGuardado={alGuardar} />}
      {modal.tipo === 'lista' && (
        <EncuestaLista encuesta={modal.encuesta} onCerrar={cerrarModal} onActualizada={() => void cargar()} />
      )}
      {modal.tipo === 'resultados' && (
        <EncuestaResultados encuesta={modal.encuesta} onCerrar={cerrarModal} onAviso={showToastMessage} />
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

export default Encuestas;
