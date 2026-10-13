// CampaniaAsistente.tsx — modal grande en 5 pasos para armar y enviar una campaña:
// 1 Datos · 2 Contenido · 3 Destinatarios · 4 Prueba · 5 Enviar.
// El paso 2 guarda la campaña (POST o PUT); los pasos 3 a 5 trabajan sobre la campaña ya guardada.
// Sin roles ni aprobación (decisión de Gino y Nico, 09/10/2026): la red de seguridad es la prueba obligatoria.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaSave, FaTimes } from 'react-icons/fa';
import CampaniaPasoContenido from './CampaniaPasoContenido';
import type { CambioImagen } from './CampaniaContenidoMail';
import CampaniaPasoDatos from './CampaniaPasoDatos';
import CampaniaPasoEnviar from './CampaniaPasoEnviar';
import CampaniaPasoLista from './CampaniaPasoLista';
import CampaniaPasoPrueba from './CampaniaPasoPrueba';
import CampaniaPreviewMail from './CampaniaPreviewMail';
import {
  crearCampania,
  editarCampania,
  obtenerCampania,
  obtenerPreviewMail,
  opcionesCampanias,
  quitarImagenCampania,
  subirImagenCampania,
} from './campanias.api';
import type { Campania, DatosFormularioCampania } from './campanias.api';
import { PRUEBA_VACIA, REMITENTES_POR_DEFECTO, datosDesdeCampania, datosVacios, errorDeCampania, esEditable } from './campaniasOpciones';
import type { EstadoPrueba } from './campaniasOpciones';
import { useConfirmacion } from '../useConfirmacion';

interface CampaniaAsistenteProps {
  /** null = campaña nueva */
  campania: Campania | null;
  /** Paso en el que se abre (1 a 5). */
  pasoInicial?: number;
  onCerrar: () => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
  /** Se llamó a "Enviar a todos" y emisivos lo aceptó. */
  onEnviada: (campania: Campania) => void;
}

const PASOS = ['Datos', 'Contenido', 'Destinatarios', 'Prueba', 'Enviar'];
const SIN_IMAGEN: CambioImagen = { archivo: null, quitar: false };

