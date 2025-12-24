import { useEffect, useCallback, useRef, useState } from 'react';
import { getSocket } from '../app/slices/socketSlice';
import { Socket } from 'socket.io-client';

interface UseWhatsAppSocketProps {
  onSignupCompleted?: (data: any) => void;
  onSignupFailed?: (error: any) => void;
}

export const useWhatsAppSocket = ({ 
  onSignupCompleted, 
  onSignupFailed 
}: UseWhatsAppSocketProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Obtener la instancia del socket global
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    
    if (socket) {
      setIsConnected(socket.connected);
      
      // Listener de conexión
      const handleConnect = () => {
        console.log('Socket.io connected');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      // Listener de desconexión
      const handleDisconnect = () => {
        console.log('Socket.io disconnected');
        setIsConnected(false);
        
        // Intentar reconexión después de 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }, 5000);
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, []);

  // Manejar evento de signup completado
  const handleSignupCompleted = useCallback((data: any) => {
    console.log('Socket: WhatsApp signup completed', data);
    
    // No mostrar toast aquí porque ya se muestra en el componente principal
    // toast.success('WhatsApp vinculado exitosamente!', {
    //   position: 'top-right',
    //   autoClose: 3000,
    // });
    
    if (onSignupCompleted) {
      onSignupCompleted(data);
    }
  }, [onSignupCompleted]);

  // Manejar evento de signup fallido
  const handleSignupFailed = useCallback((error: any) => {
    console.error('Socket: WhatsApp signup failed', error);
    
    // No mostrar toast aquí porque ya se muestra en el componente principal
    // const errorMessage = error?.message || 'Error al vincular WhatsApp';
    // toast.error(errorMessage, {
    //   position: 'top-right',
    //   autoClose: 5000,
    // });
    
    if (onSignupFailed) {
      onSignupFailed(error);
    }
  }, [onSignupFailed]);

  // Escuchar eventos de WhatsApp onboarding
  useEffect(() => {
    const socket = socketRef.current;
    
    if (!socket) {
      console.warn('Socket not available, using polling as fallback');
      return;
    }
    
    socket.on('wa:onboarding:completed', handleSignupCompleted);
    socket.on('wa:onboarding:failed', handleSignupFailed);
    
    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.off('wa:onboarding:completed', handleSignupCompleted);
        socket.off('wa:onboarding:failed', handleSignupFailed);
      }
    };
  }, [handleSignupCompleted, handleSignupFailed]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};
