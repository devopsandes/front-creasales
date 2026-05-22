

export interface TagsResponse {
    statusCode: number;
    tags:       Tag[];
}

/** Respuesta de GET /tags/chat/:chatId (admin); forma puede variar según versión del backend */
export interface ChatTagsResponse {
    statusCode: number;
    tags?: Tag[];
    items?: Tag[];
}

export interface BulkChatTagsItem {
    chatId: string;
    tags: Tag[];
}

export interface BulkChatTagsResponse {
    statusCode: number;
    items: BulkChatTagsItem[];
}

export interface Tag {
    id:      string;
    nombre:  string;
    empresa: Empresa;
}

export interface Empresa {
    nombre: string;
}
