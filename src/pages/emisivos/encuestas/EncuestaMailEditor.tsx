// EncuestaMailEditor.tsx — editor del mail que recibe quien responde una encuesta pública: plantilla, asunto, remitente, título,
// texto, botón, tarjetas e imagen (solo plantilla "beneficio"). Mismo contenido y mismas reglas que el mail de Campañas
// (CampaniaContenidoMail), pero propio: el de Campañas trae "Ver cómo queda" (que guarda un borrador de campaña) y toma la imagen
// de una campaña, y acá nada de eso aplica. Los tipos, plantillas y límites SÍ son los de Campañas, para que no se desfasen.

import type { ChangeEvent } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { errorDeImagen } from '../bannerOpciones';
import type { PlantillaMail } from '../campanias/campanias.api';
import { LARGOS, MAX_TARJETAS, PLANTILLAS_MAIL, REMITENTES_POR_DEFECTO, esLinkDeCampania, tarjetaVacia } from '../campanias/campaniasOpciones';
import type { MailFormulario } from './encuestas.api';

/** La imagen que se va a subir al guardar la encuesta: una recién elegida, o quitar la que ya tenía. */
export interface CambioImagenMail {
  archivo: File | null;
  quitar: boolean;
}

interface EncuestaMailEditorProps {
  mail: MailFormulario;
  onCambiar: (cambio: Partial<MailFormulario>) => void;
  remitentes: string[];
  /** Vista previa de la imagen elegida (object URL) o de la ya guardada; null si no hay. */
  imagenVista: string | null;
  /** ¿La encuesta guardada ya tiene imagen? Si sí, "Quitar" la borra al guardar. */
  tieneImagenGuardada: boolean;
  onImagen: (cambio: CambioImagenMail) => void;
  onError: (mensaje: string) => void;
  deshabilitado: boolean;
}

/** "12/65" al lado de un campo con tope de caracteres. Se pone rojo si se pasa. */
const Contador = ({ valor, maximo }: { valor: string; maximo: number }) => {
  const largo = valor.trim().length;
  return (
    <span className={`encuestas-contador ${largo > maximo ? 'encuestas-contador-pasado' : ''}`} aria-label={`${largo} de ${maximo} caracteres`}>
      {largo}/{maximo}
    </span>
  );
};

