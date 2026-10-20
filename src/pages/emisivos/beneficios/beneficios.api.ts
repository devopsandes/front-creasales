// beneficios.api.ts — llamadas a emisivos para la pestaña Beneficios (tarjetas de beneficios de la App de Andes).
// Contrato del backend: rutas /beneficios de emisivos. Reutiliza el fetch de la pestaña Banner.

import { JSON_HEADERS, pedir } from '../banner.api';
import type { SegmentacionBanner } from '../banner.api';

/** A quién le sale el beneficio. Todo es opcional: lo que falta es "para todos". */
export interface SegmentacionBeneficio {
  planes?: string[];
  provincias?: string[];
  edadMin?: number | null;
  edadMax?: number | null;
}

/** Beneficio tal como lo devuelve GET /beneficios (sin los bytes de la imagen). */
export interface Beneficio {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  linkUrl: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  /** Prioridad (1 = primero). */
  orden: number;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  segmentacion: SegmentacionBeneficio | null;
  activo: boolean;
  tieneImagen: boolean;
  /** Cuántos DNIs tiene la lista del beneficio (0 = no filtra por DNI). La lista en sí nunca sale de emisivos. */
  cantidadDnis: number;
  createdAt: string;
  updatedAt: string;
}

/** Lo que carga el formulario. Las fechas van como AAAA-MM-DD; lat y lng como texto (se acepta la coma decimal). */
export interface DatosFormularioBeneficio {
  titulo: string;
  descripcion: string;
  linkUrl: string;
  direccion: string;
  lat: string;
  lng: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  segmentacion: SegmentacionBanner;
  /** Prioridad. Vacía: al crear va al final, al editar no cambia. */
  orden: string;
  imagen: File | null;
  quitarImagen: boolean;
  /** Excel, CSV o TXT con los DNIs a los que les sale el beneficio. null = no se cambia la lista. */
  archivoDnis: File | null;
  /** DNIs pegados a mano en vez del archivo. '' = no se cambia la lista. Archivo y texto juntos: 400. */
  dnisTexto: string;
  quitarDnis: boolean;
}

/** Tope de beneficios que acepta emisivos (409 al pasarlo). */
export const TOPE_BENEFICIOS = 60;

/** Segmentación como la espera emisivos: solo lo que filtra (lo vacío es "para todos"). */
const segmentacionParaEnviar = (segmentacion: SegmentacionBanner): SegmentacionBeneficio => {
  const resultado: SegmentacionBeneficio = {};
  if (segmentacion.planes.length > 0) resultado.planes = segmentacion.planes;
  if (segmentacion.provincias.length > 0) resultado.provincias = segmentacion.provincias;
  if (segmentacion.edadMin !== null) resultado.edadMin = segmentacion.edadMin;
  if (segmentacion.edadMax !== null) resultado.edadMax = segmentacion.edadMax;
  return resultado;
};

/** Coordenada con punto decimal (el usuario puede haberla escrito con coma). */
const coordenadaParaEnviar = (texto: string): string => texto.trim().replace(',', '.');

/** El alta y la edición van en multipart porque llevan la imagen y la lista de DNIs como archivos. */
const armarFormData = (datos: DatosFormularioBeneficio): FormData => {
  const formData = new FormData();
  formData.append('titulo', datos.titulo.trim());
  formData.append('descripcion', datos.descripcion.trim());
  formData.append('linkUrl', datos.linkUrl.trim());
  formData.append('direccion', datos.direccion.trim());
  formData.append('lat', coordenadaParaEnviar(datos.lat));
  formData.append('lng', coordenadaParaEnviar(datos.lng));
  formData.append('vigenciaDesde', datos.vigenciaDesde);
  formData.append('vigenciaHasta', datos.vigenciaHasta);
  formData.append('segmentacion', JSON.stringify(segmentacionParaEnviar(datos.segmentacion)));
  formData.append('orden', datos.orden.trim());
  if (datos.imagen) formData.append('imagen', datos.imagen);
  if (datos.quitarImagen) formData.append('quitarImagen', 'true');
  if (datos.archivoDnis) formData.append('dnis', datos.archivoDnis);
  else if (datos.dnisTexto.trim()) formData.append('dnisTexto', datos.dnisTexto);
  if (datos.quitarDnis) formData.append('quitarDnis', 'true');
  return formData;
};

export const listarBeneficios = async (): Promise<Beneficio[]> => (await pedir<Beneficio[]>('/beneficios')).data ?? [];

export const crearBeneficio = (datos: DatosFormularioBeneficio) =>
  pedir<Beneficio>('/beneficios', { method: 'POST', body: armarFormData(datos) });

export const editarBeneficio = (id: number, datos: DatosFormularioBeneficio) =>
  pedir<Beneficio>(`/beneficios/${id}`, { method: 'PUT', body: armarFormData(datos) });

export const cambiarActivoBeneficio = (id: number, activo: boolean) =>
  pedir<Beneficio>(`/beneficios/${id}/activo`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ activo }) });

export const borrarBeneficio = (id: number) => pedir<never>(`/beneficios/${id}`, { method: 'DELETE' });

/**
 * Saca las coordenadas de un link de Google Maps (emisivos lo sigue del lado del servidor).
 * Se manda el texto tal cual (recortado en los extremos): si la operadora pegó un mensaje con el link adentro,
 * emisivos extrae el primer https://... y rechaza lo que pase de 2000 caracteres.
 * Lanza Error con el mensaje del backend: 400 si no es un link de Google Maps, 422 si no se pudo leer.
 */
/** lat/lng en null + direccion: el link no traía coordenadas, solo el lugar (link compartido desde el celu, 16/10/2026). */
export interface UbicacionDeLink {
  lat: number | null;
  lng: number | null;
  direccion: string | null;
}

export const ubicacionDesdeLink = async (url: string): Promise<UbicacionDeLink> => {
  const respuesta = await pedir<UbicacionDeLink>('/beneficios/ubicacion-desde-link', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ url: url.trim() }),
  });
  if (!respuesta.data) throw new Error('No se pudo leer la ubicación de ese link.');
  return respuesta.data;
};
