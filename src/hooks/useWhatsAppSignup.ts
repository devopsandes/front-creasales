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
export type SignupStatus = 'idle' | 'starting' | 'in_progress' | 'completed' | 'failed';

interface UseWhatsAppSignupReturn {
  signupStatus: SignupStatus;
  isProcessing: boolean;
  startSignup: (request?: EmbeddedSignupStartRequest) => Promise<void>;
  stopPolling: () => void;
}

export const useWhatsAppSignup = (onComplete?: () => void): UseWhatsAppSignupReturn => {
  const [signupStatus, setSignupStatus] = useState<SignupStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const popupRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStateRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  // Hook de Socket.io para notificaciones en tiempo real
  const { socket, isConnected } = useWhatsAppSocket({
    onSignupCompleted: (data: any) => {
      console.log('Socket: WhatsApp signup completed', data);
      setSignupStatus('completed');
      setIsProcessing(false);
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
      console.error('Socket: WhatsApp signup failed', error);
      setSignupStatus('failed');
      setIsProcessing(false);
      cleanup();
      
      const errorMessage = error?.message || 'Error al vincular WhatsApp';
      toast.error(errorMessage, {
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
  }, []);

  // Listener de postMessage para Embedded Signup v3
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verificar origen de Facebook/Meta
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id, display_name } = data.data;
            const state = currentStateRef.current;
            
            if (!state) {
              console.error('No state found for embedded signup');
              return;
            }
            
            try {
              // Enviar datos al backend para completar el signup
              await completeEmbeddedSignup({
                state,
                phoneNumberId: phone_number_id,
                wabaId: waba_id,
                displayName: display_name
              });
              
              // El estado se actualizará via Socket.io o polling
              console.log('Embedded signup completed via postMessage');
            } catch (error) {
              console.error('Error completing embedded signup:', error);
              setSignupStatus('failed');
              setIsProcessing(false);
              cleanup();
              
              toast.error('Error al completar la vinculación', {
                position: 'top-right',
                autoClose: 5000,
              });
            }
          } else if (data.event === 'CANCEL') {
            console.log('Embedded signup cancelled by user');
            setSignupStatus('failed');
            setIsProcessing(false);
            cleanup();
            
            toast.warning('Proceso de vinculación cancelado', {
              position: 'top-right',
              autoClose: 3000,
            });
          } else if (data.event === 'ERROR') {
            console.error('Embedded signup error:', data.data);
            setSignupStatus('failed');
            setIsProcessing(false);
            cleanup();
            
            const errorMessage = data.data?.message || 'Error en el proceso de vinculación';
            toast.error(errorMessage, {
              position: 'top-right',
              autoClose: 5000,
            });
          }
        }
      } catch (e) {
        console.log('Non JSON response from postMessage:', event.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [cleanup]);

  // Función para iniciar el polling
  const startPolling = useCallback((state: string) => {
    currentStateRef.current = state;
    startTimeRef.current = Date.now();
    const timeoutDuration = 15 * 60 * 1000; // 15 minutos
    
    // Timeout de 15 minutos
    timeoutRef.current = setTimeout(() => {
      setSignupStatus('failed');
      setIsProcessing(false);
      cleanup();
      toast.error('El proceso de vinculación ha expirado. Por favor, intente nuevamente.', { autoClose: 5000 });
    }, timeoutDuration);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Verificar timeout
        if (Date.now() - startTimeRef.current > timeoutDuration) {
          setSignupStatus('failed');
          setIsProcessing(false);
          cleanup();
          toast.error('El proceso de vinculación ha expirado. Por favor, intente nuevamente.', { autoClose: 5000 });
          return;
        }
        
        const statusResponse = await getEmbeddedSignupStatus(state);
        
        if (statusResponse.status === 'completed') {
          setSignupStatus('completed');
          setIsProcessing(false);
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
          setSignupStatus('failed');
          setIsProcessing(false);
          cleanup();
          
          const errorMessage = statusResponse.error?.message || 'Error al vincular WhatsApp';
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 5000,
          });
        }
        
      } catch (error) {
        console.error('Error polling signup status:', error);
      }
    }, 3000); // Polling cada 3 segundos (más eficiente)
  }, [cleanup, onComplete]);

  // Función para iniciar el signup
  const startSignup = useCallback(async (request: EmbeddedSignupStartRequest = {}) => {
    try {
      setSignupStatus('starting');
      setIsProcessing(true);
      
      // Iniciar el proceso de signup
      const signupResponse = await startEmbeddedSignup({
        tenantId: request.tenantId,
        locale: request.locale || 'es'
      });
      
      // Abrir popup
      popupRef.current = openEmbeddedSignupPopup(signupResponse.signupUrl);
      
      // Validar que el popup no fue bloqueado
      if (!popupRef.current) {
        setSignupStatus('failed');
        setIsProcessing(false);
        toast.error('El popup fue bloqueado. Por favor, habilita los popups en tu navegador e intenta nuevamente.', { autoClose: 7000 });
        return;
      }
      
      // Verificar si el popup se cerró inmediatamente
      setTimeout(() => {
        if (popupRef.current && popupRef.current.closed) {
          setSignupStatus('failed');
          setIsProcessing(false);
          cleanup();
          toast.error('El popup se cerró inmediatamente. Por favor, habilita los popups en tu navegador e intenta nuevamente.', { autoClose: 7000 });
        }
      }, 500);
      
      setSignupStatus('in_progress');
      
      // Iniciar polling para verificar el estado (fallback si Socket.io no funciona)
      if (!isConnected || !socket) {
        console.log('Socket.io not connected, using polling as fallback');
        startPolling(signupResponse.state);
      } else {
        currentStateRef.current = signupResponse.state;
        console.log('Socket.io connected, listening for real-time updates');
      }
      
    } catch (error) {
      console.error('Error starting signup:', error);
      setSignupStatus('failed');
      setIsProcessing(false);
      cleanup();
      
      toast.error('Error al iniciar el proceso de vinculación', {
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
  }, [cleanup]);

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
    startSignup,
    stopPolling,
  };
};