const EncuestaMailEditor = ({
  mail,
  onCambiar,
  remitentes,
  imagenVista,
  tieneImagenGuardada,
  onImagen,
  onError,
  deshabilitado,
}: EncuestaMailEditorProps) => {
  const elegirImagen = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const problema = errorDeImagen(archivo);
    if (problema) {
      onError(problema);
      return;
    }
    onImagen({ archivo, quitar: false });
  };

  const llevaTarjetas = mail.plantilla === 'beneficio' || mail.plantilla === 'informativo';
  const llevaBoton = mail.plantilla !== 'simple';
  const botonObligatorio = mail.plantilla === 'aviso' || mail.plantilla === 'beneficio';
  const opcionesRemitente = remitentes.length > 0 ? remitentes : REMITENTES_POR_DEFECTO;
  const botonLink = mail.botonLink.trim();
  const linkInvalido = botonLink !== '' && !esLinkDeCampania(botonLink);

  const cambiarTarjeta = (clave: number, campo: 'titulo' | 'texto', valor: string) => {
    onCambiar({ tarjetas: mail.tarjetas.map((t) => (t.clave === clave ? { ...t, [campo]: valor } : t)) });
  };

  const elegirPlantilla = (valor: PlantillaMail) => {
    // Las tarjetas empiezan con una vacía para que se vea dónde van.
    const necesitaTarjeta = (valor === 'beneficio' || valor === 'informativo') && mail.tarjetas.length === 0;
    onCambiar({ plantilla: valor, ...(necesitaTarjeta ? { tarjetas: [tarjetaVacia()] } : {}) });
  };

  return (
    <div className="encuestas-mail">
      <div className="encuestas-label">
        Plantilla
        <div className="encuestas-plantillas" role="group" aria-label="Plantilla del mail">
          {PLANTILLAS_MAIL.map((opcion) => (
            <button
              type="button"
              key={opcion.valor}
              className={`encuestas-plantilla ${mail.plantilla === opcion.valor ? 'encuestas-plantilla-activa' : ''}`}
              onClick={() => elegirPlantilla(opcion.valor)}
              aria-pressed={mail.plantilla === opcion.valor}
              disabled={deshabilitado}
            >
              <strong>{opcion.etiqueta}</strong>
              <span>{opcion.descripcion}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="encuestas-label">
        <span className="encuestas-label-linea">
          Asunto <Contador valor={mail.asunto} maximo={LARGOS.asunto} />
        </span>
        <input className="encuestas-input" value={mail.asunto} disabled={deshabilitado} onChange={(e) => onCambiar({ asunto: e.target.value })} />
        <span className="encuestas-ayuda">Puede llevar {'{{NOMBRE}}'}: se reemplaza por el primer nombre de quien respondió.</span>
      </label>

      <div className="encuestas-fila encuestas-fila-arriba">
        <label className="encuestas-label">
          Remitente <span className="encuestas-ayuda">(desde qué dirección sale)</span>
          <select className="encuestas-input" value={mail.remitente} disabled={deshabilitado} onChange={(e) => onCambiar({ remitente: e.target.value })}>
            <option value="">Elegí un remitente...</option>
            {opcionesRemitente.map((remitente) => (
              <option key={remitente} value={remitente}>
                {remitente}
              </option>
            ))}
          </select>
        </label>
        <label className="encuestas-label">
          Responder a <span className="encuestas-ayuda">(opcional)</span>
          <input
            className="encuestas-input"
            type="email"
            placeholder="comercial@andessalud.ar"
            value={mail.replyTo}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ replyTo: e.target.value })}
          />
        </label>
      </div>

      <label className="encuestas-label">
        <span className="encuestas-label-linea">
          Título <span className="encuestas-ayuda">(va en la banda azul)</span> <Contador valor={mail.titulo} maximo={LARGOS.mailTitulo} />
        </span>
        <input className="encuestas-input" value={mail.titulo} disabled={deshabilitado} onChange={(e) => onCambiar({ titulo: e.target.value })} />
      </label>

      <label className="encuestas-label">
        <span className="encuestas-label-linea">
          Texto <Contador valor={mail.texto} maximo={LARGOS.mailTexto} />
        </span>
        <textarea
          className="encuestas-input encuestas-textarea"
          rows={7}
          value={mail.texto}
          disabled={deshabilitado}
          onChange={(e) => onCambiar({ texto: e.target.value })}
        />
        <span className="encuestas-ayuda">
          **negrita** · una línea en blanco = párrafo nuevo · {'{{NOMBRE}}'} = primer nombre de quien respondió
        </span>
      </label>

      {llevaBoton && (
        <fieldset className="encuestas-fieldset" disabled={deshabilitado}>
          <legend>Botón {botonObligatorio ? '(obligatorio en esta plantilla)' : '(opcional)'}</legend>
          <div className="encuestas-fila encuestas-fila-arriba">
            <label className="encuestas-label">
              <span className="encuestas-label-linea">
                Texto del botón <Contador valor={mail.botonTexto} maximo={LARGOS.botonTexto} />
              </span>
              <input className="encuestas-input" value={mail.botonTexto} onChange={(e) => onCambiar({ botonTexto: e.target.value })} />
            </label>
            <label className="encuestas-label">
              Link del botón
              <input
                className="encuestas-input"
                type="url"
                placeholder="https://"
                value={mail.botonLink}
                onChange={(e) => onCambiar({ botonLink: e.target.value })}
              />
            </label>
          </div>
          {linkInvalido && (
            <p className="encuestas-aviso">
              El link tiene que ser https de andessalud.com.ar o andessalud.ar, o un WhatsApp de Argentina (https://wa.me/54...).
            </p>
          )}
        </fieldset>
      )}

      {llevaTarjetas && (
        <fieldset className="encuestas-fieldset" disabled={deshabilitado}>
          <legend>
            Tarjetas ({mail.tarjetas.length} de {MAX_TARJETAS})
          </legend>
          <p className="encuestas-ayuda">
            {mail.plantilla === 'beneficio' ? 'Una por cada beneficio o descuento.' : 'Para destacar datos puntuales.'} Las que queden vacías
            no se envían.
          </p>
          {mail.tarjetas.map((tarjeta, indice) => (
            <div className="encuestas-tarjeta" key={tarjeta.clave}>
              <div className="encuestas-tarjeta-cabecera">
                <span className="encuestas-pregunta-numero">Tarjeta {indice + 1}</span>
                <button
                  type="button"
                  className="encuestas-icon-btn encuestas-icon-btn-peligro"
                  onClick={() => onCambiar({ tarjetas: mail.tarjetas.filter((t) => t.clave !== tarjeta.clave) })}
                  aria-label={`Quitar la tarjeta ${indice + 1}`}
                >
                  <FaTrash />
                </button>
              </div>
              <label className="encuestas-label">
                <span className="encuestas-label-linea">
                  Título <Contador valor={tarjeta.titulo} maximo={LARGOS.tarjetaTitulo} />
                </span>
                <input
                  className="encuestas-input"
                  value={tarjeta.titulo}
                  placeholder="25% OFF"
                  onChange={(e) => cambiarTarjeta(tarjeta.clave, 'titulo', e.target.value)}
                />
              </label>
              <label className="encuestas-label">
                <span className="encuestas-label-linea">
                  Texto <Contador valor={tarjeta.texto} maximo={LARGOS.tarjetaTexto} />
                </span>
                <textarea
                  className="encuestas-input encuestas-textarea"
                  rows={2}
                  value={tarjeta.texto}
                  placeholder="en Creatina"
                  onChange={(e) => cambiarTarjeta(tarjeta.clave, 'texto', e.target.value)}
                />
              </label>
            </div>
          ))}
          {mail.tarjetas.length < MAX_TARJETAS && (
            <button
              type="button"
              className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico encuestas-btn-agregar"
              onClick={() => onCambiar({ tarjetas: [...mail.tarjetas, tarjetaVacia()] })}
            >
              <FaPlus /> Agregar tarjeta
            </button>
          )}
        </fieldset>
      )}

      <fieldset className="encuestas-fieldset" disabled={deshabilitado}>
        <legend>Imagen de arriba</legend>
        <label className="encuestas-label">
          Imagen <span className="encuestas-ayuda">(JPG, PNG o WEBP, hasta 1 MB; se sube al guardar la encuesta)</span>
          <input className="encuestas-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirImagen} />
        </label>
        {mail.plantilla !== 'beneficio' && (
          <p className="encuestas-aviso">La imagen solo se ve con la plantilla "Beneficio". Con esta plantilla el mail sale sin imagen.</p>
        )}
        {imagenVista ? (
          <>
            <img className="encuestas-imagen-mail" src={imagenVista} alt="Imagen del mail" />
            <button
              type="button"
              className="encuestas-btn encuestas-btn-secundario encuestas-btn-chico encuestas-btn-agregar"
              onClick={() => onImagen({ archivo: null, quitar: tieneImagenGuardada })}
            >
              Quitar imagen
            </button>
          </>
        ) : (
          <p className="encuestas-ayuda">Sin imagen, el mail sale sin la parte de arriba.</p>
        )}
      </fieldset>
    </div>
  );
};

export default EncuestaMailEditor;
