// banner.api.ts — llamadas a emisivos para la pestaña Banner (banners del Home de la App de Andes).
// Contrato del backend: docs/banners.md en el repo de Emisivos.

export interface SegmentacionBanner {
  planes: string[];
  provincias: string[];
  edadMin: number | null;
  edadMax: number | null;
}

/** Diseños que dibuja la app cuando el banner no tiene imagen. */
export type PlantillaBanner = 'azul' | 'calida' | 'clara';

/** Banner tal como lo devuelve GET /banners (sin los bytes de la imagen). */
export interface Banner {
  id: number;
  etiqueta: string | null;
  titulo: string | null;
  texto: string | null;
  linkUrl: string | null;
  orden: number;
  activo: boolean;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  segmentacion: SegmentacionBanner | null;
  plantilla: PlantillaBanner;
  textoBoton: string | null;
  mostrarCarita: boolean;
  tieneImagen: boolean;
  imagenUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lo que carga el formulario. Las fechas van como AAAA-MM-DD (input type="date"). */
export interface DatosFormularioBanner {
  etiqueta: string;
  titulo: string;
  texto: string;
  linkUrl: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  segmentacion: SegmentacionBanner;
  plantilla: PlantillaBanner;
  textoBoton: string;
  mostrarCarita: boolean;
  /** Prioridad en el carrusel (1 = primero). Vacía: al crear va al final, al editar no cambia. */
  orden: string;
  imagen: File | null;
  quitarImagen: boolean;
}

interface RespuestaEmisivos<T> {
  status: 'success' | 'error';
  data?: T;
  meta?: { message?: string; total?: number };
}

/** Emisivos de producción; para probar en local se puede apuntar a otro con VITE_EMISIVOS_URL. */
export const URL_EMISIVOS: string =
  (import.meta.env.VITE_EMISIVOS_URL as string | undefined)?.replace(/\/+$/, '') || 'https://emisivos.andessalud.ar';

/** fetch a emisivos con el token de la sesión, como las demás pestañas. Lanza Error con el mensaje del backend. */
async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<RespuestaEmisivos<T>> {
  const token = localStorage.getItem('token') || '';
  const response = await fetch(`${URL_EMISIVOS}${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });

  let data: RespuestaEmisivos<T>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Error ${response.status}: emisivos no respondió bien`);
  }
  if (!response.ok || data.status !== 'success') {
    throw new Error(data.meta?.message || `Error ${response.status}`);
  }
  return data;
}

/** El alta y la edición van en multipart porque llevan la imagen como archivo. */
const armarFormData = (datos: DatosFormularioBanner): FormData => {
  const formData = new FormData();
  formData.append('etiqueta', datos.etiqueta);
  formData.append('titulo', datos.titulo);
  formData.append('texto', datos.texto);
  formData.append('linkUrl', datos.linkUrl);
  formData.append('vigenciaDesde', datos.vigenciaDesde);
  formData.append('vigenciaHasta', datos.vigenciaHasta);
  formData.append('segmentacion', JSON.stringify(datos.segmentacion));
  formData.append('plantilla', datos.plantilla);
  formData.append('textoBoton', datos.textoBoton);
  formData.append('mostrarCarita', String(datos.mostrarCarita));
  formData.append('orden', datos.orden.trim());
  if (datos.imagen) formData.append('imagen', datos.imagen);
  if (datos.quitarImagen) formData.append('quitarImagen', 'true');
  return formData;
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const listarBanners = async (): Promise<Banner[]> => (await pedir<Banner[]>('/banners')).data ?? [];

export const crearBanner = (datos: DatosFormularioBanner) =>
  pedir<Banner>('/banners', { method: 'POST', body: armarFormData(datos) });

export const editarBanner = (id: number, datos: DatosFormularioBanner) =>
  pedir<Banner>(`/banners/${id}`, { method: 'PUT', body: armarFormData(datos) });

export const cambiarActivoBanner = (id: number, activo: boolean) =>
  pedir<Banner>(`/banners/${id}/activo`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ activo }) });

export const reordenarBanners = (ids: number[]) =>
  pedir<never>('/banners/orden', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ ids }) });

export const borrarBanner = (id: number) => pedir<never>(`/banners/${id}`, { method: 'DELETE' });
