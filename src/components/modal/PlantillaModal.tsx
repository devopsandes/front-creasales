import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, FileText } from 'lucide-react';
import { switchModalPlantilla } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import './plantilla-modal.css';

const PlantillaModal = () => {
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const modalPlantilla = useSelector((state: RootState) => state.action.modalPlantilla);

  // Resetear selección cuando se cierra el modal
  useEffect(() => {
    if (!modalPlantilla) {
      setSelectedPlantilla('');
      setIsLoading(false);
    }
  }, [modalPlantilla]);

  const handleEnviar = async () => {
    if (!selectedPlantilla) return;
    
    setIsLoading(true);
    
    try {
      // Aquí irá la lógica para enviar la plantilla
      // Por ahora solo cerramos el modal
      setTimeout(() => {
        dispatch(switchModalPlantilla());
        setSelectedPlantilla('');
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error al enviar plantilla:', error);
      setIsLoading(false);
    }
  };

  const handleCancelar = () => {
    dispatch(switchModalPlantilla());
    setSelectedPlantilla('');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancelar();
    }
  };

  const getPlantillaText = (plantillaId: string): string => {
    switch (plantillaId) {
      case 'inicio':
        return "¡Hola! Mi nombre es María y tengo novedades de tu gestión iniciada. Por favor cuando respondas este mensaje podemos continuar, muchas gracias.";
      case 'plantilla2':
        return '';
      case 'plantilla3':
        return '';
      case 'plantilla4':
        return '';
      default:
        return '';
    }
  };

  if (!modalPlantilla) return null;

  return (
    <div className="plantilla-modal-overlay" onClick={handleOverlayClick}>
      <div className="plantilla-modal-container">
        <button className="plantilla-modal-close" onClick={handleCancelar}>
          <X size={20} />
        </button>
        
        <div className="plantilla-modal-icon">
          <FileText size={32} />
        </div>

        <h2 className="plantilla-modal-title">Enviar Plantilla</h2>
        <p className="plantilla-modal-subtitle">Selecciona la plantilla que deseas enviar a este chat</p>

        <div className="plantilla-modal-select-container">
          <select
            value={selectedPlantilla}
            onChange={(e) => setSelectedPlantilla(e.target.value)}
            className="plantilla-modal-select"
          >
            <option value="">Seleccionar Plantilla</option>
            <option value="inicio">Retomar Conversación</option>
            <option value="plantilla2">Plantilla 2</option>
            <option value="plantilla3">Plantilla 3</option>
            <option value="plantilla4">Plantilla 4</option>
          </select>
        </div>

        <p className="plantilla-modal-description-title">Descripcion del Mensaje</p>
        
        {selectedPlantilla && (
          <div className="plantilla-modal-description-box">
            <p className="plantilla-modal-description-text">
              {getPlantillaText(selectedPlantilla)}
            </p>
          </div>
        )}

        <div className="plantilla-modal-actions">
          <button 
            className="plantilla-modal-button plantilla-modal-cancel"
            onClick={handleCancelar}
          >
            Cancelar
          </button>
          <button 
            className="plantilla-modal-button plantilla-modal-confirm"
            onClick={handleEnviar}
            disabled={!selectedPlantilla || isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantillaModal;

