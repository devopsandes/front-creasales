import { AxiosError } from 'axios'

export interface ProvinciasResponse {
    cantidad:   number;
    inicio:     number;
    parametros: Parametros;
    provincias: Provincia[];
    total:      number;
}

export interface Parametros {
}

export interface Provincia {
    centroide: Centroide;
    id:        string;
    nombre:    string;
}

export interface Centroide {
    lat: number;
    lon: number;
}

export type AxiosErrorType<T = any> = AxiosError<T>


export interface MunicipiosResponse {
    cantidad:   number;
    inicio:     number;
    municipios: Municipio[];
    parametros: Parametros;
    total:      number;
}

export interface Municipio {
    id:     string;
    nombre: string;
}

export interface Parametros {
    campos:    string[];
    max:       number;
    provincia: string[];
}

export interface NavTagProps {
    tags: Tag[]
}

export interface Tag {
    id: number
    path: string
    name: string
}
