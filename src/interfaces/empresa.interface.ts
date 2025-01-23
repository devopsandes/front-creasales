export interface EmpresaResponse {
   statusCode: number;
   empresa: Empresa;
}

export interface Empresa {
    id: number;
    nombre: string;
    cuit: string;
    direccion: string;
    telefono: string;
    email: string;
    provincia: string;
    municipio: string;
    rubro: string;
    activo: boolean;
}

export interface DataEmpresa {
    nombre: string;
    direccion: string;
    sitio_web: string;
    email: string;
    telefono: string;
    pais: string;
    provincia: string;
    municipio: string;
    CUIT: string;
    sector: string;
    tamano: string;
}