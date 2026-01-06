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
  const [nroTicket, setNroTicket] = useState<string>('');
  
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
      setNroTicket('');
    }
  }, [modalPlantilla]);

  // Mapeo de plantillas a opciones del backend
  const getOpcionPlantilla = (plantillaId: string): number | null => {
    switch (plantillaId) {
      case 'inicio':
        return 9; // Retomar Conversación
      case 'novedades':
        return 5; // Novedades
      case 'beneficio':
        return 6; // Beneficio
      case 'prevencion-estafas':
        return 12; // Prevención estafas
      case 'novedades-tramite':
        return 10; // Novedades trámite
      default:
        return null;
    }
  };

  // Verificar si una plantilla es simple (solo requiere número, sin parámetros)
  const isPlantillaSimple = (plantillaId: string): boolean => {
    return plantillaId === 'novedades' || plantillaId === 'beneficio' || plantillaId === 'prevencion-estafas';
  };

  // Verificar si una plantilla requiere nroTicket
  const requiereNroTicket = (plantillaId: string): boolean => {
    return plantillaId === 'novedades-tramite';
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

    // Validar nroTicket si es requerido
    if (requiereNroTicket(selectedPlantilla) && !nroTicket.trim()) {
      setError('Por favor, ingrese el número de ticket');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Preparar datos con conversión a número
      // Para plantillas simples (5, 6, 12) solo se requiere el número
      const isSimple = isPlantillaSimple(selectedPlantilla);
      const dataEnvio: any = {
        opcion: Number(opcion), //  Asegurar número
        graph_api_token: metaConfig.graph_api_token,
        id_phone_number: Number(metaConfig.id_phone_number), // Convertir a número
        numero: numeroTelefono,
        // Para plantillas simples, enviar valores vacíos ya que no se requieren
        afiliado: isSimple ? '' : nombreAfiliado,
        operador: isSimple ? '' : nombreOperador
      };

      // Agregar nroTicket si es requerido
      if (requiereNroTicket(selectedPlantilla)) {
        dataEnvio.nroTicket = nroTicket.trim();
      }

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
      case 'novedades':
        return `¡NOVEDADES!

Queremos contarte que en Andes Salud seguimos comprometidos con vos, trabajando constantemente para mejorar tu experiencia y garantizarte un servicio de calidad.

Te informamos que, a partir del 01/07/2025, renovamos nuestro servicio de Urgencias y Emergencias, el cual será brindado por EMERGENCIAS S.A.

Este nuevo prestador se incorpora para ofrecerte una atención eficiente y de calidad, asegurando la asistencia médica adecuada a tus necesidades.

Es muy importante que agendes que el único teléfono para solicitar el servicio es:
📞 Línea de emergencias: 0810-666-1449

Seguimos avanzando para estar más cerca tuyo, cuando más lo necesitás.`;
      case 'beneficio':
        return `🎉 ¡Renovamos un nuevo beneficio pensado para vos!
A partir del 1° de julio renovamos nuestro servicio de medicina Online, vas a poder acceder desde la APP de ANDES SALUD a DR. ONLINE,  nuestro servicio de atención médica por videollamada, disponible las 24 horas, los 365 días de año, estés donde estés.
🩺 Consultá con profesionales de la salud desde tu celular , las 24 horas.
📲 Rápido, seguro y sin moverte de casa.
💬 Demanda espontánea.
👩‍⚕️ Múltiples especialidades médicas disponibles.
📄 Recetas médicas, órdenes de estudios y constancias de atención en formato digital.
Con DR, ONLINE, damos un paso más para estar cerca tuyo cuando más lo necesitas.
👉 Por ahora solo en Android… ¡pero iOS llega muy pronto!
Más conectados con tu bienestar.`;
      case 'prevencion-estafas':
        return `Hola, ¿cómo estás?

Recordá que ANDES SALUD nunca solicita datos bancarios por teléfono, correo electrónico ni mensajes.
Si recibís un llamado o mensaje donde te pidan información como tu número de cuenta, tarjeta o claves, no los compartas y comunicate directamente con nuestros canales oficiales.

👉 Teléfono oficial: +54 9 261 330-0622
👉 Sitio web oficial: https://andessalud.com.ar/
👉 Dominios oficiales: andessalud.com.ar y andessalud.ar

Cuidar tus datos es cuidar tu salud. Muchas gracias.`;
      case 'novedades-tramite':
        // Usar nroTicket si está disponible, sino mostrar placeholder
        const ticketNum = nroTicket.trim() || '1234';
        return `¡Hola ${nombreAfiliado}! Soy ${nombreOperador}. Necesito que me brindes información extra sobre tu trámite número ${ticketNum}. Aguardamos respuesta. ¡Muchas gracias!`;
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
            <option value="novedades">Novedades</option>
            <option value="beneficio">Beneficio</option>
            <option value="prevencion-estafas">Prevención Estafas</option>
            <option value="novedades-tramite">Novedades Trámite</option>
          </select>
        </div>

        {/* Input para nroTicket cuando se selecciona la plantilla de trámite */}
        {requiereNroTicket(selectedPlantilla) && (
          <div className="plantilla-modal-select-container" style={{ marginTop: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              Número de Ticket
            </label>
            <input
              type="text"
              value={nroTicket}
              onChange={(e) => setNroTicket(e.target.value)}
              placeholder="Ingrese el número de ticket"
              className="plantilla-modal-select"
              style={{ 
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        )}

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
            disabled={
              !selectedPlantilla || 
              isLoading || 
              loadingMeta || 
              !metaConfig || 
              (requiereNroTicket(selectedPlantilla) && !nroTicket.trim())
            }
          >
            {isLoading ? 'Enviando...' : loadingMeta ? 'Cargando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantillaModal;

