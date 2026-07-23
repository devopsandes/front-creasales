// Plantillas.tsx

import { useState } from "react";
import { FaEye, FaTimes, FaFileAlt } from "react-icons/fa";
import { PLANTILLAS_EJEMPLO, PlantillaEjemplo } from "./plantillasEjemplos";
import './Plantillas.css';

const Plantillas = () => {
  const [seleccionada, setSeleccionada] = useState<PlantillaEjemplo | null>(null);

  return (
    <div className="plantillas-wrapper">
      <div className="plantillas-header">
        <h2 className="plantillas-header-title">Plantillas de Email</h2>
        <p className="plantillas-header-description">
          Previsualizá cómo le llega cada plantilla al afiliado, con datos de ejemplo ficticios.
        </p>
      </div>

      <div className="plantillas-container">
        <div className="plantillas-grid">
          {PLANTILLAS_EJEMPLO.map((p) => (
            <div key={p.id} className="plantillas-card">
              <div className="plantillas-card-icon">
                <FaFileAlt />
              </div>
              <div className="plantillas-card-body">
                <span className="plantillas-card-id">ID {p.id}</span>
                <h3 className="plantillas-card-nombre">{p.nombre}</h3>
                <p className="plantillas-card-desc">{p.descripcion}</p>
              </div>
              <button
                className="plantillas-card-btn"
                onClick={() => setSeleccionada(p)}
              >
                <FaEye /> Ver plantilla
              </button>
            </div>
          ))}
        </div>
      </div>

      {seleccionada && (
        <div className="plantillas-modal-overlay" onClick={() => setSeleccionada(null)}>
          <div className="plantillas-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plantillas-preview-header">
              <div>
                <h3 className="plantillas-preview-title">{seleccionada.nombre}</h3>
                <p className="plantillas-preview-subtitle">{seleccionada.descripcion} · Vista previa con datos de ejemplo</p>
              </div>
              <button onClick={() => setSeleccionada(null)} className="plantillas-preview-close">
                <FaTimes />
              </button>
            </div>
            <div className="plantillas-preview-body">
              <iframe
                title={seleccionada.nombre}
                srcDoc={seleccionada.html}
                className="plantillas-preview-iframe"
                sandbox=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plantillas;