// EncuestaResultados.tsx — modal con los resultados de una encuesta: avance, canal de respuesta y barras por pregunta.
// Las respuestas abiertas se muestran sin DNI. El Excel (/exportar) trae las hojas "Respuestas" y "No respondieron"; el informe
// PDF es el resumen para mostrar (cifras, una tabla por pregunta y, en las públicas, las personas) y se arma en el navegador.
// En una pública además van las cifras de los mails y la tabla de registros con el "Estado" de marketing.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaDownload, FaFilePdf, FaTimes } from 'react-icons/fa';
import EncuestaRegistros from './EncuestaRegistros';
import { exportarEncuesta, obtenerResultados, traerRegistrosPublicos } from './encuestas.api';
import type { PreguntaResultado, ResumenEncuesta, ResultadosEncuesta } from './encuestas.api';
import { audienciaDe, nombreTipo, porcentaje } from './encuestasOpciones';
import { MAX_REGISTROS_INFORME, armarInformeEncuesta } from './informeEncuesta';

interface EncuestaResultadosProps {
  encuesta: ResumenEncuesta;
  onCerrar: () => void;
  /** Avisos (toast) de la pantalla de atrás: informe descargado, error al armarlo, error al cambiar un estado. */
  onAviso: (tipo: 'success' | 'error', mensaje: string) => void;
}

/** Una barra horizontal hecha con CSS: etiqueta, relleno proporcional y "cantidad (porcentaje%)". */
const Barra = ({ etiqueta, cantidad, pct }: { etiqueta: string; cantidad: number; pct: number }) => (
  <div className="encuestas-resultado-fila">
    <span className="encuestas-resultado-etiqueta">{etiqueta}</span>
    <div
      className="encuestas-barra"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={etiqueta}
    >
      <div className="encuestas-barra-relleno" style={{ width: `${pct}%` }} />
    </div>
    <span className="encuestas-resultado-valor">
      {cantidad} ({pct}%)
    </span>
  </div>
);

/** Una cifra grande con su rótulo (resumen de una pública). */
const Cifra = ({ numero, rotulo, aviso = false }: { numero: number; rotulo: string; aviso?: boolean }) => (
  <div className={`encuestas-cifra ${aviso && numero > 0 ? 'encuestas-cifra-aviso' : ''}`}>
    <span className="encuestas-resumen-numero">{numero.toLocaleString('es-AR')}</span>
    <span className="encuestas-ayuda">{rotulo}</span>
  </div>
);

const BloquePregunta = ({ pregunta, numero }: { pregunta: PreguntaResultado; numero: number }) => (
  <section className="encuestas-resultado-pregunta">
    <h3 className="encuestas-resultado-titulo">
      {numero}. {pregunta.texto}
    </h3>
    <p className="encuestas-ayuda">
      {nombreTipo(pregunta.tipo)}
      {typeof pregunta.respondieron === 'number' ? ` · ${pregunta.respondieron} ${pregunta.respondieron === 1 ? 'respuesta' : 'respuestas'}` : ''}
      {pregunta.tipo === 'multiple' ? ' · los porcentajes pueden sumar más de 100% porque cada persona marca varias' : ''}
    </p>

    {pregunta.tipo === 'texto' ? (
      pregunta.textos.length === 0 ? (
        <p className="encuestas-estado">Todavía nadie respondió esta pregunta.</p>
      ) : (
        <ul className="encuestas-textos">
          {pregunta.textos.map((texto, indice) => (
            <li key={indice} className="encuestas-texto-item">
              {texto}
            </li>
          ))}
        </ul>
      )
    ) : (
      <div className="encuestas-resultado-barras">
        {pregunta.opciones.map((opcion) => (
          <Barra key={opcion.id} etiqueta={opcion.texto} cantidad={opcion.cantidad} pct={Math.round(opcion.porcentaje)} />
        ))}
      </div>
    )}
  </section>
);

/** Qué dice el Excel de cada tipo de encuesta. */
const AYUDA_EXCEL = {
  lista:
    'El Excel tiene dos hojas: "Respuestas" (DNI, fecha, canal y una columna por pregunta) y "No respondieron" (los DNIs que faltan, para seguir por WhatsApp).',
  afiliados: 'El Excel tiene la hoja "Respuestas" (DNI, fecha, canal y una columna por pregunta).',
  publica:
    'El Excel tiene la hoja "Registros": fecha y hora, nombre, WhatsApp, email, si es duplicado, si se mandó el mail, el estado y una columna por pregunta.',
};

