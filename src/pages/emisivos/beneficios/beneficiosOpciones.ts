// beneficiosOpciones.ts — largos, validaciones y textos de la pestaña Beneficios. Las reglas son las mismas que valida
// emisivos; acá se chequean antes de mandar para avisar rápido.

import type { SegmentacionBanner } from '../banner.api';
import { esLinkWhatsApp, linkLoAbreLaApp } from '../bannerOpciones';
import type { FiltroBanners } from '../bannerOpciones';
import type { Beneficio, DatosFormularioBeneficio, SegmentacionBeneficio } from './beneficios.api';

/** Largos máximos que acepta emisivos. */
export const LARGOS = { titulo: 40, descripcion: 300, direccion: 150, linkUrl: 500 };

export const PRIORIDAD_MIN = 1;
export const PRIORIDAD_MAX = 999;

/** Completa los criterios que faltan para poder usar la segmentación en el formulario y en los resúmenes. */
export const segmentacionCompleta = (segmentacion: SegmentacionBeneficio | null | undefined): SegmentacionBanner => ({
  planes: segmentacion?.planes ?? [],
  provincias: segmentacion?.provincias ?? [],
  edadMin: segmentacion?.edadMin ?? null,
  edadMax: segmentacion?.edadMax ?? null,
});

/**
 * true si a un afiliado con ese filtro le saldría el beneficio, con la misma lógica que los banners: un criterio vacío
 * es "para todos", así que los beneficios para todos aparecen en cualquier filtro.
 */
export const beneficioAplicaA = (beneficio: Beneficio, filtro: FiltroBanners): boolean => {
  const { planes, provincias, edadMin, edadMax } = segmentacionCompleta(beneficio.segmentacion);
  if (filtro.provincia && provincias.length > 0 && !provincias.includes(filtro.provincia)) return false;
  if (filtro.plan && planes.length > 0 && !planes.includes(filtro.plan)) return false;
  const edad = filtro.edad.trim() === '' ? null : Number(filtro.edad);
  if (edad !== null && Number.isFinite(edad)) {
    if (edadMin !== null && edad < edadMin) return false;
    if (edadMax !== null && edad > edadMax) return false;
  }
  return true;
};

/** ¿La app va a abrir este link al tocar "Más info"? Solo links de Andes o WhatsApp (wa.me/54...). */
export const linkLoAbreLaAppBeneficio = (link: string | null | undefined): boolean => {
  const limpio = (link ?? '').trim();
  return limpio !== '' && (linkLoAbreLaApp(limpio) || esLinkWhatsApp(limpio));
};

/** Mensaje de error si el link no sirve, o null si está bien (vacío también está bien: es opcional). */
export const errorDeLink = (link: string): string | null => {
  const limpio = link.trim();
  if (limpio === '') return null;
  // Igual que emisivos: ni espacios ni caracteres de control adentro del link.
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(limpio)) return 'El link no puede tener espacios';
  if (limpio.length > LARGOS.linkUrl) return `El link puede tener hasta ${LARGOS.linkUrl} caracteres.`;
  if (!linkLoAbreLaAppBeneficio(limpio)) {
    return 'El link tiene que ser de andessalud.com.ar o andessalud.ar (con https://), o un WhatsApp de Argentina (https://wa.me/54...). La app no abre otros sitios.';
  }
  return null;
};

/** Pasa el texto de una coordenada a número aceptando la coma decimal. null si no es un número. */
export const parsearCoordenada = (texto: string): number | null => {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '' || !/^-?\d+(\.\d+)?$/.test(limpio)) return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
};

/** Mensaje de error si las coordenadas no sirven, o null si están bien (las dos vacías también: sin ubicación). */
export const errorDeCoordenadas = (lat: string, lng: string): string | null => {
  const hayLat = lat.trim() !== '';
  const hayLng = lng.trim() !== '';
  if (!hayLat && !hayLng) return null;
  if (hayLat !== hayLng) return 'Cargá latitud y longitud juntas, o dejá las dos vacías.';
  const latitud = parsearCoordenada(lat);
  const longitud = parsearCoordenada(lng);
  if (latitud === null || longitud === null) return 'La latitud y la longitud tienen que ser números (ej. -32.8895).';
  if (latitud < -90 || latitud > 90) return 'La latitud tiene que estar entre -90 y 90.';
  if (longitud < -180 || longitud > 180) return 'La longitud tiene que estar entre -180 y 180.';
  return null;
};

