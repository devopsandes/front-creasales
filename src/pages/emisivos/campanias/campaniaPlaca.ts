// campaniaPlaca.ts — reglas del formulario de la "Campaña con placa propia" (Ruy, 16/11/2026). Mismos límites que valida
// emisivos (validarContenidoPlaca en campanias.helpers.js). Aparte de campaniasOpciones.ts para no tocar el asistente de siempre.

import type { Campania, DatosPlaca, TipoDestinatario } from './campanias.api';
import { LARGOS, esLinkDeCampania } from './campaniasOpciones';
import { esLinkInstagram } from '../bannerOpciones';
import { LINK_BOT_COMERCIAL } from './placaImagen';

export const MAX_TEXTO_ALTERNATIVO = 500;

/**
 * El filtro "descartados" de las tablas de personas: en contactos son los afiliados que se sacaron de la lista (estado
 * AFILIADO, que emisivos incluye en ese filtro). En los demás tipos queda como estaba (solo si se cruzan con el padrón).
 */
export const muestraDescartados = (tipo: TipoDestinatario, conPadron: boolean): boolean => conPadron || tipo === 'contactos';
export const conEtiquetaDeContactos = <T extends { valor: string; etiqueta: string }>(filtros: T[], tipo: TipoDestinatario): T[] =>
  tipo === 'contactos' ? filtros.map((f) => (f.valor === 'descartados' ? { ...f, etiqueta: 'Son afiliados (no reciben)' } : f)) : filtros;

/**
 * Por qué una campaña a contactos enviándose no avanza (emisivos manda `topeDiario`), en una frase, o null si avanza:
 * tope del día, fuera del horario (8 a 22) o esperando que salgan otras campañas (prioridad baja).
 */
export const motivoEspera = (campania: Pick<Campania, 'estado' | 'topeDiario'>): string | null => {
  const t = campania.topeDiario;
  if (campania.estado !== 'ENVIANDO' || !t) return null;
  if (t.alcanzado) return `Tope diario alcanzado (${t.tope.toLocaleString('es-AR')} mails a contactos por día): sigue sola mañana desde las 8.`;
  if (t.fueraDeHorario) return 'Fuera de horario: los mails a contactos salen todos los días de 8 a 22. Sigue sola a las 8.';
  if (t.enEspera) return 'En espera: primero salen otras campañas que se están enviando; después sigue esta.';
  return null;
};

/** La campaña es de placa propia (se abre con su asistente, no con el de siempre). */
export const esCampaniaPlaca = (campania: Pick<Campania, 'mail'>): boolean => campania.mail?.plantilla === 'placa';

export const datosPlacaVacios = (remitente = ''): DatosPlaca => ({
  nombre: '',
  asunto: '',
  remitente,
  replyTo: '',
  botonLink: LINK_BOT_COMERCIAL,
  textoAlternativo: '',
  textoBoton: '',
});

export const datosPlacaDesdeCampania = (campania: Campania): DatosPlaca => ({
  nombre: campania.nombre,
  asunto: campania.mail?.asunto ?? '',
  remitente: campania.mail?.remitente ?? '',
  replyTo: campania.mail?.replyTo ?? '',
  botonLink: campania.mail?.contenido.botonLink ?? LINK_BOT_COMERCIAL,
  textoAlternativo: campania.mail?.contenido.textoAlternativo ?? '',
  textoBoton: campania.mail?.contenido.botonDebajo?.texto ?? '',
});

/** Mensaje de error del paso Placa, o null si se puede guardar. */
export const errorDePlaca = (datos: DatosPlaca, tienePlaca: boolean): string | null => {
  if (!datos.nombre.trim()) return 'La campaña necesita un nombre.';
  if (datos.nombre.trim().length > LARGOS.nombre) return `El nombre puede tener hasta ${LARGOS.nombre} caracteres.`;
  if (!datos.asunto.trim()) return 'El mail necesita un asunto.';
  if (datos.asunto.trim().length > LARGOS.asunto) return `El asunto puede tener hasta ${LARGOS.asunto} caracteres.`;
  if (!tienePlaca) return 'Falta la placa: pegá el HTML o subí la imagen y tocá "Armar la placa".';
  const link = datos.botonLink.trim();
  if (!link) return 'Falta el link a donde lleva la placa.';
  if (!esLinkDeCampania(link) && !esLinkInstagram(link)) {
    return 'El link tiene que ser https de andessalud.com.ar o andessalud.ar, un WhatsApp de Argentina (https://wa.me/54...) o Instagram.';
  }
  if (datos.textoAlternativo.trim().length > MAX_TEXTO_ALTERNATIVO) return `El texto alternativo puede tener hasta ${MAX_TEXTO_ALTERNATIVO} caracteres.`;
  if (datos.textoBoton.trim().length > LARGOS.botonTexto) return `El texto del botón puede tener hasta ${LARGOS.botonTexto} caracteres.`;
  return null;
};
