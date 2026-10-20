// campanias.api.ts — llamadas a emisivos para la pestaña Campañas (push, mail y banner a afiliados o prestadores).
// Contrato del backend: docs/campanias.md en el repo de Emisivos.

import { JSON_HEADERS, URL_EMISIVOS, pedir } from '../banner.api';
import type { PlantillaBanner } from '../banner.api';

export type EstadoCampania = 'BORRADOR' | 'PROCESANDO_LISTA' | 'LISTA' | 'ENVIANDO' | 'PAUSADA' | 'TERMINADA' | 'CANCELADA';
export type TipoDestinatario = 'afiliados' | 'prestadores';
export type PlantillaMail = 'aviso' | 'beneficio' | 'informativo' | 'simple';
export type CanalCampania = 'push' | 'mail' | 'banner';

export interface CanalesCampania {
  push: boolean;
  mail: boolean;
  banner: boolean;
}

export interface PushCampania {
  titulo: string;
  cuerpo: string;
  link: string | null;
}

export interface TarjetaMail {
  titulo: string | null;
  texto: string | null;
}

export interface MailCampania {
  plantilla: PlantillaMail;
  asunto: string;
  remitente: string;
  replyTo: string | null;
  contenido: {
    titulo: string;
    texto: string;
    botonTexto: string | null;
    botonLink: string | null;
    tarjetas: TarjetaMail[];
  };
}

/** Banner de la campaña: mismos campos que la pestaña Banner, sin lista de DNIs (la lista es la de la campaña). */
export interface BannerCampania {
  etiqueta: string | null;
  titulo: string | null;
  texto: string | null;
  linkUrl: string | null;
  pantalla: string | null;
  textoBoton: string | null;
  plantilla: PlantillaBanner;
  mostrarCarita: boolean;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
}

/** Lo que calcula emisivos al terminar de procesar la lista. Un reenvío trae solo algunos de estos campos. */
export interface ResumenLista {
  cargados?: number;
  personas?: number;
  repetidas?: number;
  invalidas?: number;
  filasInvalidas?: number[];
  mailsDescartadosDeLaLista?: number;
  vigentes?: number;
  bajaPadron?: number;
  noEncontrados?: number;
  /** Afiliados: filas sin DNI ni CUIL, que no se pueden cruzar con el padrón y no reciben nada. */
  sinDni?: number;
  conApp?: number;
  titulares?: number;
  familiares?: number;
  /** null si la campaña no lleva ese canal. */
  conMailValido?: number | null;
  sinMail?: number | null;
  conCuil?: number | null;
  /** Personas quitadas a mano desde la tabla de la lista (no reciben nada). */
  quitados?: number;
  /** Personas sumadas con "Agregar personas" después de la carga que quedaron recibiendo. */
  agregadas?: number;
  /** Líneas pegadas en "Agregar personas" que no eran un DNI, CUIL o mail válido. */
  invalidasAlAgregar?: number;
  reenvioDe?: number;
  segmentoReenvio?: SegmentoReenvio;
}

/** A quiénes se les reenvía el mail. Las bajas quedan afuera siempre. */
export type SegmentoReenvio = 'no_abrieron' | 'todos' | 'abrieron_sin_click' | 'sin_app';

export interface OpcionReenvio {
  segmento: SegmentoReenvio;
  cantidad: number;
  /** false: "abrieron sin click" en un mail sin botón, o "sin app" en una campaña a prestadores. */
  disponible: boolean;
}

export type EstadoListaPersona = 'OK' | 'BAJA_PADRON' | 'NO_ENCONTRADO' | 'SIN_DNI' | 'QUITADO';
/** Los de abajo de 'descartados' son para la tabla de Estadísticas (filtrosPersonas en emisivos). */
export type FiltroLista =
  | 'todos'
  | 'vigentes'
  | 'quitados'
  | 'descartados'
  | 'mail_abrieron'
  | 'mail_no_abrieron'
  | 'mail_click'
  | 'mail_error'
  | 'mail_baja'
  | 'push_leyeron'
  | 'push_no_leyeron'
  | 'sin_app';

/** Una persona de la lista de la campaña, como la muestra la tabla del paso Destinatarios. */
export interface DestinatarioFila {
  id: number;
  dni: string | null;
  cuil: string | null;
  email: string | null;
  nombre: string | null;
  estadoLista: EstadoListaPersona;
  mailEstado: string | null;
  tieneApp: boolean;
  esTitular: boolean | null;
  /** Por qué no recibe (en criollo), o null si recibe. */
  motivo: string | null;
  /** Cómo le fue en cada canal (fechas ISO o null), para la tabla de Estadísticas. */
  pushEstado: string | null;
  pushLeidaAt: string | null;
  mailEnviadoAt: string | null;
  mailAbiertoAt: string | null;
  mailClickAt: string | null;
  mailBajaAt: string | null;
  bannerVistoAt: string | null;
  bannerTocadoAt: string | null;
}

