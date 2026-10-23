// encuestas.api.ts — llamadas a emisivos para la pestaña Encuestas (encuestas para afiliados de Andes Salud).
// Contrato del backend: docs/encuestas.md en el repo de Emisivos (secciones "ABM" y "Encuestas públicas").

import { JSON_HEADERS, URL_EMISIVOS, pedir, pedirArchivo } from '../banner.api';
import type { DatosFormularioCampania, MailCampania } from '../campanias/campanias.api';

/** Quién la responde: los DNI de una lista, todos los afiliados vigentes (en la app) o cualquiera con el link (solo web). */
export type Audiencia = 'lista' | 'afiliados' | 'publica';

/** El "Estado" que carga marketing en cada registro de una encuesta pública. */
export type EstadoMarketing = 'Pendiente' | 'Contactado' | 'Canjeado' | 'No responde';

/** Cómo va el mail a quien respondió (una pública). */
export type MailEstado = 'pendiente' | 'enviando' | 'enviado' | 'error' | 'rebotado' | 'no_corresponde';

export type FiltroRegistros = 'todas' | 'unicas' | 'duplicadas' | 'mail_error';

/** El mail a quien responde: el mismo contenido que el mail de Campañas, más el interruptor. */
export interface MailPersona extends MailCampania {
  activo: boolean;
}

/** Un mail por cada registro nuevo, a hasta MAX_AVISOS direcciones (p. ej. marketing). */
export interface AvisosEncuesta {
  activo: boolean;
  destinatarios: string[];
}

/** Qué pasa cuando alguien contesta. Nunca sale en la app ni en la web. */
export interface AccionEncuesta {
  mailPersona: MailPersona | null;
  avisos: AvisosEncuesta | null;
}

/** El mail como lo arma el formulario (mismo formato que el paso Contenido de Campañas). */
export type MailFormulario = DatosFormularioCampania['mail'];

export type TipoPregunta = 'unica' | 'multiple' | 'texto';

export interface OpcionEncuesta {
  id: string;
  texto: string;
}

export interface PreguntaEncuesta {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  obligatoria: boolean;
  ayuda: string | null;
  /** Vacía en las preguntas de texto libre. */
  opciones: OpcionEncuesta[];
}

/** Fila del listado: GET /encuestas (sin las preguntas). */
export interface ResumenEncuesta {
  id: number;
  titulo: string;
  textoCierre: string | null;
  activa: boolean;
  cantidadPreguntas: number;
  /** Cuántos DNIs tiene la lista (0 = sin lista; solo las de "lista" la necesitan para activarse). La lista en sí nunca sale de emisivos. */
  asignados: number;
  respondieron: number;
  createdAt: string;
  /** Si el emisivos es viejo y no lo manda, es una de lista como siempre. */
  audiencia?: Audiencia;
  descripcion?: string | null;
  condiciones?: string | null;
  textoBoton?: string | null;
  terminosUrl?: string | null;
  accion?: AccionEncuesta | null;
  /** Solo lectura: si el mail a la persona tiene imagen subida. */
  tieneImagenMail?: boolean;
}

/** GET /encuestas/:id: la encuesta completa. */
export interface Encuesta extends Omit<ResumenEncuesta, 'cantidadPreguntas'> {
  preguntas: PreguntaEncuesta[];
}

/** Una pregunta tal como la arma el constructor del formulario. */
export interface PreguntaFormulario {
  /** Clave solo del front para que React no mezcle filas al subir, bajar o quitar. */
  clave: number;
  texto: string;
  tipo: TipoPregunta;
  obligatoria: boolean;
  ayuda: string;
  /** Textos de las opciones; el backend les pone los ids (o1, o2...). Vacío en las de texto libre. */
  opciones: { clave: number; texto: string }[];
}

