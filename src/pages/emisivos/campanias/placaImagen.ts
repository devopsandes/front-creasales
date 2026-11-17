// placaImagen.ts — arma la imagen de la "Campaña con placa propia" (Ruy, 16/11/2026) en el navegador.
// Ruy arma la placa con su Claude y pega el HTML: acá se dibuja en un iframe sin scripts y se le saca una "foto"
// (html-to-image). Si la foto falla, se usa la imagen más grande que traiga el HTML adentro (data:image). Opcionalmente se
// dibuja un botón debajo de la placa, dentro de la misma imagen: un botón HTML amarillo se ve marrón en el modo oscuro de
// Gmail Android (lección de la campaña residuales, 03/11). El resultado es un JPEG de 1200 px de ancho de hasta 1 MB, que
// es lo que acepta POST /campanias/:id/imagen. Ver docs/campanias.md en Emisivos.

import { toCanvas } from 'html-to-image';

/** Ancho al que se dibuja el HTML (el de los mails) y ancho final de la imagen (el doble, para pantallas nítidas). */
const ANCHO_MAIL = 600;
const ANCHO_FINAL = ANCHO_MAIL * 2;
const MAX_BYTES = 1024 * 1024;
/** El HTML suele traer un margen alrededor de la placa: el iframe deja lugar para eso y después se busca la placa. */
const ANCHO_IFRAME = ANCHO_MAIL + 40;

export const TEXTO_BOTON_POR_DEFECTO = 'Cotizá gratis por WhatsApp';
export const LINK_BOT_COMERCIAL =
  'https://wa.me/5492617039177?text=Hola%2C%20vi%20el%20mail%20de%20Andes%20Salud%20y%20quiero%20cotizar';

const AMARILLO = '#FCAF17';
const AZUL_TEXTO = '#150958';

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

/** Todas las imágenes del documento terminaron de cargar (o fallaron). */
const imagenesCargadas = async (doc: Document) => {
  await Promise.all(
    Array.from(doc.images).map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((listo) => { img.onload = () => listo(); img.onerror = () => listo(); }),
    ),
  );
};

/**
 * La placa dentro del HTML: el primer elemento (en orden) de hasta 600 px de ancho y algo de alto. Así se deja afuera el
 * fondo y el margen que suelen rodearla. Si no hay ninguno, el body entero.
 */
const elegirPlaca = (doc: Document): HTMLElement => {
  for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>('*'))) {
    const { width, height } = el.getBoundingClientRect();
    if (width >= 300 && width <= ANCHO_MAIL + 1 && height >= 150) return el;
  }
  return doc.body;
};

/**
 * El HTML pegado sin nada que se pueda ejecutar: sin <script>, iframes ni objetos incrustados, sin atributos on* (onload,
 * onerror...) y sin links javascript:. El iframe ya no corre scripts (sandbox), pero html-to-image copia los elementos al
 * documento de CreaSales para la foto, donde está la sesión: esto es una segunda barrera (revisión 16/11/2026).
 */
export const limpiarHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, frame, frameset, object, embed, applet, base, meta[http-equiv]').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const { name, value } of Array.from(el.attributes)) {
      const peligroso = name.toLowerCase().startsWith('on') || /^\s*(javascript|vbscript):/i.test(value);
      if (peligroso) el.removeAttribute(name);
    }
  });
  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
};

/** Iframe sin scripts (sandbox) fuera de la pantalla, con el HTML ya limpio. */
const crearIframe = (html: string): HTMLIFrameElement => {
  const iframe = document.createElement('iframe');
  // allow-same-origin para poder leer el DOM y sacarle la foto; sin allow-scripts: nada del HTML pegado se ejecuta.
  iframe.setAttribute('sandbox', 'allow-same-origin');
  iframe.style.cssText = `position:fixed; left:-10000px; top:0; width:${ANCHO_IFRAME}px; height:2000px; border:0;`;
  iframe.srcdoc = limpiarHtml(html);
  return iframe;
};

/** Espera a que el iframe (cargado = su onload) y sus imágenes terminen de cargar, y devuelve su documento. */
const esperarIframe = async (iframe: HTMLIFrameElement, cargado: Promise<void>): Promise<Document> => {
  await cargado;
  const doc = iframe.contentDocument;
  if (!doc?.body) throw new Error('No se pudo leer el HTML.');
  await imagenesCargadas(doc);
  await esperar(150);
  return doc;
};

