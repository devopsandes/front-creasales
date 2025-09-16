import { Usuario } from "./auth.interface";

export interface ChatState {
    archivar: boolean;
    cliente:   Cliente;
    createdAt: Date;
    id:        string;
    operador: Usuario;
    thread_id: string;
    updatedAt: Date;
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


