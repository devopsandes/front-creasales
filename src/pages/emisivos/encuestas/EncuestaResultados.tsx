// EncuestaResultados.tsx — modal con los resultados de una encuesta: avance, canal de respuesta y barras por pregunta.
// Las respuestas abiertas se muestran sin DNI. El Excel (/exportar) trae las hojas "Respuestas" y "No respondieron".

import { useEffect, useState } from 'react';
import { FaDownload, FaTimes } from 'react-icons/fa';
import { obtenerResultados, urlExportarEncuesta } from './encuestas.api';
import type { PreguntaResultado, ResumenEncuesta, ResultadosEncuesta } from './encuestas.api';
import { nombreTipo, porcentaje } from './encuestasOpciones';

interface EncuestaResultadosProps {
  encuesta: ResumenEncuesta;
  onCerrar: () => void;
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

const BloquePregunta = ({ pregunta, numero }: { pregunta: PreguntaResultado; numero: number }) => (
  <section className="encuestas-resultado-pregunta">
    <h3 className="encuestas-resultado-titulo">
      {numero}. {pregunta.texto}
    </h3>
    <p className="encuestas-ayuda">
      {nombreTipo(pregunta.tipo)}
      {typeof pregunta.respondieron === 'number' ? ` · ${pregunta.respondieron} ${pregunta.respondieron === 1 ? 'respuesta' : 'respuestas'}` : ''}
      {pregunta.tipo === 'multiple' ? ' · los porcentajes pueden sumar más de 100% porque cada afiliado marca varias' : ''}
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

const EncuestaResultados = ({ encuesta, onCerrar }: EncuestaResultadosProps) => {
  const [resultados, setResultados] = useState<ResultadosEncuesta | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const total = resultados?.respondieron ?? 0;

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
                <a
                  className="encuestas-btn encuestas-btn-primario encuestas-resumen-excel"
                  href={urlExportarEncuesta(encuesta.id)}
                  rel="noopener noreferrer"
                  download
                >
                  <FaDownload /> Descargar Excel
                </a>
              </div>
              <p className="encuestas-ayuda">
                El Excel tiene dos hojas: "Respuestas" (DNI, fecha, canal y una columna por pregunta) y "No respondieron" (los DNIs
                que faltan, para seguir por WhatsApp).
              </p>

              {total === 0 && <p className="encuestas-estado">Todavía no respondió nadie.</p>}
              {resultados.preguntas.map((pregunta, indice) => (
                <BloquePregunta key={pregunta.id} pregunta={pregunta} numero={indice + 1} />
              ))}
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