/**
 * Tope para la foto: html-to-image espera un requestAnimationFrame, y el navegador no lo dispara con la pestaña en segundo
 * plano (se vio en la prueba local del 16/11). Sin tope, "Armando..." quedaba para siempre; con tope, se usa el plan B.
 */
const TOPE_FOTO_MS = 20000;

const conTope = <T,>(promesa: Promise<T>, ms: number): Promise<T> =>
  Promise.race([promesa, new Promise<T>((_, rechazar) => setTimeout(() => rechazar(new Error('La foto del HTML tardó demasiado.')), ms))]);

/**
 * "Foto" de la placa del HTML a 1200 px de ancho. El tope cubre todo (carga del iframe, de las imágenes y la foto) y el
 * iframe se saca siempre, salga bien o mal. Si la placa es más ancha que un mail (Claude a veces la arma de 1080 px), se
 * corta acá: la foto agarraría un pedazo y conviene el plan B (la imagen que trae adentro) o subirla como imagen.
 */
export const fotoDelHtml = async (html: string): Promise<HTMLCanvasElement> => {
  const iframe = crearIframe(html);
  const cargado = new Promise<void>((listo) => { iframe.onload = () => listo(); });
  document.body.appendChild(iframe);
  try {
    return await conTope((async () => {
      const doc = await esperarIframe(iframe, cargado);
      if (doc.documentElement.scrollWidth > ANCHO_IFRAME + 4) throw new Error('La placa es más ancha que un mail (600 px).');
      const placa = elegirPlaca(doc);
      const ancho = placa.getBoundingClientRect().width || ANCHO_MAIL;
      const canvas = await toCanvas(placa, { pixelRatio: ANCHO_FINAL / ancho, cacheBust: false, skipFonts: false });
      if (!canvas.width || !canvas.height || pareceVacio(canvas)) throw new Error('La foto del HTML salió vacía.');
      return canvas;
    })(), TOPE_FOTO_MS);
  } finally {
    iframe.remove();
  }
};

/** Una foto toda de un mismo color (en blanco) es que no se pudo dibujar. Se miran algunos puntos al azar. */
const pareceVacio = (canvas: HTMLCanvasElement): boolean => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  const muestras = 40;
  let primero: string | null = null;
  for (let i = 0; i < muestras; i++) {
    const x = Math.floor(((i * 37) % 100) / 100 * canvas.width);
    const y = Math.floor(((i * 61) % 100) / 100 * canvas.height);
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const color = `${r},${g},${b}`;
    if (primero === null) primero = color;
    else if (color !== primero) return false;
  }
  return true;
};

/** La imagen más grande que trae el HTML adentro (data:image/...), o null. Es el plan B si la foto falla. */
export const imagenIncrustadaMasGrande = (html: string): string | null => {
  const encontradas = html.match(/data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+/g) ?? [];
  if (encontradas.length === 0) return null;
  return encontradas.reduce((mayor, actual) => (actual.length > mayor.length ? actual : mayor)).replace(/\s+/g, '');
};

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement>((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });

/** Una imagen (subida o incrustada) llevada a 1200 px de ancho. */
export const canvasDeImagen = async (src: string): Promise<HTMLCanvasElement> => {
  const img = await cargarImagen(src);
  if (!img.naturalWidth || !img.naturalHeight) throw new Error('No se pudo leer la imagen.');
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO_FINAL;
  canvas.height = Math.round((img.naturalHeight * ANCHO_FINAL) / img.naturalWidth);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no pudo dibujar la imagen.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
};

/** Color del borde de abajo de la placa: la franja del botón lo continúa para que no se note el corte. */
const colorDeAbajo = (canvas: HTMLCanvasElement): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#164BCD';
  const [r, g, b] = ctx.getImageData(Math.floor(canvas.width / 2), canvas.height - 2, 1, 1).data;
  return `rgb(${r},${g},${b})`;
};

