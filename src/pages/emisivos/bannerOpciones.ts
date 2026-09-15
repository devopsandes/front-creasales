// bannerOpciones.ts — opciones y textos de la pestaña Banner. Las reglas son las mismas que valida
// emisivos (docs/banners.md); acá se chequean antes de mandar para avisar rápido.

import type { Banner, PlantillaBanner, SegmentacionBanner } from './banner.api';

/** Filtros del listado (pedido de Nico 14/09): ver qué banners le salen a una provincia, un plan o una edad. */
export interface FiltroBanners {
  provincia: string;
  plan: string;
  edad: string;
}

export const FILTRO_VACIO: FiltroBanners = { provincia: '', plan: '', edad: '' };

export const hayFiltro = (filtro: FiltroBanners): boolean =>
  Boolean(filtro.provincia || filtro.plan || filtro.edad.trim());

/**
 * true si a un afiliado con ese filtro le saldría el banner, con la misma lógica que la app: un criterio vacío
 * en el banner es "para todos", así que los banners para todos aparecen en cualquier filtro.
 */
export const bannerAplicaA = (banner: Banner, filtro: FiltroBanners): boolean => {
  const segmentacion = banner.segmentacion;
  if (!segmentacion) return true;
  const provincias = segmentacion.provincias ?? [];
  const planes = segmentacion.planes ?? [];
  if (filtro.provincia && provincias.length > 0 && !provincias.includes(filtro.provincia)) return false;
  if (filtro.plan && planes.length > 0 && !planes.includes(filtro.plan)) return false;
  const edad = filtro.edad.trim() === '' ? null : Number(filtro.edad);
  if (edad !== null && Number.isFinite(edad)) {
    if (segmentacion.edadMin !== null && edad < segmentacion.edadMin) return false;
    if (segmentacion.edadMax !== null && edad > segmentacion.edadMax) return false;
  }
  return true;
};

/** Diseños que dibuja la app si el banner no tiene imagen (mismos colores que el Home de la app). */
export const PLANTILLAS: { valor: PlantillaBanner; etiqueta: string }[] = [
  { valor: 'azul', etiqueta: 'Azul' },
  { valor: 'calida', etiqueta: 'Cálida' },
  { valor: 'clara', etiqueta: 'Clara' },
];

export const nombrePlantilla = (plantilla: PlantillaBanner): string =>
  PLANTILLAS.find((opcion) => opcion.valor === plantilla)?.etiqueta ?? 'Azul';

/**
 * Pantallas de la app a las que puede llevar un banner (Nico 14/09). Mismas claves que PANTALLAS de emisivos y que
 * services/banners/pantallasBanner.ts de la app.
 */
export const PANTALLAS_APP = [
  { valor: 'gestion', etiqueta: 'Gestión (pestaña)' },
  { valor: 'consulta', etiqueta: 'Orden de consulta' },
  { valor: 'estudios', etiqueta: 'Autorizar estudio' },
  { valor: 'consumos', etiqueta: 'Mis consumos' },
  { valor: 'andesPet', etiqueta: 'Andes Pet (solo a quien puede usarlo)' },
  { valor: 'doctorOnline', etiqueta: 'Doctor Online' },
  { valor: 'formularios', etiqueta: 'Formularios' },
  { valor: 'estadoPagos', etiqueta: 'Estado de mis pagos' },
  { valor: 'pagos', etiqueta: 'Pagos' },
  { valor: 'facturas', etiqueta: 'Facturas' },
  { valor: 'cartilla', etiqueta: 'Cartilla (pestaña)' },
  { valor: 'token', etiqueta: 'Token (pestaña)' },
  { valor: 'credencial', etiqueta: 'Mi credencial' },
  { valor: 'notificaciones', etiqueta: 'Notificaciones' },
  { valor: 'grupoFamiliar', etiqueta: 'Grupo familiar' },
  { valor: 'perfil', etiqueta: 'Perfil (pestaña)' },
  { valor: 'misDatos', etiqueta: 'Mis datos' },
  { valor: 'configuracion', etiqueta: 'Configuración' },
];

export const nombrePantalla = (pantalla: string): string =>
  PANTALLAS_APP.find((opcion) => opcion.valor === pantalla)?.etiqueta ?? pantalla;

/** Familias de plan que entiende la app (junta Titanium Plus C/C y S/C). */
export const FAMILIAS_PLAN = [
  { valor: 'TITANIUM', etiqueta: 'Titanium' },
  { valor: 'TITANIUM PLUS', etiqueta: 'Titanium Plus (C/C y S/C)' },
  { valor: 'BLACK', etiqueta: 'Black' },
  { valor: 'PLATINUM', etiqueta: 'Platinum' },
  { valor: 'GOLD', etiqueta: 'Gold' },
  { valor: 'PMO', etiqueta: 'PMO' },
];

/** Las mismas provincias que "Crear Notificaciones". */
export const PROVINCIAS = [
  { valor: 'MENDOZA', etiqueta: 'Mendoza' },
  { valor: 'SAN JUAN', etiqueta: 'San Juan' },
  { valor: 'CORDOBA', etiqueta: 'Córdoba' },
  { valor: 'SAN LUIS', etiqueta: 'San Luis' },
  { valor: 'LA RIOJA', etiqueta: 'La Rioja' },
];

