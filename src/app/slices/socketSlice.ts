import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { io, Socket } from "socket.io-client";
import { recordSocketReconnect } from "../../utils/frontendObservability";

/* // Variable externa para almacenar la instancia del socket
export let socket: Socket | null = null;

// Define el tipo para el estado inicial
interface SocketState {
    isConnected: boolean; // Indica si el socket está conectado
    socketId: string | null; // Almacena el ID del socket (opcional)
}

// Estado inicial
const initialState: SocketState = {
    isConnected: false,
    socketId: null,
};

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        // Conectar el socket
        connectSocket: (state, action: PayloadAction<string>) => {
            if (!socket) {
                socket = io(action.payload, {
                    transports: ['websocket'],
                    withCredentials: true,
                    auth: {
                        token: localStorage.getItem('token'),
                    },
                });

                socket.on('connect', () => {
                    state.isConnected = true;
                    state.socketId = socket?.id || null;
                });

                socket.on('disconnect', () => {
                    state.isConnected = false;
                    state.socketId = null;
                });
            }
        },

        // Desconectar el socket
        disconnectSocket: (state) => {
            if (socket) {
                socket.disconnect();
                socket = null;
                state.isConnected = false;
                state.socketId = null;
            }
        },


        // Emitir eventos al socket (opcional)
        emitEvent: (state, action: PayloadAction<{ event: string; data: any }>) => {
            if (socket) {
                socket.emit(action.payload.event, action.payload.data);
            }
        },
    },
});

export const { connectSocket, disconnectSocket, emitEvent } = socketSlice.actions;
export default socketSlice.reducer; */


const SOCKET_URL = `${import.meta.env.VITE_URL_BACK}`; // URL de tu backend con Socket.IO


let socket: Socket | null = null; // Variable externa para almacenar la instancia del socket
let hasConnectedOnce = false

interface SocketState {
    isConnected: boolean;
    messages: string[];
}
  

const initialState: SocketState = {
    isConnected: false,
    messages: [],
};

const socketSlice = createSlice({
    name: "socket",
    initialState,
    reducers: {
      connectSocket: (state) => {
        
        if (!socket) {
            
            socket = io(SOCKET_URL,{
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 30000,
                randomizationFactor: 0.5,
                timeout: 20000,
                auth: {
                    token: localStorage.getItem('token')
                }
            });

            // TODO: revisar error de conexión al socket
            // state.isConnected = true;
            socket.on('connect', () => {
                // console.log('se conecta al socket');
                if (hasConnectedOnce) {
                    recordSocketReconnect()
                }
                hasConnectedOnce = true
            })

            socket.on('disconnect', () => {
                // alert('Su sesión ha caducado')
            })
        }
        state.isConnected = true;
      },
      disconnectSocket: (state) => {
        // TODO: revisar error de conexión al socket
        socket?.disconnect();
        socket = null;
        hasConnectedOnce = false
        state.isConnected = false;
      },
      addMessage: (state, action: PayloadAction<string>) => {
        state.messages.push(action.payload);
      },
    },
  });
  
  export const { connectSocket, disconnectSocket, addMessage } = socketSlice.actions;
  export default socketSlice.reducer;
  
  // Exportamos la instancia del socket para poder usarla en los componentes
  export const getSocket = () => socket;