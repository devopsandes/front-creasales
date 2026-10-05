
import { Empresa } from "./empresa.interface";

export interface DataLogin {
    email: string
    password: string
    turnstileToken?: string
    dispositivoToken?: string
}

export interface LoginResponse {
    id: string;
    role: string;
    token: string;
    // MFA: cuando falta el código, no viene token y viene esto.
    mfaRequerido?: boolean;
    mfaTicket?: string;
    emailEnmascarado?: string;
    // "Recordar este navegador": solo al validar el código con recordar=true.
    dispositivoToken?: string;
}

export interface DataVerificarMfa {
    mfaTicket: string
    codigo: string
    recordar: boolean
}

export interface ErrorResponse {
    message: string[];
    error: string;
    statusCode: number;
    code?: string;
}

export interface SuccessResponse {
    statusCode: number;
    msg: string;
}

export interface UsersResponse {
    statusCode: number;
    msg: string;
    users: Usuario[];
}



export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    nacimiento: Date;
    telefono: string;
    tipo_doc: string;
    nro_doc: number;
    cuil: null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    verificado: boolean;
    token: string;
    role: string;
    activo: boolean;
}


export interface DataRegister {
    nombre: string;
    apellido: string;
    email: string;
    nacimiento: string;
    telefono: string;
    tipo_doc: string;
    nro_doc: number;
    password: string;
    role: string;
    empresa_id?: string | undefined;
}

export interface ValidationResponse {
    statusCode: number
    msg: string
}

export interface User {
    id: string;
    name: string;
    email: string;
};

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    message: string;
    empresa: Empresa | null;
};

