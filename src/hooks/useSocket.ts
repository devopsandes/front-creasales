// hooks/useSocket.ts
/* import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../app/store"; // Ajusta la ruta según tu proyecto
import { connectSocket, disconnectSocket, emitEvent } from "../app/slices/socketSlice";
import { getSocket } from "../app/slices/socketSlice";
 */
/* export const useSocket = () => {
  const dispatch = useDispatch();

  // Extraemos estado del store
  const { isConnected, socketId, messages } = useSelector(
    (state: RootState) => state.socket
  );

  // Conectar/desconectar automáticamente al montar/desmontar
  useEffect(() => {
    dispatch(connectSocket());

    return () => {
      dispatch(disconnectSocket());
    };
  }, [dispatch]);

  // Obtenemos instancia real del socket
  const socket = getSocket();

  // Wrapper para emitir eventos desde el hook
  const emit = (event: string, data: any) => {
    dispatch(emitEvent({ event, data }));
  };

  return {
    socket,
    isConnected,
    socketId,
    messages,
    emit,
  };
};
 */