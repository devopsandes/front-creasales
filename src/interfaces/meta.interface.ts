export interface DataMeta {
    graph_api_token: string;
    id_phone_number: number;
    user_token?: string;
    servicios: string;
}

export interface MetaResponse {
    graph_api_token: string;
    id_phone_number: number;
    statusCode?: number;
    message?: string | string[];
    error?: string;
}