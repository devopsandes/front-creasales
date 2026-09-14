// bannerOpciones.ts — opciones y textos de la pestaña Banner. Las reglas son las mismas que valida
// emisivos (docs/banners.md); acá se chequean antes de mandar para avisar rápido.

import type { PlantillaBanner, SegmentacionBanner } from './banner.api';

/** Diseños que dibuja la app si el banner no tiene imagen (mismos colores que el Home de la app). */
export const PLANTILLAS: { valor: PlantillaBanner; etiqueta: string }[] = [
  { valor: 'azul', etiqueta: 'Azul' },
  { valor: 'calida', etiqueta: 'Cálida' },
  { valor: 'clara', etiqueta: 'Clara' },
];

export const nombrePlantilla = (plantilla: PlantillaBanner): string =>
  PLANTILLAS.find((opcion) => opcion.valor === plantilla)?.etiqueta ?? 'Azul';

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