export interface PaginaDestinatarios {
  filas: DestinatarioFila[];
  total: number;
  porPagina: number;
}

export interface ProgresoLista {
  hechos: number;
  total: number;
}

/** Campaña tal como la devuelve emisivos (sin los bytes de la imagen). */
export interface Campania {
  id: number;
  nombre: string;
  tipoDestinatario: TipoDestinatario;
  canales: CanalesCampania;
  estado: EstadoCampania;
  push: PushCampania | null;
  mail: MailCampania | null;
  banner: BannerCampania | null;
  bannerId: number | null;
  tieneImagen: boolean;
  resumen: ResumenLista | null;
  progresoLista: ProgresoLista | null;
  errorLista: string | null;
  pruebaVigente: boolean;
  pruebaEnviadaAt: string | null;
  enviadaAt: string | null;
  terminadaAt: string | null;
  campaniaOrigenId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpcionesCampania {
  plantillas: PlantillaMail[];
  remitentes: string[];
}

/** Lo que carga el asistente (los textos opcionales van como string vacío). */
export interface DatosFormularioCampania {
  nombre: string;
  tipoDestinatario: TipoDestinatario;
  canales: CanalesCampania;
  push: { titulo: string; cuerpo: string; link: string };
  mail: {
    plantilla: PlantillaMail;
    asunto: string;
    remitente: string;
    replyTo: string;
    titulo: string;
    texto: string;
    botonTexto: string;
    botonLink: string;
    /** `clave` es solo del front, para que React no mezcle filas al quitar una tarjeta. */
    tarjetas: { clave: number; titulo: string; texto: string }[];
  };
  banner: {
    etiqueta: string;
    titulo: string;
    texto: string;
    /** Lo que hace al tocar: el link (Andes o WhatsApp) o la pantalla de la app. Uno solo. */
    linkUrl: string;
    pantalla: string;
    textoBoton: string;
    plantilla: PlantillaBanner;
    mostrarCarita: boolean;
    vigenciaDesde: string;
    vigenciaHasta: string;
  };
}

export type EstadoPruebaPush = 'ENCOLADO' | 'SIN_TOKEN' | 'PUSH_APAGADO' | 'SIN_CUENTA' | 'ERROR';

export interface ResultadoPrueba {
  push: { destino: string; estado: EstadoPruebaPush | string; detalle?: string }[] | null;
  mail: { destino: string; estado: 'ENVIADO' | 'ERROR' | string; detalle?: string }[] | null;
  pruebaVigente: boolean;
}

export interface EstadisticasCampania {
  total: number;
  lista: { OK?: number; BAJA_PADRON?: number; NO_ENCONTRADO?: number; SIN_DNI?: number; QUITADO?: number };
  app: { conApp: number; sinApp: number };
  parentesco: { titulares: number; familiares: number; sinDato: number };
  push: {
    recibieron: number;
    enBuzon: number;
    apagadas: number;
    sinCuenta: number;
    sinCuil: number;
    errores: number;
    pendientes: number;
    /** Se cortó el servidor en medio de una tanda: no se sabe si salió, y no se reenvía. */
    inciertas?: number;
    leidas: number;
  };
  mail: { pendientes: number; enviados: number; errores: number; omitidos: number; abiertos: number; clicks: number; bajas: number };
  banner: { vieron: number; tocaron: number };
  cruces: {
    sinAppConMail: { enviados: number; abrieron: number };
    leyeronPushNoAbrieronMail: number;
    abrieronMailNoLeyeronPush: number;
    ambos: number;
    porParentesco: {
      titulares: { personas: number; leyeronPush: number; abrieronMail: number };
      familiares: { personas: number; leyeronPush: number; abrieronMail: number };
    };
  };
}

const textoOVacio = (valor: string) => valor.trim();

/** Lo que espera POST/PUT /campanias: solo viaja el contenido de los canales marcados. */
const armarCuerpo = (datos: DatosFormularioCampania): string => {
  const { canales } = datos;
  const { plantilla } = datos.mail;
  const llevaTarjetas = plantilla === 'beneficio' || plantilla === 'informativo';
  const llevaBoton = plantilla !== 'simple';
  return JSON.stringify({
    nombre: textoOVacio(datos.nombre),
    tipoDestinatario: datos.tipoDestinatario,
    canales,
    push: canales.push
      ? { titulo: datos.push.titulo, cuerpo: datos.push.cuerpo, link: datos.push.link }
      : undefined,
    mail: canales.mail
      ? {
          plantilla,
          asunto: datos.mail.asunto,
          remitente: datos.mail.remitente,
          replyTo: datos.mail.replyTo,
          contenido: {
            titulo: datos.mail.titulo,
            texto: datos.mail.texto,
            botonTexto: llevaBoton ? datos.mail.botonTexto : '',
            botonLink: llevaBoton ? datos.mail.botonLink : '',
            tarjetas: llevaTarjetas ? datos.mail.tarjetas.map(({ titulo, texto }) => ({ titulo, texto })) : [],
          },
        }
      : undefined,
    banner: canales.banner
      ? {
          etiqueta: datos.banner.etiqueta,
          titulo: datos.banner.titulo,
          texto: datos.banner.texto,
          linkUrl: datos.banner.linkUrl,
          pantalla: datos.banner.pantalla,
          textoBoton: datos.banner.textoBoton,
          plantilla: datos.banner.plantilla,
          mostrarCarita: datos.banner.mostrarCarita,
          vigenciaDesde: datos.banner.vigenciaDesde,
          vigenciaHasta: datos.banner.vigenciaHasta,
        }
      : undefined,
  });
};

const exigirCampania = (data: Campania | undefined, id: number): Campania => {
  if (!data) throw new Error(`No se encontró la campaña #${id}`);
  return data;
};

export const opcionesCampanias = async (): Promise<OpcionesCampania> => {
  const respuesta = await pedir<OpcionesCampania>('/campanias/opciones');
  if (!respuesta.data) throw new Error('Emisivos no devolvió las opciones de campañas');
  return respuesta.data;
};

export const listarCampanias = async (): Promise<Campania[]> => (await pedir<Campania[]>('/campanias')).data ?? [];

export const obtenerCampania = async (id: number): Promise<Campania> =>
  exigirCampania((await pedir<Campania>(`/campanias/${id}`)).data, id);

export const crearCampania = (datos: DatosFormularioCampania) =>
  pedir<Campania>('/campanias', { method: 'POST', headers: JSON_HEADERS, body: armarCuerpo(datos) });

/** Solo en BORRADOR o LISTA. Cambiar canales o destinatarios con la lista ya cargada devuelve 409. */
export const editarCampania = (id: number, datos: DatosFormularioCampania) =>
  pedir<Campania>(`/campanias/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: armarCuerpo(datos) });

/** 409 si la campaña ya se envió: pedir() lanza el Error con el mensaje del backend. */
export const borrarCampania = (id: number) => pedir<never>(`/campanias/${id}`, { method: 'DELETE' });

/** Imagen del mail (plantilla beneficio): JPG, PNG o WEBP de hasta 1 MB. */
export const subirImagenCampania = (id: number, archivo: File) => {
  const formData = new FormData();
  formData.append('imagen', archivo);
  return pedir<Campania>(`/campanias/${id}/imagen`, { method: 'POST', body: formData });
};

export const quitarImagenCampania = (id: number) => {
  const formData = new FormData();
  formData.append('quitar', 'true');
  return pedir<Campania>(`/campanias/${id}/imagen`, { method: 'POST', body: formData });
};

/** La imagen es pública (la piden los clientes de correo). El parámetro v evita ver una vieja guardada en el navegador. */
export const urlImagenCampania = (id: number, version: string): string =>
  `${URL_EMISIVOS}/campanias/${id}/imagen?v=${encodeURIComponent(version)}`;

/** Reemplaza la lista con un archivo (.xlsx, .csv o .txt, campo "lista"). Se procesa en segundo plano. */
export const cargarListaArchivo = (id: number, archivo: File) => {
  const formData = new FormData();
  formData.append('lista', archivo);
  return pedir<Campania>(`/campanias/${id}/destinatarios`, { method: 'POST', body: formData });
};

/** Reemplaza la lista con lo que se pegó en un texto. Se procesa en segundo plano. */
export const cargarListaTexto = (id: number, texto: string) =>
  pedir<Campania>(`/campanias/${id}/destinatarios`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ texto }) });

/**
 * La lista de la campaña de a 50, con buscador (DNI, CUIL, mail o nombre) y filtro. Lo buscado va en el cuerpo de un POST
 * y nunca en la URL: la URL queda en el log de Sentinel (revisión 13/10).
 */
export const listarDestinatarios = async (id: number, buscar: string, filtro: FiltroLista, pagina: number): Promise<PaginaDestinatarios> => {
  const respuesta = await pedir<DestinatarioFila[]>(`/campanias/${id}/destinatarios/buscar`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ buscar, filtro, pagina }),
  });
  const meta = respuesta.meta as { total?: number; porPagina?: number } | undefined;
  return { filas: respuesta.data ?? [], total: meta?.total ?? 0, porPagina: meta?.porPagina ?? 50 };
};

/**
 * Todas las personas de un filtro (para el informe PDF), pidiendo las páginas de a una y en orden: no se le tira un lote de
 * pedidos juntos al servidor. Corta con una página vacía, al llegar al total o al `tope` (si el filtro tiene más, `total` dice
 * cuántas hay de verdad y la diferencia queda sin traer). Con la campaña enviándose la lista se mueve y la paginación por
 * offset puede repetir personas entre páginas: cada una entra una sola vez, por id. `cancelado` se consulta antes de cada
 * página: si dice que sí, corta ahí y devuelve lo que tenga (quien llama decide qué hacer).
 */
export const traerTodasLasPersonas = async (
  id: number,
  filtro: FiltroLista,
  tope: number,
  cancelado?: () => boolean,
): Promise<{ filas: DestinatarioFila[]; total: number }> => {
  const filas: DestinatarioFila[] = [];
  const vistos = new Set<number>();
  let total = 0;
  for (let pagina = 1; !cancelado?.(); pagina += 1) {
    const actual = await listarDestinatarios(id, '', filtro, pagina);
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

/** Solo con la campaña en LISTA. Quitar no borra: la persona queda "quitada a mano" y se puede volver a poner. */
export const quitarDestinatario = (id: number, destinatarioId: number) =>
  pedir<DestinatarioFila>(`/campanias/${id}/destinatarios/${destinatarioId}/quitar`, { method: 'POST' });

export const restaurarDestinatario = (id: number, destinatarioId: number) =>
  pedir<DestinatarioFila>(`/campanias/${id}/destinatarios/${destinatarioId}/restaurar`, { method: 'POST' });

/** Suma DNIs, CUILs o mails (hasta 500) a la lista ya cargada. Se procesa en segundo plano, como la carga. */
export const agregarDestinatarios = (id: number, texto: string) =>
  pedir<Campania>(`/campanias/${id}/destinatarios/agregar`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ texto }) });

/** El preview devuelve el HTML del mail (texto, no JSON): por eso no pasa por pedir(). */
export const obtenerPreviewMail = async (id: number): Promise<string> => {
  const token = localStorage.getItem('token') || '';
  const response = await fetch(`${URL_EMISIVOS}/campanias/${id}/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const cuerpo = await response.text();
  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      mensaje = (JSON.parse(cuerpo) as { meta?: { message?: string } }).meta?.message || mensaje;
    } catch {
      // la respuesta no era JSON: queda el mensaje con el código
    }
    throw new Error(mensaje);
  }
  return cuerpo;
};

