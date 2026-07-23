// PreviewPlantillaModal.tsx

import { FaTimes } from "react-icons/fa";
import './PreviewPlantillaModal.css';

interface PreviewPlantillaModalProps {
  titulo: string;
  subtitulo: string;
  html: string;
  onCerrar: () => void;
}

const PreviewPlantillaModal = ({ titulo, subtitulo, html, onCerrar }: PreviewPlantillaModalProps) => {
  return (
    <div className="preview-plantilla-overlay" onClick={onCerrar}>
      <div className="preview-plantilla-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-plantilla-header">
          <div>
            <h3 className="preview-plantilla-title">{titulo}</h3>
            <p className="preview-plantilla-subtitle">{subtitulo}</p>
          </div>
          <button onClick={onCerrar} className="preview-plantilla-close">
            <FaTimes />
          </button>
        </div>
        <div className="preview-plantilla-body">
          <iframe
            title={titulo}
            srcDoc={html}
            className="preview-plantilla-iframe"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPlantillaModal;