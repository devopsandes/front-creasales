export interface DataModulo {
    nombre: string;
    descripcion: string;
}


export interface FindModulosResponse {
    statusCode: number;
    modulos:    Modulo[];
}

export interface Modulo {
    id:          string;
    nombre:      string;
    descripcion: string;
    admin:       null;
    usuarios:    any[];
    categorias:  any[];
}