/** destinos = DNIs o CUILs para la push; mails = direcciones para el mail (hasta 5). */
export const mandarPrueba = async (id: number, destinos: string, mails: string): Promise<{ resultado: ResultadoPrueba; mensaje: string }> => {
  const respuesta = await pedir<ResultadoPrueba>(`/campanias/${id}/prueba`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ destinos, mails }),
  });
  if (!respuesta.data) throw new Error('Emisivos no devolvió el resultado de la prueba');
  return { resultado: respuesta.data, mensaje: respuesta.meta?.message ?? '' };
};

/** 409 sin lista, sin prueba vigente o sin vigentes. */
export const enviarCampania = (id: number) => pedir<Campania>(`/campanias/${id}/enviar`, { method: 'POST' });
export const pausarCampania = (id: number) => pedir<Campania>(`/campanias/${id}/pausar`, { method: 'POST' });
export const reanudarCampania = (id: number) => pedir<Campania>(`/campanias/${id}/reanudar`, { method: 'POST' });
export const cancelarCampania = (id: number) => pedir<Campania>(`/campanias/${id}/cancelar`, { method: 'POST' });

/** Cuántas personas entran en cada opción de reenvío (emisivos trae antes las aperturas y bajas del tracker). */
export const opcionesReenvio = async (id: number): Promise<OpcionReenvio[]> =>
  (await pedir<OpcionReenvio[]>(`/campanias/${id}/reenvio`)).data ?? [];

/** Campaña nueva (solo mail, en estado LISTA) con las personas del segmento elegido. */
export const crearReenvio = (id: number, segmento: SegmentoReenvio) =>
  pedir<Campania>(`/campanias/${id}/reenvio`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ segmento }) });

export const obtenerEstadisticas = async (id: number): Promise<EstadisticasCampania> => {
  const respuesta = await pedir<EstadisticasCampania>(`/campanias/${id}/estadisticas`);
  if (!respuesta.data) throw new Error('Emisivos no devolvió las estadísticas');
  return respuesta.data;
};

/** Excel con una fila por persona y todas las fechas. Se descarga abriendo el link. */
export const urlExportarCampania = (id: number): string => `${URL_EMISIVOS}/campanias/${id}/exportar`;
