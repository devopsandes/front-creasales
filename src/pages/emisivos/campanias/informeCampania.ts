// informeCampania.ts — arma el MODELO del informe PDF de una campaña (qué dice, en qué orden y con qué números). No dibuja
// nada y no importa jspdf: el dibujo vive en informeCampania.pdf.ts. Así esta parte se prueba con node, sin navegador.
// El diseño copia el informe de la campaña "Pasos para prestadores" (Mail Masivos/informes): resumen con tarjetas de cifras,
// párrafos, tabla del envío y listas de personas (las muy largas van a dos columnas).

import type { Campania, DestinatarioFila, EstadisticasCampania, FiltroLista } from './campanias.api';
import { etiquetaEstado, numero, textoPorcentaje } from './campaniasOpciones';

/** Tope de filas por lista de personas: más que eso engorda el PDF sin que nadie lo lea. El detalle completo está en el Excel. */
export const MAX_FILAS_POR_LISTA = 1000;

/** Estas dos listas van siempre completas: quién se dio de baja y quién hizo click es lo que hay que accionar. */
const LISTAS_COMPLETAS: FiltroLista[] = ['mail_baja', 'mail_click'];

const ZONA = 'America/Argentina/Mendoza';

export interface CifraInforme {
  numero: string;
  rotulo: string;
}

export interface TablaInforme {
  titulo: string;
  columnas: string[];
  filas: string[][];
  /** Ancho de cada columna en mm (suman 170, el ancho útil de la hoja). */
  anchos: number[];
}

export interface SeccionInforme {
  titulo: string;
  columnas: string[];
  /**
   * Una fila por persona. Con `dosColumnas` cada fila trae DOS celdas (una por columna) y cada celda es "Nombre\nmail" o,
   * si la persona no tiene nombre, solo el mail/DNI: el dibujo pone el nombre en negrita y el mail abajo.
   */
  filas: string[][];
  dosColumnas?: boolean;
  nota?: string;
  /** Cuántas personas quedaron fuera por el tope MAX_FILAS_POR_LISTA (la nota ya lo explica). */
  cortadas?: number;
}

export interface InformeCampania {
  titulo: string;
  subtitulo: string;
  pie: string;
  resumen: CifraInforme[];
  parrafos: string[];
  tablaEnvio?: TablaInforme;
  notas: string[];
  secciones: SeccionInforme[];
  nombreArchivo: string;
}

/** Lo que devuelve traerTodasLasPersonas: las filas (hasta el tope) y el total real que tiene el filtro. */
export interface PersonasTraidas {
  filas: DestinatarioFila[];
  total: number;
}

export type ListasInforme = Partial<Record<FiltroLista, PersonasTraidas>>;

// ------------------------------------------------------------------------------------------------------ fechas y textos

/** Partes de una fecha en hora de Mendoza (el navegador de quien baja el informe puede estar en cualquier zona). */
const partesMendoza = (fecha: Date) => {
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const por = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return { aaaa: por('year'), mm: por('month'), dd: por('day'), hh: por('hour'), min: por('minute') };
};

const fechaValida = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/** "2026-10-07T19:42:00Z" → "07/10 16:42" (hora de Mendoza). Vacío si no hay fecha. */
export const fechaCortaMendoza = (iso: string | null | undefined): string => {
  const fecha = fechaValida(iso);
  if (!fecha) return '';
  const { dd, mm, hh, min } = partesMendoza(fecha);
  return `${dd}/${mm} ${hh}:${min}`;
};

/** "07/10/2026". */
export const diaMendoza = (fecha: Date): string => {
  const { dd, mm, aaaa } = partesMendoza(fecha);
  return `${dd}/${mm}/${aaaa}`;
};

const horaMendoza = (fecha: Date): string => {
  const { hh, min } = partesMendoza(fecha);
  return `${hh}:${min}`;
};

/** "2026-10-07", para el nombre del archivo. */
const diaIsoMendoza = (fecha: Date): string => {
  const { aaaa, mm, dd } = partesMendoza(fecha);
  return `${aaaa}-${mm}-${dd}`;
};

