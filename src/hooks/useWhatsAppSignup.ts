import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  startEmbeddedSignup, 
  getEmbeddedSignupStatus,
  completeEmbeddedSignup,
  openEmbeddedSignupPopup,
  closeEmbeddedSignupPopup,
  EmbeddedSignupStartRequest
} from '../services/whatsapp/whatsapp.services';
import { useWhatsAppSocket } from './useWhatsAppSocket';

// Estados del signup
export type SignupStatus = 'idle' | 'starting' | 'in_progress' | 'completing' | 'completed' | 'failed';

// Estados visuales para feedback
export type VisualStatus = string;

interface UseWhatsAppSignupReturn {
  signupStatus: SignupStatus;
  isProcessing: boolean;
  visualStatus: VisualStatus;
  errorMessage: string | null;
  startSignup: (request?: EmbeddedSignupStartRequest) => Promise<void>;
  stopPolling: () => void;
  clearError: () => void;
}

export const useWhatsAppSignup = (onComplete?: () => void): UseWhatsAppSignupReturn => {
  const [signupStatus, setSignupStatus] = useState<SignupStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [visualStatus, setVisualStatus] = useState<VisualStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const popupRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStateRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const isListenerActiveRef = useRef<boolean>(false);

  // Hook de Socket.io para notificaciones en tiempo real
  const { socket, isConnected } = useWhatsAppSocket({
    onSignupCompleted: (data: any) => {
      console.log('[WhatsApp Signup] Socket: WhatsApp signup completed', data);
      setSignupStatus('completed');
      setIsProcessing(false);
      setVisualStatus('✅ WhatsApp vinculado exitosamente');
      setErrorMessage(null);
      cleanup();
      
      toast.success('WhatsApp vinculado exitosamente!', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      if (onComplete) {
        onComplete();
      }
    },
    onSignupFailed: (error: any) => {
      const errorMsg = error?.message || 'Error al vincular WhatsApp';
      console.error('[WhatsApp Signup] Socket: WhatsApp signup failed', error);
      setSignupStatus('failed');
      setIsProcessing(false);
      setVisualStatus(`❌ Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      cleanup();
      
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  });

  // Función para limpiar recursos
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (popupRef.current && !popupRef.current.closed) {
      closeEmbeddedSignupPopup(popupRef.current);
      popupRef.current = null;
    }
    
    currentStateRef.current = null;
    startTimeRef.current = 0;
    isListenerActiveRef.current = false;
  }, []);

  // Listener de postMessage para Embedded Signup v3
  // SOLO se activa cuando el popup está abierto
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // VALIDACIÓN 1: Verificar que el listener esté activo solo cuando el popup está abierto
      if (!isListenerActiveRef.current) {
        console.log('[WhatsApp Signup] Listener inactivo - popup no está abierto');
        return;
      }

      // VALIDACIÓN 2: Verificar origen de Facebook/Meta
      const validOrigins = [
        "https://www.facebook.com",
        "https://web.facebook.com",
        "https://business.facebook.com",
        "https://www.meta.com"
      ];
      
      if (!validOrigins.includes(event.origin)) {
        console.log('[WhatsApp Signup] Mensaje ignorado - origen no válido:', event.origin);
        return;
      }
      
      console.log('[WhatsApp Signup] postMessage recibido:', {
        origin: event.origin,
        data: event.data,
        timestamp: new Date().toISOString()
      });
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        console.log('[WhatsApp Signup] Datos parseados:', data);
        
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            console.log('[WhatsApp Signup] Evento FINISH recibido:', data.data);
            const { phone_number_id, waba_id, display_name } = data.data || {};
            const state = currentStateRef.current;
            
            // VALIDACIÓN 3: Verificar que tenemos el state
            if (!state) {
              const errorMsg = 'No se encontró el state del proceso de vinculación';
              console.error('[WhatsApp Signup]', errorMsg);
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`❌ Error: ${errorMsg}`);
              setErrorMessage(errorMsg);
              cleanup();
              
              toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
              });
              return;
            }

            // VALIDACIÓN 4: Verificar que tenemos los datos necesarios
            if (!phone_number_id || !waba_id) {
              const errorMsg = 'Datos incompletos recibidos de Meta. Faltan phone_number_id o waba_id';
              console.error('[WhatsApp Signup]', errorMsg, { phone_number_id, waba_id, display_name });
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`❌ Error: ${errorMsg}`);
              setErrorMessage(errorMsg);
              cleanup();
              
              toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
              });
              return;
            }
            
            try {
              setSignupStatus('completing');
              setVisualStatus('Completando vinculación...');
              
              console.log('[WhatsApp Signup] Llamando a /complete con:', {
                state,
                phoneNumberId: phone_number_id,
                wabaId: waba_id,
                displayName: display_name || 'Sin nombre'
              });

              // VALIDACIÓN 5: Llamar al endpoint /complete con los datos correctos
              await completeEmbeddedSignup({
                state,
                phoneNumberId: phone_number_id,
                wabaId: waba_id,
                displayName: display_name || ''
              });
              
              console.log('[WhatsApp Signup] Embedded signup completado via postMessage - esperando confirmación del backend');
              // El estado se actualizará via Socket.io o polling
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || error?.message || 'Error al completar la vinculación';
              console.error('[WhatsApp Signup] Error completando embedded signup:', {
                error,
                response: error?.response?.data,
                status: error?.response?.status
              });
              
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`❌ Error: ${errorMsg}`);
              setErrorMessage(errorMsg);
              cleanup();
              
              toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
              });
            }
          } else if (data.event === 'CANCEL') {
            console.log('[WhatsApp Signup] Evento CANCEL recibido - usuario canceló');
            setSignupStatus('failed');
            setIsProcessing(false);
            setVisualStatus('⚠️ Proceso cancelado');
            setErrorMessage('El usuario canceló el proceso');
            cleanup();
            
            toast.warning('Proceso de vinculación cancelado', {
              position: 'top-right',
              autoClose: 3000,
            });
          } else if (data.event === 'ERROR') {
            const errorMsg = data.data?.message || data.data?.error || 'Error en el proceso de vinculación';
            console.error('[WhatsApp Signup] Evento ERROR recibido:', {
              event: data.event,
              data: data.data,
              fullData: data
            });
            
            setSignupStatus('failed');
            setIsProcessing(false);
            setVisualStatus(`❌ Error: ${errorMsg}`);
            setErrorMessage(errorMsg);
            cleanup();
            
            toast.error(errorMsg, {
              position: 'top-right',
              autoClose: 5000,
            });
          } else {
            console.log('[WhatsApp Signup] Evento desconocido recibido:', data.event, data);
          }
        } else {
          console.log('[WhatsApp Signup] Tipo de mensaje no reconocido:', data.type);
        }
      } catch (e: any) {
        console.error('[WhatsApp Signup] Error parseando postMessage:', {
          error: e,
          rawData: event.data,
          origin: event.origin
        });
      }
    };
    
    // Solo agregar el listener si el popup está abierto
    if (isListenerActiveRef.current) {
      console.log('[WhatsApp Signup] Agregando listener de postMessage');
      window.addEventListener('message', handleMessage);
    }
    
    return () => {
      if (isListenerActiveRef.current) {
        console.log('[WhatsApp Signup] Removiendo listener de postMessage');
        window.removeEventListener('message', handleMessage);
      }
    };
  }, [cleanup]);

  // Función para iniciar el polling
  const startPolling = useCallback((state: string) => {
    currentStateRef.current = state;
    startTimeRef.current = Date.now();
    const timeoutDuration = 15 * 60 * 1000; // 15 minutos
    
    // Timeout de 15 minutos
    timeoutRef.current = setTimeout(() => {
      const errorMsg = 'El proceso de vinculación ha expirado. Por favor, intente nuevamente.';
      setSignupStatus('failed');
      setIsProcessing(false);
      setVisualStatus(`❌ Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      cleanup();
      toast.error(errorMsg, { autoClose: 5000 });
    }, timeoutDuration);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Verificar timeout
        if (Date.now() - startTimeRef.current > timeoutDuration) {
          const errorMsg = 'El proceso de vinculación ha expirado. Por favor, intente nuevamente.';
          setSignupStatus('failed');
          setIsProcessing(false);
          setVisualStatus(`❌ Error: ${errorMsg}`);
          setErrorMessage(errorMsg);
          cleanup();
          toast.error(errorMsg, { autoClose: 5000 });
          return;
        }
        
        const statusResponse = await getEmbeddedSignupStatus(state);
        
        if (statusResponse.status === 'completed') {
          setSignupStatus('completed');
          setIsProcessing(false);
          setVisualStatus('✅ WhatsApp vinculado exitosamente');
          setErrorMessage(null);
          cleanup();
          
          toast.success('WhatsApp vinculado exitosamente!', {
            position: 'top-right',
            autoClose: 3000,
          });
          
          // Llamar callback de completado
          if (onComplete) {
            onComplete();
          }
          
        } else if (statusResponse.status === 'failed') {
          const errorMsg = statusResponse.error?.message || 'Error al vincular WhatsApp';
          setSignupStatus('failed');
          setIsProcessing(false);
          setVisualStatus(`❌ Error: ${errorMsg}`);
          setErrorMessage(errorMsg);
          cleanup();
          
          toast.error(errorMsg, {
            position: 'top-right',
            autoClose: 5000,
          });
        }
        
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || 'Error al verificar el estado';
        console.error('[WhatsApp Signup] Error polling signup status:', {
          error,
          message: errorMsg,
          response: error?.response?.data
        });
        // No cambiar el estado aquí, solo loguear el error
      }
    }, 3000); // Polling cada 3 segundos (más eficiente)
  }, [cleanup, onComplete]);

  // Función para iniciar el signup
  const startSignup = useCallback(async (request: EmbeddedSignupStartRequest = {}) => {
    try {
      setSignupStatus('starting');
      setIsProcessing(true);
      setVisualStatus('Iniciando proceso...');
      setErrorMessage(null);
      
      console.log('[WhatsApp Signup] Iniciando proceso de signup...');
      
      // Iniciar el proceso de signup
      const signupResponse = await startEmbeddedSignup({
        tenantId: request.tenantId,
        locale: request.locale || 'es'
      });
      
      console.log('[WhatsApp Signup] Signup iniciado:', {
        signupUrl: signupResponse.signupUrl,
        state: signupResponse.state,
        correlationId: signupResponse.correlationId
      });
      
      // Abrir popup
      popupRef.current = openEmbeddedSignupPopup(signupResponse.signupUrl);
      
      console.log('[WhatsApp Signup] Intentando abrir popup:', {
        popupRef: popupRef.current,
        url: signupResponse.signupUrl
      });
      
      // ACTIVAR el listener de postMessage - lo necesitamos activo desde el inicio
      // Incluso si window.open() retorna null, algunos navegadores pueden abrir el popup
      isListenerActiveRef.current = true;
      console.log('[WhatsApp Signup] Listener de postMessage activado');
      
      // Cambiar estado a in_progress inmediatamente
      setSignupStatus('in_progress');
      setVisualStatus('Procesando en Meta...');
      
      // Verificar el estado del popup después de un breve delay
      // SOLO verificamos si realmente tenemos referencia Y podemos confirmar que está cerrado
      // NO verificamos si está bloqueado cuando no hay referencia, porque puede ser cross-origin
      setTimeout(() => {
        if (popupRef.current) {
          // Solo si tenemos referencia, intentar verificar (puede fallar por cross-origin)
          try {
            if (popupRef.current.closed) {
              const errorMsg = 'El popup se cerró inmediatamente. Por favor, habilita los popups en tu navegador e intenta nuevamente.';
              console.error('[WhatsApp Signup] Popup se cerró inmediatamente');
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`❌ Error: ${errorMsg}`);
              setErrorMessage(errorMsg);
              isListenerActiveRef.current = false;
              cleanup();
              toast.error(errorMsg, { autoClose: 7000 });
              return;
            } else {
              console.log('[WhatsApp Signup] Popup abierto correctamente y verificado');
            }
          } catch (e) {
            // No podemos acceder a popup.closed (cross-origin) - esto es NORMAL y esperado
            // Meta/Facebook popups siempre están en otro dominio
            // Si el popup se abrió, continuamos normalmente
            console.log('[WhatsApp Signup] No se puede acceder a popup.closed (cross-origin) - esto es normal para Meta popups, continuando');
          }
        } else {
          // Si no hay referencia, NO asumimos que está bloqueado
          // Puede ser que el navegador haya abierto el popup pero retornó null
          // El listener de postMessage confirmará si realmente se abrió
          console.log('[WhatsApp Signup] No hay referencia al popup - esperando confirmación del listener de postMessage');
        }
      }, 500);
      
      // Iniciar polling para verificar el estado (fallback si Socket.io no funciona)
      if (!isConnected || !socket) {
        console.log('[WhatsApp Signup] Socket.io no conectado, usando polling como fallback');
        startPolling(signupResponse.state);
      } else {
        currentStateRef.current = signupResponse.state;
        console.log('[WhatsApp Signup] Socket.io conectado, escuchando actualizaciones en tiempo real');
      }
      
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error al iniciar el proceso de vinculación';
      console.error('[WhatsApp Signup] Error iniciando signup:', {
        error,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
      setSignupStatus('failed');
      setIsProcessing(false);
      setVisualStatus(`❌ Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      cleanup();
      
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  }, [startPolling, cleanup, socket, isConnected]);

  // Función para detener el polling
  const stopPolling = useCallback(() => {
    cleanup();
    setSignupStatus('idle');
    setIsProcessing(false);
    setVisualStatus('idle');
    setErrorMessage(null);
  }, [cleanup]);

  // Función para limpiar el error manualmente
  const clearError = useCallback(() => {
    // Solo limpiar el error si estamos en estado failed
    if (signupStatus === 'failed') {
      setVisualStatus('idle');
      setErrorMessage(null);
      // Si no estamos procesando, también resetear el estado
      if (!isProcessing) {
        setSignupStatus('idle');
      }
    }
  }, [signupStatus, isProcessing]);

  // Limpiar recursos al desmontar el componente
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Verificar si el popup se cerró manualmente
  useEffect(() => {
    if (popupRef.current && signupStatus === 'in_progress') {
      const checkClosed = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(checkClosed);
          
          // Si el popup se cerró y aún estamos en progreso, asumir cancelación
          if (signupStatus === 'in_progress') {
            setSignupStatus('failed');
            setIsProcessing(false);
            setVisualStatus('⚠️ Proceso cancelado');
            setErrorMessage('El usuario cerró la ventana');
            cleanup();
            
            toast.warning('Proceso de vinculación cancelado', {
              position: 'top-right',
              autoClose: 3000,
            });
          }
        }
      }, 1000);
      
      return () => clearInterval(checkClosed);
    }
  }, [signupStatus, cleanup]);

  return {
    signupStatus,
    isProcessing,
    visualStatus,
    errorMessage,
    startSignup,
    stopPolling,
    clearError,
  };
};

