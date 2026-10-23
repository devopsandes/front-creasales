// CampaniaContenidoMail.tsx — contenido del mail de la campaña: plantilla cerrada, asunto, remitente, texto, botón,
// tarjetas e imagen (solo plantilla "beneficio"). La vista previa la arma emisivos (botón "Ver cómo queda").

import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import CampaniaContador from './CampaniaContador';
import { urlImagenCampania } from './campanias.api';
import type { Campania, DatosFormularioCampania, PlantillaMail } from './campanias.api';
import {
  LARGOS,
  MAX_TARJETAS,
  PLANTILLAS_MAIL,
  REMITENTES_POR_DEFECTO,
  esLinkDeCampania,
  esLinkInstagram,
  errorDeImagenMail,
  tarjetaVacia,
} from './campaniasOpciones';

/** La imagen que se va a guardar con la campaña: una recién elegida, o quitar la que ya tenía. */
export interface CambioImagen {
  archivo: File | null;
  quitar: boolean;
}

interface ContenidoMailProps {
  mail: DatosFormularioCampania['mail'];
  onCambiar: (cambio: Partial<DatosFormularioCampania['mail']>) => void;
  /** Remitentes que devuelve GET /campanias/opciones (si todavía no llegaron, los de siempre). */
  remitentes: string[];
  campania: Campania | null;
  imagen: CambioImagen;
  onImagen: (cambio: CambioImagen) => void;
  onError: (mensaje: string) => void;
  onVerPreview: () => void;
  verificando: boolean;
  deshabilitado: boolean;
}