/** Un texto de una sola línea y sin espacios de más (los nombres de la libreta vienen con saltos, comillas y dobles espacios). */
const limpiar = (texto: string | null | undefined): string =>
  (texto ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();

/** "Informe-Campania-<nombre>-<AAAA-MM-DD>.pdf", con el nombre sin tildes ni símbolos. */
export const nombreArchivoInforme = (nombreCampania: string, ahora: Date): string => {
  const saneado = limpiar(nombreCampania)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `Informe-Campania-${saneado || 'sin-nombre'}-${diaIsoMendoza(ahora)}.pdf`;
};

const plural = (cantidad: number, singular: string, pluralTexto: string): string => (cantidad === 1 ? singular : pluralTexto);

// ------------------------------------------------------------------------------------------------------ qué pedir

/** ¿El mail de la campaña tiene botón? Sin botón no hay clicks que medir. */
const mailTieneBoton = (campania: Campania): boolean => {
  const contenido = campania.mail?.contenido;
  return campania.mail?.plantilla !== 'simple' && Boolean(contenido?.botonTexto?.trim() && contenido?.botonLink?.trim());
};

/** Cuántas personas traer de cada lista: sin tope en bajas y clicks, MAX_FILAS_POR_LISTA en las demás. */
export const topeParaFiltro = (filtro: FiltroLista): number => (LISTAS_COMPLETAS.includes(filtro) ? Number.POSITIVE_INFINITY : MAX_FILAS_POR_LISTA);

/**
 * Las listas de personas que tiene sentido pedir según los canales de la campaña y sus números (no se pide una lista que
 * las estadísticas ya dicen que está vacía). Van en el orden en que salen en el PDF.
 */
export const listasNecesarias = (campania: Campania, stats: EstadisticasCampania): FiltroLista[] => {
  const listas: FiltroLista[] = [];
  if (campania.canales.mail) {
    if (stats.mail.bajas > 0) listas.push('mail_baja');
    // Un click cuenta como apertura en la lista (aunque no se haya registrado la apertura), así que también se pide con solo clicks.
    if (stats.mail.abiertos > 0 || stats.mail.clicks > 0) listas.push('mail_abrieron');
    if (stats.mail.clicks > 0 && mailTieneBoton(campania)) listas.push('mail_click');
    if (stats.mail.enviados > 0) listas.push('mail_no_abrieron');
  }
  if (campania.canales.push) {
    const recibidas = stats.push.recibieron + stats.push.enBuzon;
    if (stats.push.leidas > 0) listas.push('push_leyeron');
    if (recibidas > 0) listas.push('push_no_leyeron');
  }
  return listas;
};

// ------------------------------------------------------------------------------------------------------ personas

const nombreDe = (fila: DestinatarioFila): string => {
  const nombre = limpiar(fila.nombre);
  // Hay contactos cuyo "nombre" es el mismo mail: no se muestra dos veces.
  return [fila.email, fila.dni, fila.cuil].some((dato) => dato && nombre.toLowerCase() === dato.toLowerCase()) ? '' : nombre;
};

const mailODni = (fila: DestinatarioFila): string => limpiar(fila.email) || limpiar(fila.dni) || limpiar(fila.cuil) || '—';
const dniOMail = (fila: DestinatarioFila): string => limpiar(fila.dni) || limpiar(fila.cuil) || limpiar(fila.email) || '—';

/** Por nombre (los que no tienen, al final) y después por mail: el mismo orden del informe que sirve de modelo. */
const comparar = (a: { nombre: string; dato: string }, b: { nombre: string; dato: string }): number => {
  if (Boolean(a.nombre) !== Boolean(b.nombre)) return a.nombre ? -1 : 1;
  return (
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }) || a.dato.localeCompare(b.dato, 'es', { sensitivity: 'base' })
  );
};

interface SeccionPedida {
  titulo: string;
  lista: PersonasTraidas | undefined;
  filtro: FiltroLista;
}

interface OpcionesFilasSimples {
  columnas: string[];
  /** Columna del medio: el mail (o DNI) o el DNI (o mail), según el canal. */
  dato: (fila: DestinatarioFila) => string;
  cuando: (fila: DestinatarioFila) => string | null | undefined;
  nota?: string;
}

/** Las filas que entran: el tope (salvo bajas y clicks) y cuántas quedaron afuera. */
const recortarLista = (filtro: FiltroLista, lista: PersonasTraidas): { filas: DestinatarioFila[]; cortadas: number } => {
  const tope = topeParaFiltro(filtro);
  const filas = lista.filas.slice(0, tope);
  // `total` es lo que tiene el filtro en el servidor; si trajimos menos filas que eso (por el tope), el resto queda sin mostrar.
  return { filas, cortadas: Math.max(0, Math.max(lista.total, lista.filas.length) - filas.length) };
};

