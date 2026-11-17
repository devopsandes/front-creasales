// CampaniaPlacaAsistente.tsx — "Campaña con placa propia" (Ruy, 16/11/2026): 1 Placa · 2 Destinatarios · 3 Prueba · 4 Enviar.
// Es un asistente aparte del de siempre (CampaniaAsistente.tsx) para no tocar lo que usa Karen (pedido de Nico). Siempre
// crea campañas a contactos (lista de mails tal cual, sin afiliados), solo mail y plantilla placa. Los pasos 2 a 4 son los
// mismos componentes del asistente de siempre. Ver docs/campanias.md en Emisivos.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaSave, FaTimes } from 'react-icons/fa';
import CampaniaPasoEnviar from './CampaniaPasoEnviar';
import CampaniaPasoLista from './CampaniaPasoLista';
import CampaniaPasoPlaca from './CampaniaPasoPlaca';
import type { EntradaPlaca } from './CampaniaPasoPlaca';
import CampaniaPasoPrueba from './CampaniaPasoPrueba';
import CampaniaPreviewMail from './CampaniaPreviewMail';
import {
  crearCampaniaPlaca,
  editarCampaniaPlaca,
  obtenerCampania,
  obtenerPreviewMail,
  opcionesCampanias,
  subirImagenCampania,
  urlImagenCampania,
} from './campanias.api';
import type { Campania, DatosPlaca } from './campanias.api';
import { PRUEBA_VACIA, REMITENTES_POR_DEFECTO, esEditable } from './campaniasOpciones';
import type { EstadoPrueba } from './campaniasOpciones';
import { datosPlacaDesdeCampania, datosPlacaVacios, errorDePlaca } from './campaniaPlaca';
import { TEXTO_BOTON_POR_DEFECTO, armarPlaca } from './placaImagen';
import type { OrigenPlaca } from './placaImagen';
import { useConfirmacion } from '../useConfirmacion';

interface CampaniaPlacaAsistenteProps {
  /** null = campaña nueva */
  campania: Campania | null;
  /** Paso en el que se abre (1 a 4). */
  pasoInicial?: number;
  onCerrar: () => void;
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
  onEnviada: (campania: Campania) => void;
}

const PASOS = ['Placa', 'Destinatarios', 'Prueba', 'Enviar'];
const ENTRADA_VACIA: EntradaPlaca = { modo: 'html', html: '', archivo: null };

interface PlacaArmada {
  archivo: File;
  vistaPrevia: string;
  origen: OrigenPlaca;
}