/** Lo que entra en una línea de la tarjeta en un celu de 360 dp (medido con Montserrat, revisión 14/09). */
export const LARGOS = { etiqueta: 30, titulo: 24, texto: 40, textoBoton: 20 };

const MAX_BYTES_IMAGEN = 1024 * 1024;
const MIMES_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Dominios que la app abre al tocar un banner (DOMINIOS_PERMITIDOS_BANNER de la App de Andes): solo Andes.
 * Revisión 14/09: sin Mercado Pago, para que nadie pueda cargar un banner que cobre a otra cuenta.
 */
const DOMINIOS_BANNER = ['andessalud.com.ar', 'andessalud.ar'];

/**
 * true si la app va a abrir este link. Misma regla que la app (services/urlPermitida.ts) y que emisivos:
 * https, host "limpio" (sin puerto, usuario ni barras raras) y de un dominio de Andes.
 */
export const linkLoAbreLaApp = (link: string): boolean => {
  const partes = (link || '').match(/^https:\/\/([^/?#]+)/i);
  if (!partes) return false;
  const host = partes[1].toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(host)) return false;
  return DOMINIOS_BANNER.some((dominio) => host === dominio || host.endsWith(`.${dominio}`));
};

/**
 * WhatsApp en un banner (Nico 15/09): cualquier número de Argentina (54 + 8 a 11 dígitos) con el link oficial wa.me y
 * mensaje opcional codificado. Misma regla que emisivos (banners.helpers.js) y la app (services/urlPermitida.ts).
 */
const REGEX_WHATSAPP = /^https:\/\/wa\.me\/54\d{8,11}(\?text=[A-Za-z0-9%\-_.!~*'()]*)?$/;

export const esLinkWhatsApp = (link: string): boolean => REGEX_WHATSAPP.test(link || '');

/** El mensaje inicial se limita para que el link codificado no pase los 500 caracteres que acepta emisivos. */
export const LARGO_MENSAJE_WHATSAPP = 120;

/** Arma el link wa.me con el número (se queda solo con los dígitos) y el mensaje opcional. */
export const armarLinkWhatsApp = (numero: string, mensaje: string): string => {
  const digitos = numero.replace(/\D/g, '');
  const texto = mensaje.trim();
  return `https://wa.me/${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
};

/** Lee número y mensaje de un link wa.me guardado (para editar o mostrarlo en el listado). */
export const leerLinkWhatsApp = (link: string): { numero: string; mensaje: string } => {
  const partes = (link || '').match(/^https:\/\/wa\.me\/(\d+)(?:\?text=(.*))?$/);
  if (!partes) return { numero: '', mensaje: '' };
  try {
    return { numero: partes[1], mensaje: partes[2] ? decodeURIComponent(partes[2]) : '' };
  } catch {
    return { numero: partes[1], mensaje: '' };
  }
};

/** Mensaje de error si la imagen no sirve, o null si está bien. */
export const errorDeImagen = (archivo: File): string | null => {
  if (!MIMES_IMAGEN.includes(archivo.type)) return 'La imagen tiene que ser JPG, PNG o WEBP.';
  if (archivo.size > MAX_BYTES_IMAGEN) return 'La imagen puede pesar hasta 1 MB.';
  return null;
};

/** "2026-09-15" → "15/09/2026". */
const fechaLegible = (fecha: string): string => fecha.split('-').reverse().join('/');

/** Hoy en hora local como AAAA-MM-DD (para comparar con las fechas de vigencia). */
const hoyLocal = (): string => {
  const hoy = new Date();
  const dosDigitos = (numero: number) => String(numero).padStart(2, '0');
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
};

/** Texto de la vigencia para el listado, avisando si ya venció o todavía no empezó. */
export const textoVigencia = (desde: string | null, hasta: string | null): string => {
  let texto = 'Sin fechas: se muestra siempre';
  if (desde && hasta) texto = `Del ${fechaLegible(desde)} al ${fechaLegible(hasta)}`;
  else if (desde) texto = `Desde el ${fechaLegible(desde)}`;
  else if (hasta) texto = `Hasta el ${fechaLegible(hasta)}`;

  const hoy = hoyLocal();
  if (hasta && hasta < hoy) return `${texto} (ya venció, no se muestra)`;
  if (desde && desde > hoy) return `${texto} (todavía no empezó)`;
  return texto;
};

/** Resumen de a quién le sale el banner. */
export const resumenSegmentacion = (segmentacion: SegmentacionBanner | null): string => {
  if (!segmentacion) return 'Para todos los afiliados';
  const partes: string[] = [];
  const planes = segmentacion.planes ?? [];
  const provincias = segmentacion.provincias ?? [];
  if (planes.length > 0) partes.push(`Planes: ${planes.join(', ')}`);
  if (provincias.length > 0) partes.push(`Provincias: ${provincias.join(', ')}`);
  if (segmentacion.edadMin !== null || segmentacion.edadMax !== null) {
    partes.push(`Edad: ${segmentacion.edadMin ?? 0} a ${segmentacion.edadMax ?? 'sin tope'}`);
  }
  return partes.length > 0 ? partes.join(' · ') : 'Para todos los afiliados';
};
