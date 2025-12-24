

export interface TagsResponse {
    statusCode: number;
    tags:       Tag[];
}

export interface Tag {
    id:      string;
    nombre:  string;
    empresa: Empresa;
}

export interface Empresa {
    nombre: string;
}