const notaCortadas = (cortadas: number): string =>
  `y ${numero(cortadas)} más: el detalle completo está en el Excel (botón Descargar Excel).`;

/** Las notas de una sección van en párrafos separados (un salto de línea entre cada una). */
const unirNotas = (...notas: (string | undefined)[]): string | undefined => notas.filter(Boolean).join('\n') || undefined;

const seccionSimple = (pedida: SeccionPedida, opciones: OpcionesFilasSimples): SeccionInforme | null => {
  if (!pedida.lista || pedida.lista.total === 0) return null;
  const { filas, cortadas } = recortarLista(pedida.filtro, pedida.lista);
  if (filas.length === 0) return null;
  const ordenadas = filas
    .map((fila) => ({ nombre: nombreDe(fila), dato: opciones.dato(fila), cuando: fechaCortaMendoza(opciones.cuando(fila)) }))
    .sort(comparar);
  return {
    titulo: `${pedida.titulo} (${numero(Math.max(pedida.lista.total, filas.length))})`,
    columnas: opciones.columnas,
    filas: ordenadas.map((p) => [p.nombre, p.dato, p.cuando]),
    nota: unirNotas(opciones.nota, cortadas > 0 ? notaCortadas(cortadas) : undefined),
    cortadas: cortadas > 0 ? cortadas : undefined,
  };
};

/** Lista a dos columnas: nombre arriba y mail/DNI abajo, repartida por mitades (la primera columna se llena antes). */
const seccionDosColumnas = (
  pedida: SeccionPedida,
  columna: string,
  dato: (fila: DestinatarioFila) => string,
  notaFija?: string,
): SeccionInforme | null => {
  if (!pedida.lista || pedida.lista.total === 0) return null;
  const { filas, cortadas } = recortarLista(pedida.filtro, pedida.lista);
  if (filas.length === 0) return null;
  const celdas = filas
    .map((fila) => ({ nombre: nombreDe(fila), dato: dato(fila) }))
    .sort(comparar)
    .map((p) => (p.nombre ? `${p.nombre}\n${p.dato}` : p.dato));
  const mitad = Math.ceil(celdas.length / 2);
  const filasDobles = Array.from({ length: mitad }, (_, i) => [celdas[i], celdas[i + mitad] ?? '']);
  return {
    titulo: `${pedida.titulo} (${numero(Math.max(pedida.lista.total, filas.length))})`,
    columnas: [columna, columna],
    filas: filasDobles,
    dosColumnas: true,
    nota: unirNotas(notaFija, cortadas > 0 ? notaCortadas(cortadas) : undefined),
    cortadas: cortadas > 0 ? cortadas : undefined,
  };
};

// ------------------------------------------------------------------------------------------------------ el informe

const NOTA_APERTURAS =
  'Las aperturas son aproximadas: Gmail y Yahoo las cuentan bien pero pueden perder segundas lecturas, Apple Mail puede inflarlas y quien lee con las imágenes bloqueadas no aparece. Los escaneos automáticos de antivirus se descartan.';
const NOTA_PUSH = 'La lectura de la notificación cuenta cuando la persona la abre en el buzón de la app. El porcentaje es sobre los que la recibieron (en el celu o en el buzón).';
const NOTA_BANNER = 'El banner lo cuenta la app 7.1.6 en adelante; las versiones anteriores no avisan si lo vieron o lo tocaron.';

const lista = (partes: string[]): string => (partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0] ?? '');

/**
 * Arma el informe. `listas` trae las personas de cada filtro (ver listasNecesarias); una lista que falta o está vacía no
 * genera sección. `ahora` es la hora de los datos y del informe.
 */
