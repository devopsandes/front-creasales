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
    comentarios: string;
    nro:         string;
    createdAt:   Date;
    updatedAt:   Date;
    chat:        Chat;
    estado:     Estado;
    departamento?: string;    
    tipificacion?: string;    
    afiliadoData?: any; 
}

/* export interface Chat {
    id:        string;
    thread_id: string;
    archivar:  boolean;
    createdAt: Date;
    updatedAt: Date;
} */

export interface TicketResponse {
    statusCode: number;
    ticket:     Ticket;
}

export interface Ticket {
    id:          string;
    nombre:      string;
    descripcion: string;
    prioridad:   string;
    canal:       string;
    closedAt:    null;
    comentarios: string;
    nro:         string;
    createdAt:   Date;
    updatedAt:   Date;
    chat:        Chat;
    estado:      Estado;
}

export interface Chat {
    id:        string;
    thread_id: string;
    archivar:  boolean;
    createdAt: Date;
    updatedAt: Date;
    cliente?:   Cliente;
}

export interface Cliente {
    id:         string;
    nombre:     string;
    apellido:   null;
    nacimiento: null;
    telefono:   string;
    tipo_doc:   string;
    nro_doc:    number;
    cuil:       string;
    email:      string;
    createdAt:  Date;
    updatedAt:  Date;
    ingreso:    Date;
    notas:      null;
}

