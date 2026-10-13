// encuestasOpciones.ts — constantes, textos y validaciones de la pestaña Encuestas.
// Los límites son los mismos que valida emisivos (LARGOS, MAX_PREGUNTAS... en encuestas.helpers.js): si cambian allá, acá también.

import type { DatosFormularioEncuesta, PreguntaFormulario, TipoPregunta } from './encuestas.api';

export const LARGOS = { titulo: 120, textoCierre: 300, pregunta: 200, ayuda: 200, opcion: 120 };
export const MAX_PREGUNTAS = 20;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 15;

export const TIPOS_PREGUNTA: { valor: TipoPregunta; etiqueta: string }[] = [
  { valor: 'unica', etiqueta: 'Opción única' },
  { valor: 'multiple', etiqueta: 'Varias opciones' },
  { valor: 'texto', etiqueta: 'Texto libre' },
];

export const nombreTipo = (tipo: TipoPregunta): string =>
  TIPOS_PREGUNTA.find((opcion) => opcion.valor === tipo)?.etiqueta ?? tipo;

/** Contador para las claves de React del constructor (no viajan al backend). */
let ultimaClave = 0;
export const nuevaClave = (): number => {
  ultimaClave += 1;
  return ultimaClave;
};

export const opcionVacia = () => ({ clave: nuevaClave(), texto: '' });

export const preguntaVacia = (tipo: TipoPregunta = 'unica'): PreguntaFormulario => ({
  clave: nuevaClave(),
  texto: '',
  tipo,
  obligatoria: true,
  ayuda: '',
  opciones: tipo === 'texto' ? [] : [opcionVacia(), opcionVacia()],
});

/** Igual que textoLimpio() de emisivos: recorta y junta los espacios repetidos. */
const limpiar = (texto: string): string => texto.trim().replace(/\s+/g, ' ');

/**
 * Mensaje del primer problema de la encuesta, o null si está bien. Mismas reglas y casi los mismos textos que
 * validarEncuesta() de emisivos (el backend vuelve a validar igual y su mensaje se muestra en el toast).
 */
export const errorDeEncuesta = (datos: DatosFormularioEncuesta): string | null => {
  const titulo = limpiar(datos.titulo);
  if (!titulo) return 'La encuesta necesita un título.';
  if (titulo.length > LARGOS.titulo) return `El título puede tener hasta ${LARGOS.titulo} caracteres.`;
  if (limpiar(datos.textoCierre).length > LARGOS.textoCierre) {
    return `El texto de cierre puede tener hasta ${LARGOS.textoCierre} caracteres.`;
  }

  if (datos.preguntas.length === 0) return 'La encuesta necesita al menos una pregunta.';
  if (datos.preguntas.length > MAX_PREGUNTAS) return `La encuesta puede tener hasta ${MAX_PREGUNTAS} preguntas.`;

  for (const [indice, pregunta] of datos.preguntas.entries()) {
    const numero = indice + 1;
    const texto = limpiar(pregunta.texto);
    if (!texto) return `La pregunta ${numero} no tiene texto.`;
    if (texto.length > LARGOS.pregunta) return `La pregunta ${numero} puede tener hasta ${LARGOS.pregunta} caracteres.`;
    if (limpiar(pregunta.ayuda).length > LARGOS.ayuda) {
      return `La ayuda de la pregunta ${numero} puede tener hasta ${LARGOS.ayuda} caracteres.`;
    }
    if (pregunta.tipo === 'texto') continue;

    const textos = pregunta.opciones.map((opcion) => limpiar(opcion.texto));
    if (textos.some((opcion) => opcion === '')) {
      return `La pregunta ${numero} tiene una opción vacía: completala o quitala.`;
    }
    if (textos.length < MIN_OPCIONES || textos.length > MAX_OPCIONES) {
      return `La pregunta ${numero} necesita entre ${MIN_OPCIONES} y ${MAX_OPCIONES} opciones.`;
    }
    if (textos.some((opcion) => opcion.length > LARGOS.opcion)) {
      return `Las opciones de la pregunta ${numero} pueden tener hasta ${LARGOS.opcion} caracteres.`;
    }
    if (new Set(textos.map((opcion) => opcion.toLowerCase())).size !== textos.length) {
      return `La pregunta ${numero} tiene opciones repetidas.`;
    }
  }
  return null;
};

/** "3 de 10 respondieron" para el listado. */
export const textoAvance = (respondieron: number, asignados: number): string =>
  `${respondieron} de ${asignados} respondieron`;

/** Porcentaje entero 0-100 (0 si no hay nadie asignado). */
export const porcentaje = (parte: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0;

/** "2026-10-09T14:35:24.000Z" → "09/10/2026" (hora local). */
export const fechaCorta = (iso: string): string => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Dónde se responde la encuesta en la web (encuesta-web, publicada por FTP en andessalud.com.ar/encuesta/). En local se
 * apunta al servidor de desarrollo con VITE_ENCUESTA_WEB_URL (ej. http://localhost:5210/encuesta/).
 */
const URL_ENCUESTA_WEB = (import.meta.env.VITE_ENCUESTA_WEB_URL || 'https://andessalud.com.ar/encuesta/').replace(/\/?$/, '/');

/** Link de la encuesta para mandar por WhatsApp o mail: andessalud.com.ar/encuesta/?e=<id>. */
export const linkEncuestaWeb = (id: number): string => `${URL_ENCUESTA_WEB}?e=${id}`;
