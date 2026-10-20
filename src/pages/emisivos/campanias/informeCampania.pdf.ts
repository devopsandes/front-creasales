// informeCampania.pdf.ts — dibuja en PDF el modelo que arma informeCampania.ts. jspdf y jspdf-autotable se cargan con
// import() recién al tocar "Descargar informe PDF": no entran al bundle principal del front. El diseño copia el informe de la
// campaña "Pasos para prestadores" (generar-informe-pasosprest.py, reportlab): A4, logo centrado, título azul, tarjetas
// de cifras sobre fondo lila, tablas con encabezado lila y pie con línea amarilla. Todo en milímetros.

import type { jsPDF } from 'jspdf';
import type { InformeCampania, SeccionInforme, TablaInforme } from './informeCampania';
import logoUrl from './logo-andes-informe.png';

type Color = [number, number, number];

const AZUL: Color = [21, 9, 88]; // #150958
const AMARILLO: Color = [252, 175, 23]; // #FCAF17
const LILA: Color = [244, 242, 250]; // #f4f2fa
const TEXTO: Color = [43, 36, 71]; // #2b2447
const GRIS: Color = [111, 106, 133]; // #6f6a85
const SEPARADOR: Color = [230, 226, 242]; // #e6e2f2
const BLANCO: Color = [255, 255, 255];

const PAGINA_ANCHO = 210;
const PAGINA_ALTO = 297;
const MARGEN_X = 20;
const MARGEN_SUP = 18;
const MARGEN_INF = 22;
const ANCHO_UTIL = PAGINA_ANCHO - MARGEN_X * 2; // 170

/** Todo el texto se dibuja desde el borde de arriba (baseline 'top'): así las alturas de fila y de párrafo se calculan fácil. */
const TEXTO_ARRIBA = { baseline: 'top' } as const;

/** Los tamaños del modelo vienen en puntos; jsPDF dibuja en mm. */
const pt = (puntos: number): number => puntos * 0.3528;

// Tablas: 9,5 pt con interlineado de 12,5 pt y 5 pt de aire arriba y abajo, como el modelo.
const TABLA_FUENTE = 9.5;
const TABLA_LINEA = pt(12.5);
const PAD_VERTICAL = pt(5);
const PAD_IZQ = pt(7);
const PAD_DER = 2;

// Los estándar de PDF solo traen Latin-1 y unos signos más: cualquier otro carácter (un emoji en un nombre) se vería roto.
const ENTRA_EN_PDF = /[\u0020-\u007e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026\u20ac\n]/;
const paraPdf = (texto: string): string =>
  Array.from(texto)
    .map((c) => (ENTRA_EN_PDF.test(c) ? c : c === '\t' || c === '\r' ? ' ' : '?'))
    .join('');

const aBase64 = (bytes: Uint8Array): string => {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
};

/** El logo como dataURL (jsPDF lo necesita así). Si no se puede traer, el informe sale igual sin logo. */
export const cargarLogoInforme = async (): Promise<string | undefined> => {
  try {
    const respuesta = await fetch(logoUrl);
    if (!respuesta.ok) return undefined;
    return `data:image/png;base64,${aBase64(new Uint8Array(await respuesta.arrayBuffer()))}`;
  } catch {
    return undefined;
  }
};

/** Lo que agrega autotable al documento: la última tabla dibujada (y dónde terminó). */
const finalDeTabla = (doc: jsPDF): number | undefined => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;

/** Una celda de las listas a dos columnas, ya partida en líneas: el nombre va en negrita y el mail abajo. */
interface CeldaDoble {
  nombre: string[];
  dato: string[];
  alto: number;
}

