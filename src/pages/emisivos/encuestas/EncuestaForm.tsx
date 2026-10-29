// EncuestaForm.tsx — modal para crear o editar una encuesta: título, quién la responde, textos, constructor de preguntas y
// acción al contestar (mail a la persona en las públicas, aviso por mail a marketing).
// La encuesta nace pausada: si es de lista, después se le carga la lista de DNIs y se activa.

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FaArrowDown, FaArrowUp, FaPlus, FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import { datosVacios as datosVaciosCampania, nuevaClave as nuevaClaveTarjeta, remitenteVigente } from '../campanias/campaniasOpciones';
import EncuestaFormAccion from './EncuestaFormAccion';
import type { CambioImagenMail } from './EncuestaMailEditor';
import { armarCuerpo, crearEncuesta, editarEncuesta, quitarImagenMail, subirImagenMail } from './encuestas.api';
import type { Audiencia, DatosFormularioEncuesta, Encuesta, MailFormulario, PreguntaFormulario, TipoPregunta } from './encuestas.api';
import {
  AUDIENCIAS,
  LARGOS,
  MAX_OPCIONES,
  MAX_PREGUNTAS,
  MIN_OPCIONES,
  TERMINOS_POR_DEFECTO,
  TIPOS_PREGUNTA,
  audienciaDe,
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

/** El mail a quien responde, cargado desde lo guardado (o vacío, con la plantilla "beneficio" que es la del descuento). */
const mailInicial = (encuesta: Encuesta | null): MailFormulario => {
  const guardado = encuesta?.accion?.mailPersona;
  if (!guardado) return { ...datosVaciosCampania().mail, plantilla: 'beneficio' };
  return {
    plantilla: guardado.plantilla,
    asunto: guardado.asunto,
    remitente: remitenteVigente(guardado.remitente),
    replyTo: guardado.replyTo ?? '',
    titulo: guardado.contenido.titulo,
    texto: guardado.contenido.texto,
    botonTexto: guardado.contenido.botonTexto ?? '',
    botonLink: guardado.contenido.botonLink ?? '',
    tarjetas: (guardado.contenido.tarjetas ?? []).map((t) => ({ clave: nuevaClaveTarjeta(), titulo: t.titulo ?? '', texto: t.texto ?? '' })),
  };
};

const datosIniciales = (encuesta: Encuesta | null): DatosFormularioEncuesta => {
  const base = {
    audiencia: (encuesta ? audienciaDe(encuesta) : 'lista') as Audiencia,
    descripcion: encuesta?.descripcion ?? '',
    textoBoton: encuesta?.textoBoton ?? '',
    condiciones: encuesta?.condiciones ?? '',
    terminosUrl: encuesta?.terminosUrl ?? '',
    mailPersonaActivo: Boolean(encuesta?.accion?.mailPersona?.activo),
    mail: mailInicial(encuesta),
    avisosActivo: Boolean(encuesta?.accion?.avisos?.activo),
    avisos: (encuesta?.accion?.avisos?.destinatarios ?? []).join(', '),
  };
  if (!encuesta) return { titulo: '', textoCierre: '', preguntas: [preguntaVacia()], ...base };
  return {
    ...base,
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

/** Todo lo que el usuario puede haber cambiado, en un solo texto: si difiere del guardado, hay cambios sin guardar. */
const huellaDe = (datos: DatosFormularioEncuesta, imagen: CambioImagenMail): string => {
  const archivo = imagen.archivo ? `${imagen.archivo.name}:${imagen.archivo.size}:${imagen.archivo.lastModified}` : '';
  return `${armarCuerpo(datos)}|${archivo}|${imagen.quitar}`;
};

const EncuestaForm = ({ encuesta, onCerrar, onGuardado }: EncuestaFormProps) => {
  const [datos, setDatos] = useState<DatosFormularioEncuesta>(() => datosIniciales(encuesta));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  /** La imagen del mail a quien responde: se sube después de guardar la encuesta (con el id que devuelve el alta). */
  const [imagen, setImagen] = useState<CambioImagenMail>({ archivo: null, quitar: false });
  /** Id de la encuesta que ya existe en el servidor: la que se abrió o la que se creó recién (si la imagen falla, el reintento edita esa). */
  const [idGuardada, setIdGuardada] = useState<number | null>(encuesta?.id ?? null);
  const [versionImagen, setVersionImagen] = useState(() => Date.now());
  const conRespuestas = (encuesta?.respondieron ?? 0) > 0;
  const publica = datos.audiencia === 'publica';

  // "Huella" de lo guardado, para saber si hay cambios sin guardar (la prueba de mail usa lo guardado, no lo que está en pantalla).
  const [huellaGuardada, setHuellaGuardada] = useState<string | null>(() =>
    encuesta ? huellaDe(datosIniciales(encuesta), { archivo: null, quitar: false }) : null,
  );
  const hayCambios = huellaGuardada === null || huellaDe(datos, imagen) !== huellaGuardada;

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

  const cambiarCampos = (cambio: Partial<DatosFormularioEncuesta>) => {
    setDatos((prev) => ({ ...prev, ...cambio }));
  };

  const cambiarMail = (cambio: Partial<MailFormulario>) => {
    setDatos((prev) => ({ ...prev, mail: { ...prev.mail, ...cambio } }));
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
      const respuesta = idGuardada !== null ? await editarEncuesta(idGuardada, datos) : await crearEncuesta(datos);
      const id = respuesta.data?.id ?? idGuardada;
      const mensaje = respuesta.meta?.message || (encuesta ? 'Encuesta actualizada' : 'Encuesta creada');

      // La imagen del mail se sube con la encuesta ya guardada. Solo cuenta si hay mail a la persona con la plantilla "beneficio".
      const lleva = id !== null && publica && datos.mailPersonaActivo && datos.mail.plantilla === 'beneficio';
      if (lleva && (imagen.archivo || imagen.quitar)) {
        try {
          if (imagen.archivo) await subirImagenMail(id, imagen.archivo);
          else await quitarImagenMail(id);
        } catch (errImagen) {
          // La encuesta ya quedó guardada: el próximo "Guardar" la edita (no crea otra) y reintenta la imagen.
          setIdGuardada(id);
          setHuellaGuardada(huellaDe(datos, { archivo: null, quitar: false }));
          setError(
            `La encuesta se guardó, pero la imagen del mail no se pudo subir: ${errImagen instanceof Error ? errImagen.message : 'error de conexión'}. Volvé a tocar Guardar para reintentar.`,
          );
          setGuardando(false);
          return;
        }
        setVersionImagen(Date.now());
      }
      onGuardado(mensaje);
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
            Título <span className="encuestas-ayuda">(es lo que ve {publica ? 'la persona' : 'el afiliado'} al abrir la encuesta)</span>
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

          <div className="encuestas-label">
            ¿Quién la responde?
            <div className="encuestas-modo" role="group" aria-label="Quién responde la encuesta">
              {AUDIENCIAS.map((opcion) => (
                <button
                  type="button"
                  key={opcion.valor}
                  className={`encuestas-modo-opcion ${datos.audiencia === opcion.valor ? 'encuestas-modo-opcion-activa' : ''}`}
                  onClick={() => cambiarCampos({ audiencia: opcion.valor })}
                  aria-pressed={datos.audiencia === opcion.valor}
                  disabled={guardando}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
            <p className="encuestas-ayuda">{AUDIENCIAS.find((opcion) => opcion.valor === datos.audiencia)?.explicacion}</p>
          </div>

          {conRespuestas && (
            <p className="encuestas-aviso">
              Ya tiene respuestas: podés corregir textos y el mail, pero no las preguntas ni quién la responde.
            </p>
          )}

          {publica && (
            <>
              <label className="encuestas-label">
                Descripción <span className="encuestas-ayuda">(opcional, el texto que va debajo del título en la web)</span>
                <textarea
                  className="encuestas-input encuestas-textarea"
                  rows={3}
                  maxLength={LARGOS.descripcion}
                  value={datos.descripcion}
                  onChange={(e) => cambiarCampos({ descripcion: e.target.value })}
                />
              </label>
              <label className="encuestas-label">
                Texto del botón <span className="encuestas-ayuda">(opcional, por defecto "Enviar")</span>
                <input
                  className="encuestas-input"
                  maxLength={LARGOS.textoBoton}
                  placeholder="Enviar"
                  value={datos.textoBoton}
                  onChange={(e) => cambiarCampos({ textoBoton: e.target.value })}
                />
              </label>
              <label className="encuestas-label">
                Condiciones / letra chica <span className="encuestas-ayuda">(opcional, va al pie del formulario)</span>
                <textarea
                  className="encuestas-input encuestas-textarea"
                  rows={2}
                  maxLength={LARGOS.condiciones}
                  value={datos.condiciones}
                  onChange={(e) => cambiarCampos({ condiciones: e.target.value })}
                />
              </label>
            </>
          )}

          <label className="encuestas-label">
            Texto de cierre{' '}
            <span className="encuestas-ayuda">
              (opcional, se muestra al terminar de responder
              {publica ? ': en la pública es el mensaje que ve la persona al enviar' : ''})
            </span>
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

          <label className="encuestas-label">
            Link de términos y condiciones <span className="encuestas-ayuda">(si lo dejás vacío, se usa la página de formularios y promociones)</span>
            <input
              className="encuestas-input"
              type="url"
              maxLength={LARGOS.terminosUrl}
              placeholder={TERMINOS_POR_DEFECTO}
              value={datos.terminosUrl}
              onChange={(e) => cambiarCampos({ terminosUrl: e.target.value })}
            />
            <span className="encuestas-ayuda">
              La casilla de términos aparece siempre en la web. Cargá un link solo si la promo tiene bases propias: tiene que ser una página
              https de andessalud.com.ar.
            </span>
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

          {/* Mail a quien responde y avisos: solo en las públicas (en las otras no hay email ni quién los mande). */}
          {datos.audiencia === 'publica' && (
          <EncuestaFormAccion
            datos={datos}
            onCambiar={cambiarCampos}
            onCambiarMail={cambiarMail}
            encuesta={encuesta}
            idGuardada={idGuardada}
            hayCambios={hayCambios}
            imagen={imagen}
            onImagen={setImagen}
            versionImagen={versionImagen}
            onError={setError}
            deshabilitado={guardando}
          />
          )}

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