const CampaniaContenidoMail = ({
  mail,
  onCambiar,
  remitentes,
  campania,
  imagen,
  onImagen,
  onError,
  onVerPreview,
  verificando,
  deshabilitado,
}: ContenidoMailProps) => {
  const [urlImagenNueva, setUrlImagenNueva] = useState<string | null>(null);

  // Vista previa de la imagen elegida: se libera al cambiarla o al cerrar el asistente.
  useEffect(() => {
    if (!imagen.archivo) {
      setUrlImagenNueva(null);
      return;
    }
    const url = URL.createObjectURL(imagen.archivo);
    setUrlImagenNueva(url);
    return () => URL.revokeObjectURL(url);
  }, [imagen.archivo]);

  const imagenGuardada = campania && campania.tieneImagen && !imagen.quitar ? urlImagenCampania(campania.id, campania.updatedAt) : null;
  const imagenVista = urlImagenNueva ?? imagenGuardada;

  const elegirImagen = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const problema = errorDeImagenMail(archivo);
    if (problema) {
      onError(problema);
      return;
    }
    onImagen({ archivo, quitar: false });
  };

  const plantilla = PLANTILLAS_MAIL.find((opcion) => opcion.valor === mail.plantilla);
  const llevaTarjetas = mail.plantilla === 'beneficio' || mail.plantilla === 'informativo';
  const llevaBoton = mail.plantilla !== 'simple';
  const botonObligatorio = mail.plantilla === 'aviso' || mail.plantilla === 'beneficio';
  const opcionesRemitente = remitentes.length > 0 ? remitentes : REMITENTES_POR_DEFECTO;
  const botonLink = mail.botonLink.trim();
  const linkInvalido = botonLink !== '' && !esLinkDeCampania(botonLink) && !esLinkInstagram(botonLink);

  const cambiarTarjeta = (clave: number, campo: 'titulo' | 'texto', valor: string) => {
    onCambiar({ tarjetas: mail.tarjetas.map((t) => (t.clave === clave ? { ...t, [campo]: valor } : t)) });
  };

  const elegirPlantilla = (valor: PlantillaMail) => {
    // Las tarjetas empiezan con una vacía para que se vea dónde van.
    const necesitaTarjeta = (valor === 'beneficio' || valor === 'informativo') && mail.tarjetas.length === 0;
    onCambiar({ plantilla: valor, ...(necesitaTarjeta ? { tarjetas: [tarjetaVacia()] } : {}) });
  };

  return (
    <div className="campanias-seccion-campos">
      <div className="campanias-label">
        Plantilla
        <div className="campanias-plantillas" role="group" aria-label="Plantilla del mail">
          {PLANTILLAS_MAIL.map((opcion) => (
            <button
              type="button"
              key={opcion.valor}
              className={`campanias-plantilla ${mail.plantilla === opcion.valor ? 'campanias-plantilla-activa' : ''}`}
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

      <label className="campanias-label">
        <span className="campanias-label-linea">
          Asunto <CampaniaContador valor={mail.asunto} maximo={LARGOS.asunto} />
        </span>
        <input
          className="campanias-input"
          value={mail.asunto}
          disabled={deshabilitado}
          onChange={(e) => onCambiar({ asunto: e.target.value })}
        />
        <span className="campanias-ayuda">Puede llevar {'{{NOMBRE}}'}: se reemplaza por el primer nombre de cada persona.</span>
      </label>

      <div className="campanias-fila">
        <label className="campanias-label">
          Remitente <span className="campanias-ayuda">(desde qué dirección sale)</span>
          <select
            className="campanias-input"
            value={mail.remitente}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ remitente: e.target.value })}
          >
            <option value="">Elegí un remitente...</option>
            {opcionesRemitente.map((remitente) => (
              <option key={remitente} value={remitente}>
                {remitente}
              </option>
            ))}
          </select>
        </label>
        <label className="campanias-label">
          Responder a <span className="campanias-ayuda">(opcional)</span>
          <input
            className="campanias-input"
            type="email"
            placeholder="comercial@andessalud.ar"
            value={mail.replyTo}
            disabled={deshabilitado}
            onChange={(e) => onCambiar({ replyTo: e.target.value })}
          />
        </label>
      </div>

      <label className="campanias-label">
        <span className="campanias-label-linea">
          Título <span className="campanias-ayuda">(va en la banda azul)</span> <CampaniaContador valor={mail.titulo} maximo={LARGOS.mailTitulo} />
        </span>
        <input
          className="campanias-input"
          value={mail.titulo}
          disabled={deshabilitado}
          onChange={(e) => onCambiar({ titulo: e.target.value })}
        />
      </label>

      <label className="campanias-label">
        <span className="campanias-label-linea">
          Texto <CampaniaContador valor={mail.texto} maximo={LARGOS.mailTexto} />
        </span>
        <textarea
          className="campanias-input campanias-textarea"
          rows={8}
          value={mail.texto}
          disabled={deshabilitado}
          onChange={(e) => onCambiar({ texto: e.target.value })}
        />
        <span className="campanias-ayuda">
          **negrita** · una línea en blanco = párrafo nuevo · {'{{NOMBRE}}'} = primer nombre de la persona
        </span>
      </label>

      {llevaBoton && (
        <fieldset className="campanias-fieldset" disabled={deshabilitado}>
          <legend>Botón {botonObligatorio ? '(obligatorio en esta plantilla)' : '(opcional)'}</legend>
          <div className="campanias-fila">
            <label className="campanias-label">
              <span className="campanias-label-linea">
                Texto del botón <CampaniaContador valor={mail.botonTexto} maximo={LARGOS.botonTexto} />
              </span>
              <input className="campanias-input" value={mail.botonTexto} onChange={(e) => onCambiar({ botonTexto: e.target.value })} />
            </label>
            <label className="campanias-label">
              Link del botón
              <input
                className="campanias-input"
                type="url"
                placeholder="https://"
                value={mail.botonLink}
                onChange={(e) => onCambiar({ botonLink: e.target.value })}
              />
            </label>
          </div>
          {linkInvalido && (
            <p className="campanias-aviso">
              El link tiene que ser https de andessalud.com.ar o andessalud.ar, un WhatsApp de Argentina (https://wa.me/54...) o
              Instagram (https://www.instagram.com/...).
            </p>
          )}
        </fieldset>
      )}

      {llevaTarjetas && (
        <fieldset className="campanias-fieldset" disabled={deshabilitado}>
          <legend>
            Tarjetas ({mail.tarjetas.length} de {MAX_TARJETAS})
          </legend>
          <p className="campanias-ayuda">
            {mail.plantilla === 'beneficio' ? 'Una por cada beneficio o descuento.' : 'Para destacar datos puntuales.'} Las que queden
            vacías no se envían.
          </p>
          {mail.tarjetas.map((tarjeta, indice) => (
            <div className="campanias-tarjeta" key={tarjeta.clave}>
              <div className="campanias-tarjeta-cabecera">
                <span className="campanias-tarjeta-numero">Tarjeta {indice + 1}</span>
                <button
                  type="button"
                  className="campanias-icon-btn campanias-icon-btn-peligro"
                  onClick={() => onCambiar({ tarjetas: mail.tarjetas.filter((t) => t.clave !== tarjeta.clave) })}
                  aria-label={`Quitar la tarjeta ${indice + 1}`}
                >
                  <FaTrash />
                </button>
              </div>
              <label className="campanias-label">
                <span className="campanias-label-linea">
                  Título <CampaniaContador valor={tarjeta.titulo} maximo={LARGOS.tarjetaTitulo} />
                </span>
                <input
                  className="campanias-input"
                  value={tarjeta.titulo}
                  placeholder="20% OFF"
                  onChange={(e) => cambiarTarjeta(tarjeta.clave, 'titulo', e.target.value)}
                />
              </label>
              <label className="campanias-label">
                <span className="campanias-label-linea">
                  Texto <CampaniaContador valor={tarjeta.texto} maximo={LARGOS.tarjetaTexto} />
                </span>
                <textarea
                  className="campanias-input campanias-textarea"
                  rows={2}
                  value={tarjeta.texto}
                  placeholder="en Gym Marina"
                  onChange={(e) => cambiarTarjeta(tarjeta.clave, 'texto', e.target.value)}
                />
              </label>
            </div>
          ))}
          {mail.tarjetas.length < MAX_TARJETAS && (
            <button
              type="button"
              className="campanias-btn campanias-btn-secundario campanias-btn-chico campanias-btn-agregar"
              onClick={() => onCambiar({ tarjetas: [...mail.tarjetas, tarjetaVacia()] })}
            >
              <FaPlus /> Agregar tarjeta
            </button>
          )}
        </fieldset>
      )}

      {mail.plantilla === 'beneficio' && (
        <fieldset className="campanias-fieldset" disabled={deshabilitado}>
          <legend>Imagen de arriba</legend>
          <label className="campanias-label">
            Imagen <span className="campanias-ayuda">(JPG, PNG o WEBP, hasta 1 MB; se sube al guardar)</span>
            <input className="campanias-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirImagen} />
          </label>
          {imagenVista ? (
            <>
              <img className="campanias-imagen-mail" src={imagenVista} alt="Imagen del mail" />
              <button
                type="button"
                className="campanias-btn campanias-btn-secundario campanias-btn-chico campanias-btn-agregar"
                onClick={() => onImagen({ archivo: null, quitar: Boolean(campania?.tieneImagen) })}
              >
                Quitar imagen
              </button>
            </>
          ) : (
            <p className="campanias-ayuda">Sin imagen, el mail sale sin la parte de arriba.</p>
          )}
        </fieldset>
      )}

      <div className="campanias-preview-mail-accion">
        <button type="button" className="campanias-btn campanias-btn-secundario" onClick={onVerPreview} disabled={verificando || deshabilitado}>
          <FaEye /> {verificando ? 'Preparando...' : 'Ver cómo queda'}
        </button>
        <span className="campanias-ayuda">
          Guarda el borrador y muestra el mail armado por el servidor ({plantilla?.etiqueta ?? mail.plantilla}), con "Juan" de nombre.
        </span>
      </div>
    </div>
  );
};

export default CampaniaContenidoMail;
