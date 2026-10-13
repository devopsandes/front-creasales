// CampaniaPasoContenido.tsx — paso 2 del asistente: el contenido de cada canal elegido (push, mail y banner).

import { FaBell, FaEnvelope, FaImage } from 'react-icons/fa';
import CampaniaContenidoBanner from './CampaniaContenidoBanner';
import CampaniaContenidoMail from './CampaniaContenidoMail';
import type { CambioImagen } from './CampaniaContenidoMail';
import CampaniaContenidoPush from './CampaniaContenidoPush';
import type { Campania, DatosFormularioCampania } from './campanias.api';

interface PasoContenidoProps {
  datos: DatosFormularioCampania;
  onCambiar: (cambio: (prev: DatosFormularioCampania) => DatosFormularioCampania) => void;
  remitentes: string[];
  campania: Campania | null;
  imagen: CambioImagen;
  onImagen: (cambio: CambioImagen) => void;
  onError: (mensaje: string) => void;
  onVerPreview: () => void;
  verificando: boolean;
  deshabilitado: boolean;
}

const CampaniaPasoContenido = ({
  datos,
  onCambiar,
  remitentes,
  campania,
  imagen,
  onImagen,
  onError,
  onVerPreview,
  verificando,
  deshabilitado,
}: PasoContenidoProps) => {
  const { canales } = datos;

  return (
    <div className="campanias-paso">
      {canales.push && (
        <section className="campanias-seccion">
          <h3 className="campanias-seccion-titulo">
            <FaBell aria-hidden="true" /> Push
          </h3>
          <CampaniaContenidoPush
            push={datos.push}
            deshabilitado={deshabilitado}
            onCambiar={(cambio) => onCambiar((prev) => ({ ...prev, push: { ...prev.push, ...cambio } }))}
          />
        </section>
      )}

      {canales.mail && (
        <section className="campanias-seccion">
          <h3 className="campanias-seccion-titulo">
            <FaEnvelope aria-hidden="true" /> Mail
          </h3>
          <CampaniaContenidoMail
            mail={datos.mail}
            remitentes={remitentes}
            campania={campania}
            imagen={imagen}
            onImagen={onImagen}
            onError={onError}
            onVerPreview={onVerPreview}
            verificando={verificando}
            deshabilitado={deshabilitado}
            onCambiar={(cambio) => onCambiar((prev) => ({ ...prev, mail: { ...prev.mail, ...cambio } }))}
          />
        </section>
      )}

      {canales.banner && (
        <section className="campanias-seccion">
          <h3 className="campanias-seccion-titulo">
            <FaImage aria-hidden="true" /> Banner
          </h3>
          <CampaniaContenidoBanner
            banner={datos.banner}
            deshabilitado={deshabilitado}
            onCambiar={(cambio) => onCambiar((prev) => ({ ...prev, banner: { ...prev.banner, ...cambio } }))}
          />
        </section>
      )}

      {!canales.push && !canales.mail && !canales.banner && (
        <p className="campanias-aviso">Volvé al paso 1 y elegí al menos un canal.</p>
      )}
    </div>
  );
};

export default CampaniaPasoContenido;
