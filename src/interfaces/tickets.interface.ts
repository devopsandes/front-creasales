import { Estado } from './chats.interface';
export interface QueryParams {
    page: string
    limit: string
}

export interface TicketsResponse {
    statusCode: number;
    tickets:    Ticket[];
}

export interface Ticket {
    id:          string;
    nombre:      string;
    descripcion: string;
    prioridad:   string;
    canal:       string;
    closedAt:    null;
    comentarios: null;
    nro:         string;
    createdAt:   Date;
    updatedAt:   Date;
    chat:        Chat;
    estado:     Estado;
}

export interface Chat {
    id:        string;
    thread_id: string;
    archivar:  boolean;
    createdAt: Date;
    updatedAt: Date;
}
