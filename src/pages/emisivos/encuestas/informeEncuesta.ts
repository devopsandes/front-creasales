// informeEncuesta.ts — arma el MODELO del informe PDF de una encuesta (qué dice, en qué orden y con qué números). No dibuja nada y
// no importa jspdf: usa el mismo modelo (InformeCampania) y el mismo dibujo que el informe de Campañas
// (campanias/informeCampania.pdf.ts), así el PDF sale con el mismo diseño. Lógica pura: se prueba con node, sin navegador.

import { numero, textoPorcentaje } from '../campanias/campaniasOpciones';
import { diaMendoza } from '../campanias/informeCampania';
import type { CifraInforme, InformeCampania, SeccionInforme } from '../campanias/informeCampania';
import type { Audiencia, PreguntaResultado, RegistroPublico, ResultadosEncuesta } from './encuestas.api';
import { AUDIENCIAS, audienciaDe, nombreTipo } from './encuestasOpciones';

/** Tope de personas en la tabla del PDF (más que eso engorda el informe sin que nadie lo lea). El detalle completo está en el Excel. */
export const MAX_REGISTROS_INFORME = 1000;
/** Tope de respuestas abiertas que se listan por pregunta. */
export const MAX_TEXTOS_INFORME = 200;

const ZONA = 'America/Argentina/Mendoza';

export interface DatosInformeEncuesta {
  encuesta: { id: number; titulo: string; audiencia?: Audiencia };
  resultados: ResultadosEncuesta;
  /** Solo las públicas: los registros (hasta MAX_REGISTROS_INFORME) y el total real que hay. */
  registros?: { filas: RegistroPublico[]; total: number } | null;
}

/** Un texto de una sola línea y sin espacios de más. */
const limpiar = (texto: string | null | undefined): string => (texto ?? '').replace(/\s+/g, ' ').trim();

const plural = (cantidad: number, singular: string, pluralTexto: string): string => (cantidad === 1 ? singular : pluralTexto);

