// CampaniaPreviewMail.tsx — el mail armado por emisivos (POST /campanias/:id/preview) en un iframe, a ancho de celular o de pantalla.
// El iframe va con sandbox vacío: el HTML se muestra pero no corre scripts ni toca la página.

import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface PreviewMailProps {
  html: string;
  onCerrar: () => void;
}

const ANCHOS = [
  { valor: 375, etiqueta: 'Celular (375 px)' },
  { valor: 600, etiqueta: 'Pantalla (600 px)' },
];

const CampaniaPreviewMail = ({ html, onCerrar }: PreviewMailProps) => {
  const [ancho, setAncho] = useState(375);

  return (
    <div className="campanias-modal-overlay campanias-modal-overlay-arriba">
      <div className="campanias-modal campanias-modal-medio" role="dialog" aria-modal="true" aria-labelledby="campanias-preview-titulo">
        <div className="campanias-modal-header">
          <h2 id="campanias-preview-titulo">Cómo queda el mail</h2>
          <button type="button" className="campanias-icon-btn" onClick={onCerrar} aria-label="Cerrar la vista previa">
            <FaTimes />
          </button>
        </div>
        <div className="campanias-form">
          <div className="campanias-modo" role="group" aria-label="Ancho de la vista previa">
            {ANCHOS.map((opcion) => (
              <button
                type="button"
                key={opcion.valor}
                className={`campanias-modo-opcion ${ancho === opcion.valor ? 'campanias-modo-opcion-activa' : ''}`}
                onClick={() => setAncho(opcion.valor)}
                aria-pressed={ancho === opcion.valor}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
          <p className="campanias-ayuda">
            Se ve con "Juan" de nombre. La imagen puede tardar en aparecer. En los mails reales, además, van el pie con la baja y el
            seguimiento.
          </p>
          <div className="campanias-iframe-marco">
            <iframe className="campanias-iframe" title="Vista previa del mail" sandbox="" srcDoc={html} style={{ width: `${ancho}px` }} />
          </div>
          <div className="campanias-modal-acciones">
            <button type="button" className="campanias-btn campanias-btn-secundario" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaniaPreviewMail;