/** Agrega debajo de la placa una franja con un botón amarillo redondeado y el texto (todo dentro de la misma imagen). */
export const conBotonDebajo = (placa: HTMLCanvasElement, texto: string): HTMLCanvasElement => {
  const alto = 200;
  const canvas = document.createElement('canvas');
  canvas.width = placa.width;
  canvas.height = placa.height + alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no pudo dibujar el botón.');
  ctx.drawImage(placa, 0, 0);
  ctx.fillStyle = colorDeAbajo(placa);
  ctx.fillRect(0, placa.height, canvas.width, alto);

  ctx.font = `bold 46px Poppins, 'Trebuchet MS', Arial, sans-serif`;
  const anchoTexto = ctx.measureText(texto).width;
  const anchoBoton = Math.min(canvas.width - 120, anchoTexto + 140);
  const altoBoton = 110;
  const x = (canvas.width - anchoBoton) / 2;
  const y = placa.height + (alto - altoBoton) / 2;
  ctx.fillStyle = AMARILLO;
  ctx.beginPath();
  ctx.roundRect(x, y, anchoBoton, altoBoton, altoBoton / 2);
  ctx.fill();
  ctx.fillStyle = AZUL_TEXTO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, canvas.width / 2, y + altoBoton / 2 + 2, anchoBoton - 60);
  return canvas;
};

const aBlob = (canvas: HTMLCanvasElement, calidad: number) =>
  new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', calidad));

/**
 * La placa sobre fondo blanco (el del mail). El JPEG no tiene transparencia: las esquinas redondeadas de la placa
 * saldrían negras (pasó con la placa de Ruy del 03/11).
 */
const sobreBlanco = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const fondo = document.createElement('canvas');
  fondo.width = canvas.width;
  fondo.height = canvas.height;
  const ctx = fondo.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, fondo.width, fondo.height);
  ctx.drawImage(canvas, 0, 0);
  return fondo;
};

/** JPEG de hasta 1 MB: baja la calidad y, si no alcanza, achica la imagen. */
export const aJpegDeHasta1Mb = async (canvas: HTMLCanvasElement): Promise<File> => {
  let actual = sobreBlanco(canvas);
  for (let achique = 0; achique < 3; achique++) {
    for (const calidad of [0.9, 0.82, 0.74, 0.66, 0.6]) {
      const blob = await aBlob(actual, calidad);
      if (blob && blob.size <= MAX_BYTES) return new File([blob], 'placa.jpg', { type: 'image/jpeg' });
    }
    const menor = document.createElement('canvas');
    menor.width = Math.round(actual.width * 0.8);
    menor.height = Math.round(actual.height * 0.8);
    menor.getContext('2d')?.drawImage(actual, 0, 0, menor.width, menor.height);
    actual = menor;
  }
  throw new Error('La placa es muy pesada: probá con una imagen más chica.');
};

export type OrigenPlaca = 'foto' | 'incrustada' | 'subida';

/**
 * De lo que cargó Ruy (HTML pegado o imagen subida) al JPEG final, con el botón debajo si lo pidió.
 * Devuelve también de dónde salió la imagen, para avisarle si se usó el plan B.
 */
export const armarPlaca = async (
  entrada: { html: string } | { archivo: File },
  textoBoton: string,
): Promise<{ archivo: File; origen: OrigenPlaca; vistaPrevia: string }> => {
  let canvas: HTMLCanvasElement;
  let origen: OrigenPlaca;
  if ('archivo' in entrada) {
    const url = URL.createObjectURL(entrada.archivo);
    try {
      canvas = await canvasDeImagen(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    origen = 'subida';
  } else {
    try {
      canvas = await fotoDelHtml(entrada.html);
      origen = 'foto';
    } catch {
      const incrustada = imagenIncrustadaMasGrande(entrada.html);
      if (!incrustada) throw new Error('No se pudo convertir el HTML en imagen y no trae ninguna imagen adentro. Subí la placa como imagen.');
      canvas = await canvasDeImagen(incrustada);
      origen = 'incrustada';
    }
  }
  // Primero el fondo blanco: si la placa tiene bordes o un margen transparente abajo, el color de la franja del botón
  // saldría negro (el pixel transparente se lee como 0,0,0).
  const conFondo = sobreBlanco(canvas);
  const final = textoBoton.trim() ? conBotonDebajo(conFondo, textoBoton.trim()) : conFondo;
  const archivo = await aJpegDeHasta1Mb(final);
  return { archivo, origen, vistaPrevia: URL.createObjectURL(archivo) };
};