const CampaniaPlacaAsistente = ({ campania: campaniaInicial, pasoInicial = 1, onCerrar, onAviso, onEnviada }: CampaniaPlacaAsistenteProps) => {
  const { confirmar, ventanaConfirmacion } = useConfirmacion();
  const [campania, setCampania] = useState<Campania | null>(campaniaInicial);
  const [datos, setDatos] = useState<DatosPlaca>(() => (campaniaInicial ? datosPlacaDesdeCampania(campaniaInicial) : datosPlacaVacios()));
  const [entrada, setEntrada] = useState<EntradaPlaca>(ENTRADA_VACIA);
  const [placa, setPlaca] = useState<PlacaArmada | null>(null);
  const [placaDesactualizada, setPlacaDesactualizada] = useState(false);
  const [armando, setArmando] = useState(false);
  const [conBoton, setConBoton] = useState(() => Boolean(campaniaInicial?.mail?.contenido.botonDebajo?.texto));
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

  // Remitentes permitidos: los del backend (hoy uno solo, notificaciones@).
  useEffect(() => {
    let vigente = true;
    opcionesCampanias()
      .then((opciones) => {
        if (!vigente) return;
        setRemitentes(opciones.remitentes);
        setDatos((prev) => (prev.remitente ? prev : { ...prev, remitente: opciones.remitentes[0] ?? '' }));
      })
      .catch(() => {
        // sin respuesta: queda el remitente por defecto y el backend valida igual al guardar
      });
    return () => {
      vigente = false;
    };
  }, []);

  // Mientras emisivos procesa la lista se mira el avance cada 2 segundos (enviándose, el asistente no se abre: el avance
  // y el aviso del tope diario están en la lista y en Estadísticas).
  useEffect(() => {
    if (!campaniaId || estadoActual !== 'PROCESANDO_LISTA') return;
    let vigente = true;
    const temporizador = setInterval(() => {
      obtenerCampania(campaniaId)
        .then((actual) => {
          if (vigente) setCampania(actual);
        })
        .catch(() => {
          // un corte puntual: se vuelve a intentar en la próxima vuelta
        });
    }, 2000);
    return () => {
      vigente = false;
      clearInterval(temporizador);
    };
  }, [campaniaId, estadoActual]);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [error]);

  // La vista previa de la placa es un objectURL: se libera al cambiarla o al cerrar.
  useEffect(() => () => {
    if (placa) URL.revokeObjectURL(placa.vistaPrevia);
  }, [placa]);

  // Si se cierra mientras se arma la placa, lo que termine después no se guarda en un componente que ya no está.
  const montado = useRef(true);
  useEffect(() => () => {
    montado.current = false;
  }, []);

  const cambiarDatos = (cambio: Partial<DatosPlaca>) => {
    setDatos((prev) => ({ ...prev, ...cambio }));
    setSucio(true);
    if (cambio.textoBoton !== undefined) setPlacaDesactualizada(true);
  };

  /** La casilla del botón tiene su propio estado: borrar el texto para escribir otro no la destilda. */
  const cambiarConBoton = (activo: boolean) => {
    setConBoton(activo);
    cambiarDatos({ textoBoton: activo ? datos.textoBoton || TEXTO_BOTON_POR_DEFECTO : '' });
  };

  const cambiarEntrada = (cambio: Partial<EntradaPlaca>) => {
    setEntrada((prev) => ({ ...prev, ...cambio }));
    if (cambio.html !== undefined || cambio.archivo !== undefined) {
      setPlacaDesactualizada(true);
      setSucio(true);
    }
  };

  const armar = async () => {
    setError(null);
    if (entrada.modo === 'html' ? !entrada.html.trim() : !entrada.archivo) {
      setError(entrada.modo === 'html' ? 'Pegá el HTML de la placa.' : 'Elegí la imagen de la placa.');
      return;
    }
    if (conBoton && !datos.textoBoton.trim()) {
      setError('Escribí el texto del botón (o destildá "Agregar botón debajo").');
      return;
    }
    setArmando(true);
    try {
      const fuente = entrada.modo === 'imagen' && entrada.archivo ? { archivo: entrada.archivo } : { html: entrada.html };
      const armada = await armarPlaca(fuente, conBoton ? datos.textoBoton : '');
      if (!montado.current) {
        URL.revokeObjectURL(armada.vistaPrevia);
        return;
      }
      setPlaca(armada);
      setPlacaDesactualizada(false);
      setSucio(true);
    } catch (err) {
      if (montado.current) setError(err instanceof Error ? err.message : 'No se pudo armar la placa.');
    } finally {
      if (montado.current) setArmando(false);
    }
  };

  /** Valida y guarda la campaña (y la placa nueva, si se armó). Devuelve la campaña guardada, o null si hubo un problema. */
  const guardar = useCallback(async (): Promise<Campania | null> => {
    const problema = errorDePlaca(datos, Boolean(placa || campania?.tieneImagen));
    if (problema) {
      setError(problema);
      return null;
    }
    if (conBoton && !datos.textoBoton.trim()) {
      setError('Escribí el texto del botón (o destildá "Agregar botón debajo").');
      return null;
    }
    // Una placa ya guardada sin HTML ni imagen nueva: el botón va dibujado en la imagen, así que no se puede cambiar solo
    // el texto (quedaría guardado un botón que la imagen no tiene). Revisión 16/11/2026.
    const botonGuardado = campania?.mail?.contenido.botonDebajo?.texto ?? '';
    if (!placa && campania?.tieneImagen && datos.textoBoton.trim() !== botonGuardado) {
      setError('El botón va dibujado en la imagen: para agregarlo, sacarlo o cambiarlo, volvé a pegar el HTML (o subí la imagen) y tocá "Armar la placa".');
      return null;
    }
    if (placaDesactualizada && (placa || entrada.html.trim() || entrada.archivo)) {
      setError('Cambiaste la placa o el botón: tocá "Armar la placa" antes de guardar.');
      return null;
    }
    setGuardando(true);
    setError(null);
    try {
      let guardada = (campania ? await editarCampaniaPlaca(campania.id, datos) : await crearCampaniaPlaca(datos)).data ?? campania;
      // Se recuerda apenas existe: si después falla la subida de la imagen, el reintento edita esta y no crea otra.
      if (guardada) setCampania(guardada);
      if (guardada && placa) {
        guardada = (await subirImagenCampania(guardada.id, placa.archivo)).data ?? guardada;
        setCampania(guardada);
      }
      setPlaca(null);
      setSucio(false);
      setPrueba((prev) => ({ ...prev, resultado: null, mensaje: '' }));
      return guardada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return null;
    } finally {
      setGuardando(false);
    }
  }, [campania, datos, placa, placaDesactualizada, entrada, conBoton]);

  /** 2 pide la campaña guardada; 3 y 4, la lista cargada. */
  const puedeIrA = (destino: number, actual: Campania | null): boolean => {
    if (destino === 1) return true;
    if (!actual) return false;
    return destino === 2 || actual.estado === 'LISTA';
  };

  const irAPaso = async (destino: number) => {
    if (destino === paso || guardando) return;
    setError(null);
    let actual = campania;
    if (destino >= 2 && (sucio || !campania) && editable) {
      actual = await guardar();
      if (!actual) return;
    }
    if (!puedeIrA(destino, actual)) {
      setError(destino === 2 ? 'Primero completá la placa y guardala.' : 'Primero cargá la lista y esperá a que termine de procesarse.');
      return;
    }
    setPaso(destino);
  };

  const guardarYSeguir = async () => {
    const guardada = await guardar();
    if (guardada) setPaso(guardada.estado === 'LISTA' ? 3 : 2);
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
    if (sucio && !(await confirmar({ titulo: 'Cambios sin guardar', mensaje: 'Hay cambios sin guardar en la placa. ¿Cerrar igual?', textoConfirmar: 'Cerrar sin guardar' }))) return;
    onCerrar();
  };

  const vistaPrevia = placa?.vistaPrevia ?? (campania?.tieneImagen ? urlImagenCampania(campania.id, campania.updatedAt) : null);
  const titulo = campania ? `Campaña con placa #${campania.id}` : 'Campaña con placa propia';

  return (
    <div className="campanias-modal-overlay">
      {ventanaConfirmacion}
      <div className="campanias-modal campanias-modal-grande" role="dialog" aria-modal="true" aria-labelledby="campanias-placa-titulo">
        <div className="campanias-modal-header">
          <h2 id="campanias-placa-titulo">
            {titulo}
            {campania ? <span className="campanias-modal-subtitulo"> · {campania.nombre}</span> : null}
          </h2>
          <button type="button" className="campanias-icon-btn" onClick={cerrar} aria-label="Cerrar" disabled={guardando || armando}>
            <FaTimes />
          </button>
        </div>

        <ol className="campanias-pasos" aria-label="Pasos de la campaña">
          {PASOS.map((nombre, indice) => {
            const numeroPaso = indice + 1;
            const alcanzable = puedeIrA(numeroPaso, campania);
            const clase = numeroPaso === paso ? 'campanias-paso-activo' : numeroPaso < paso ? 'campanias-paso-hecho' : '';
            return (
              <li key={nombre} className={`campanias-paso-item ${clase} ${alcanzable ? '' : 'campanias-paso-bloqueado'}`}>
                <button
                  type="button"
                  className="campanias-paso-boton"
                  onClick={() => void irAPaso(numeroPaso)}
                  disabled={guardando}
                  aria-current={numeroPaso === paso ? 'step' : undefined}
                >
                  <span className="campanias-paso-numero">{numeroPaso}</span>
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
          {paso === 1 && (
            <CampaniaPasoPlaca
              datos={datos}
              onCambiar={cambiarDatos}
              remitentes={remitentes}
              entrada={entrada}
              onEntrada={cambiarEntrada}
              conBoton={conBoton}
              onConBoton={cambiarConBoton}
              vistaPrevia={vistaPrevia}
              origen={placa?.origen ?? null}
              placaDesactualizada={placaDesactualizada}
              armando={armando}
              onArmar={() => void armar()}
              onError={setError}
              onVerPreview={() => void verPreview()}
              verificando={verificando || guardando}
              deshabilitado={!editable}
            />
          )}

          {paso === 2 && campania && <CampaniaPasoLista campania={campania} onCampania={setCampania} onAviso={onAviso} />}

          {paso === 3 && campania && (
            <CampaniaPasoPrueba
              campania={campania}
              prueba={prueba}
              onPrueba={(cambio) => setPrueba((prev) => ({ ...prev, ...cambio }))}
              onCampania={setCampania}
              onAviso={onAviso}
            />
          )}

          {paso === 4 && campania && <CampaniaPasoEnviar campania={campania} onEnviada={onEnviada} />}

          {error && (
            <p className="campanias-error" ref={errorRef} role="alert">
              {error}
            </p>
          )}

          <div className="campanias-modal-acciones campanias-acciones-asistente">
            <button type="button" className="campanias-btn campanias-btn-secundario" onClick={cerrar} disabled={guardando || armando}>
              Cerrar
            </button>
            <span className="campanias-acciones-separador" />
            {paso > 1 && (
              <button type="button" className="campanias-btn campanias-btn-secundario" onClick={() => void irAPaso(paso - 1)} disabled={guardando}>
                <FaArrowLeft /> Anterior
              </button>
            )}
            {paso === 1 && (
              <button type="button" className="campanias-btn campanias-btn-primario" onClick={() => void guardarYSeguir()} disabled={guardando || armando || !editable}>
                <FaSave /> {guardando ? 'Guardando...' : 'Guardar y seguir'}
              </button>
            )}
            {(paso === 2 || paso === 3) && (
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

export default CampaniaPlacaAsistente;