export interface DatosFormularioEncuesta {
  titulo: string;
  textoCierre: string;
  preguntas: PreguntaFormulario[];
  audiencia: Audiencia;
  /** Solo pública: texto bajo el título en la web. */
  descripcion: string;
  /** Solo pública: texto del botón de enviar (vacío = "Enviar"). */
  textoBoton: string;
  /** Solo pública: letra chica. */
  condiciones: string;
  /** Vacío = en una pública, la página de formularios y promociones. */
  terminosUrl: string;
  /** Solo pública: mandarle un mail a quien responde. */
  mailPersonaActivo: boolean;
  mail: MailFormulario;
  avisosActivo: boolean;
  /** Mails de aviso tal como los escribe la operadora (separados por coma). */
  avisos: string;
}

export interface OpcionResultado {
  id: string;
  texto: string;
  cantidad: number;
  /** Sobre los que respondieron esa pregunta. */
  porcentaje: number;
}

export interface PreguntaResultado {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  /** Cuántos contestaron esta pregunta. */
  respondieron?: number;
  opciones: OpcionResultado[];
  /** Respuestas abiertas, sin DNI. */
  textos: string[];
}

/** Lo que suma GET /encuestas/:id/resultados en una encuesta pública. */
export interface ResumenPublico {
  total: number;
  unicas: number;
  duplicadas: number;
  mail: { enviados: number; pendientes: number; errores: number; rebotados: number };
  estados: Record<EstadoMarketing, number>;
}

export interface ResultadosEncuesta {
  /** Cero en las de "todos los afiliados" y en las públicas (no hay lista). */
  asignados: number;
  respondieron: number;
  porCanal: { app: number; web: number };
  preguntas: PreguntaResultado[];
  publica?: ResumenPublico;
}

/** Una fila de la tabla de registros de una pública. */
export interface RegistroPublico {
  id: number;
  nombre: string;
  whatsapp: string;
  email: string;
  duplicada: boolean;
  mailEstado: MailEstado;
  estado: EstadoMarketing;
  respuestas?: unknown;
  createdAt: string;
}

export interface PaginaRegistros {
  filas: RegistroPublico[];
  total: number;
  porPagina: number;
}

export interface ConsultaRegistros {
  filtro: FiltroRegistros;
  /** '' = todos los estados */
  estado: EstadoMarketing | '';
  q: string;
  pagina: number;
}

export interface ResultadoPruebaMail {
  mail: string;
  ok: boolean;
  error?: string;
}

/** Los mails de aviso tal como los escribió la operadora → lista sin vacíos ni repetidos. */
export const listaDeMails = (texto: string): string[] => [
  ...new Set(
    texto
      .split(/[\s,;]+/)
      .map((mail) => mail.trim().toLowerCase())
      .filter(Boolean),
  ),
];

/** Lo que viaja en `accion` de POST/PUT /encuestas. */
interface AccionParaEnviar {
  mailPersona: {
    activo: true;
    plantilla: MailFormulario['plantilla'];
    asunto: string;
    remitente: string;
    replyTo?: string;
    contenido: {
      titulo: string;
      texto: string;
      botonTexto: string;
      botonLink: string;
      tarjetas: { titulo: string; texto: string }[];
    };
  } | null;
  avisos: { activo: true; destinatarios: string[] } | null;
}

/** La acción al contestar, como la espera el backend. Sin nada prendido va null. El mail y los avisos solo existen en las públicas. */
const armarAccion = (datos: DatosFormularioEncuesta): AccionParaEnviar | null => {
  const { mail } = datos;
  const llevaTarjetas = mail.plantilla === 'beneficio' || mail.plantilla === 'informativo';
  const llevaBoton = mail.plantilla !== 'simple';
  const mailPersona =
    datos.audiencia === 'publica' && datos.mailPersonaActivo
      ? {
          activo: true as const,
          plantilla: mail.plantilla,
          asunto: mail.asunto,
          remitente: mail.remitente,
          replyTo: mail.replyTo.trim() || undefined,
          contenido: {
            titulo: mail.titulo,
            texto: mail.texto,
            botonTexto: llevaBoton ? mail.botonTexto : '',
            botonLink: llevaBoton ? mail.botonLink : '',
            tarjetas: llevaTarjetas ? mail.tarjetas.map(({ titulo, texto }) => ({ titulo, texto })) : [],
          },
        }
      : null;
  // Los avisos solo salen de las públicas: en las de lista o afiliados el backend no los acepta (no había quién los mandara).
  const avisos =
    datos.audiencia === 'publica' && datos.avisosActivo ? { activo: true as const, destinatarios: listaDeMails(datos.avisos) } : null;
  return mailPersona || avisos ? { mailPersona, avisos } : null;
};

