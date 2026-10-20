// BeneficioPreview.tsx — cómo se ve la tarjeta del beneficio en la App de Andes.
// Imagen arriba (si hay), título, descripción, dirección y los botones: "Más info" solo si el link lo abre la app,
// "Cómo llegar" solo si el beneficio tiene ubicación.

import { FaMapMarkerAlt } from 'react-icons/fa';

interface BeneficioPreviewProps {
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  direccion: string | null;
  /** El link existe y lo abre la app. */
  masInfo: boolean;
  /** Tiene latitud y longitud. */
  comoLlegar: boolean;
}

const BeneficioPreview = ({ titulo, descripcion, imagenUrl, direccion, masInfo, comoLlegar }: BeneficioPreviewProps) => {
  const tituloLimpio = (titulo ?? '').trim();
  const descripcionLimpia = (descripcion ?? '').trim();
  const direccionLimpia = (direccion ?? '').trim();

  return (
    <div className="beneficio-preview" title="Vista previa en la app">
      {imagenUrl && <img className="beneficio-preview-imagen" src={imagenUrl} alt="Vista previa del beneficio" />}
      <div className="beneficio-preview-cuerpo">
        {(tituloLimpio || !imagenUrl) && (
          <strong className={`beneficio-preview-titulo ${tituloLimpio ? '' : 'beneficio-preview-vacio'}`}>
            {tituloLimpio || 'Título del beneficio'}
          </strong>
        )}
        {descripcionLimpia && <span className="beneficio-preview-descripcion">{descripcionLimpia}</span>}
        {direccionLimpia && (
          <span className="beneficio-preview-direccion">
            <FaMapMarkerAlt aria-hidden="true" /> {direccionLimpia}
          </span>
        )}
        {(masInfo || comoLlegar) && (
          <div className="beneficio-preview-botones">
            {masInfo && <span className="beneficio-preview-boton beneficio-preview-boton-primario">Más info</span>}
            {comoLlegar && <span className="beneficio-preview-boton beneficio-preview-boton-secundario">Cómo llegar</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeneficioPreview;
