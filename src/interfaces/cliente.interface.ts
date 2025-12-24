export interface ClientesResponse {
    statusCode: number;
    clientes:   Cliente[];
}

export interface Cliente {
    id:         string;
    nombre:     string;
    apellido:   null;
    nacimiento: null;
    telefono:   string;
    tipo_doc:   null;
    nro_doc:    null;
    cuil:       null;
    email:      null;
    createdAt:  Date;
    updatedAt:  Date;
    ingreso:    Date;
    notas:      null;
    chat:       Chat;
}

export interface Chat {
    id:        string;
    thread_id: string;
    archivar:  boolean;
    createdAt: Date;
    updatedAt: Date;
}