export const crearPdfInforme = async (informe: InformeCampania, logo?: string): Promise<jsPDF> => {
  // Carga perezosa: estos dos paquetes pesan bastante y solo hacen falta acá.
  const [{ jsPDF: JsPdf }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new JsPdf({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  doc.setProperties({ title: paraPdf(informe.titulo), author: 'Andes Salud' });
  let y = MARGEN_SUP;

  const fuente = (estilo: 'normal' | 'bold', tamano: number, color: Color) => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamano);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  /** Si lo que sigue no entra en la hoja, pasa a la siguiente. */
  const asegurar = (alto: number) => {
    if (y + alto > PAGINA_ALTO - MARGEN_INF) {
      doc.addPage();
      y = MARGEN_SUP;
    }
  };

  /**
   * Ancho en mm de un texto con la fuente actual. Se mide con `kerning: true` porque es lo que coincide con cómo se dibuja:
   * el ancho por defecto de jsPDF es unos décimos de mm MENOR que el real y el texto se pisaba con el espacio que sigue
   * ("Yahoolas").
   */
  const medir = (texto: string): number => (doc.getStringUnitWidth(texto, { kerning: true }) * doc.getFontSize()) / doc.internal.scaleFactor;

  /** Recorta un texto por ANCHO medido (no por cantidad de letras) para que entre en `maximo` mm, con "…" al final si hubo que cortar. */
  const recortarAncho = (texto: string, maximo: number): string => {
    if (medir(texto) <= maximo) return texto;
    let largo = texto.length;
    while (largo > 0 && medir(`${texto.slice(0, largo).trimEnd()}…`) > maximo) largo -= 1;
    return `${texto.slice(0, largo).trimEnd()}…`;
  };

  /**
   * Parte un texto al ancho dado con la fuente actual, palabra por palabra. Una palabra más larga que el ancho (un mail) se
   * corta después de un "-", ".", "@", "_" o "/" si hay, y si no, justo donde se pasa.
   */
  const envolver = (texto: string, ancho: number): string[] => {
    const salida: string[] = [];
    for (const parrafo of paraPdf(texto).split('\n')) {
      let actual = '';
      for (const palabra of parrafo.split(/ +/)) {
        const candidata = actual ? `${actual} ${palabra}` : palabra;
        if (medir(candidata) <= ancho) {
          actual = candidata;
          continue;
        }
        if (actual) {
          salida.push(actual);
          actual = '';
        }
        let resto = palabra;
        while (medir(resto) > ancho && resto.length > 1) {
          let n = resto.length;
          while (n > 1 && medir(resto.slice(0, n)) > ancho) n -= 1;
          const corte = Math.max(...['-', '.', '@', '_', '/'].map((c) => resto.slice(0, n).lastIndexOf(c)));
          const hasta = corte > 0 ? corte + 1 : n;
          salida.push(resto.slice(0, hasta));
          resto = resto.slice(hasta);
        }
        actual = resto;
      }
      salida.push(actual);
    }
    return salida;
  };

  // ---------------------------------------------------------------------------------------------------- piezas sueltas

  const dibujarLogo = () => {
    if (!logo) return;
    const ancho = 46;
    const alto = ancho * 0.225;
    doc.addImage(logo, 'PNG', (PAGINA_ANCHO - ancho) / 2, y, ancho, alto);
    y += alto + pt(10);
  };

  const dibujarTitulo = (titulo: string, subtitulo: string) => {
    fuente('bold', 22, AZUL);
    for (const linea of envolver(titulo, ANCHO_UTIL)) {
      doc.text(linea, MARGEN_X, y, TEXTO_ARRIBA);
      y += pt(26);
    }
    y += pt(4);
    fuente('normal', 10.5, GRIS);
    for (const linea of envolver(subtitulo, ANCHO_UTIL)) {
      doc.text(linea, MARGEN_X, y, TEXTO_ARRIBA);
      y += pt(14);
    }
    y += pt(14);
  };

  /** Título de sección. `reservar` es el alto que tiene que quedar libre en la hoja para que el título no quede huérfano. */
  const encabezado = (texto: string, reservar = 45) => {
    asegurar(reservar);
    if (y > MARGEN_SUP) y += pt(14);
    fuente('bold', 13.5, AZUL);
    for (const linea of envolver(texto, ANCHO_UTIL)) {
      doc.text(linea, MARGEN_X, y, TEXTO_ARRIBA);
      y += pt(17);
    }
    y += pt(7);
  };

  /** Párrafo con negrita entre **dobles asteriscos**, armado palabra por palabra. */
  const parrafo = (texto: string, tamano: number, interlineado: number, color: Color, espacioDespues: number) => {
    interface Palabra {
      t: string;
      negrita: boolean;
      espacio: boolean;
    }
    const palabras: Palabra[] = [];
    let espacioPendiente = false;
    for (const segmento of paraPdf(texto).split(/(\*\*[^*]+\*\*)/)) {
      if (!segmento) continue;
      const negrita = segmento.startsWith('**');
      for (const pieza of (negrita ? segmento.slice(2, -2) : segmento).match(/\S+|\s+/g) ?? []) {
        if (/^\s+$/.test(pieza)) espacioPendiente = true;
        else {
          palabras.push({ t: pieza, negrita, espacio: espacioPendiente && palabras.length > 0 });
          espacioPendiente = false;
        }
      }
    }

    const ancho = (t: string, negrita: boolean) => {
      doc.setFont('helvetica', negrita ? 'bold' : 'normal');
      doc.setFontSize(tamano);
      return medir(t);
    };
    const anchoEspacio = ancho(' ', false);

    const lineas: { t: string; negrita: boolean; x: number }[][] = [[]];
    let x = 0;
    for (const palabra of palabras) {
      const w = ancho(palabra.t, palabra.negrita);
      const sep = palabra.espacio && x > 0 ? anchoEspacio : 0;
      if (x > 0 && x + sep + w > ANCHO_UTIL) {
        lineas.push([]);
        x = 0;
      }
      const inicio = x + (x > 0 ? sep : 0);
      lineas[lineas.length - 1].push({ t: palabra.t, negrita: palabra.negrita, x: inicio });
      x = inicio + w;
    }

    doc.setTextColor(color[0], color[1], color[2]);
    for (const linea of lineas) {
      asegurar(interlineado);
      for (const p of linea) {
        doc.setFont('helvetica', p.negrita ? 'bold' : 'normal');
        doc.setFontSize(tamano);
        doc.text(p.t, MARGEN_X + p.x, y, TEXTO_ARRIBA);
      }
      y += interlineado;
    }
    y += espacioDespues;
  };

  /** Tarjetas de cifras: número grande azul y rótulo gris chico, sobre una franja lila. Hasta 5 por fila. */
  const dibujarCifras = (cifras: InformeCampania['resumen']) => {
    if (!cifras.length) return;
    const filas = Math.ceil(cifras.length / 5);
    const porFila = Math.ceil(cifras.length / filas);
    const anchoTarjeta = ANCHO_UTIL / porFila;
    const padding = pt(9);
    const interNumero = pt(24);
    const interRotulo = pt(12);

    for (let desde = 0; desde < cifras.length; desde += porFila) {
      const fila = cifras.slice(desde, desde + porFila);
      fuente('normal', 8.5, GRIS);
      const rotulos = fila.map((c) => envolver(c.rotulo, anchoTarjeta - pt(10) - 2));
      const alto = padding + interNumero + Math.max(...rotulos.map((r) => r.length)) * interRotulo + padding;
      asegurar(alto + 1);

      doc.setFillColor(...LILA);
      doc.rect(MARGEN_X, y, ANCHO_UTIL, alto, 'F');
      doc.setDrawColor(...BLANCO);
      doc.setLineWidth(pt(0.6));
      for (let i = 1; i < fila.length; i += 1) doc.line(MARGEN_X + i * anchoTarjeta, y, MARGEN_X + i * anchoTarjeta, y + alto);

      fila.forEach((cifra, i) => {
        const x = MARGEN_X + i * anchoTarjeta + pt(10);
        fuente('bold', 20, AZUL);
        doc.text(paraPdf(cifra.numero), x, y + padding, TEXTO_ARRIBA);
        fuente('normal', 8.5, GRIS);
        rotulos[i].forEach((linea, n) => doc.text(linea, x, y + padding + interNumero + n * interRotulo, TEXTO_ARRIBA));
      });
      y += alto + pt(2);
    }
    y += pt(6);
  };

  /** Texto chico y gris (notas al pie de una tabla o de una sección). */
  const nota = (texto: string) => {
    for (const parte of texto.split('\n')) {
      y += pt(4);
      fuente('normal', 8.5, GRIS);
      parrafo(parte, 8.5, pt(12), GRIS, pt(4));
    }
  };

  /**
   * Tabla con el estilo del modelo: encabezado lila con texto azul en negrita y una línea azul abajo, filas con separador
   * gris claro. `dobles` son las celdas de las listas a dos columnas, que se dibujan a mano (nombre en negrita + mail).
   */
  const tabla = (columnas: string[], filas: string[][], anchos: number[], dobles?: CeldaDoble[][]) => {
    const cuerpo = dobles
      ? dobles.map((fila) => fila.map((celda) => ({ content: '', styles: { minCellHeight: celda.alto } })))
      : filas.map((fila) => {
          fuente('normal', TABLA_FUENTE, TEXTO);
          return fila.map((celda, i) => envolver(celda, anchos[i] - PAD_IZQ - PAD_DER).join('\n'));
        });

    autoTable(doc, {
      startY: y,
      head: [columnas],
      body: cuerpo,
      theme: 'plain',
      margin: { top: MARGEN_SUP, bottom: MARGEN_INF, left: MARGEN_X, right: MARGEN_X },
      tableWidth: ANCHO_UTIL,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      styles: {
        font: 'helvetica',
        fontSize: TABLA_FUENTE,
        textColor: TEXTO,
        valign: 'top',
        overflow: 'linebreak',
        cellPadding: { top: PAD_VERTICAL, bottom: PAD_VERTICAL, left: PAD_IZQ, right: PAD_DER },
      },
      headStyles: { fillColor: LILA, textColor: AZUL, fontStyle: 'bold' },
      columnStyles: Object.fromEntries(anchos.map((a, i) => [i, { cellWidth: a }])),
      didParseCell: (datos) => {
        const cabecera = datos.section === 'head';
        datos.cell.styles.lineColor = cabecera ? AZUL : SEPARADOR;
        datos.cell.styles.lineWidth = { bottom: cabecera ? pt(1) : pt(0.4) };
      },
      didDrawCell: (datos) => {
        if (!dobles || datos.section !== 'body') return;
        const celda = dobles[datos.row.index]?.[datos.column.index];
        if (!celda) return;
        let yy = datos.cell.y + PAD_VERTICAL;
        const xx = datos.cell.x + PAD_IZQ;
        fuente('bold', TABLA_FUENTE, AZUL);
        for (const linea of celda.nombre) {
          doc.text(linea, xx, yy, TEXTO_ARRIBA);
          yy += TABLA_LINEA;
        }
        fuente('normal', TABLA_FUENTE, TEXTO);
        for (const linea of celda.dato) {
          doc.text(linea, xx, yy, TEXTO_ARRIBA);
          yy += TABLA_LINEA;
        }
      },
    });
    y = (finalDeTabla(doc) ?? y) + pt(4);
  };

  /** Parte cada celda "Nombre\nmail" de una lista a dos columnas en sus líneas, para saber cuánto mide la fila. */
  const celdasDobles = (seccion: SeccionInforme, anchos: number[]): CeldaDoble[][] =>
    seccion.filas.map((fila) =>
      fila.map((celda, i) => {
        const [primera, ...resto] = celda.split('\n');
        const ancho = anchos[i] - PAD_IZQ - PAD_DER;
        // Con nombre: el nombre va en negrita y el mail abajo. Sin nombre: solo el mail, en texto común.
        const tieneNombre = resto.length > 0;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(TABLA_FUENTE);
        const nombre = tieneNombre ? envolver(primera, ancho) : [];
        doc.setFont('helvetica', 'normal');
        const dato = celda ? envolver(tieneNombre ? resto.join(' ') : primera, ancho) : [];
        return { nombre, dato, alto: PAD_VERTICAL * 2 + (nombre.length + dato.length) * TABLA_LINEA };
      }),
    );

  /** Cuánto mide una sección entera (título, tabla y nota), para saber si entra en lo que queda de la hoja. */
  const altoDeSeccion = (seccion: SeccionInforme, anchos: number[], dobles?: CeldaDoble[][]): number => {
    fuente('normal', TABLA_FUENTE, TEXTO);
    const filas = dobles
      ? dobles.reduce((suma, fila) => suma + Math.max(...fila.map((celda) => celda.alto)), 0)
      : seccion.filas.reduce(
          (suma, fila) => suma + PAD_VERTICAL * 2 + Math.max(...fila.map((celda, i) => envolver(celda, anchos[i] - PAD_IZQ - PAD_DER).length)) * TABLA_LINEA,
          0,
        );
    fuente('normal', 8.5, GRIS);
    const lineasNota = seccion.nota ? seccion.nota.split('\n').reduce((suma, parte) => suma + envolver(parte, ANCHO_UTIL).length, 0) : 0;
    const cabecera = PAD_VERTICAL * 2 + TABLA_LINEA;
    return pt(14 + 17 + 7) + cabecera + filas + lineasNota * pt(12) + (seccion.nota ? pt(8) : 0) + 2;
  };

  const dibujarSeccion = (seccion: SeccionInforme) => {
    const anchos = seccion.dosColumnas ? [ANCHO_UTIL / 2, ANCHO_UTIL / 2] : seccion.columnas.length === 3 ? [60, 76, 34] : [ANCHO_UTIL / seccion.columnas.length];
    const dobles = seccion.dosColumnas ? celdasDobles(seccion, anchos) : undefined;
    // Las listas cortas no se parten entre hojas (como el KeepTogether del modelo); las largas pasan a la hoja siguiente si queda poco lugar.
    encabezado(seccion.titulo, seccion.filas.length <= 12 ? Math.min(altoDeSeccion(seccion, anchos, dobles), PAGINA_ALTO - MARGEN_SUP - MARGEN_INF) : 45);
    tabla(seccion.columnas, seccion.filas, anchos, dobles);
    if (seccion.nota) nota(seccion.nota);
  };

  const dibujarTablaEnvio = (envio: TablaInforme) => {
    encabezado(envio.titulo, 40);
    tabla(envio.columnas, envio.filas, envio.anchos);
  };

  // ---------------------------------------------------------------------------------------------------- el documento

  dibujarLogo();
  dibujarTitulo(informe.titulo, informe.subtitulo);

  encabezado('Resumen', 60);
  dibujarCifras(informe.resumen);
  for (const texto of informe.parrafos) parrafo(texto, 10, pt(14.5), TEXTO, pt(4));

  if (informe.tablaEnvio) dibujarTablaEnvio(informe.tablaEnvio);
  for (const texto of informe.notas) nota(texto);

  for (const seccion of informe.secciones) dibujarSeccion(seccion);

  // Pie en todas las hojas, recién ahora que se sabe cuántas son: línea amarilla, texto a la izquierda y "Página N de M".
  const paginas = doc.getNumberOfPages();
  for (let n = 1; n <= paginas; n += 1) {
    doc.setPage(n);
    doc.setDrawColor(...AMARILLO);
    doc.setLineWidth(pt(2));
    doc.line(MARGEN_X, PAGINA_ALTO - 14, PAGINA_ANCHO - MARGEN_X, PAGINA_ALTO - 14);
    fuente('normal', 8, GRIS);
    const paginado = `Página ${n} de ${paginas}`;
    doc.text(paginado, PAGINA_ANCHO - MARGEN_X - medir(paginado), PAGINA_ALTO - 9);
    doc.text(recortarAncho(paraPdf(informe.pie), ANCHO_UTIL - medir(paginado) - 4), MARGEN_X, PAGINA_ALTO - 9);
  }

  return doc;
};

/**
 * Arma el PDF y lo descarga con el nombre del informe. `cancelado` se consulta justo antes de bajarlo: si dice que sí (se cerró
 * la pantalla mientras se armaba) no se descarga nada. Devuelve si lo descargó.
 */
export const descargarInformePdf = async (informe: InformeCampania, cancelado?: () => boolean): Promise<boolean> => {
  const doc = await crearPdfInforme(informe, await cargarLogoInforme());
  if (cancelado?.()) return false;
  doc.save(informe.nombreArchivo);
  return true;
};
