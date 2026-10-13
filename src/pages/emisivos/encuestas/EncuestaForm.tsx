// EncuestaForm.tsx — modal para crear o editar una encuesta: título, texto de cierre y constructor de preguntas.
// La encuesta nace pausada y sin lista: después se le carga la lista de DNIs y se activa.

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FaArrowDown, FaArrowUp, FaPlus, FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import { crearEncuesta, editarEncuesta } from './encuestas.api';
import type { DatosFormularioEncuesta, Encuesta, PreguntaFormulario, TipoPregunta } from './encuestas.api';
import {
  LARGOS,
  MAX_OPCIONES,
  MAX_PREGUNTAS,
  MIN_OPCIONES,
  TIPOS_PREGUNTA,
  errorDeEncuesta,
  nuevaClave,
  opcionVacia,
  preguntaVacia,
} from './encuestasOpciones';

interface EncuestaFormProps {
  /** null = encuesta nueva */
  encuesta: Encuesta | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

const datosIniciales = (encuesta: Encuesta | null): DatosFormularioEncuesta => {
  if (!encuesta) return { titulo: '', textoCierre: '', preguntas: [preguntaVacia()] };
  return {
    titulo: encuesta.titulo,
    textoCierre: encuesta.textoCierre ?? '',
    preguntas: encuesta.preguntas.map((pregunta) => ({
      clave: nuevaClave(),
      texto: pregunta.texto,
      tipo: pregunta.tipo,
      obligatoria: pregunta.obligatoria,
      ayuda: pregunta.ayuda ?? '',
      opciones: pregunta.opciones.map((opcion) => ({ clave: nuevaClave(), texto: opcion.texto })),
    })),
  };
};

const EncuestaForm = ({ encuesta, onCerrar, onGuardado }: EncuestaFormProps) => {
  const [datos, setDatos] = useState<DatosFormularioEncuesta>(() => datosIniciales(encuesta));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // El formulario puede ser largo: cuando aparece un error, se lo trae a la vista.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [error]);

  /** Cambia una pregunta (por su clave) sin tocar las demás. */
  const cambiarPregunta = (clave: number, cambio: (pregunta: PreguntaFormulario) => PreguntaFormulario) => {
    setDatos((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((pregunta) => (pregunta.clave === clave ? cambio(pregunta) : pregunta)),
    }));
  };

  const agregarPregunta = () => {
    setDatos((prev) => ({ ...prev, preguntas: [...prev.preguntas, preguntaVacia()] }));
  };

  const quitarPregunta = (clave: number) => {
    setDatos((prev) => ({ ...prev, preguntas: prev.preguntas.filter((pregunta) => pregunta.clave !== clave) }));
  };

  /** Mueve una pregunta un lugar (-1 sube, +1 baja). */
  const moverPregunta = (indice: number, sentido: -1 | 1) => {
    setDatos((prev) => {
      const destino = indice + sentido;
      if (destino < 0 || destino >= prev.preguntas.length) return prev;
      const preguntas = [...prev.preguntas];
      [preguntas[indice], preguntas[destino]] = [preguntas[destino], preguntas[indice]];
      return { ...prev, preguntas };
    });
  };

  // Al pasar a "Texto libre" las opciones no se usan; al volver a única/múltiple se arman dos vacías si no había.
  const cambiarTipo = (clave: number, tipo: TipoPregunta) => {
    cambiarPregunta(clave, (pregunta) => ({
      ...pregunta,
      tipo,
      opciones: tipo === 'texto' ? pregunta.opciones : pregunta.opciones.length > 0 ? pregunta.opciones : [opcionVacia(), opcionVacia()],
    }));
  };

  const agregarOpcion = (clave: number) => {
    cambiarPregunta(clave, (pregunta) => ({ ...pregunta, opciones: [...pregunta.opciones, opcionVacia()] }));
  };

  const quitarOpcion = (clavePregunta: number, claveOpcion: number) => {
    cambiarPregunta(clavePregunta, (pregunta) => ({
      ...pregunta,
      opciones: pregunta.opciones.filter((opcion) => opcion.clave !== claveOpcion),
    }));
  };

