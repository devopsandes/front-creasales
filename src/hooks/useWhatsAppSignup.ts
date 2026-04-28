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
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStateRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const isListenerActiveRef = useRef<boolean>(false);
  const pollingAttemptRef = useRef<number>(0);
  const pollingConsecutiveErrorsRef = useRef<number>(0);

  // Hook de Socket.io para notificaciones en tiempo real
  const { socket, isConnected } = useWhatsAppSocket({
    onSignupCompleted: (data: any) => {
      console.log('[WhatsApp Signup] Socket: WhatsApp signup completed', data);
      setSignupStatus('completed');
      setIsProcessing(false);
      setVisualStatus('âœ… WhatsApp vinculado exitosamente');
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
      setVisualStatus(`âŒ Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      cleanup();
      
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  });

  // FunciÃ³n para limpiar recursos
  const cleanup = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
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
    pollingAttemptRef.current = 0;
    pollingConsecutiveErrorsRef.current = 0;
  }, []);

  // Listener de postMessage para Embedded Signup v3
  // SOLO se activa cuando el popup estÃ¡ abierto
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // VALIDACIÃ“N 1: Verificar que el listener estÃ© activo solo cuando el popup estÃ¡ abierto
      if (!isListenerActiveRef.current) {
        console.log('[WhatsApp Signup] Listener inactivo - popup no estÃ¡ abierto');
        return;
      }

      // VALIDACIÃ“N 2: Verificar origen de Facebook/Meta
      const validOrigins = [
        "https://www.facebook.com",
        "https://web.facebook.com",
        "https://business.facebook.com",
        "https://www.meta.com"
      ];
      
      if (!validOrigins.includes(event.origin)) {
        console.log('[WhatsApp Signup] Mensaje ignorado - origen no vÃ¡lido:', event.origin);
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
            
            // VALIDACIÃ“N 3: Verificar que tenemos el state
            if (!state) {
              const errorMsg = 'No se encontrÃ³ el state del proceso de vinculaciÃ³n';
              console.error('[WhatsApp Signup]', errorMsg);
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`âŒ Error: ${errorMsg}`);
              setErrorMessage(errorMsg);
              cleanup();
              
              toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
              });
              return;
            }

            // VALIDACIÃ“N 4: Verificar que tenemos los datos necesarios
            if (!phone_number_id || !waba_id) {
              const errorMsg = 'Datos incompletos recibidos de Meta. Faltan phone_number_id o waba_id';
              console.error('[WhatsApp Signup]', errorMsg, { phone_number_id, waba_id, display_name });
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`âŒ Error: ${errorMsg}`);
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
              setVisualStatus('Completando vinculaciÃ³n...');
              
              console.log('[WhatsApp Signup] Llamando a /complete con:', {
                state,
                phoneNumberId: phone_number_id,
                wabaId: waba_id,
                displayName: display_name || 'Sin nombre'
              });

              // VALIDACIÃ“N 5: Llamar al endpoint /complete con los datos correctos
              await completeEmbeddedSignup({
                state,
                phoneNumberId: phone_number_id,
                wabaId: waba_id,
                displayName: display_name || ''
              });
              
              console.log('[WhatsApp Signup] Embedded signup completado via postMessage - esperando confirmaciÃ³n del backend');
              // El estado se actualizarÃ¡ via Socket.io o polling
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || error?.message || 'Error al completar la vinculaciÃ³n';
              console.error('[WhatsApp Signup] Error completando embedded signup:', {
                error,
                response: error?.response?.data,
                status: error?.response?.status
              });
              
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`âŒ Error: ${errorMsg}`);
              setErrorMessage(errorMsg);
              cleanup();
              
              toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
              });
            }
          } else if (data.event === 'CANCEL') {
            console.log('[WhatsApp Signup] Evento CANCEL recibido - usuario cancelÃ³');
            setSignupStatus('failed');
            setIsProcessing(false);
            setVisualStatus('âš ï¸ Proceso cancelado');
            setErrorMessage('El usuario cancelÃ³ el proceso');
            cleanup();
            
            toast.warning('Proceso de vinculaciÃ³n cancelado', {
              position: 'top-right',
              autoClose: 3000,
            });
          } else if (data.event === 'ERROR') {
            const errorMsg = data.data?.message || data.data?.error || 'Error en el proceso de vinculaciÃ³n';
            console.error('[WhatsApp Signup] Evento ERROR recibido:', {
              event: data.event,
              data: data.data,
              fullData: data
            });
            
            setSignupStatus('failed');
            setIsProcessing(false);
            setVisualStatus(`âŒ Error: ${errorMsg}`);
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
    
    console.log('[WhatsApp Signup] Agregando listener de postMessage');
    window.addEventListener('message', handleMessage);
    
    return () => {
      console.log('[WhatsApp Signup] Removiendo listener de postMessage');
      window.removeEventListener('message', handleMessage);
    };
  }, [cleanup]);

  // FunciÃ³n para iniciar el polling
  const startPolling = useCallback((state: string) => {
    currentStateRef.current = state;
    startTimeRef.current = Date.now();
    pollingAttemptRef.current = 0;
    pollingConsecutiveErrorsRef.current = 0;
    const timeoutDuration = 15 * 60 * 1000; // 15 minutos
    const maxConsecutiveErrors = 8;
    
    // Timeout de 15 minutos
    timeoutRef.current = setTimeout(() => {
      const errorMsg = 'El proceso de vinculaciÃ³n ha expirado. Por favor, intente nuevamente.';
      setSignupStatus('failed');
      setIsProcessing(false);
      setVisualStatus(`âŒ Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      cleanup();
      toast.error(errorMsg, { autoClose: 5000 });
    }, timeoutDuration);
    
    const scheduleNextPoll = (delayMs: number) => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = setTimeout(runPoll, delayMs);
    };

    const runPoll = async () => {
      try {
        // Verificar timeout
        if (Date.now() - startTimeRef.current > timeoutDuration) {
          const errorMsg = 'El proceso de vinculaciÃ³n ha expirado. Por favor, intente nuevamente.';
          setSignupStatus('failed');
          setIsProcessing(false);
          setVisualStatus(`âŒ Error: ${errorMsg}`);
          setErrorMessage(errorMsg);
          cleanup();
          toast.error(errorMsg, { autoClose: 5000 });
          return;
        }

        pollingAttemptRef.current += 1;
        const statusResponse = await getEmbeddedSignupStatus(state);
        pollingConsecutiveErrorsRef.current = 0;
        
        if (statusResponse.status === 'completed') {
          setSignupStatus('completed');
          setIsProcessing(false);
          setVisualStatus('âœ… WhatsApp vinculado exitosamente');
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
          setVisualStatus(`âŒ Error: ${errorMsg}`);
          setErrorMessage(errorMsg);
          cleanup();
          
          toast.error(errorMsg, {
            position: 'top-right',
            autoClose: 5000,
          });
          return;
        }
        
        // Backoff liviano: 2s -> 3s -> 5s (cap)
        const nextDelay = Math.min(5000, 2000 + pollingAttemptRef.current * 500);
        scheduleNextPoll(nextDelay);
        
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || 'Error al verificar el estado';
        console.error('[WhatsApp Signup] Error polling signup status:', {
          error,
          message: errorMsg,
          response: error?.response?.data
        });
        pollingConsecutiveErrorsRef.current += 1;

        if (pollingConsecutiveErrorsRef.current >= maxConsecutiveErrors) {
          const fatalMsg = 'No se pudo verificar el estado de vinculaciÃ³n tras varios intentos.';
          setSignupStatus('failed');
          setIsProcessing(false);
          setVisualStatus(`âŒ Error: ${fatalMsg}`);
          setErrorMessage(fatalMsg);
          cleanup();
          toast.error(fatalMsg, { autoClose: 5000 });
          return;
        }

        // Backoff mÃ¡s agresivo cuando hay errores consecutivos
        const nextDelay = Math.min(12000, 3000 + pollingConsecutiveErrorsRef.current * 1500);
        scheduleNextPoll(nextDelay);
      }
    };

    // Primer poll rÃ¡pido
    scheduleNextPoll(1500);
  }, [cleanup, onComplete]);

  // FunciÃ³n para iniciar el signup
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
      
      // Verificar el estado del popup despuÃ©s de un breve delay
      // SOLO verificamos si realmente tenemos referencia Y podemos confirmar que estÃ¡ cerrado
      // NO verificamos si estÃ¡ bloqueado cuando no hay referencia, porque puede ser cross-origin
      setTimeout(() => {
        if (popupRef.current) {
          // Solo si tenemos referencia, intentar verificar (puede fallar por cross-origin)
          try {
            if (popupRef.current.closed) {
              const errorMsg = 'El popup se cerrÃ³ inmediatamente. Por favor, habilita los popups en tu navegador e intenta nuevamente.';
              console.error('[WhatsApp Signup] Popup se cerrÃ³ inmediatamente');
              setSignupStatus('failed');
              setIsProcessing(false);
              setVisualStatus(`âŒ Error: ${errorMsg}`);
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
            // Meta/Facebook popups siempre estÃ¡n en otro dominio
            // Si el popup se abriÃ³, continuamos normalmente
            console.log('[WhatsApp Signup] No se puede acceder a popup.closed (cross-origin) - esto es normal para Meta popups, continuando');
          }
        } else {
          // Si no hay referencia, NO asumimos que estÃ¡ bloqueado
          // Puede ser que el navegador haya abierto el popup pero retornÃ³ null
          // El listener de postMessage confirmarÃ¡ si realmente se abriÃ³
          console.log('[WhatsApp Signup] No hay referencia al popup - esperando confirmaciÃ³n del listener de postMessage');
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
      const errorMsg = error?.response?.data?.message || error?.message || 'Error al iniciar el proceso de vinculaciÃ³n';
      console.error('[WhatsApp Signup] Error iniciando signup:', {
        error,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
      setSignupStatus('failed');
      setIsProcessing(false);
      setVisualStatus(`âŒ Error: ${errorMsg}`);
      setErrorMessage(errorMsg);
      cleanup();
      
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  }, [startPolling, cleanup, socket, isConnected]);

  // FunciÃ³n para detener el polling
  const stopPolling = useCallback(() => {
    cleanup();
    setSignupStatus('idle');
    setIsProcessing(false);
    setVisualStatus('idle');
    setErrorMessage(null);
  }, [cleanup]);

  // FunciÃ³n para limpiar el error manualmente
  const clearError = useCallback(() => {
    // Solo limpiar el error si estamos en estado failed
    if (signupStatus === 'failed') {
      setVisualStatus('idle');
      setErrorMessage(null);
      // Si no estamos procesando, tambiÃ©n resetear el estado
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

  // Verificar si el popup se cerrÃ³ manualmente
  useEffect(() => {
    if (popupRef.current && signupStatus === 'in_progress') {
      const checkClosed = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(checkClosed);
          
          // Si el popup se cerrÃ³ y aÃºn estamos en progreso, asumir cancelaciÃ³n
          if (signupStatus === 'in_progress') {
            setSignupStatus('failed');
            setIsProcessing(false);
            setVisualStatus('âš ï¸ Proceso cancelado');
            setErrorMessage('El usuario cerrÃ³ la ventana');
            cleanup();
            
            toast.warning('Proceso de vinculaciÃ³n cancelado', {
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