/**
 * Lo que espera POST/PUT /encuestas: las opciones van como lista de textos. Lo propio de las públicas (descripción, botón,
 * condiciones, mail a la persona) solo viaja si la audiencia es pública; el resto va vacío. Sirve también de "huella" para
 * saber si el formulario tiene cambios sin guardar.
 */
export const armarCuerpo = (datos: DatosFormularioEncuesta): string => {
  const publica = datos.audiencia === 'publica';
  return JSON.stringify({
    titulo: datos.titulo,
    textoCierre: datos.textoCierre,
    audiencia: datos.audiencia,
    descripcion: publica ? datos.descripcion : '',
    condiciones: publica ? datos.condiciones : '',
    textoBoton: publica ? datos.textoBoton : '',
    terminosUrl: datos.terminosUrl.trim(),
    accion: armarAccion(datos),
    preguntas: datos.preguntas.map((pregunta) => ({
      texto: pregunta.texto,
      tipo: pregunta.tipo,
      obligatoria: pregunta.obligatoria,
      ayuda: pregunta.ayuda,
      opciones: pregunta.tipo === 'texto' ? [] : pregunta.opciones.map((opcion) => opcion.texto),
    })),
  });
};

export const listarEncuestas = async (): Promise<ResumenEncuesta[]> =>
  (await pedir<ResumenEncuesta[]>('/encuestas')).data ?? [];

export const obtenerEncuesta = async (id: number): Promise<Encuesta> => {
  const respuesta = await pedir<Encuesta>(`/encuestas/${id}`);
  if (!respuesta.data) throw new Error(`No se encontró la encuesta #${id}`);
  return respuesta.data;
};

export const crearEncuesta = (datos: DatosFormularioEncuesta) =>
  pedir<Encuesta>('/encuestas', { method: 'POST', headers: JSON_HEADERS, body: armarCuerpo(datos) });

