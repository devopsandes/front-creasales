// encuestas.api.ts — llamadas a emisivos para la pestaña Encuestas (encuestas para afiliados de Andes Salud).
// Contrato del backend: docs/encuestas.md en el repo de Emisivos (sección "ABM").

import { JSON_HEADERS, URL_EMISIVOS, pedir } from '../banner.api';

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
  /** Cuántos DNIs tiene la lista (0 = sin lista, no se puede activar). La lista en sí nunca sale de emisivos. */
  asignados: number;
  respondieron: number;
  createdAt: string;
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

export interface ResultadosEncuesta {
  asignados: number;
  respondieron: number;
  porCanal: { app: number; web: number };
  preguntas: PreguntaResultado[];
}

/** Lo que espera POST/PUT /encuestas: las opciones van como lista de textos. */
const armarCuerpo = (datos: DatosFormularioEncuesta) =>
  JSON.stringify({
    titulo: datos.titulo,
    textoCierre: datos.textoCierre,
    preguntas: datos.preguntas.map((pregunta) => ({
      texto: pregunta.texto,
      tipo: pregunta.tipo,
      obligatoria: pregunta.obligatoria,
      ayuda: pregunta.ayuda,
      opciones: pregunta.tipo === 'texto' ? [] : pregunta.opciones.map((opcion) => opcion.texto),
    })),
  });

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

/** Activar sin lista de DNIs devuelve 409: pedir() lanza el Error con el mensaje del backend. */
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

/** Excel con dos hojas: "Respuestas" y "No respondieron". Se descarga abriendo el link. */
export const urlExportarEncuesta = (id: number): string => `${URL_EMISIVOS}/encuestas/${id}/exportar`;
