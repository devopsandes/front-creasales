import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { X, FileText } from 'lucide-react';
import { switchModalPlantilla } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { enviarPlantilla } from '../../services/plantillas/plantillas.services';
import { getMeta } from '../../services/meta/meta.services';
import { toast } from 'react-toastify';
import './plantilla-modal.css';

const PlantillaModal = () => {
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaConfig, setMetaConfig] = useState<{ graph_api_token: string; id_phone_number: number } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  
  const dispatch = useDispatch();
  const modalPlantilla = useSelector((state: RootState) => state.action.modalPlantilla);
  const chats = useSelector((state: RootState) => state.action.chats);
  const dataUser = useSelector((state: RootState) => state.action.dataUser);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const { id: chatId } = useParams<{ id: string }>();
  const token = localStorage.getItem('token') || '';

  // Obtener chat actual
  const currentChat = chats.find(chat => chat.id === chatId);
  const numeroTelefono = currentChat?.cliente?.telefono || '';
  const nombreAfiliado = dataUser?.apellnombAfilado || currentChat?.cliente?.nombre || 'Cliente';
  const nombreOperador = user?.name || 'Operador';

  // Obtener configuración de Meta al abrir el modal
  useEffect(() => {
    if (modalPlantilla && token) {
      const fetchMetaConfig = async () => {
        setLoadingMeta(true);
        setError(null);
        try {
          const response = await getMeta(token);
          
          //  Verificar que la respuesta tenga los datos
          if (response.graph_api_token && response.id_phone_number && 
              response.graph_api_token.trim() !== '' && response.id_phone_number > 0) {
            setMetaConfig({
              graph_api_token: response.graph_api_token,
              id_phone_number: response.id_phone_number
            });
            setError(null);
          } else {
            // Si no hay datos, verificar el statusCode para dar un mensaje más específico
            if (response.statusCode === 404) {
              setError('No se encontró la configuración de Meta. Por favor, vaya a Configuración → Meta y complete los datos requeridos (Access Token e ID Phone Number).');
            } else {
              setError('La configuración de Meta está incompleta. Por favor, vaya a Configuración → Meta y complete los datos requeridos.');
            }
          }
        } catch (error: any) {
          console.error('Error obteniendo configuración de Meta:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Error al obtener la configuración de Meta';
          setError(errorMsg);
        } finally {
          setLoadingMeta(false);
        }
      };
      fetchMetaConfig();
    }
  }, [modalPlantilla, token]);

  // Resetear selección cuando se cierra el modal
  useEffect(() => {
    if (!modalPlantilla) {
      setSelectedPlantilla('');
      setIsLoading(false);
      setError(null);
    }
  }, [modalPlantilla]);

  // Mapeo de plantillas a opciones del backend
  const getOpcionPlantilla = (plantillaId: string): number | null => {
    switch (plantillaId) {
      case 'inicio':
        return 9; // Retomar Conversación
      case 'plantilla2':
        return null; // Por ahora no implementado
      case 'plantilla3':
        return null;
      case 'plantilla4':
        return null;
      default:
        return null;
    }
  };

  const handleEnviar = async () => {
    if (!selectedPlantilla) return;
    
    const opcion = getOpcionPlantilla(selectedPlantilla);
    if (opcion === null) {
      setError('Esta plantilla aún no está implementada');
      return;
    }

    if (!metaConfig) {
      setError('No se encontró la configuración de Meta');
      return;
    }

    if (!numeroTelefono) {
      setError('No se pudo obtener el número de teléfono del chat');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Preparar datos con conversión a número
      const dataEnvio = {
        opcion: Number(opcion), //  Asegurar número
        graph_api_token: metaConfig.graph_api_token,
        id_phone_number: Number(metaConfig.id_phone_number), // Convertir a número
        numero: numeroTelefono,
        afiliado: nombreAfiliado,
        operador: nombreOperador
      };

      const response = await enviarPlantilla(token, dataEnvio);

      // Verificar éxito: statusCode 200, 201 o si no hay statusCode pero tampoco hay error
      if (response.statusCode === 200 || response.statusCode === 201 || 
          (!response.statusCode && !response.message && !response.error)) {
        toast.success('Plantilla enviada correctamente');
        dispatch(switchModalPlantilla());
        setSelectedPlantilla('');
      } else {
        const errorMsg = Array.isArray(response.message) 
          ? response.message.join(', ') 
          : (response.message || response.error || 'Error al enviar la plantilla');
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('Error al enviar plantilla:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al enviar la plantilla';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar = () => {
    dispatch(switchModalPlantilla());
    setSelectedPlantilla('');
    setError(null);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancelar();
    }
  };

  const getPlantillaText = (plantillaId: string): string => {
    switch (plantillaId) {
      case 'inicio':
        return `¡Hola ${nombreAfiliado}! Mi nombre es ${nombreOperador} y tengo novedades de tu gestión iniciada. Por favor cuando respondas este mensaje podemos continuar, muchas gracias.`;
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

        {error && (
          <div className="plantilla-modal-error">
            {error}
          </div>
        )}

        <div className="plantilla-modal-actions">
          <button 
            className="plantilla-modal-button plantilla-modal-cancel"
            onClick={handleCancelar}
            disabled={isLoading || loadingMeta}
          >
            Cancelar
          </button>
          <button 
            className="plantilla-modal-button plantilla-modal-confirm"
            onClick={handleEnviar}
            disabled={!selectedPlantilla || isLoading || loadingMeta || !metaConfig}
          >
            {isLoading ? 'Enviando...' : loadingMeta ? 'Cargando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantillaModal;