export const armarInforme = (campania: Campania, stats: EstadisticasCampania, listas: ListasInforme, ahora: Date): InformeCampania => {
  const { canales } = campania;
  const esAfiliados = campania.tipoDestinatario === 'afiliados';
  const personaPlural = esAfiliados ? 'afiliados' : 'prestadores';
  const vigentes = stats.lista.OK ?? 0;
  const descartadas = Math.max(0, stats.total - vigentes);
  const pushRecibida = stats.push.recibieron + stats.push.enBuzon;
  const conBoton = mailTieneBoton(campania);
  const nombre = limpiar(campania.nombre) || `Campaña #${campania.id}`;
  const enviada = fechaValida(campania.enviadaAt);

  // --- Resumen: tarjetas de cifras, solo de los canales que la campaña usó.
  const resumen: CifraInforme[] = [
    { numero: numero(stats.total), rotulo: plural(stats.total, 'persona en la lista', 'personas en la lista') },
    { numero: numero(descartadas), rotulo: plural(descartadas, 'descartada de la lista', 'descartadas de la lista') },
  ];
  if (canales.mail) {
    resumen.push({ numero: numero(stats.mail.enviados), rotulo: 'recibieron el mail' });
    resumen.push({ numero: numero(stats.mail.abiertos), rotulo: `abrieron el mail (${textoPorcentaje(stats.mail.abiertos, stats.mail.enviados)})` });
    if (conBoton) resumen.push({ numero: numero(stats.mail.clicks), rotulo: 'hicieron click en el botón' });
    resumen.push({ numero: numero(stats.mail.bajas), rotulo: 'pidieron la baja' });
  }
  if (canales.push) {
    resumen.push({ numero: numero(pushRecibida), rotulo: 'recibieron la notificación' });
    resumen.push({ numero: numero(stats.push.leidas), rotulo: `leyeron la notificación (${textoPorcentaje(stats.push.leidas, pushRecibida)})` });
    resumen.push({ numero: numero(stats.push.sinCuenta + stats.push.apagadas), rotulo: 'sin la app o con la push apagada' });
  }
  if (canales.banner) {
    resumen.push({ numero: numero(stats.banner.vieron), rotulo: 'vieron el banner' });
    resumen.push({ numero: numero(stats.banner.tocaron), rotulo: 'tocaron el banner' });
  }

  // --- Párrafos.
  const parrafos: string[] = [];
  const nombresCanales = [canales.push && 'notificación push', canales.mail && 'mail', canales.banner && 'banner en la app'].filter(Boolean) as string[];
  parrafos.push(`Campaña a **${personaPlural}** por ${lista(nombresCanales) || 'ningún canal'}.`);

  const motivos: string[] = [];
  if (esAfiliados) {
    if ((stats.lista.BAJA_PADRON ?? 0) > 0) motivos.push(`${numero(stats.lista.BAJA_PADRON ?? 0)} de baja en el padrón`);
    if ((stats.lista.NO_ENCONTRADO ?? 0) > 0) motivos.push(`${numero(stats.lista.NO_ENCONTRADO ?? 0)} no encontrados`);
    if ((stats.lista.SIN_DNI ?? 0) > 0) motivos.push(`${numero(stats.lista.SIN_DNI ?? 0)} sin DNI ni CUIL`);
  }
  if ((stats.lista.QUITADO ?? 0) > 0) motivos.push(`${numero(stats.lista.QUITADO ?? 0)} quitados a mano antes de enviar`);
  parrafos.push(
    descartadas > 0
      ? `La lista tenía **${numero(stats.total)}** ${plural(stats.total, 'persona', 'personas')}. A **${numero(vigentes)}** les correspondía recibir la campaña; ` +
          `${numero(descartadas)} quedaron afuera${motivos.length ? `: ${lista(motivos)}` : ''}.`
      : `La lista tenía **${numero(stats.total)}** ${plural(stats.total, 'persona', 'personas')} y ${stats.total === 1 ? 'le' : 'a todas les'} correspondía recibir la campaña.`,
  );

  if (canales.mail) {
    const partes = [
      `Mail: **${numero(stats.mail.abiertos)} de ${numero(stats.mail.enviados)}** ${plural(stats.mail.enviados, 'persona que lo recibió lo abrió', 'personas que lo recibieron lo abrieron')} ` +
        `al menos una vez (${textoPorcentaje(stats.mail.abiertos, stats.mail.enviados)}).`,
    ];
    partes.push(
      conBoton
        ? `${numero(stats.mail.clicks)} ${plural(stats.mail.clicks, 'hizo', 'hicieron')} click en el botón y ${numero(stats.mail.bajas)} ${plural(stats.mail.bajas, 'pidió', 'pidieron')} no recibir más mails.`
        : `El mail no tenía botón, así que no hay clicks que medir. ${numero(stats.mail.bajas)} ${plural(stats.mail.bajas, 'pidió', 'pidieron')} no recibir más mails.`,
    );
    if (stats.mail.pendientes > 0) partes.push(`Todavía quedan ${numero(stats.mail.pendientes)} por enviar.`);
    if (stats.mail.errores > 0) partes.push(`${numero(stats.mail.errores)} ${plural(stats.mail.errores, 'rebotó', 'rebotaron')} (error al enviar).`);
    if (stats.mail.omitidos > 0) {
      partes.push(
        `${numero(stats.mail.omitidos)} ${plural(stats.mail.omitidos, 'persona quedó afuera', 'personas quedaron afuera')} del mail (sin mail, de baja, no encontradas o campaña cancelada).`,
      );
    }
    parrafos.push(partes.join(' '));
  }

  if (canales.push) {
    const sinLlegar: string[] = [];
    if (stats.push.apagadas > 0) sinLlegar.push(`${numero(stats.push.apagadas)} con la push apagada`);
    if (stats.push.sinCuenta > 0) sinLlegar.push(`${numero(stats.push.sinCuenta)} sin cuenta en la app`);
    if (stats.push.sinCuil > 0) sinLlegar.push(`${numero(stats.push.sinCuil)} sin CUIL`);
    if (stats.push.errores > 0) sinLlegar.push(`${numero(stats.push.errores)} con error`);
    if (stats.push.pendientes > 0) sinLlegar.push(`${numero(stats.push.pendientes)} todavía sin mandar`);
    if ((stats.push.inciertas ?? 0) > 0) sinLlegar.push(`${numero(stats.push.inciertas ?? 0)} ${plural(stats.push.inciertas ?? 0, 'incierta', 'inciertas')} (se cortó el servidor en medio de una tanda, no se sabe si salieron)`);
    parrafos.push(
      `Push: le llegó al celu a **${numero(stats.push.recibieron)}** y quedó en el buzón de la app de ${numero(stats.push.enBuzon)} (tienen cuenta pero no un celular registrado). ` +
        `La leyeron **${numero(stats.push.leidas)} de ${numero(pushRecibida)}** (${textoPorcentaje(stats.push.leidas, pushRecibida)}).` +
        (sinLlegar.length ? ` No llegó: ${lista(sinLlegar)}.` : ''),
    );
  }

  if (canales.banner) {
    parrafos.push(
      `Banner: lo vieron **${numero(stats.banner.vieron)}** de ${numero(vigentes)} vigentes (${textoPorcentaje(stats.banner.vieron, vigentes)}) y lo tocaron ${numero(stats.banner.tocaron)} ` +
        `de los que lo vieron (${textoPorcentaje(stats.banner.tocaron, stats.banner.vieron)}).`,
    );
  }

  if (campania.estado !== 'TERMINADA') {
    parrafos.push(
      `La campaña está **${etiquetaEstado(campania.estado).toLowerCase()}**: los números pueden seguir cambiando. Estos son los datos al momento del informe.`,
    );
  }

  // --- Tabla del envío: una fila por canal con lo que se mandó.
  const filasEnvio: string[][] = [];
  if (canales.push) {
    filasEnvio.push(['Push', campania.push?.titulo?.trim() || '—', numero(pushRecibida), numero(stats.push.errores)]);
  }
  if (canales.mail) {
    filasEnvio.push(['Mail', campania.mail?.asunto?.trim() || '—', numero(stats.mail.enviados), numero(stats.mail.errores)]);
  }
  if (canales.banner) {
    filasEnvio.push(['Banner', campania.banner?.titulo?.trim() || '—', numero(vigentes), '—']);
  }
  const desde = fechaCortaMendoza(campania.enviadaAt);
  const hasta = fechaCortaMendoza(campania.terminadaAt);
  const tablaEnvio: TablaInforme | undefined = filasEnvio.length
    ? {
        titulo: desde ? `Envío (${hasta && hasta !== desde ? `${desde} a ${hasta}` : desde}, hora Mendoza)` : 'Envío',
        columnas: ['Canal', 'Título o asunto', 'Enviados', 'Con error'],
        filas: filasEnvio,
        anchos: [26, 94, 25, 25],
      }
    : undefined;

  // --- Notas chicas.
  const notas: string[] = [];
  if (canales.mail) notas.push(NOTA_APERTURAS);
  if (canales.push) notas.push(NOTA_PUSH);
  if (canales.banner) notas.push(NOTA_BANNER);

  // --- Listas de personas (solo las que aplican y tienen gente).
  const persona = esAfiliados ? 'Afiliado' : 'Prestador';
  const secciones: SeccionInforme[] = [];
  const agregar = (seccion: SeccionInforme | null) => {
    if (seccion) secciones.push(seccion);
  };
  if (canales.mail) {
    // La tarjeta y el párrafo cuentan `stats.mail.abiertos` (como la pantalla de estadísticas), pero el filtro `mail_abrieron` suma
    // también a quien hizo click sin que se registrara la apertura. Si la lista trae más gente que la tarjeta, se explica la diferencia.
    const sinAperturaConClick = (listas.mail_abrieron?.total ?? 0) - stats.mail.abiertos;
    agregar(
      seccionSimple(
        { titulo: 'Pidieron no recibir más mails', lista: listas.mail_baja, filtro: 'mail_baja' },
        {
          columnas: ['Nombre', esAfiliados ? 'Mail / DNI' : 'Mail', 'Cuándo'],
          dato: mailODni,
          cuando: (f) => f.mailBajaAt,
          nota: 'Usaron el enlace de baja del pie del mail. Quedan excluidos de los próximos envíos masivos. Si hace falta que sigan recibiendo avisos operativos, hay que contactarlos por otro canal.',
        },
      ),
    );
    agregar(
      seccionSimple(
        { titulo: 'Abrieron el mail', lista: listas.mail_abrieron, filtro: 'mail_abrieron' },
        {
          columnas: ['Nombre', 'Mail', 'Primera apertura'],
          dato: mailODni,
          // Un click sin apertura es alguien que lo vio con las imágenes bloqueadas: se muestra la fecha del click.
          cuando: (f) => f.mailAbiertoAt ?? f.mailClickAt,
          nota: unirNotas(
            'Se cuenta como apertura el primer momento en que se cargó el mail; el nombre sale de la lista cargada y muchas entradas tienen solo el mail.',
            sinAperturaConClick > 0
              ? `Incluye ${numero(sinAperturaConClick)} que ${plural(sinAperturaConClick, 'hizo', 'hicieron')} click aunque no se registró la apertura (por ejemplo, con las imágenes bloqueadas).`
              : undefined,
          ),
        },
      ),
    );
    if (conBoton) {
      agregar(
        seccionSimple(
          { titulo: 'Hicieron click en el botón', lista: listas.mail_click, filtro: 'mail_click' },
          { columnas: ['Nombre', 'Mail', 'Cuándo'], dato: mailODni, cuando: (f) => f.mailClickAt },
        ),
      );
    }
    agregar(
      seccionDosColumnas(
        { titulo: 'No abrieron el mail', lista: listas.mail_no_abrieron, filtro: 'mail_no_abrieron' },
        persona,
        mailODni,
        'No incluye a quienes hicieron click ni a quienes pidieron la baja.',
      ),
    );
  }
  if (canales.push) {
    agregar(
      seccionSimple(
        { titulo: 'Leyeron la notificación', lista: listas.push_leyeron, filtro: 'push_leyeron' },
        { columnas: ['Nombre', 'DNI', 'Cuándo'], dato: dniOMail, cuando: (f) => f.pushLeidaAt },
      ),
    );
    agregar(seccionDosColumnas({ titulo: 'No leyeron la notificación', lista: listas.push_no_leyeron, filtro: 'push_no_leyeron' }, persona, dniOMail));
  }

  return {
    titulo: nombre,
    subtitulo: `${enviada ? `Envío del ${diaMendoza(enviada)}` : 'Campaña sin enviar todavía'} · Datos al ${diaMendoza(ahora)} ${horaMendoza(ahora)} (hora Mendoza)`,
    // El nombre va al final porque el dibujo recorta el pie por ancho (informeCampania.pdf.ts) y lo que se pierde es el nombre.
    pie: `Andes Salud · Informe del ${diaMendoza(ahora)} · ${nombre}`,
    resumen,
    parrafos,
    tablaEnvio,
    notas,
    secciones,
    nombreArchivo: nombreArchivoInforme(nombre, ahora),
  };
};