/** Las coordenadas como números si están completas y bien; si no, null. */
export const coordenadasValidas = (lat: string, lng: string): { lat: number; lng: number } | null => {
  if (lat.trim() === '' || lng.trim() === '' || errorDeCoordenadas(lat, lng)) return null;
  const latitud = parsearCoordenada(lat);
  const longitud = parsearCoordenada(lng);
  return latitud === null || longitud === null ? null : { lat: latitud, lng: longitud };
};

/** Link para ver el punto en Google Maps. */
export const urlVerEnMaps = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

/** Buscar una dirección en Maps: lo que hace "Cómo llegar" en la app cuando el beneficio no tiene coordenadas (16/10/2026). */
export const urlBuscarEnMaps = (direccion: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion.trim())}`;

/** La app muestra "Cómo llegar" con coordenadas o, si no hay, con la dirección. */
export const tieneComoLlegar = (lat: number | null, lng: number | null, direccion: string | null | undefined): boolean =>
  (lat !== null && lng !== null) || Boolean(direccion?.trim());

/** Mensaje de error si las fechas no cierran, o null si están bien. */
export const errorDeFechas = (desde: string, hasta: string): string | null =>
  desde && hasta && hasta < desde ? 'La fecha "hasta" no puede ser anterior a la fecha "desde".' : null;

/** Mensaje de error si la prioridad no sirve, o null si está bien (vacía también: va al final / no cambia). */
export const errorDePrioridad = (orden: string): string | null => {
  const limpio = orden.trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  if (!Number.isInteger(numero) || numero < PRIORIDAD_MIN || numero > PRIORIDAD_MAX) {
    return `La prioridad tiene que ser un número entero entre ${PRIORIDAD_MIN} y ${PRIORIDAD_MAX}.`;
  }
  return null;
};

/** Mensaje de error si la edad mínima y la máxima no cierran, o null si está bien. */
export const errorDeEdades = (segmentacion: SegmentacionBanner): string | null => {
  const { edadMin, edadMax } = segmentacion;
  // Emisivos solo acepta edades enteras (1.5 es 400).
  if ((edadMin !== null && !Number.isInteger(edadMin)) || (edadMax !== null && !Number.isInteger(edadMax))) {
    return 'La edad tiene que ser un número entero';
  }
  if ((edadMin !== null && (edadMin < 0 || edadMin > 120)) || (edadMax !== null && (edadMax < 0 || edadMax > 120))) {
    return 'Las edades tienen que estar entre 0 y 120.';
  }
  if (edadMin !== null && edadMax !== null && edadMax < edadMin) return 'La edad máxima no puede ser menor que la mínima.';
  return null;
};

/**
 * Primer problema del formulario (el que frena el guardado), o null si se puede guardar.
 * `hayImagen` es la imagen que va a quedar (la nueva o la que ya tenía, si no la quitaron).
 */
export const errorDeBeneficio = (datos: DatosFormularioBeneficio, hayImagen: boolean): string | null => {
  if (!datos.titulo.trim() && !hayImagen) return 'El beneficio necesita un título o una imagen.';
  if (datos.titulo.trim().length > LARGOS.titulo) return `El título puede tener hasta ${LARGOS.titulo} caracteres.`;
  if (datos.descripcion.trim().length > LARGOS.descripcion) {
    return `La descripción puede tener hasta ${LARGOS.descripcion} caracteres.`;
  }
  if (datos.direccion.trim().length > LARGOS.direccion) return `La dirección puede tener hasta ${LARGOS.direccion} caracteres.`;
  return (
    errorDeLink(datos.linkUrl) ||
    errorDeCoordenadas(datos.lat, datos.lng) ||
    errorDeFechas(datos.vigenciaDesde, datos.vigenciaHasta) ||
    errorDePrioridad(datos.orden) ||
    errorDeEdades(datos.segmentacion)
  );
};

/** Texto de la ubicación para el listado. */
export const textoUbicacion = (beneficio: Beneficio): string => {
  if (beneficio.lat !== null && beneficio.lng !== null) return `Ubicación: sí (${beneficio.lat}, ${beneficio.lng})`;
  if (beneficio.direccion?.trim()) return 'Ubicación: por dirección ("Cómo llegar" la busca en Maps; sin distancia)';
  return 'Ubicación: no (sin botón "Cómo llegar")';
};
