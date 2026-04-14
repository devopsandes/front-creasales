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
  const [periodos, setPeriodos] = useState<string>('');
  const [vencimiento, setVencimiento] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [metodo, setMetodo] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [capitas, setCapitas] = useState<string>('');
  const [cuota, setCuota] = useState<string>('');
  
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
  // Obtener nombre completo del afiliado: nombre + apellido del chat o dataUser
  const nombreAfiliado = currentChat?.cliente?.nombre && currentChat?.cliente?.apellido
    ? `${currentChat.cliente.nombre} ${currentChat.cliente.apellido}`
    : (dataUser?.apellnombAfilado || currentChat?.cliente?.nombre || 'Cliente');
  const nombreOperador = (user?.name || 'Operador').split(' ')[0];
  // Obtener CUIL del chat o dataUser
  const cuilCliente = currentChat?.cliente?.cuil?.toString() || dataUser?.CUILAfiliado?.toString() || '';
  const cuilTitular = dataUser?.CUILTitular?.toString() || cuilCliente;
  // Obtener email del chat o dataUser
  const emailCliente = currentChat?.cliente?.email || dataUser?.mail || '';
  // Obtener ingreso del chat y formatearlo
  const ingresoCliente = currentChat?.cliente?.ingreso
    ? new Date(currentChat.cliente.ingreso).toLocaleDateString('es-AR')
    : (dataUser?.mesAlta ? new Date(dataUser.mesAlta).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR'));

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
      setPeriodos('');
      setVencimiento('');
      setTotal('');
      setMetodo('');
      setPlan('');
      setCapitas('');
      setCuota('');
    }
  }, [modalPlantilla]);

  // Mapeo de plantillas a opciones del backend
  const getOpcionPlantilla = (plantillaId: string): number | null => {
    switch (plantillaId) {
      // ids sincronizados (guía backend)
      case 'retomar_conversacion':
        return 9;
      case 'novedades':
        return 5;
      case 'beneficio':
        return 6;
      case 'pagorecibido':
        return 2;
      case 'bienvenida':
        return 3;
      case 'prealta':
        return 4;
      case 'prealta_rel':
        return 8;
      case 'novedades_tramite':
        return 10;
      case 'duplicados':
        return 11;
      case 'prevencion_estafas':
        return 12;
      case 'deuda_utilidad':
        return 7;

      // compatibilidad ids antiguos (no deberían usarse desde el UI)
      case 'inicio':
        return 9;
      case 'prevencion-estafas':
        return 12;
      case 'novedades-tramite':
        return 10;
      case 'deuda-utilidad':
        return 7;
      case 'pago-recibido':
        return 2;
      case 'pre-alta':
        return 4;
      case 'pre-alta-rel':
        return 8;
      case 'deuda':
        return 0;
      default:
        return null;
    }
  };

  // Verificar si una plantilla requiere nroTicket
  const requiereNroTicket = (plantillaId: string): boolean => {
    return plantillaId === 'novedades_tramite' || plantillaId === 'novedades-tramite';
  };

  // Verificar si una plantilla requiere campos de deuda (periodos, vencimiento, total)
  const requiereCamposDeuda = (plantillaId: string): boolean => {
    return plantillaId === 'deuda_utilidad' || plantillaId === 'deuda-utilidad' || plantillaId === 'deuda';
  };

  // Verificar si una plantilla requiere campos de pago recibido (metodo, periodos)
  const requiereCamposPagoRecibido = (plantillaId: string): boolean => {
    return plantillaId === 'pagorecibido' || plantillaId === 'pago-recibido';
  };

  // Verificar si una plantilla requiere campos de pre-alta (plan, capitas, metodo)
  const requiereCamposPreAlta = (plantillaId: string): boolean => {
    return plantillaId === 'prealta' || plantillaId === 'prealta_rel' || plantillaId === 'pre-alta' || plantillaId === 'pre-alta-rel';
  };

  const requiereCamposBienvenida = (plantillaId: string): boolean => {
    return plantillaId === 'bienvenida';
  };

  const requiereDuplicados = (plantillaId: string): boolean => {
    return plantillaId === 'duplicados';
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

    // Normalizar y validar número (solo dígitos, 11–13)
    const numeroSoloDigitos = (numeroTelefono || '').replace(/\D/g, '');
    if (numeroSoloDigitos.length < 11 || numeroSoloDigitos.length > 13) {
      setError('El número de teléfono debe contener solo dígitos y tener entre 11 y 13 caracteres');
      return;
    }

    // Validar nroTicket si es requerido
    if (requiereNroTicket(selectedPlantilla) && !nroTicket.trim()) {
      setError('Por favor, ingrese el número de ticket');
      return;
    }

    // Validar campos de deuda si son requeridos
    if (requiereCamposDeuda(selectedPlantilla)) {
      if (!periodos.trim()) {
        setError('Por favor, ingrese los periodos');
        return;
      }
      if (!vencimiento.trim()) {
        setError('Por favor, ingrese la fecha de vencimiento');
        return;
      }
      if (!total.trim()) {
        setError('Por favor, ingrese el total');
        return;
      }
    }

    // Validar campos de pago recibido si son requeridos
    if (requiereCamposPagoRecibido(selectedPlantilla)) {
      if (!metodo.trim()) {
        setError('Por favor, ingrese el método de pago');
        return;
      }
      if (!periodos.trim()) {
        setError('Por favor, ingrese los periodos');
        return;
      }
    }

    // Validar campos de pre-alta si son requeridos
    if (requiereCamposPreAlta(selectedPlantilla)) {
      if (!plan.trim()) {
        setError('Por favor, ingrese el plan');
        return;
      }
      if (!capitas.trim() || isNaN(Number(capitas)) || Number(capitas) <= 0) {
        setError('Por favor, ingrese un número válido de capitas');
        return;
      }
      if (!metodo.trim()) {
        setError('Por favor, ingrese el método de pago');
        return;
      }
    }

    // Validar campos de bienvenida si son requeridos
    if (requiereCamposBienvenida(selectedPlantilla)) {
      if (!cuota.trim()) {
        setError('Por favor, ingrese la cuota mensual');
        return;
      }
      if (!cuilTitular.trim()) {
        setError('No se pudo obtener el CUIL del titular');
        return;
      }
      const planBienvenida = dataUser?.planAfiliado || plan.trim();
      if (!planBienvenida) {
        setError('No se pudo obtener el plan');
        return;
      }
      if (!emailCliente.trim()) {
        setError('No se pudo obtener el email');
        return;
      }
      const idAfiliado = (dataUser as any)?.IdAfiliadoTitular || (dataUser as any)?.IdAfiliado || '';
      if (!idAfiliado) {
        setError('No se pudo obtener el ID del afiliado para la credencial');
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Preparar datos con conversión a número
      const dataEnvio: any = {
        opcion: Number(opcion), //  Asegurar número
        graph_api_token: metaConfig.graph_api_token,
        id_phone_number: Number(metaConfig.id_phone_number), // Convertir a número
        numero: numeroSoloDigitos
      };

      // Campos específicos por plantilla (evitar enviar propiedades no contempladas por el DTO del backend)
      if (selectedPlantilla === 'retomar_conversacion' || selectedPlantilla === 'inicio') {
        dataEnvio.afiliado = nombreAfiliado;
        dataEnvio.operador = nombreOperador;
      }

      // Agregar nroTicket si es requerido
      if (requiereNroTicket(selectedPlantilla)) {
        dataEnvio.afiliado = nombreAfiliado;
        dataEnvio.operador = nombreOperador;
        dataEnvio.nroTicket = nroTicket.trim();
      }

      // Agregar campos de deuda si son requeridos
      if (requiereCamposDeuda(selectedPlantilla)) {
        dataEnvio.afiliado = nombreAfiliado;
        dataEnvio.periodos = periodos.trim();
        dataEnvio.vencimiento = vencimiento.trim();
        dataEnvio.total = total.trim();
        dataEnvio.cuil = cuilCliente;
      }

      // Agregar campos de pago recibido si son requeridos
      if (requiereCamposPagoRecibido(selectedPlantilla)) {
        dataEnvio.afiliado = nombreAfiliado;
        dataEnvio.metodo = metodo.trim();
        dataEnvio.periodos = periodos.trim();
      }

      // Agregar campos de pre-alta si son requeridos (case 4 y 8)
      if (requiereCamposPreAlta(selectedPlantilla)) {
        dataEnvio.afiliado = nombreAfiliado;
        dataEnvio.plan = plan.trim();
        dataEnvio.capitas = Number(capitas);
        dataEnvio.metodo = metodo.trim();
        dataEnvio.email = emailCliente;
        dataEnvio.ingreso = ingresoCliente;
      }

      // Agregar campos de bienvenida (case 3)
      if (requiereCamposBienvenida(selectedPlantilla)) {
        const planBienvenida = dataUser?.planAfiliado || plan.trim();
        const idAfiliado = (dataUser as any)?.IdAfiliadoTitular || (dataUser as any)?.IdAfiliado || '';
        const credencialUrl = `https://andessalud.createch.com.ar/api/credencial?idAfiliado=${idAfiliado}`;
        dataEnvio.afiliado = nombreAfiliado;
        dataEnvio.cuil = cuilTitular;
        dataEnvio.plan = planBienvenida;
        dataEnvio.email = emailCliente;
        dataEnvio.cuota = cuota.trim();
        dataEnvio.credencial = credencialUrl;
      }

      if (requiereDuplicados(selectedPlantilla)) {
        dataEnvio.afiliado = nombreAfiliado;
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
      case 'retomar_conversacion':
        return `¡Hola ${nombreAfiliado}! Mi nombre es ${nombreOperador} y tengo novedades de tu gestión iniciada. Por favor cuando respondas este mensaje podemos continuar, muchas gracias.`;
      case 'novedades':
        return `¡NOVEDADES!

Queremos contarte que en Andes Salud seguimos comprometidos con vos, trabajando constantemente para mejorar tu experiencia y garantizarte un servicio de calidad.

Te informamos que, a partir del 01/07/2025, renovamos nuestro servicio de Urgencias y Emergencias, el cual será brindado por EMERGENCIAS S.A.

Este nuevo prestador se incorpora para ofrecerte una atención eficiente y de calidad, asegurando la asistencia médica adecuada a tus necesidades.

Es muy importante que agendes que el único teléfono para solicitar el servicio es:
📞 Línea de emergencias: 0810-666-1449

Seguimos avanzando para estar más cerca tuyo, cuando más lo necesitás.`;
      case 'bienvenida': {
        const planBienvenida = dataUser?.planAfiliado || plan.trim() || 'Black';
        const cuilText = cuilTitular || '27324567897';
        const emailText = emailCliente || 'correo@correo.com';
        const cuotaText = cuota.trim() || '$ 55999';
        const idAfiliado = (dataUser as any)?.IdAfiliadoTitular || (dataUser as any)?.IdAfiliado || 'sarasa';
        const credencialUrl = `https://andessalud.createch.com.ar/api/credencial?idAfiliado=${idAfiliado}`;
        return `¡Felicitaciones ${nombreAfiliado} 😊 se activó tu cobertura de salud!
Te damos la bienvenida a Andes Salud. Te ayudaremos a conocer cómo acceder a tu cobertura médica.

✅ App móvil: Al momento de instalarla tené a mano tu DNI, vas a necesitarlo para ingresar. Descargala acá
IOS
https://apps.apple.com/ar/app/andessaludapp/id6633440872
ANDROID
https://play.google.com/store/apps/details?id=com.ar.andessalud.andessalud
✅ Pixi tu asistente virtual, a través de Whatsapp wa.me/5492613300622. Él te guiará paso a paso para cada solución.
✅ Sitio Web para realizar todas las gestiones que necesites. https://andessalud.com.ar/

Tus Datos:

Titular: ${cuilText}
Plan: ${planBienvenida}
Email: ${emailText}
Cuota Mensual: ${cuotaText}
Credencial: ${credencialUrl}

¡Gracias por elegirnos! 😊`;
      }
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
      case 'prevencion_estafas':
        return `Hola, ¿cómo estás?

Recordá que ANDES SALUD nunca solicita datos bancarios por teléfono, correo electrónico ni mensajes.
Si recibís un llamado o mensaje donde te pidan información como tu número de cuenta, tarjeta o claves, no los compartas y comunicate directamente con nuestros canales oficiales.

👉 Teléfono oficial: +54 9 261 330-0622
👉 Sitio web oficial: https://andessalud.com.ar/
👉 Dominios oficiales: andessalud.com.ar y andessalud.ar

Cuidar tus datos es cuidar tu salud. Muchas gracias.`;
      case 'novedades-tramite':
      case 'novedades_tramite':
        // Usar nroTicket si está disponible, sino mostrar placeholder
        const ticketNum = nroTicket.trim() || '1234';
        return `¡Hola ${nombreAfiliado}! Soy ${nombreOperador}. Necesito que me brindes información extra sobre tu trámite número ${ticketNum}. Aguardamos respuesta. ¡Muchas gracias!`;
      case 'deuda':
      case 'deuda-utilidad':
      case 'deuda_utilidad':
        // Usar valores de los inputs o placeholders
        const periodosText = periodos.trim() || 'aca va la lista de los periodos';
        const vencimientoText = vencimiento.trim() || '10/10/1990';
        const totalText = total.trim() || '$ 123456';
        const cuilText = cuilCliente || '20367894563';
        return `Estimado afiliado ${nombreAfiliado.toLowerCase()}:
Desde Andes Salud 😊 te adjuntamos los link de pago de la cuota mensual de los periodos detallados a continuación:
Te recordamos que también podés abonar por transferencia al siguiente Alias: ANDES.SALUD123
PERIODOS ADEUDADOS:

${periodosText}

VENCIMIENTO: ${vencimientoText}
DEUDA TOTAL: ${totalText}
CUIL TITULAR: ${cuilText}

Transferencia Bancaria:
Alias: ANDES.SALUD123
Razón social: ANDESALUD S.A.

⚠️ ESTE ES UN MENSAJE AUTOMÁTICO, NO DEBES RESPONDERLO ⚠️ 
Sí tenés alguna duda comunicate con PIXI, nuestro asistente virtual vía Whatsapp haciendo clic acá 👉🏼 wa.me/5492613300622`;
      case 'pago-recibido':
      case 'pagorecibido':
        // Usar valores de los inputs o placeholders
        const metodoPago = metodo.trim() || 'bizum';
        const periodosPago = periodos.trim() || 'mayo 2025';
        return `¡Hola ${nombreAfiliado}!
✅ Hemos recibido tu pago a través de ${metodoPago} correspondiente al periodo de ${periodosPago}. ¡Muchas gracias! 😊`;
      case 'pre-alta':
      case 'prealta':
        // Usar valores de los inputs o placeholders
        const planText = plan.trim() || 'PLAN BLACK';
        const capitasText = capitas.trim() || '3';
        const metodoPreAlta = metodo.trim() || 'EFECTIVO';
        const emailText = emailCliente || 'juanperex@perex.com';
        return `¡Hola ☺️, ${nombreAfiliado}!
Estamos procesando tu solicitud para afiliarte a Andes Salud y queremos asegurarnos de que tus datos de contacto sean correctos. ✅

Datos del Plan: 
Plan elegido: ${planText}
Modalidad de ingreso: RELACION DE DEPENDENCIA
Cantidad total de integrantes: ${capitasText}
Forma de Pago: ${metodoPreAlta}
Correo Electrónico: ${emailText}

Cualquier duda o consulta 📱 contáctanos en WhatsApp: wa.me/5492613300622 , estamos aquí para ayudarte.

¡Gracias por elegirnos! 😊`;
      case 'pre-alta-rel':
      case 'prealta_rel':
        // Usar valores de los inputs o placeholders
        const planTextRel = plan.trim() || 'PLAN BLACK';
        const capitasTextRel = capitas.trim() || '3';
        const metodoPreAltaRel = metodo.trim() || 'DEBITO';
        const emailTextRel = emailCliente || 'juan@perex.com';
        return `¡Hola ☺️, ${nombreAfiliado}!
Estamos procesando tu solicitud para afiliarte a Andes Salud y queremos asegurarnos de que tus datos de contacto sean correctos. ✅

TUS DATOS 
Plan elegido: ${planTextRel}
Modalidad de ingreso: RELACION DE DEPENDENCIA
Cantidad total de integrantes: ${capitasTextRel}
Forma de Pago: ${metodoPreAltaRel}
Correo Electrónico: ${emailTextRel}

Para hacer efectiva la opción tienes que tener tu clave fiscal, te mostramos como se hace: https://www.youtube.com/shorts/ZHxnTkWq1oo

Cualquier duda o consulta 📱 contáctanos en WhatsApp: wa.me/5492613300622 , estamos aquí para ayudarte.

¡Gracias por elegirnos! 😊`;
      case 'duplicados':
        return `¡Hola ${nombreAfiliado}!`;
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
        
        <div className="plantilla-modal-header">
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
              <option value="retomar_conversacion">Retomar conversación</option>
              <option value="novedades">Novedades</option>
              <option value="beneficio">Beneficio</option>
              <option value="prevencion_estafas">Prevención Estafas</option>
              <option value="novedades_tramite">Novedades Trámite</option>
              <option value="deuda_utilidad">Deuda Utilidad</option>
              <option value="pagorecibido">Pago Recibido</option>
              <option value="bienvenida">Bienvenida</option>
              <option value="prealta">Pre-Alta</option>
              <option value="prealta_rel">Pre-Alta Rel</option>
              <option value="duplicados">Duplicados</option>
            </select>
          </div>
        </div>

        <div className="plantilla-modal-content">
          {/* Input para cuota cuando se selecciona la plantilla bienvenida */}
          {requiereCamposBienvenida(selectedPlantilla) && (
            <div className="plantilla-modal-input-group">
              <label className="plantilla-modal-input-label">
                Cuota Mensual
              </label>
              <input
                type="text"
                value={cuota}
                onChange={(e) => setCuota(e.target.value)}
                placeholder="Ej: $ 55999"
                className="plantilla-modal-input"
              />
            </div>
          )}

          {/* Input para nroTicket cuando se selecciona la plantilla de trámite */}
          {requiereNroTicket(selectedPlantilla) && (
            <div className="plantilla-modal-input-group">
              <label className="plantilla-modal-input-label">
                Número de Ticket
              </label>
              <input
                type="text"
                value={nroTicket}
                onChange={(e) => setNroTicket(e.target.value)}
                placeholder="Ingrese el número de ticket"
                className="plantilla-modal-input"
              />
            </div>
          )}

          {/* Inputs para campos de deuda cuando se seleccionan plantillas de deuda */}
          {requiereCamposDeuda(selectedPlantilla) && (
            <>
              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Periodos
                </label>
                <input
                  type="text"
                  value={periodos}
                  onChange={(e) => setPeriodos(e.target.value)}
                  placeholder="Ej: 2024-01,2024-02 o Enero 2024, Febrero 2024"
                  className="plantilla-modal-input"
                />
              </div>

              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Vencimiento
                </label>
                <input
                  type="text"
                  value={vencimiento}
                  onChange={(e) => setVencimiento(e.target.value)}
                  placeholder="Ej: 2024-03-15 o 15/03/2024"
                  className="plantilla-modal-input"
                />
              </div>

              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Total
                </label>
                <input
                  type="text"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="Ej: $5000 o 5000"
                  className="plantilla-modal-input"
                />
              </div>
            </>
          )}

          {/* Inputs para campos de pago recibido cuando se selecciona la plantilla */}
          {requiereCamposPagoRecibido(selectedPlantilla) && (
            <>
              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Método de Pago
                </label>
                <input
                  type="text"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  placeholder="Ej: Transferencia bancaria, Efectivo, Tarjeta"
                  className="plantilla-modal-input"
                />
              </div>

              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Periodos
                </label>
                <input
                  type="text"
                  value={periodos}
                  onChange={(e) => setPeriodos(e.target.value)}
                  placeholder="Ej: 2024-01,2024-02 o mayo 2025"
                  className="plantilla-modal-input"
                />
              </div>
            </>
          )}

          {/* Inputs para campos de pre-alta cuando se selecciona la plantilla */}
          {requiereCamposPreAlta(selectedPlantilla) && (
            <>
              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Plan
                </label>
                <input
                  type="text"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="Ej: Plan Básico, Plan Premium, PLAN BLACK"
                  className="plantilla-modal-input"
                />
              </div>

              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Capitas
                </label>
                <input
                  type="number"
                  value={capitas}
                  onChange={(e) => setCapitas(e.target.value)}
                  placeholder="Ej: 1, 2, 3"
                  className="plantilla-modal-input"
                  min="1"
                />
              </div>

              <div className="plantilla-modal-input-group">
                <label className="plantilla-modal-input-label">
                  Método de Pago
                </label>
                <input
                  type="text"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  placeholder="Ej: Transferencia, Débito automático, EFECTIVO"
                  className="plantilla-modal-input"
                />
              </div>
            </>
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
        </div>

        <div className="plantilla-modal-footer">
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
                (requiereNroTicket(selectedPlantilla) && !nroTicket.trim()) ||
                (requiereCamposDeuda(selectedPlantilla) && (!periodos.trim() || !vencimiento.trim() || !total.trim())) ||
                (requiereCamposPagoRecibido(selectedPlantilla) && (!metodo.trim() || !periodos.trim())) ||
                (requiereCamposPreAlta(selectedPlantilla) && (!plan.trim() || !capitas.trim() || !metodo.trim() || isNaN(Number(capitas)) || Number(capitas) <= 0)) ||
                (requiereCamposBienvenida(selectedPlantilla) && !cuota.trim())
              }
            >
              {isLoading ? 'Enviando...' : loadingMeta ? 'Cargando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantillaModal;

