// campaniasOpciones.ts — constantes, textos y validaciones de la pestaña Campañas.
// Los límites son los mismos que valida emisivos (LARGOS en campanias.helpers.js y banners.helpers.js): si cambian allá, acá también.

import { LARGOS as LARGOS_BANNER, esLinkWhatsApp, linkLoAbreLaApp } from '../bannerOpciones';
import type {
  Campania,
  CanalCampania,
  DatosFormularioCampania,
  EstadoCampania,
  FiltroLista,
  PlantillaMail,
  ResultadoPrueba,
  ResumenLista,
  SegmentoReenvio,
  TipoDestinatario,
} from './campanias.api';

export const LARGOS = {
  nombre: 120,
  pushTitulo: 65,
  pushCuerpo: 240,
  asunto: 150,
  mailTitulo: 100,
  mailTexto: 3000,
  botonTexto: 30,
  tarjetaTitulo: 60,
  tarjetaTexto: 300,
  mailsPrueba: 5,
  destinosPrueba: 10,
};
export const MAX_TARJETAS = 4;

/** Mismas cifras que el backend (MAX_BYTES_LISTA = 5 MB). */
export const MAX_BYTES_LISTA = 5 * 1024 * 1024;
export const EXTENSIONES_LISTA = ['.xlsx', '.csv', '.txt'];
export const ACEPTA_LISTA = EXTENSIONES_LISTA.join(',');

const MAX_BYTES_IMAGEN = 1024 * 1024;
const MIMES_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

export const CANALES: { valor: CanalCampania; etiqueta: string }[] = [
  { valor: 'push', etiqueta: 'Push' },
  { valor: 'mail', etiqueta: 'Mail' },
  { valor: 'banner', etiqueta: 'Banner' },
];

export const TIPOS_DESTINATARIO: { valor: TipoDestinatario; etiqueta: string; corta: string; ayuda: string }[] = [
  {
    valor: 'afiliados',
    etiqueta: 'Afiliados',
    corta: 'Afiliados',
    ayuda: 'Cada persona se cruza con el padrón de Andes: los que están de baja o no figuran no reciben nada. Pueden ir push, mail y banner.',
  },
  {
    valor: 'prestadores',
    etiqueta: 'Prestadores',
    corta: 'Prestadores',
    ayuda: 'La lista se usa tal cual (sin cruzar con el padrón). Los prestadores no tienen la app: solo se les manda mail.',
  },
  {
    // 23/10/2026, pedido de Karen: mandarle a los dados de baja el link de una encuesta pública.
    valor: 'exafiliados',
    etiqueta: 'Ex afiliados (dados de baja)',
    corta: 'Ex afiliados',
    ayuda:
      'Para escribirle a quien ya no es afiliado (por ejemplo, con el link de una encuesta pública). Se cruza con el padrón y reciben los que están de baja (y los vigentes); se usa el mail del padrón si la lista no lo trae. Solo mail.',
  },
];

/** Prestadores y ex afiliados: solo mail (no tienen la app de afiliado). */
export const esSoloMail = (tipo: TipoDestinatario): boolean => tipo === 'prestadores' || tipo === 'exafiliados';

/** Afiliados y ex afiliados se cruzan con el padrón (no encontrados, sin DNI); los prestadores van tal cual. */
export const cruzaConPadron = (tipo: TipoDestinatario): boolean => tipo === 'afiliados' || tipo === 'exafiliados';

/** "Afiliados", "Prestadores" o "Ex afiliados", para la tabla y los encabezados. */
export const etiquetaTipo = (tipo: TipoDestinatario): string => TIPOS_DESTINATARIO.find((t) => t.valor === tipo)?.corta ?? tipo;

export const ESTADOS: Record<EstadoCampania, { etiqueta: string; clase: string }> = {
  BORRADOR: { etiqueta: 'Borrador', clase: 'borrador' },
  PROCESANDO_LISTA: { etiqueta: 'Procesando lista', clase: 'procesando' },
  LISTA: { etiqueta: 'Lista', clase: 'lista' },
  ENVIANDO: { etiqueta: 'Enviando', clase: 'enviando' },
  PAUSADA: { etiqueta: 'Pausada', clase: 'pausada' },
  TERMINADA: { etiqueta: 'Terminada', clase: 'terminada' },
  CANCELADA: { etiqueta: 'Cancelada', clase: 'cancelada' },
};

