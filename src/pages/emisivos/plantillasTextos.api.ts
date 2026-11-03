// plantillasTextos.api.ts — textos editables de Bienvenida y Pre-Alta (Emisivos: routes/plantillasTextos.routes.js).

import { JSON_HEADERS, pedir } from './banner.api';

export interface CampoTexto {
  clave: string;
  etiqueta: string;
  valor: string;
  valorOriginal: string;
  obligatorio: boolean;
  largoMaximo: number;
  unaLinea: boolean;
}

export interface PlantillaTextos {
  id: number;
  nombre: string;
  descripcion: string;
  modificada: boolean;
  campos: CampoTexto[];
}

export type Textos = Record<string, string>;

/** Las plantillas que se editan desde CreaSales; las demás siguen con su copia de plantillasEjemplos.ts. */
export const IDS_EDITABLES = [1, 2, 3, 6, 7];

export const textosDeCampos = (campos: CampoTexto[]): Textos =>
  Object.fromEntries(campos.map((campo) => [campo.clave, campo.valor]));

export const listarTextosPlantillas = async (): Promise<PlantillaTextos[]> =>
  (await pedir<PlantillaTextos[]>('/plantillas/textos')).data ?? [];

export const guardarTextosPlantilla = async (id: number, textos: Textos): Promise<PlantillaTextos> =>
  (await pedir<PlantillaTextos>(`/plantillas/${id}/textos`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify({ textos }),
  })).data as PlantillaTextos;

export const restaurarTextosPlantilla = async (id: number): Promise<PlantillaTextos> =>
  (await pedir<PlantillaTextos>(`/plantillas/${id}/textos`, { method: 'DELETE' })).data as PlantillaTextos;

/** Dibuja los textos sin guardarlos, con datos ficticios. */
export const previewTextosPlantilla = async (id: number, textos: Textos): Promise<{ html: string; asunto: string }> =>
  (await pedir<{ html: string; asunto: string }>(`/plantillas/${id}/preview`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ textos }),
  })).data as { html: string; asunto: string };