  const cambiarOpcion = (clavePregunta: number, claveOpcion: number, texto: string) => {
    cambiarPregunta(clavePregunta, (pregunta) => ({
      ...pregunta,
      opciones: pregunta.opciones.map((opcion) => (opcion.clave === claveOpcion ? { ...opcion, texto } : opcion)),
    }));
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const problema = errorDeEncuesta(datos);
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const respuesta = encuesta ? await editarEncuesta(encuesta.id, datos) : await crearEncuesta(datos);
      onGuardado(respuesta.meta?.message || (encuesta ? 'Encuesta actualizada' : 'Encuesta creada'));
    } catch (err) {
      // El backend vuelve a validar: su mensaje (o el 409 "ya tiene respuestas") se muestra acá.
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setGuardando(false);
    }
  };

  return (
    <div className="encuestas-modal-overlay">
      <div className="encuestas-modal encuestas-modal-ancho" role="dialog" aria-modal="true" aria-labelledby="encuestas-form-titulo">
        <div className="encuestas-modal-header">
          <h2 id="encuestas-form-titulo">{encuesta ? `Editar encuesta #${encuesta.id}` : 'Nueva encuesta'}</h2>
          <button type="button" className="encuestas-icon-btn" onClick={onCerrar} aria-label="Cerrar" disabled={guardando}>
            <FaTimes />
          </button>
        </div>

        <form className="encuestas-form" onSubmit={guardar}>
          <label className="encuestas-label">
            Título <span className="encuestas-ayuda">(es lo que ve el afiliado al abrir la encuesta)</span>
            <input
              className="encuestas-input"
              maxLength={LARGOS.titulo}
              value={datos.titulo}
              onChange={(e) => {
                const titulo = e.target.value;
                setDatos((prev) => ({ ...prev, titulo }));
              }}
            />
          </label>

          <label className="encuestas-label">
            Texto de cierre <span className="encuestas-ayuda">(opcional, se muestra al terminar de responder)</span>
            <textarea
              className="encuestas-input encuestas-textarea"
              rows={2}
              maxLength={LARGOS.textoCierre}
              placeholder="¡Gracias por participar! Tu opinión nos ayuda a seguir mejorando."
              value={datos.textoCierre}
              onChange={(e) => {
                const textoCierre = e.target.value;
                setDatos((prev) => ({ ...prev, textoCierre }));
              }}
            />
          </label>

          <div className="encuestas-preguntas-cabecera">
            <span className="encuestas-subtitulo">
              Preguntas ({datos.preguntas.length} de {MAX_PREGUNTAS})
            </span>
          </div>

          <ol className="encuestas-preguntas">
            {datos.preguntas.map((pregunta, indice) => (
              <li key={pregunta.clave} className="encuestas-pregunta">
                <div className="encuestas-pregunta-cabecera">
                  <span className="encuestas-pregunta-numero">Pregunta {indice + 1}</span>
                  <div className="encuestas-pregunta-herramientas">
                    <button
                      type="button"
                      className="encuestas-icon-btn"
                      onClick={() => moverPregunta(indice, -1)}
                      disabled={guardando || indice === 0}
                      aria-label={`Subir la pregunta ${indice + 1}`}
                      title="Subir"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      type="button"
                      className="encuestas-icon-btn"
                      onClick={() => moverPregunta(indice, 1)}
                      disabled={guardando || indice === datos.preguntas.length - 1}
                      aria-label={`Bajar la pregunta ${indice + 1}`}
                      title="Bajar"
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      type="button"
                      className="encuestas-icon-btn encuestas-icon-btn-peligro"
                      onClick={() => quitarPregunta(pregunta.clave)}
                      disabled={guardando}
                      aria-label={`Quitar la pregunta ${indice + 1}`}
                      title="Quitar pregunta"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <label className="encuestas-label">
                  Texto de la pregunta
                  <input
                    className="encuestas-input"
                    maxLength={LARGOS.pregunta}
                    value={pregunta.texto}
                    onChange={(e) => {
                      const texto = e.target.value;
                      cambiarPregunta(pregunta.clave, (actual) => ({ ...actual, texto }));
                    }}
                  />
                </label>

                <div className="encuestas-fila">
                  <div className="encuestas-label">
                    Tipo de respuesta
                    <div className="encuestas-modo" role="group" aria-label={`Tipo de la pregunta ${indice + 1}`}>
                      {TIPOS_PREGUNTA.map((tipo) => (
                        <button
                          type="button"
                          key={tipo.valor}
                          className={`encuestas-modo-opcion ${pregunta.tipo === tipo.valor ? 'encuestas-modo-opcion-activa' : ''}`}
                          onClick={() => cambiarTipo(pregunta.clave, tipo.valor)}
                          aria-pressed={pregunta.tipo === tipo.valor}
                        >
                          {tipo.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="encuestas-check">
                    <input
                      type="checkbox"
                      checked={pregunta.obligatoria}
                      onChange={(e) => {
                        const obligatoria = e.target.checked;
                        cambiarPregunta(pregunta.clave, (actual) => ({ ...actual, obligatoria }));
                      }}
                    />
                    Obligatoria
                  </label>
                </div>

                <label className="encuestas-label">
                  Ayuda <span className="encuestas-ayuda">(opcional, texto chico debajo de la pregunta)</span>
                  <input
                    className="encuestas-input"
                    maxLength={LARGOS.ayuda}
                    value={pregunta.ayuda}
                    onChange={(e) => {
                      const ayuda = e.target.value;
                      cambiarPregunta(pregunta.clave, (actual) => ({ ...actual, ayuda }));
                    }}
                  />
                </label>

                {pregunta.tipo === 'texto' ? (
                  <p className="encuestas-ayuda">El afiliado escribe su respuesta (hasta 500 caracteres).</p>
                ) : (
                  <div className="encuestas-opciones">
                    <span className="encuestas-sublabel">
                      Opciones{' '}
                      <span className="encuestas-ayuda">
                        ({pregunta.tipo === 'unica' ? 'elige una sola' : 'puede elegir varias'}; de {MIN_OPCIONES} a {MAX_OPCIONES},
                        sin repetir)
                      </span>
                    </span>
                    {pregunta.opciones.map((opcion, posicion) => (
                      <div key={opcion.clave} className="encuestas-opcion">
                        <input
                          className="encuestas-input"
                          maxLength={LARGOS.opcion}
                          placeholder={`Opción ${posicion + 1}`}
                          aria-label={`Opción ${posicion + 1} de la pregunta ${indice + 1}`}
                          value={opcion.texto}
                          onChange={(e) => cambiarOpcion(pregunta.clave, opcion.clave, e.target.value)}
                        />
                        <button
                          type="button"
                          className="encuestas-icon-btn encuestas-icon-btn-peligro"
                          onClick={() => quitarOpcion(pregunta.clave, opcion.clave)}
                          disabled={guardando || pregunta.opciones.length <= MIN_OPCIONES}
                          aria-label={`Quitar la opción ${posicion + 1} de la pregunta ${indice + 1}`}
                          title={pregunta.opciones.length <= MIN_OPCIONES ? `Mínimo ${MIN_OPCIONES} opciones` : 'Quitar opción'}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico encuestas-btn-agregar"
                      onClick={() => agregarOpcion(pregunta.clave)}
                      disabled={guardando || pregunta.opciones.length >= MAX_OPCIONES}
                    >
                      <FaPlus /> Agregar opción
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="encuestas-btn encuestas-btn-secundario encuestas-btn-agregar"
            onClick={agregarPregunta}
            disabled={guardando || datos.preguntas.length >= MAX_PREGUNTAS}
          >
            <FaPlus /> Agregar pregunta
          </button>

          {error && (
            <p className="encuestas-error" ref={errorRef} role="alert">
              {error}
            </p>
          )}

          <div className="encuestas-modal-acciones">
            <button type="button" className="encuestas-btn encuestas-btn-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="encuestas-btn encuestas-btn-primario" disabled={guardando}>
              <FaSave /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EncuestaForm;