export const etiquetaEstado = (estado: EstadoCampania): string => ESTADOS[estado]?.etiqueta ?? estado;
export const claseEstado = (estado: EstadoCampania): string => ESTADOS[estado]?.clase ?? 'borrador';

/** Cuándo todavía se puede cambiar el contenido y la lista. */
export const esEditable = (estado: EstadoCampania): boolean => estado === 'BORRADOR' || estado === 'LISTA';

export const PLANTILLAS_MAIL: { valor: PlantillaMail; etiqueta: string; descripcion: string }[] = [
  {
    valor: 'aviso',
    etiqueta: 'Aviso',
    descripcion: 'Banda azul con el título, un texto y un botón con link (obligatorio). Para comunicar algo puntual.',
  },
  {
    valor: 'beneficio',
    etiqueta: 'Beneficio',
    descripcion: 'Imagen arriba, texto, tarjetas con los descuentos y un botón con link (obligatorio).',
  },
  {
    valor: 'informativo',
    etiqueta: 'Informativo',
    descripcion: 'Texto y tarjetas lilas con los datos. El botón es opcional.',
  },
  {
    valor: 'simple',
    etiqueta: 'Simple',
    descripcion: 'Solo título y texto, sin botón. Para un mensaje corto y sobrio.',
  },
];

/** Los mismos que devuelve GET /campanias/opciones; se usan hasta que llegue esa respuesta. */
export const REMITENTES_POR_DEFECTO = ['novedades@andessalud.ar', 'notificaciones@andessalud.ar', 'comercial@andessalud.ar'];

/** Contador para las claves de React de las tarjetas (no viajan al backend). */
let ultimaClave = 0;
export const nuevaClave = (): number => {
  ultimaClave += 1;
  return ultimaClave;
};

export const tarjetaVacia = () => ({ clave: nuevaClave(), titulo: '', texto: '' });

export const datosVacios = (): DatosFormularioCampania => ({
  nombre: '',
  tipoDestinatario: 'afiliados',
  canales: { push: true, mail: false, banner: false },
  push: { titulo: '', cuerpo: '', link: '' },
  mail: {
    plantilla: 'informativo',
    asunto: '',
    remitente: '',
    replyTo: '',
    titulo: '',
    texto: '',
    botonTexto: '',
    botonLink: '',
    tarjetas: [],
  },
  banner: {
    etiqueta: '',
    titulo: '',
    texto: '',
    linkUrl: '',
    pantalla: '',
    textoBoton: '',
    plantilla: 'azul',
    mostrarCarita: false,
    vigenciaDesde: '',
    vigenciaHasta: '',
  },
});

/** Pasa la campaña guardada al formulario del asistente (los null pasan a texto vacío). */
export const datosDesdeCampania = (campania: Campania): DatosFormularioCampania => {
  const base = datosVacios();
  const { push, mail, banner } = campania;
  return {
    nombre: campania.nombre,
    tipoDestinatario: campania.tipoDestinatario,
    canales: { ...campania.canales },
    push: push ? { titulo: push.titulo, cuerpo: push.cuerpo, link: push.link ?? '' } : base.push,
    mail: mail
      ? {
          plantilla: mail.plantilla,
          asunto: mail.asunto,
          remitente: mail.remitente,
          replyTo: mail.replyTo ?? '',
          titulo: mail.contenido.titulo,
          texto: mail.contenido.texto,
          botonTexto: mail.contenido.botonTexto ?? '',
          botonLink: mail.contenido.botonLink ?? '',
          tarjetas: (mail.contenido.tarjetas ?? []).map((t) => ({ clave: nuevaClave(), titulo: t.titulo ?? '', texto: t.texto ?? '' })),
        }
      : base.mail,
    banner: banner
      ? {
          etiqueta: banner.etiqueta ?? '',
          titulo: banner.titulo ?? '',
          texto: banner.texto ?? '',
          linkUrl: banner.linkUrl ?? '',
          pantalla: banner.pantalla ?? '',
          textoBoton: banner.textoBoton ?? '',
          plantilla: banner.plantilla ?? 'azul',
          mostrarCarita: Boolean(banner.mostrarCarita),
          vigenciaDesde: banner.vigenciaDesde ?? '',
          vigenciaHasta: banner.vigenciaHasta ?? '',
        }
      : base.banner,
  };
};

/** Igual que lineaLimpia() de emisivos: recorta y junta los espacios repetidos. */
const limpiar = (texto: string): string => texto.trim().replace(/\s+/g, ' ');

