import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { io, Socket } from "socket.io-client";
import { perfTrackReconnectAttempt } from "../../utils/perfTracker";

const SOCKET_URL = `${import.meta.env.VITE_URL_BACK}`;

const perfEnabled = () =>
  typeof window !== "undefined" && window.localStorage?.getItem("perfLogs") === "1";

let socket: Socket | null = null;
let listenersAttached = false;
let handleConnect: (() => void) | null = null;
let handleDisconnect: (() => void) | null = null;
let handleConnectError: (() => void) | null = null;

const emitSocketConnectionState = (connected: boolean) => {
  import("../store")
    .then((mod) => {
      const reduxStore = mod.default as { dispatch: (action: { type: string; payload: boolean }) => void };
      reduxStore.dispatch({ type: "socket/setSocketConnectedState", payload: connected });
    })
    .catch(() => {
      // noop
    });
};

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
    setSocketConnectedState: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    connectSocket: (state) => {
      if (!socket) {
        socket = io(SOCKET_URL, {
          transports: ["websocket"],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 12,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          randomizationFactor: 0.4,
          auth: {
            token: localStorage.getItem("token"),
          },
        });
      }

      if (socket && !listenersAttached) {
        handleConnect = () => {
          if (perfEnabled()) {
            console.log("[perf.front]", {
              event: "socket.connected",
              socketId: socket?.id ?? null,
              connectListeners: socket?.listeners("connect")?.length ?? 0,
              disconnectListeners: socket?.listeners("disconnect")?.length ?? 0,
            });
          }
          emitSocketConnectionState(true);
        };

        handleDisconnect = () => {
          perfTrackReconnectAttempt("socket.disconnect");
          if (perfEnabled()) {
            console.log("[perf.front]", {
              event: "socket.disconnected",
              socketId: socket?.id ?? null,
            });
          }
          emitSocketConnectionState(false);
        };

        handleConnectError = () => {
          perfTrackReconnectAttempt("socket.connect_error");
          if (perfEnabled()) {
            console.log("[perf.front]", {
              event: "socket.connect_error",
              socketId: socket?.id ?? null,
            });
          }
          emitSocketConnectionState(false);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        listenersAttached = true;
      }

      if (socket && perfEnabled()) {
        console.log("[perf.front]", {
          event: socket.connected ? "socket.reuse_connected" : "socket.reuse_disconnected",
          socketId: socket.id ?? null,
          connected: socket.connected,
          connectListeners: socket.listeners("connect")?.length ?? 0,
          disconnectListeners: socket.listeners("disconnect")?.length ?? 0,
        });
      }

      state.isConnected = Boolean(socket?.connected);
    },
    disconnectSocket: (state) => {
      if (socket && listenersAttached) {
        if (handleConnect) socket.off("connect", handleConnect);
        if (handleDisconnect) socket.off("disconnect", handleDisconnect);
        if (handleConnectError) socket.off("connect_error", handleConnectError);
      }

      socket?.disconnect();
      socket = null;
      listenersAttached = false;
      handleConnect = null;
      handleDisconnect = null;
      handleConnectError = null;
      state.isConnected = false;
    },
    addMessage: (state, action: PayloadAction<string>) => {
      state.messages.push(action.payload);
    },
  },
});

export const { connectSocket, disconnectSocket, addMessage, setSocketConnectedState } = socketSlice.actions;
export default socketSlice.reducer;

export const getSocket = () => socket;

