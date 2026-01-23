import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { DataEmpresa, EmpresaResponse } from "../../interfaces/empresa.interface"
import { Usuario } from "../../interfaces/auth.interface"

const empresaXUser = async (token: string): Promise<EmpresaResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/empresas/usuarios`
        

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.get<EmpresaResponse & ErrorResponse>(url,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  EmpresaResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const createEmpresa = async (token: string, dataEmpresa: DataEmpresa): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/empresas`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,dataEmpresa,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            
            const objeto:  SuccessResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

/**
 * Obtiene los operadores disponibles para menciones/asignaciones, scoped a la empresa del usuario autenticado.
 *
 * Backend propuesto: GET /empresas/usuarios/operators (auth requerida; roles USER|ADMIN|ROOT)
 * Respuesta esperada: { statusCode: 200, users: Usuario[] }
 */
const getOperadoresEmpresa = async (token: string): Promise<{ statusCode: number; users?: Usuario[] } & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/empresas/usuarios/operators`
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.get<any>(url, { headers })

        // toleramos distintas formas de respuesta para no ser frágiles:
        // - { users: [...] }
        // - { operadores: [...] }
        // - { data: [...] }
        const users =
            Array.isArray(data?.users) ? data.users :
            Array.isArray(data?.operadores) ? data.operadores :
            Array.isArray(data?.data) ? data.data :
            undefined

        return {
            statusCode: data?.statusCode ?? 200,
            users,
        } as any
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: any = error.response.data
            return {
                statusCode: objeto?.statusCode ?? error.response.status,
                message: objeto?.message ?? ['Error al obtener operadores'],
                error: objeto?.error ?? 'Error',
                users: [],
            }
        }
        throw error
    }
}

export { empresaXUser, createEmpresa, getOperadoresEmpresa }