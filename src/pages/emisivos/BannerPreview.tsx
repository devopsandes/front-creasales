// BannerPreview.tsx — cómo se ve el banner en el Home de la App de Andes.
// Copia la tarjeta de la app (PromoBannerCarousel.tsx): 116 px de alto, bordes 18, y las 3 plantillas
// (azul, cálida, clara) con los colores del Home. Con imagen, la app muestra SOLO la imagen.

import type { PlantillaBanner } from './banner.api';
import carita from './carita-andes.png';

interface BannerPreviewProps {
  etiqueta: string | null;
  titulo: string | null;
  texto: string | null;
  imagenUrl: string | null;
  plantilla: PlantillaBanner;
  textoBoton: string | null;
  mostrarCarita: boolean;
  /** La app dibuja el botón solo si el banner tiene link. */
  conLink: boolean;
  /** Tema de la app del afiliado: las plantillas Cálida y Clara cambian de colores en modo oscuro. */
  modo?: 'claro' | 'oscuro';
}

const BannerPreview = ({ etiqueta, titulo, texto, imagenUrl, plantilla, textoBoton, mostrarCarita, conLink, modo = 'claro' }: BannerPreviewProps) => (
  <div className={`banner-preview ${modo === 'oscuro' ? 'banner-preview-oscuro' : ''}`} title="Vista previa en la app">
    {imagenUrl ? (
      <img className="banner-preview-imagen" src={imagenUrl} alt="Vista previa del banner" />
    ) : (
      <div className={`banner-preview-tarjeta banner-plantilla-${plantilla}`}>
        <div className="banner-preview-deco" />
        <div className="banner-preview-txt">
          {etiqueta && <span className="banner-preview-etiqueta">{etiqueta}</span>}
          <strong className={`banner-preview-titulo ${titulo ? '' : 'banner-preview-vacio'}`}>
            {titulo || 'Título del banner'}
          </strong>
          {texto && <span className="banner-preview-texto">{texto}</span>}
          {textoBoton && conLink && <span className="banner-preview-boton">{textoBoton}</span>}
        </div>
        {mostrarCarita && <img className="banner-preview-carita" src={carita} alt="" />}
      </div>
    )}
  </div>
);

export default BannerPreview;