export const editarEncuesta = (id: number, datos: DatosFormularioEncuesta) =>
  pedir<Encuesta>(`/encuestas/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: armarCuerpo(datos) });

/** Activar una de lista sin lista de DNIs devuelve 409: pedir() lanza el Error con el mensaje del backend. */
export const cambiarActivaEncuesta = (id: number, activa: boolean) =>
  pedir<Encuesta>(`/encuestas/${id}/activa`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ activa }) });

export const duplicarEncuesta = (id: number) => pedir<Encuesta>(`/encuestas/${id}/duplicar`, { method: 'POST' });

export const borrarEncuesta = (id: number) => pedir<never>(`/encuestas/${id}`, { method: 'DELETE' });

/** Reemplaza la lista de DNIs con un archivo (.xlsx, .csv o .txt, campo "dnis"). */
export const cargarListaPorArchivo = (id: number, archivo: File) => {
  const formData = new FormData();
  formData.append('dnis', archivo);
  return pedir<Encuesta>(`/encuestas/${id}/asignados`, { method: 'POST', body: formData });
};

/** Reemplaza la lista de DNIs con los que se pegaron en un texto. */
export const cargarListaPorTexto = (id: number, texto: string) =>
  pedir<Encuesta>(`/encuestas/${id}/asignados`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ texto }) });

export const obtenerResultados = async (id: number): Promise<ResultadosEncuesta> => {
  const respuesta = await pedir<ResultadosEncuesta>(`/encuestas/${id}/resultados`);
  if (!respuesta.data) throw new Error('Emisivos no devolvió los resultados');
  return respuesta.data;
};

/** Imagen del mail a la persona (plantilla beneficio): JPG, PNG o WEBP de hasta 1 MB. Se sube DESPUÉS de guardar la encuesta. */
export const subirImagenMail = (id: number, archivo: File) => {
  const formData = new FormData();
  formData.append('imagen', archivo);
  return pedir<Encuesta>(`/encuestas/${id}/imagen-mail`, { method: 'POST', body: formData });
};

export const quitarImagenMail = (id: number) => {
  const formData = new FormData();
  formData.append('quitar', 'true');
  return pedir<Encuesta>(`/encuestas/${id}/imagen-mail`, { method: 'POST', body: formData });
};

/** La imagen es pública (la piden los clientes de correo). El parámetro v evita ver una vieja guardada en el navegador. */
export const urlImagenMail = (id: number, version: string | number): string =>
  `${URL_EMISIVOS}/encuestas/${id}/imagen-mail?v=${encodeURIComponent(String(version))}`;

/** Una página (de a 50, los más nuevos primero) de los registros de una encuesta pública. */
export const listarRegistrosPublicos = async (id: number, consulta: ConsultaRegistros): Promise<PaginaRegistros> => {
  const parametros = new URLSearchParams({ filtro: consulta.filtro, pagina: String(consulta.pagina) });
  if (consulta.estado) parametros.set('estado', consulta.estado);
  if (consulta.q.trim()) parametros.set('q', consulta.q.trim());
  const respuesta = await pedir<RegistroPublico[]>(`/encuestas/${id}/respuestas-publicas?${parametros.toString()}`);
  const meta = respuesta.meta as { total?: number; porPagina?: number } | undefined;
  return { filas: respuesta.data ?? [], total: meta?.total ?? 0, porPagina: meta?.porPagina ?? 50 };
};

/**
 * Los registros de una pública para el informe PDF, pidiendo las páginas de a una y en orden, hasta `tope` (si hay más, `total`
 * dice cuántos hay de verdad y el resto queda en el Excel). Cada registro entra una sola vez, por id: con respuestas nuevas entrando
 * la paginación por offset puede repetir filas entre páginas. `cancelado` se consulta antes de cada página.
 */
export const traerRegistrosPublicos = async (
  id: number,
  tope: number,
  cancelado?: () => boolean,
): Promise<{ filas: RegistroPublico[]; total: number }> => {
  const filas: RegistroPublico[] = [];
  const vistos = new Set<number>();
  let total = 0;
  for (let pagina = 1; !cancelado?.(); pagina += 1) {
    const actual = await listarRegistrosPublicos(id, { filtro: 'todas', estado: '', q: '', pagina });
    total = actual.total;
    for (const fila of actual.filas) {
      if (vistos.has(fila.id)) continue;
      vistos.add(fila.id);
      filas.push(fila);
    }
    if (actual.filas.length === 0 || filas.length >= total || filas.length >= tope) break;
  }
  return { filas: filas.slice(0, tope), total };
};

/** Cambia el "Estado" que carga marketing en un registro. */
export const cambiarEstadoRegistro = (id: number, registroId: number, estado: EstadoMarketing) =>
  pedir<RegistroPublico>(`/encuestas/${id}/respuestas-publicas/${registroId}/estado`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ estado }),
  });

/** Manda el mail de la acción a hasta 5 direcciones con "[PRUEBA]". 409 si la encuesta guardada no tiene el mail prendido. */
export const mandarPruebaMail = async (id: number, mails: string[]): Promise<ResultadoPruebaMail[]> => {
  const respuesta = await pedir<ResultadoPruebaMail[]>(`/encuestas/${id}/prueba-mail`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ mails }),
  });
  return respuesta.data ?? [];
};

/**
 * Excel con dos hojas: "Respuestas" y "No respondieron" (en una pública, una sola: "Registros"). Lo baja con el token
 * (pide sesión); devuelve el nombre del archivo.
 */
export const exportarEncuesta = (id: number): Promise<string> =>
  pedirArchivo(`/encuestas/${id}/exportar`, `encuesta-${id}.xlsx`);