const CampaniaAsistente = ({ campania: campaniaInicial, pasoInicial = 1, onCerrar, onAviso, onEnviada }: CampaniaAsistenteProps) => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [campania, setCampania] = useState<Campania | null>(campaniaInicial);
  const [datos, setDatos] = useState<DatosFormularioCampania>(() => (campaniaInicial ? datosDesdeCampania(campaniaInicial) : datosVacios()));
  const [imagen, setImagen] = useState<CambioImagen>(SIN_IMAGEN);
  const [paso, setPaso] = useState(pasoInicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [sucio, setSucio] = useState(false);
  const [prueba, setPrueba] = useState<EstadoPrueba>(PRUEBA_VACIA);
  const [remitentes, setRemitentes] = useState<string[]>(REMITENTES_POR_DEFECTO);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const campaniaId = campania?.id;
  const estadoActual = campania?.estado;
  const editable = !campania || esEditable(campania.estado);
  const tieneLista = Boolean(campania?.resumen);

  // Remitentes y plantillas permitidos: los del backend. Si no responde, se quedan los de siempre.
  useEffect(() => {
    let vigente = true;
    opcionesCampanias()
      .then((opciones) => {
        if (!vigente) return;
        setRemitentes(opciones.remitentes);
        // Una campaña nueva arranca con el primer remitente (no cuenta como cambio del usuario).
        setDatos((prev) => (prev.mail.remitente ? prev : { ...prev, mail: { ...prev.mail, remitente: opciones.remitentes[0] ?? '' } }));
      })
      .catch(() => {
        // sin respuesta: el combo usa los remitentes por defecto y el backend valida igual al guardar
      });
    return () => {
      vigente = false;
    };
  }, []);

  // Mientras emisivos procesa la lista (cruce con el padrón), se mira el avance cada 2 segundos.
  useEffect(() => {
    if (!campaniaId || estadoActual !== 'PROCESANDO_LISTA') return;
    let vigente = true;
    const temporizador = setInterval(() => {
      obtenerCampania(campaniaId)
        .then((actual) => {
          if (vigente) setCampania(actual);
        })
        .catch(() => {
          // un corte de conexión puntual: se vuelve a intentar en la próxima vuelta
        });
    }, 2000);
    return () => {
      vigente = false;
      clearInterval(temporizador);
    };
  }, [campaniaId, estadoActual]);

  // El formulario puede ser largo: cuando aparece un error, se lo trae a la vista.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [error]);

  const cambiarDatos = (cambio: (prev: DatosFormularioCampania) => DatosFormularioCampania) => {
    setDatos(cambio);
    setSucio(true);
  };

  const cambiarImagen = (cambio: CambioImagen) => {
    setImagen(cambio);
    setSucio(true);
    setError(null);
  };

  /** Valida y guarda la campaña (y su imagen). Devuelve la campaña guardada, o null si hubo un problema (ya mostrado). */
  const guardar = useCallback(async (): Promise<Campania | null> => {
    const problema = errorDeCampania(datos);
    if (problema) {
      setError(problema);
      return null;
    }
    setGuardando(true);
    setError(null);
    let guardada = campania;
    try {
      const respuesta = campania ? await editarCampania(campania.id, datos) : await crearCampania(datos);
      guardada = respuesta.data ?? campania;
      if (guardada) setCampania(guardada);
      if (guardada && datos.canales.mail && datos.mail.plantilla === 'beneficio') {
        if (imagen.archivo) guardada = (await subirImagenCampania(guardada.id, imagen.archivo)).data ?? guardada;
        else if (imagen.quitar) guardada = (await quitarImagenCampania(guardada.id)).data ?? guardada;
        setCampania(guardada);
      }
      setImagen(SIN_IMAGEN);
      setSucio(false);
      // Los resultados de una prueba anterior ya no son del contenido guardado.
      setPrueba((prev) => ({ ...prev, resultado: null, mensaje: '' }));
      return guardada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return null;
    } finally {
      setGuardando(false);
    }
  }, [campania, datos, imagen]);

  /** El paso al que se puede ir con la campaña que hay: 3 pide campaña guardada; 4 y 5, la lista cargada. */
  const puedeIrA = (destino: number, actual: Campania | null): boolean => {
    if (destino <= 2) return true;
    if (!actual) return false;
    return destino === 3 || actual.estado === 'LISTA';
  };

  const irAPaso = async (destino: number) => {
    if (destino === paso || guardando) return;
    setError(null);
    if (paso === 1 && destino >= 2) {
      if (!datos.nombre.trim()) {
        setError('La campaña necesita un nombre.');
        return;
      }
      if (!datos.canales.push && !datos.canales.mail && !datos.canales.banner) {
        setError('Elegí al menos un canal: push, mail o banner.');
        return;
      }
    }
    let actual = campania;
    // Al salir del contenido con cambios, se guardan: los pasos de adelante trabajan sobre lo guardado.
    if (destino >= 3 && (sucio || !campania) && editable) {
      actual = await guardar();
      if (!actual) return;
    }
    if (!puedeIrA(destino, actual)) {
      setError(
        destino === 3 ? 'Primero completá el contenido y guardalo.' : 'Primero cargá la lista de destinatarios y esperá a que termine de procesarse.',
      );
      return;
    }
    setPaso(destino);
  };

  const guardarYSeguir = async () => {
    const guardada = await guardar();
    if (guardada) setPaso(guardada.estado === 'LISTA' ? 4 : 3);
  };

  const verPreview = async () => {
    setVerificando(true);
    try {
      const guardada = sucio || !campania ? await guardar() : campania;
      if (!guardada) return;
      setPreviewHtml(await obtenerPreviewMail(guardada.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setVerificando(false);
    }
  };

  const cerrar = async () => {
    if (sucio && !(await confirmar({ titulo: 'Cambios sin guardar', mensaje: 'Hay cambios sin guardar en el contenido. ¿Cerrar igual?', textoConfirmar: 'Cerrar sin guardar' }))) return;
    onCerrar();
  };

  const titulo = campania ? `Campaña #${campania.id}` : 'Nueva campaña';

  return (
    <div className="campanias-modal-overlay">
      {ventanaConfirmacion}
      <div className="campanias-modal campanias-modal-grande" role="dialog" aria-modal="true" aria-labelledby="campanias-asistente-titulo">
        <div className="campanias-modal-header">
          <h2 id="campanias-asistente-titulo">
            {titulo}
            {campania ? <span className="campanias-modal-subtitulo"> · {campania.nombre}</span> : null}
          </h2>
          <button type="button" className="campanias-icon-btn" onClick={cerrar} aria-label="Cerrar" disabled={guardando}>
            <FaTimes />
          </button>
        </div>

        <ol className="campanias-pasos" aria-label="Pasos de la campaña">
          {PASOS.map((nombre, indice) => {
            const numero = indice + 1;
            const alcanzable = puedeIrA(numero, campania);
            const clase = numero === paso ? 'campanias-paso-activo' : numero < paso ? 'campanias-paso-hecho' : '';
            return (
              <li key={nombre} className={`campanias-paso-item ${clase} ${alcanzable ? '' : 'campanias-paso-bloqueado'}`}>
                <button
                  type="button"
                  className="campanias-paso-boton"
                  onClick={() => void irAPaso(numero)}
                  disabled={guardando}
                  aria-current={numero === paso ? 'step' : undefined}
                >
                  <span className="campanias-paso-numero">{numero}</span>
                  <span className="campanias-paso-nombre">{nombre}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="campanias-form">
          {campania && !editable && (
            <p className="campanias-aviso">
              {campania.estado === 'PROCESANDO_LISTA'
                ? 'Se está procesando la lista: hasta que termine no se puede cambiar nada.'
                : 'Esta campaña ya se está enviando: no se puede editar.'}
            </p>
          )}

          {paso === 1 && <CampaniaPasoDatos datos={datos} onCambiar={cambiarDatos} bloqueado={tieneLista} deshabilitado={!editable} />}

          {paso === 2 && (
            <CampaniaPasoContenido
              datos={datos}
              onCambiar={cambiarDatos}
              remitentes={remitentes}
              campania={campania}
              imagen={imagen}
              onImagen={cambiarImagen}
              onError={setError}
              onVerPreview={() => void verPreview()}
              verificando={verificando || guardando}
              deshabilitado={!editable}
            />
          )}

          {paso === 3 && campania && <CampaniaPasoLista campania={campania} onCampania={setCampania} onAviso={onAviso} />}

          {paso === 4 && campania && (
            <CampaniaPasoPrueba
              campania={campania}
              prueba={prueba}
              onPrueba={(cambio) => setPrueba((prev) => ({ ...prev, ...cambio }))}
              onCampania={setCampania}
              onAviso={onAviso}
            />
          )}

          {paso === 5 && campania && <CampaniaPasoEnviar campania={campania} onEnviada={onEnviada} />}

          {error && (
            <p className="campanias-error" ref={errorRef} role="alert">
              {error}
            </p>
          )}

          <div className="campanias-modal-acciones campanias-acciones-asistente">
            <button type="button" className="campanias-btn campanias-btn-secundario" onClick={cerrar} disabled={guardando}>
              Cerrar
            </button>
            <span className="campanias-acciones-separador" />
            {paso > 1 && (
              <button type="button" className="campanias-btn campanias-btn-secundario" onClick={() => void irAPaso(paso - 1)} disabled={guardando}>
                <FaArrowLeft /> Anterior
              </button>
            )}
            {paso === 1 && (
              <button type="button" className="campanias-btn campanias-btn-primario" onClick={() => void irAPaso(2)} disabled={guardando}>
                Siguiente <FaArrowRight />
              </button>
            )}
            {paso === 2 && (
              <button type="button" className="campanias-btn campanias-btn-primario" onClick={() => void guardarYSeguir()} disabled={guardando || !editable}>
                <FaSave /> {guardando ? 'Guardando...' : 'Guardar y seguir'}
              </button>
            )}
            {(paso === 3 || paso === 4) && (
              <button
                type="button"
                className="campanias-btn campanias-btn-primario"
                onClick={() => void irAPaso(paso + 1)}
                disabled={guardando || campania?.estado !== 'LISTA'}
              >
                Siguiente <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>

      {previewHtml !== null && <CampaniaPreviewMail html={previewHtml} onCerrar={() => setPreviewHtml(null)} />}
    </div>
  );
};

export default CampaniaAsistente;
