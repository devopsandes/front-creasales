import { Usuario } from "./auth.interface";

export type MediaUrl = string | { statusCode?: number; expires?: number; url?: string };

export type TimelineItem =
    | {
          kind: "message";
          id: string;
          createdAt: string | Date;
          msg_entrada?: string | null;
          msg_salida?: string | null;
          type?: "text" | "image" | "document" | "audio";
          imageUrl?: MediaUrl;
          documentUrl?: MediaUrl;
          audioUrl?: MediaUrl;
          traduccion?: string | null;
      }
    | {
          kind: "event";
          id: string;
          createdAt: string | Date;
          type: string;
          text: string;
          payload?: any;
      }
    // Compatibilidad temporal con mensajes legacy (sin `kind`)
    | {
          kind?: undefined;
          id?: string;
          createdAt: string | Date;
          updatedAt?: string | Date;
          msg_entrada?: null | string;
          msg_salida?: null | string;
          nota?: any;
          leido?: boolean;
          type?: any;
          imageUrl?: any;
          documentUrl?: any;
          audioUrl?: any;
          traduccion?: any;
      };

export interface TimelineResponse {
    statusCode: number;
    page: number;
    limit: number;
    total: number;
    items: TimelineItem[];
}

export interface ChatTag {
    id:        string;
    nombre:    string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface ChatState {
    archivar: boolean;
    cliente:   Cliente;
    createdAt: Date;
    id:        string;
    operador: Usuario | null;
    thread_id: string;
    updatedAt: Date;
    mensajes:  Mensaje[];
    tags?:     ChatTag[];
    assignment?: 'bot' | 'unassigned' | 'assigned';
    /**
     * Option C (backend agregado):
     * - `unreadCount`: cantidad de mensajes ENTRANTES no leídos.
     * - `lastIncomingMessageAt`: timestamp del último mensaje ENTRANTE recibido.
     * Estos campos son opcionales para mantener compatibilidad con backends viejos.
     */
    unreadCount?: number;
    lastIncomingMessageAt?: Date | string;
    manualUnread?: boolean;
    lastReadAt?: Date | string | null;
    /**
     * Fallbacks opcionales si el backend decide exponerlos.
     */
    lastMessageAt?: Date | string;
    lastMessageDirection?: 'incoming' | 'outgoing';
}

export interface Cliente {
    apellido:   string;
    chat:       string;
    createdAt:  Date;
    cuil:       string;
    email:      string;
    estado:     Estado;
    id:         string;
    ingreso:    Date;
    nacimiento: string;
    nombre:     string;
    notas:      string;
    nro_doc:    string;
    telefono:   string;
    tipo_doc:   string;
    updatedAt:  Date;
}

export interface Estado {
    id:          string;
    nombre:      string;
    descripcion: string;
    referencia:  string;
}

export interface ChatResponse {
    statusCode: number;
    chat:       Chat;
}

export interface Chat {
    id:        string;
    thread_id: string;
    createdAt: Date;
    updatedAt: Date;
    mensajes:  Mensaje[];
}

export interface Mensaje {
    id?:          string;
    msg_id?:      string;
    msg_entrada?: null | string;
    msg_salida?:  null | string;
    nota?:        null;
    leido?:       boolean;
    createdAt:   Date;
    updatedAt:   Date;
}

export interface ChatsResponse {
    statcusCode: number;
    chats:       ChatState[];
}

export interface Chat {
    id:        string;
    thread_id: string;
    archivar:  boolean;
    createdAt: Date;
    updatedAt: Date;
    cliente:   Cliente;
    operador:  Operador | null;
}



export interface Operador {
    id:         string;
    nombre:     string;
    apellido:   string;
    nacimiento: Date;
    telefono:   string;
    tipo_doc:   string;
    nro_doc:    number;
    cuil:       null;
    email:      string;
    createdAt:  Date;
    updatedAt:  Date;
    verificado: boolean;
    token:      string;
    role:       string;
    activo:     boolean;
}


