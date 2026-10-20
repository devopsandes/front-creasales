// encuestasOpciones.ts — constantes, textos y validaciones de la pestaña Encuestas.
// Los límites son los mismos que valida emisivos (LARGOS... en encuestas.helpers.js y encuestas.publicas.helpers.js): si cambian allá, acá también.

import { datosVacios, errorDeCampania } from '../campanias/campaniasOpciones';
import { listaDeMails } from './encuestas.api';
import type {
  Audiencia,
  DatosFormularioEncuesta,
  EstadoMarketing,
  FiltroRegistros,
  MailEstado,
  PreguntaFormulario,
  TipoPregunta,
} from './encuestas.api';

export const LARGOS = {
  titulo: 120,
  textoCierre: 300,
  pregunta: 200,
  ayuda: 200,
  opcion: 120,
  descripcion: 600,
  condiciones: 300,
  textoBoton: 40,
  terminosUrl: 300,
};
export const MAX_PREGUNTAS = 20;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 15;
/** A cuántos mails se avisa como máximo cada vez que alguien responde (y a cuántos se manda la prueba). */
export const MAX_AVISOS = 5;

/** Página de formularios y promociones: es la que usa una pública cuando no se carga otro link de términos. */
export const TERMINOS_POR_DEFECTO = 'https://andessalud.com.ar/terminos-formularios/';

/** Quién la responde. `chip` es lo que se ve en el listado. */
export const AUDIENCIAS: { valor: Audiencia; etiqueta: string; chip: string; explicacion: string }[] = [
  {
    valor: 'lista',
    etiqueta: 'Lista de DNI',
    chip: 'Lista de DNI',
    explicacion:
      'Solo la responden los afiliados cuyo DNI está en la lista que cargues. Les aparece en la app y pueden entrar por el link de la web con su DNI. Para activarla hace falta la lista.',
  },
  {
    valor: 'afiliados',
    etiqueta: 'Todos los afiliados',
    chip: 'Todos los afiliados',
    explicacion:
      'La responde cualquier afiliado vigente, sin lista: le aparece en la app (versión 7.1.6 en adelante). Cada afiliado la contesta una sola vez.',
  },
  {
    valor: 'publica',
    etiqueta: 'Pública (con link)',
    chip: 'Pública',
    explicacion:
      'La responde cualquiera con el link, solo en la web (nunca aparece en la app). Pide nombre, WhatsApp y email, y se puede mandar un mail a quien responde. Una respuesta con el mismo email o WhatsApp se guarda marcada como duplicada y no recibe el mail.',
  },
];

export const nombreAudiencia = (audiencia: Audiencia): string =>
  AUDIENCIAS.find((opcion) => opcion.valor === audiencia)?.chip ?? audiencia;

/** Las encuestas viejas (o un emisivos que todavía no manda el campo) son de lista, como siempre. */
export const audienciaDe = (encuesta: { audiencia?: Audiencia }): Audiencia => encuesta.audiencia ?? 'lista';

/** El "Estado" que carga marketing en cada registro de una pública. */
export const ESTADOS_MARKETING: EstadoMarketing[] = ['Pendiente', 'Contactado', 'Canjeado', 'No responde'];

export const FILTROS_REGISTROS: { valor: FiltroRegistros; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'unicas', etiqueta: 'Únicas' },
  { valor: 'duplicadas', etiqueta: 'Duplicadas' },
  { valor: 'mail_error', etiqueta: 'Con error de mail' },
];

/** Cómo va el mail a quien respondió, en criollo. */
export const textoMailEstado = (estado: MailEstado): string => {
  switch (estado) {
    case 'enviado':
      return 'Enviado';
    case 'pendiente':
    case 'enviando':
      return 'Pendiente';
    case 'error':
      return 'Error';
    case 'rebotado':
      return 'Rebotó';
    case 'no_corresponde':
      return 'No corresponde';
    default:
      return estado;
  }
};

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

/** Igual que esTerminosPermitido() de emisivos: https de andessalud.com.ar (con o sin www), sin usuario ni clave. */
const esLinkDeTerminos = (link: string): boolean => {
  try {
    const url = new URL(link);
    return (
      url.protocol === 'https:' && ['andessalud.com.ar', 'www.andessalud.com.ar'].includes(url.hostname) && !url.username && !url.password
    );
  } catch {
    return false;
  }
};

const REGEX_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lo propio de las públicas y la acción al contestar. Mismos mensajes que validarExtrasEncuesta() de emisivos. */
const errorDeExtras = (datos: DatosFormularioEncuesta): string | null => {
  const publica = datos.audiencia === 'publica';
  if (publica) {
    if (limpiar(datos.descripcion).length > LARGOS.descripcion) {
      return `La descripción puede tener hasta ${LARGOS.descripcion} caracteres.`;
    }
    if (limpiar(datos.condiciones).length > LARGOS.condiciones) {
      return `Las condiciones pueden tener hasta ${LARGOS.condiciones} caracteres.`;
    }
    if (limpiar(datos.textoBoton).length > LARGOS.textoBoton) {
      return `El texto del botón puede tener hasta ${LARGOS.textoBoton} caracteres.`;
    }
  }
  const terminos = limpiar(datos.terminosUrl);
  if (terminos && (terminos.length > LARGOS.terminosUrl || !esLinkDeTerminos(terminos))) {
    return 'El link de términos tiene que ser una página https de andessalud.com.ar.';
  }

  if (publica && datos.avisosActivo) {
    const mails = listaDeMails(datos.avisos);
    if (mails.length === 0) return 'Para avisar por mail cargá al menos un mail.';
    if (mails.length > MAX_AVISOS) return `Se puede avisar a hasta ${MAX_AVISOS} mails.`;
    const malo = mails.find((mail) => !REGEX_MAIL.test(mail));
    if (malo) return `El mail de aviso ${malo} no es válido.`;
  }

  // El mail a quien responde se valida con las mismas reglas que el de Campañas (plantilla, botón, tarjetas, largos).
  if (publica && datos.mailPersonaActivo) {
    return errorDeCampania({
      ...datosVacios(),
      nombre: 'encuesta',
      canales: { push: false, mail: true, banner: false },
      mail: datos.mail,
    });
  }
  return null;
};

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
  return errorDeExtras(datos);
};

/**
 * El avance en el listado. De lista: "3 de 10 respondieron"; todos los afiliados: "3 respondieron" (no hay un total contra el
 * cual comparar); pública: "3 registros".
 */
export const textoAvance = (respondieron: number, asignados: number, audiencia: Audiencia = 'lista'): string => {
  if (audiencia === 'publica') return `${respondieron} ${respondieron === 1 ? 'registro' : 'registros'}`;
  if (audiencia === 'afiliados') return `${respondieron} ${respondieron === 1 ? 'respondió' : 'respondieron'}`;
  return `${respondieron} de ${asignados} respondieron`;
};

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