const EncuestaResultados = ({ encuesta, onCerrar, onAviso }: EncuestaResultadosProps) => {
  const [resultados, setResultados] = useState<ResultadosEncuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [armandoInforme, setArmandoInforme] = useState(false);
  const [bajandoExcel, setBajandoExcel] = useState(false);

  // ¿Sigue abierta la pantalla? Si se cierra mientras se arma el informe, se corta el armado y no se baja nada ni se avisa.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true; // si se cierra el modal antes de que llegue la respuesta, no se toca el estado
    obtenerResultados(encuesta.id)
      .then((datos) => {
        if (vigente) setResultados(datos);
      })
      .catch((err: unknown) => {
        if (vigente) setError(err instanceof Error ? err.message : 'Error de conexión');
      });
    return () => {
      vigente = false;
    };
  }, [encuesta.id]);

  /** Vuelve a pedir las cifras sin mostrar "Cargando" (cuando marketing cambia un estado, las de arriba se actualizan). */
  const refrescarCifras = useCallback(() => {
    obtenerResultados(encuesta.id)
      .then((datos) => {
        if (montado.current) setResultados(datos);
      })
      .catch(() => {
        // las cifras quedan como estaban: se actualizan la próxima vez que se abra
      });
  }, [encuesta.id]);

  const audiencia = resultados?.publica ? 'publica' : audienciaDe(encuesta);
  const total = resultados?.respondieron ?? 0;

  /**
   * Informe PDF: trae los resultados frescos y, en una pública, los registros (de a 50, hasta MAX_REGISTROS_INFORME), arma el
   * modelo y recién ahí carga jspdf (import perezoso). Si se cierra la pantalla en el medio, corta sin bajar nada.
   */
  const descargarInforme = async () => {
    const cerrado = () => !montado.current;
    setArmandoInforme(true);
    try {
      const frescos = await obtenerResultados(encuesta.id);
      if (cerrado()) return;
      const registros = frescos.publica ? await traerRegistrosPublicos(encuesta.id, MAX_REGISTROS_INFORME, cerrado) : null;
      if (cerrado()) return;
      const informe = armarInformeEncuesta({ encuesta, resultados: frescos, registros }, new Date());
      const { descargarInformePdf } = await import('../campanias/informeCampania.pdf');
      if (await descargarInformePdf(informe, cerrado)) onAviso('success', `Informe descargado: ${informe.nombreArchivo}`);
    } catch (err) {
      if (!cerrado()) onAviso('error', `No se pudo armar el informe: ${err instanceof Error ? err.message : 'error de conexión'}`);
    } finally {
      if (montado.current) setArmandoInforme(false);
    }
  };

  /** Excel con el token de la sesión (un link común no lo manda). Los errores salen por el mismo aviso. */
  const descargarExcel = async () => {
    setBajandoExcel(true);
    try {
      const nombre = await exportarEncuesta(encuesta.id);
      if (montado.current) onAviso('success', `Excel descargado: ${nombre}`);
    } catch (err) {
      if (montado.current) onAviso('error', `No se pudo bajar el Excel: ${err instanceof Error ? err.message : 'error de conexión'}`);
    } finally {
      if (montado.current) setBajandoExcel(false);
    }
  };

  return (
    <div className="encuestas-modal-overlay">
      <div className="encuestas-modal encuestas-modal-ancho" role="dialog" aria-modal="true" aria-labelledby="encuestas-resultados-titulo">
        <div className="encuestas-modal-header">
          <h2 id="encuestas-resultados-titulo">Resultados · Encuesta #{encuesta.id}</h2>
          <button type="button" className="encuestas-icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="encuestas-form">
          <p className="encuestas-lista-encuesta">{encuesta.titulo}</p>

          {error && <p className="encuestas-error">{error}</p>}
          {!resultados && !error && <p className="encuestas-estado">Cargando resultados...</p>}

          {resultados && (
            <>
              <div className="encuestas-resumen">
                {audiencia === 'publica' && resultados.publica ? (
                  <div className="encuestas-cifras">
                    <Cifra numero={resultados.publica.total} rotulo="registros" />
                    <Cifra numero={resultados.publica.unicas} rotulo="únicos" />
                    <Cifra numero={resultados.publica.duplicadas} rotulo="duplicados" />
                    <Cifra numero={resultados.publica.mail.enviados} rotulo="mails enviados" />
                    <Cifra numero={resultados.publica.mail.pendientes} rotulo="mails pendientes" />
                    <Cifra numero={resultados.publica.mail.errores} rotulo="mails con error" aviso />
                    <Cifra numero={resultados.publica.mail.rebotados} rotulo="mails rebotados" aviso />
                  </div>
                ) : audiencia !== 'lista' ? (
                  // Todos los afiliados (y una pública sin resumen, si el emisivos es viejo): no hay lista, así que no hay "X de Y".
                  <>
                    <div className="encuestas-resumen-dato">
                      <span className="encuestas-resumen-numero">{resultados.respondieron}</span>
                      <span className="encuestas-ayuda">{resultados.respondieron === 1 ? 'afiliado respondió' : 'afiliados respondieron'}</span>
                    </div>
                    <div className="encuestas-resumen-canales">
                      <span className="encuestas-sublabel">Por dónde respondieron</span>
                      <Barra etiqueta="App" cantidad={resultados.porCanal.app} pct={porcentaje(resultados.porCanal.app, total)} />
                      <Barra etiqueta="Web" cantidad={resultados.porCanal.web} pct={porcentaje(resultados.porCanal.web, total)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="encuestas-resumen-dato">
                      <span className="encuestas-resumen-numero">
                        {resultados.respondieron} de {resultados.asignados}
                      </span>
                      <span className="encuestas-ayuda">
                        respondieron ({porcentaje(resultados.respondieron, resultados.asignados)}% de la lista)
                      </span>
                    </div>
                    <div className="encuestas-resumen-canales">
                      <span className="encuestas-sublabel">Por dónde respondieron</span>
                      <Barra etiqueta="App" cantidad={resultados.porCanal.app} pct={porcentaje(resultados.porCanal.app, total)} />
                      <Barra etiqueta="Web" cantidad={resultados.porCanal.web} pct={porcentaje(resultados.porCanal.web, total)} />
                    </div>
                  </>
                )}
                <div className="encuestas-resumen-descargas">
                  <button
                    type="button"
                    className="encuestas-btn encuestas-btn-primario"
                    onClick={() => void descargarExcel()}
                    disabled={bajandoExcel}
                    aria-busy={bajandoExcel}
                  >
                    <FaDownload /> {bajandoExcel ? 'Bajando el Excel…' : 'Descargar Excel'}
                  </button>
                  <button
                    type="button"
                    className="encuestas-btn encuestas-btn-primario"
                    onClick={() => void descargarInforme()}
                    disabled={armandoInforme}
                    aria-busy={armandoInforme}
                    title="Resumen en PDF para mostrar: cifras, una tabla por pregunta y, en las públicas, las personas que respondieron"
                  >
                    <FaFilePdf /> {armandoInforme ? 'Armando el informe…' : 'Descargar informe PDF'}
                  </button>
                </div>
              </div>
              <p className="encuestas-ayuda">{AYUDA_EXCEL[audiencia]}</p>

              {audiencia === 'publica' && resultados.publica && (
                <p className="encuestas-ayuda">
                  Seguimiento de marketing: {resultados.publica.estados.Pendiente} pendientes · {resultados.publica.estados.Contactado} contactados ·{' '}
                  {resultados.publica.estados.Canjeado} canjeados · {resultados.publica.estados['No responde']} no responden.
                </p>
              )}

              {total === 0 && <p className="encuestas-estado">Todavía no respondió nadie.</p>}
              {resultados.preguntas.map((pregunta, indice) => (
                <BloquePregunta key={pregunta.id} pregunta={pregunta} numero={indice + 1} />
              ))}

              {audiencia === 'publica' && (
                <EncuestaRegistros encuestaId={encuesta.id} onAviso={onAviso} onEstadoCambiado={refrescarCifras} />
              )}
            </>
          )}

          <div className="encuestas-modal-acciones">
            <button type="button" className="encuestas-btn encuestas-btn-secundario" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncuestaResultados;