/** Mismo criterio que esLinkPermitido() de emisivos: https de Andes o WhatsApp de Argentina. */
export const esLinkDeCampania = (link: string): boolean => linkLoAbreLaApp(link) || esLinkWhatsApp(link);

const MENSAJE_LINK = 'tiene que ser https de andessalud.com.ar o andessalud.ar, o un WhatsApp de Argentina (https://wa.me/54...)';

/**
 * Link de la push (revisión 23/10/2026): solo de Andes, como esLinkDePush() de emisivos. La app no abre WhatsApp desde
 * una push (solo desde un banner): con WhatsApp el afiliado veía "No pudimos abrir el link".
 */
export const esLinkDePush = (link: string): boolean => linkLoAbreLaApp(link);

export const MENSAJE_LINK_PUSH = 'tiene que ser https de andessalud.com.ar o andessalud.ar (la app no abre WhatsApp desde una push)';

/**
 * Instagram, solo en el botón del mail (23/10/2026): mismo criterio que esLinkInstagram() de emisivos (instagram.com o
 * www.instagram.com; l.instagram.com no, redirige a cualquier sitio). En la push y el banner no, hasta que la app lo
 * deje abrir (7.1.8).
 */
const REGEX_INSTAGRAM = /^https:\/\/(www\.)?instagram\.com([/?#][^\s]*)?$/i;
export const esLinkInstagram = (link: string): boolean => REGEX_INSTAGRAM.test(link);

const MENSAJE_LINK_BOTON =
  'tiene que ser https de andessalud.com.ar o andessalud.ar, un WhatsApp de Argentina (https://wa.me/54...) o Instagram (https://www.instagram.com/...)';

const REGEX_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mensaje del primer problema de la campaña, o null si está bien. Mismas reglas y casi los mismos textos que
 * validarCampania() de emisivos (el backend vuelve a validar igual y su mensaje se muestra al guardar).
 */
export const errorDeCampania = (datos: DatosFormularioCampania): string | null => {
  const { canales } = datos;
  const nombre = limpiar(datos.nombre);
  if (!nombre) return 'La campaña necesita un nombre.';
  if (nombre.length > LARGOS.nombre) return `El nombre puede tener hasta ${LARGOS.nombre} caracteres.`;
  if (!canales.push && !canales.mail && !canales.banner) return 'Elegí al menos un canal: push, mail o banner.';
  if (datos.tipoDestinatario === 'prestadores' && (canales.push || canales.banner)) {
    return 'A los prestadores solo se les manda mail: no tienen la app (ni push ni banner).';
  }
  if (datos.tipoDestinatario === 'exafiliados' && (canales.push || canales.banner)) {
    return 'A los ex afiliados solo se les manda mail: la app es para afiliados vigentes (ni push ni banner).';
  }

  if (canales.push) {
    const titulo = limpiar(datos.push.titulo);
    const cuerpo = datos.push.cuerpo.trim();
    const link = datos.push.link.trim();
    if (!titulo) return 'La push necesita un título.';
    if (titulo.length > LARGOS.pushTitulo) return `El título de la push puede tener hasta ${LARGOS.pushTitulo} caracteres.`;
    if (!cuerpo) return 'La push necesita un texto.';
    if (cuerpo.length > LARGOS.pushCuerpo) return `El texto de la push puede tener hasta ${LARGOS.pushCuerpo} caracteres.`;
    if (link && !esLinkDePush(link)) return `El link de la push ${MENSAJE_LINK_PUSH}.`;
  }

  if (canales.mail) {
    const { mail } = datos;
    const asunto = limpiar(mail.asunto);
    const titulo = limpiar(mail.titulo);
    const texto = mail.texto.trim();
    const botonTexto = limpiar(mail.botonTexto);
    const botonLink = mail.botonLink.trim();
    if (!asunto) return 'El mail necesita un asunto.';
    if (asunto.length > LARGOS.asunto) return `El asunto puede tener hasta ${LARGOS.asunto} caracteres.`;
    if (!mail.remitente) return 'Elegí desde qué dirección sale el mail.';
    if (mail.replyTo.trim() && !REGEX_MAIL.test(mail.replyTo.trim())) return 'El mail de respuesta no es válido.';
    if (!titulo) return 'El mail necesita un título.';
    if (titulo.length > LARGOS.mailTitulo) return `El título del mail puede tener hasta ${LARGOS.mailTitulo} caracteres.`;
    if (!texto) return 'El mail necesita un texto.';
    if (texto.length > LARGOS.mailTexto) return `El texto del mail puede tener hasta ${LARGOS.mailTexto} caracteres.`;

    if (mail.plantilla !== 'simple') {
      if (Boolean(botonTexto) !== Boolean(botonLink)) return 'El botón necesita texto y link (o ninguno de los dos).';
      if (botonTexto.length > LARGOS.botonTexto) return `El texto del botón puede tener hasta ${LARGOS.botonTexto} caracteres.`;
      if (botonLink && !esLinkDeCampania(botonLink) && !esLinkInstagram(botonLink)) return `El link del botón ${MENSAJE_LINK_BOTON}.`;
      if ((mail.plantilla === 'aviso' || mail.plantilla === 'beneficio') && !botonLink) {
        return `La plantilla "${mail.plantilla}" lleva un botón con texto y link.`;
      }
    }

    if (mail.plantilla === 'beneficio' || mail.plantilla === 'informativo') {
      const tarjetas = mail.tarjetas.filter((t) => t.titulo.trim() || t.texto.trim());
      if (tarjetas.length > MAX_TARJETAS) return `El mail puede tener hasta ${MAX_TARJETAS} tarjetas.`;
      if (tarjetas.some((t) => limpiar(t.titulo).length > LARGOS.tarjetaTitulo || t.texto.trim().length > LARGOS.tarjetaTexto)) {
        return `Cada tarjeta puede tener un título de hasta ${LARGOS.tarjetaTitulo} y un texto de hasta ${LARGOS.tarjetaTexto} caracteres.`;
      }
    }
  }

  if (canales.banner) {
    const { banner } = datos;
    if (!banner.titulo.trim()) return 'El banner necesita un título.';
    if (banner.etiqueta.trim().length > LARGOS_BANNER.etiqueta) return `La etiqueta del banner puede tener hasta ${LARGOS_BANNER.etiqueta} caracteres.`;
    if (banner.titulo.trim().length > LARGOS_BANNER.titulo) return `El título del banner puede tener hasta ${LARGOS_BANNER.titulo} caracteres.`;
    if (banner.texto.trim().length > LARGOS_BANNER.texto) return `El texto del banner puede tener hasta ${LARGOS_BANNER.texto} caracteres.`;
    if (banner.textoBoton.trim().length > LARGOS_BANNER.textoBoton) return `El texto del botón del banner puede tener hasta ${LARGOS_BANNER.textoBoton} caracteres.`;
    if (banner.linkUrl.trim() && !esLinkDeCampania(banner.linkUrl.trim())) return `El link del banner ${MENSAJE_LINK}.`;
    if (banner.vigenciaDesde && banner.vigenciaHasta && banner.vigenciaHasta < banner.vigenciaDesde) {
      return 'La fecha "hasta" del banner no puede ser anterior a la fecha "desde".';
    }
  }
  return null;
};

/** Mensaje de error si la imagen del mail no sirve, o null si está bien. */
export const errorDeImagenMail = (archivo: File): string | null => {
  if (!MIMES_IMAGEN.includes(archivo.type)) return 'La imagen tiene que ser JPG, PNG o WEBP.';
  if (archivo.size > MAX_BYTES_IMAGEN) return 'La imagen puede pesar hasta 1 MB.';
  return null;
};

/** Mensaje de error si el archivo de la lista no sirve, o null si está bien. La lista la lee emisivos. */
export const errorDeArchivoLista = (archivo: File): string | null => {
  const nombre = archivo.name.toLowerCase();
  if (nombre.endsWith('.xls')) return 'El Excel viejo (.xls) no se puede leer. Guardalo como .xlsx o como .csv.';
  if (!EXTENSIONES_LISTA.some((extension) => nombre.endsWith(extension))) {
    return 'La lista tiene que ser un Excel (.xlsx) o un archivo .csv o .txt.';
  }
  if (archivo.size > MAX_BYTES_LISTA) return 'La lista puede pesar hasta 5 MB.';
  return null;
};

// --------------------------------------------------------------------------------------------- formatos

/** 1215 → "1.215". */
export const numero = (valor: number): string => valor.toLocaleString('es-AR');

/** Porcentaje con un decimal si hace falta (0 si no hay base): 1 de 3 → 33,3. */
export const porcentaje = (parte: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((parte / total) * 1000) / 10) : 0;

/** Ancho de barra: entero 0-100. */
export const anchoBarra = (parte: number, total: number): number => (total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0);

export const textoPorcentaje = (parte: number, total: number): string => `${porcentaje(parte, total).toLocaleString('es-AR')}%`;

/** "2026-10-09T14:35:24.000Z" → "09/10/2026" (hora local). */
export const fechaCorta = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** "2026-10-09T14:35:24.000Z" → "09/10/2026 14:35" (hora local). */
export const fechaHora = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fechaCorta(iso)} ${hora}`;
};

/** Canales de la campaña para los chips del listado. */
export const canalesActivos = (campania: Pick<Campania, 'canales'>): { valor: CanalCampania; etiqueta: string }[] =>
  CANALES.filter((canal) => campania.canales[canal.valor]);

/**
 * El resumen de la lista como una sola frase corta por dato: "1.215 cargados", "39 sin mail", "12 de baja en el padrón"...
 * Lo del padrón solo se muestra a afiliados (los prestadores no se cruzan; a los ex afiliados, solo los que no figuran o no
 * tienen DNI: la baja les cuenta). Lo que vale cero y es un descarte
 * (inválidos, repetidos, mails mal escritos) no se muestra.
 */
export const lineasResumen = (resumen: ResumenLista, tipo: TipoDestinatario): string[] => {
  const lineas: string[] = [];
  const sumar = (valor: number | null | undefined, texto: (n: number) => string, soloSiHay = false) => {
    if (valor === null || valor === undefined) return;
    if (soloSiHay && valor === 0) return;
    lineas.push(texto(valor));
  };

  sumar(resumen.cargados, (n) => `${numero(n)} cargados`);
  sumar(resumen.personas, (n) => `${numero(n)} ${n === 1 ? 'persona' : 'personas'}`);
  sumar(resumen.sinMail, (n) => `${numero(n)} sin mail`);
  if (tipo === 'afiliados') {
    sumar(resumen.bajaPadron, (n) => `${numero(n)} de baja en el padrón`);
    sumar(resumen.noEncontrados, (n) => `${numero(n)} no encontrados`);
    sumar(resumen.sinDni, (n) => `${numero(n)} sin DNI ni CUIL (no se pudieron cruzar con el padrón)`, true);
    sumar(resumen.conApp, (n) => `${numero(n)} con la app`);
    sumar(resumen.titulares, (n) => `${numero(n)} ${n === 1 ? 'titular' : 'titulares'}`);
    sumar(resumen.familiares, (n) => `${numero(n)} ${n === 1 ? 'familiar' : 'familiares'}`);
  }
  if (tipo === 'exafiliados') {
    sumar(resumen.noEncontrados, (n) => `${numero(n)} no encontrados en el padrón`);
    sumar(resumen.sinDni, (n) => `${numero(n)} sin DNI ni CUIL (no se pudieron cruzar con el padrón)`, true);
  }
  if (resumen.invalidas) {
    const filas = resumen.filasInvalidas ?? [];
    const detalle = filas.length > 0 ? ` (${filas.length === 1 ? 'fila' : 'filas'} ${filas.join(', ')}${resumen.invalidas > filas.length ? ', ...' : ''})` : '';
    lineas.push(`${numero(resumen.invalidas)} ${resumen.invalidas === 1 ? 'fila inválida' : 'filas inválidas'}${detalle}`);
  }
  sumar(resumen.repetidas, (n) => `${numero(n)} ${n === 1 ? 'repetido' : 'repetidos'}`, true);
  sumar(resumen.mailsDescartadosDeLaLista, (n) => `${numero(n)} ${n === 1 ? 'mail mal escrito descartado' : 'mails mal escritos descartados'}`, true);
  sumar(resumen.quitados, (n) => `${numero(n)} ${n === 1 ? 'quitado' : 'quitados'} a mano`, true);
  sumar(resumen.agregadas, (n) => `${numero(n)} ${n === 1 ? 'agregado' : 'agregados'} a mano`, true);
  sumar(resumen.invalidasAlAgregar, (n) => `${numero(n)} ${n === 1 ? 'línea inválida' : 'líneas inválidas'} al agregar`, true);
  return lineas;
};

/** Tope de personas por cada "Agregar personas" (el mismo que valida emisivos: MAX_AGREGAR). */
export const MAX_AGREGAR = 500;

export const FILTROS_LISTA: { valor: FiltroLista; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'vigentes', etiqueta: 'Vigentes' },
  { valor: 'quitados', etiqueta: 'Quitados a mano' },
  { valor: 'descartados', etiqueta: 'Descartados por el padrón' },
];

/**
 * Filtros de la tabla de personas de Estadísticas; `canal` = solo se muestra si la campaña lleva ese canal; `soloAfiliados`
 * = solo a afiliados (la app); `conPadron` = a afiliados y ex afiliados (los que se cruzan con el padrón).
 */
export const FILTROS_PERSONAS: {
  valor: FiltroLista;
  etiqueta: string;
  canal?: CanalCampania;
  soloAfiliados?: boolean;
  conPadron?: boolean;
}[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  // Incluye a los que tocaron el botón sin que se registre la apertura (imágenes bloqueadas): por eso puede dar más que el
  // número "Abrieron" de arriba, que cuenta solo aperturas (revisión 13/10).
  { valor: 'mail_abrieron', etiqueta: 'Abrieron o tocaron el botón', canal: 'mail' },
  { valor: 'mail_no_abrieron', etiqueta: 'No abrieron el mail', canal: 'mail' },
  { valor: 'mail_click', etiqueta: 'Tocaron el botón', canal: 'mail' },
  { valor: 'mail_error', etiqueta: 'Rebotaron', canal: 'mail' },
  { valor: 'mail_baja', etiqueta: 'Se dieron de baja', canal: 'mail' },
  { valor: 'push_leyeron', etiqueta: 'Leyeron la push', canal: 'push' },
  { valor: 'push_no_leyeron', etiqueta: 'No leyeron la push', canal: 'push' },
  { valor: 'sin_app', etiqueta: 'Sin la app', soloAfiliados: true },
  { valor: 'quitados', etiqueta: 'Quitados a mano' },
  { valor: 'descartados', etiqueta: 'Descartados por el padrón', conPadron: true },
];

/** Las opciones de la ventana "¿A quiénes se lo reenviás?", en el orden en que se muestran. */
export const SEGMENTOS_REENVIO: { valor: SegmentoReenvio; titulo: string; ayuda: string; noDisponible: string }[] = [
  {
    valor: 'no_abrieron',
    titulo: 'Los que no lo abrieron',
    ayuda: 'Recibieron el mail y no lo abrieron ni tocaron el botón.',
    noDisponible: '',
  },
  {
    valor: 'todos',
    titulo: 'Todos los que lo recibieron',
    ayuda: 'Se lo manda de nuevo a todos a los que les llegó, lo hayan abierto o no.',
    noDisponible: '',
  },
  {
    valor: 'abrieron_sin_click',
    titulo: 'Los que lo abrieron y no tocaron el botón',
    ayuda: 'Lo vieron pero no entraron al link.',
    noDisponible: 'Este mail no tiene botón.',
  },
  {
    valor: 'sin_app',
    titulo: 'Los que no tienen la app',
    ayuda: 'Afiliados de la lista sin cuenta activa en la app de Andes.',
    noDisponible: 'Solo para campañas a afiliados.',
  },
];

/** Qué pasó con cada destino de la prueba de push, en criollo. `bien` = le llegó de alguna forma. */
export const textoPruebaPush = (estado: string): { texto: string; bien: boolean } => {
  switch (estado) {
    case 'ENCOLADO':
      return { texto: 'Le llega al celular', bien: true };
    case 'SIN_TOKEN':
      return { texto: 'Queda en el buzón de la app', bien: true };
    case 'PUSH_APAGADO':
      return { texto: 'Tiene las notificaciones apagadas: no le llega', bien: false };
    case 'SIN_CUENTA':
      return { texto: 'Ese DNI no tiene la app', bien: false };
    case 'ERROR':
      return { texto: 'No se pudo mandar', bien: false };
    default:
      return { texto: estado, bien: false };
  }
};

export const textoPruebaMail = (estado: string): { texto: string; bien: boolean } =>
  estado === 'ENVIADO'
    ? { texto: 'Enviado: revisá la bandeja (y el spam)', bien: true }
    : { texto: 'No se pudo mandar', bien: false };

/** Lo que el paso "Prueba" recuerda mientras el asistente está abierto (aunque se cambie de paso). */
export interface EstadoPrueba {
  destinos: string;
  mails: string;
  resultado: ResultadoPrueba | null;
  mensaje: string;
}

export const PRUEBA_VACIA: EstadoPrueba = { destinos: '', mails: '', resultado: null, mensaje: '' };
