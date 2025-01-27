export interface DataCategoria {
    modulo_id: string;
    nombre: string;
    descripcion: string;
}

export interface FindCategoriasResponse {
    statusCode: number;
    categorias: Categoria[];
}

export interface Categoria {
    id:          string;
    nombre:      string;
    descripcion: string;
    tareas:      any[];
    chats:       any[];
}