/** "14:35" en hora de Mendoza (el navegador de quien baja el informe puede estar en cualquier zona). */
const horaMendoza = (fecha: Date): string => {
  const partes = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(fecha);
  const por = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${por('hour')}:${por('minute')}`;
};

/** "Informe-Encuesta-<título>-<AAAA-MM-DD>.pdf", con el título sin tildes ni símbolos (mismo saneado que el de Campañas). */
export const nombreArchivoInformeEncuesta = (titulo: string, ahora: Date): string => {
  const saneado = limpiar(titulo)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  const [dd, mm, aaaa] = diaMendoza(ahora).split('/');
  return `Informe-Encuesta-${saneado || 'sin-titulo'}-${aaaa}-${mm}-${dd}.pdf`;
};

const notaCortadas = (cortadas: number): string =>
  `y ${numero(cortadas)} más: el detalle completo está en el Excel (botón Descargar Excel).`;

/** Una tabla por pregunta: opción / cantidad / porcentaje, o la lista de respuestas si es de texto libre. */
const seccionDePregunta = (pregunta: PreguntaResultado, numeroPregunta: number): SeccionInforme => {
  const titulo = `${numeroPregunta}. ${limpiar(pregunta.texto)}`;
  const respondieron = pregunta.respondieron;
  const partesNota = [nombreTipo(pregunta.tipo)];
  if (typeof respondieron === 'number') partesNota.push(`${numero(respondieron)} ${plural(respondieron, 'respuesta', 'respuestas')}`);

  if (pregunta.tipo === 'texto') {
    const textos = pregunta.textos.map(limpiar).filter(Boolean);
    const mostrados = textos.slice(0, MAX_TEXTOS_INFORME);
    const cortadas = textos.length - mostrados.length;
    return {
      titulo,
      columnas: ['Respuesta'],
      filas: mostrados.length > 0 ? mostrados.map((texto) => [texto]) : [['Todavía nadie respondió esta pregunta.']],
      nota: [partesNota.join(' · '), cortadas > 0 ? notaCortadas(cortadas) : ''].filter(Boolean).join('\n'),
      cortadas: cortadas > 0 ? cortadas : undefined,
    };
  }

  if (pregunta.tipo === 'multiple') partesNota.push('los porcentajes pueden sumar más de 100% porque cada persona marca varias');
  return {
    titulo,
    columnas: ['Opción', 'Cantidad', '%'],
    filas: pregunta.opciones.map((opcion) => [limpiar(opcion.texto), numero(opcion.cantidad), `${Math.round(opcion.porcentaje)}%`]),
    nota: partesNota.join(' · '),
  };
};

/** Las cifras grandes de arriba y el párrafo que las cuenta, según quién la responde. */
const resumenSegunAudiencia = (audiencia: Audiencia, resultados: ResultadosEncuesta): { cifras: CifraInforme[]; parrafos: string[] } => {
  const { respondieron, asignados, porCanal, publica } = resultados;
  const cifras: CifraInforme[] = [];
  const parrafos: string[] = [];

  if (audiencia === 'publica') {
    const p = publica;
    const total = p?.total ?? respondieron;
    const unicas = p?.unicas ?? 0;
    const duplicadas = p?.duplicadas ?? 0;
    const mail = p?.mail ?? { enviados: 0, pendientes: 0, errores: 0, rebotados: 0 };
    const estados = p?.estados ?? { Pendiente: 0, Contactado: 0, Canjeado: 0, 'No responde': 0 };
    const contactados = estados.Contactado + estados.Canjeado;
    cifras.push(
      { numero: numero(total), rotulo: plural(total, 'registro', 'registros') },
      { numero: numero(unicas), rotulo: plural(unicas, 'registro único', 'registros únicos') },
      { numero: numero(duplicadas), rotulo: plural(duplicadas, 'duplicado', 'duplicados') },
      { numero: numero(mail.enviados), rotulo: plural(mail.enviados, 'mail enviado', 'mails enviados') },
      { numero: numero(mail.rebotados + mail.errores), rotulo: plural(mail.rebotados + mail.errores, 'mail rebotado o con error', 'mails rebotados o con error') },
      { numero: numero(contactados), rotulo: plural(contactados, 'contactado o canjeado', 'contactados o canjeados') },
    );
    parrafos.push(
      'Encuesta **pública**: la responde cualquiera con el link, solo en la web, y pide nombre, WhatsApp y email.',
      total === 0
        ? 'Todavía no respondió nadie.'
        : `Entraron **${numero(total)}** ${plural(total, 'registro', 'registros')}: **${numero(unicas)}** ${plural(unicas, 'único', 'únicos')} y ` +
            `${numero(duplicadas)} ${plural(duplicadas, 'duplicado', 'duplicados')} (repiten el email o el WhatsApp de una respuesta anterior y no reciben el mail).`,
    );
    const partesMail = [`Mail a quien respondió: **${numero(mail.enviados)}** ${plural(mail.enviados, 'enviado', 'enviados')}`];
    if (mail.pendientes > 0) partesMail.push(`${numero(mail.pendientes)} ${plural(mail.pendientes, 'pendiente', 'pendientes')}`);
    if (mail.errores > 0) partesMail.push(`${numero(mail.errores)} con error al enviar`);
    if (mail.rebotados > 0) partesMail.push(`${numero(mail.rebotados)} ${plural(mail.rebotados, 'rebotó', 'rebotaron')}`);
    parrafos.push(`${partesMail.join(', ')}.`);
    parrafos.push(
      `Seguimiento de marketing: ${numero(estados.Pendiente)} ${plural(estados.Pendiente, 'pendiente', 'pendientes')}, ` +
        `${numero(estados.Contactado)} ${plural(estados.Contactado, 'contactado', 'contactados')}, ` +
        `${numero(estados.Canjeado)} ${plural(estados.Canjeado, 'canjeado', 'canjeados')} y ` +
        `${numero(estados['No responde'])} que no ${plural(estados['No responde'], 'responde', 'responden')}.`,
    );
    return { cifras, parrafos };
  }

  if (audiencia === 'afiliados') {
    cifras.push(
      { numero: numero(respondieron), rotulo: plural(respondieron, 'afiliado respondió', 'afiliados respondieron') },
      { numero: numero(porCanal.app), rotulo: 'por la app' },
      { numero: numero(porCanal.web), rotulo: 'por la web' },
    );
    parrafos.push(
      'Encuesta abierta a **todos los afiliados** vigentes, sin lista.',
      respondieron === 0
        ? 'Todavía no respondió nadie.'
        : `Respondieron **${numero(respondieron)}** ${plural(respondieron, 'afiliado', 'afiliados')}: ${numero(porCanal.app)} desde la app y ${numero(porCanal.web)} desde la web.`,
    );
    return { cifras, parrafos };
  }

  cifras.push(
    { numero: numero(respondieron), rotulo: plural(respondieron, 'afiliado respondió', 'afiliados respondieron') },
    { numero: numero(asignados), rotulo: plural(asignados, 'afiliado en la lista', 'afiliados en la lista') },
    { numero: textoPorcentaje(respondieron, asignados), rotulo: 'de la lista respondió' },
    { numero: numero(porCanal.app), rotulo: 'por la app' },
    { numero: numero(porCanal.web), rotulo: 'por la web' },
  );
  parrafos.push(
    `Encuesta para los **${numero(asignados)}** ${plural(asignados, 'afiliado', 'afiliados')} de una lista de DNIs.`,
    respondieron === 0
      ? 'Todavía no respondió nadie.'
      : `Respondieron **${numero(respondieron)} de ${numero(asignados)}** (${textoPorcentaje(respondieron, asignados)}): ` +
          `${numero(porCanal.app)} desde la app y ${numero(porCanal.web)} desde la web.`,
  );
  return { cifras, parrafos };
};

/** Estado que se imprime en la tabla de personas: el de marketing, y si es duplicado se aclara. */
const estadoDeRegistro = (registro: RegistroPublico): string => `${registro.estado}${registro.duplicada ? ' (duplicado)' : ''}`;

/**
 * Arma el informe. `ahora` es la hora de los datos y del informe. Una pública suma la tabla de personas (`registros`); si trae
 * menos filas que el total, la nota aclara cuántas faltan.
 */
export const armarInformeEncuesta = (datos: DatosInformeEncuesta, ahora: Date): InformeCampania => {
  const { encuesta, resultados } = datos;
  const audiencia: Audiencia = resultados.publica ? 'publica' : audienciaDe(encuesta);
  const titulo = limpiar(encuesta.titulo) || `Encuesta #${encuesta.id}`;
  const quien = AUDIENCIAS.find((opcion) => opcion.valor === audiencia)?.etiqueta ?? audiencia;
  const { cifras, parrafos } = resumenSegunAudiencia(audiencia, resultados);

  const secciones: SeccionInforme[] = resultados.preguntas.map((pregunta, indice) => seccionDePregunta(pregunta, indice + 1));

  if (audiencia === 'publica' && datos.registros) {
    const { filas, total } = datos.registros;
    const mostradas = filas.slice(0, MAX_REGISTROS_INFORME);
    const cortadas = Math.max(0, Math.max(total, filas.length) - mostradas.length);
    if (mostradas.length > 0) {
      secciones.push({
        titulo: `Personas que respondieron (${numero(Math.max(total, mostradas.length))})`,
        // Tres columnas y no cuatro: el dibujo (informeCampania.pdf.ts) solo sabe repartir el ancho de las tablas de 1 o 3 columnas
        // ([60, 76, 34] mm). WhatsApp y email van juntos, uno abajo del otro.
        columnas: ['Nombre', 'WhatsApp y email', 'Estado'],
        filas: mostradas.map((r) => [
          limpiar(r.nombre) || '—',
          `${limpiar(r.whatsapp) || '—'}\n${limpiar(r.email) || '—'}`,
          estadoDeRegistro(r),
        ]),
        nota: [
          'Las más nuevas primero. "Estado" es el seguimiento que carga marketing; un duplicado repite el email o el WhatsApp de una respuesta anterior.',
          cortadas > 0 ? notaCortadas(cortadas) : '',
        ]
          .filter(Boolean)
          .join('\n'),
        cortadas: cortadas > 0 ? cortadas : undefined,
      });
    }
  }

  const notas: string[] = [];
  if (audiencia === 'publica') {
    notas.push('Mail "Rebotó": el mail volvió como rebote permanente o queja del buzón de la persona. "Con error": no se pudo enviar.');
  }

  return {
    titulo,
    subtitulo: `Quién la responde: ${quien} · Datos al ${diaMendoza(ahora)} ${horaMendoza(ahora)} (hora Mendoza)`,
    // El nombre va al final porque el dibujo recorta el pie por ancho y lo que se pierde es el nombre.
    pie: `Andes Salud · Informe del ${diaMendoza(ahora)} · ${titulo}`,
    resumen: cifras,
    parrafos,
    notas,
    secciones,
    nombreArchivo: nombreArchivoInformeEncuesta(titulo, ahora),
  };
};
