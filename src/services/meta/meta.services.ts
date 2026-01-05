import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { DataMeta, MetaResponse } from "../../interfaces/meta.interface"



const createMeta = async (token: string, dataMeta: DataMeta): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/meta`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,dataMeta,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.log(error);
            
            const objeto:  SuccessResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const getMeta = async (token: string): Promise<MetaResponse> => {
    try {
        // ✅ CAMBIO: Agregar /current al final de la URL
        const url = `${import.meta.env.VITE_URL_BACKEND}/meta/current`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.get<any>(url, { headers })

        // ✅ CAMBIO: Parsear data.meta en lugar de data directamente
        // El backend devuelve: { statusCode: 200, meta: { graph_api_token, id_phone_number, ... } }
        if (data.meta && data.meta.graph_api_token && data.meta.id_phone_number) {
            return {
                graph_api_token: data.meta.graph_api_token,
                id_phone_number: data.meta.id_phone_number,
                statusCode: data.statusCode || 200
            }
        } else {
            // No se encontró configuración (meta es null)
            return {
                graph_api_token: '',
                id_phone_number: 0,
                statusCode: data.statusCode || 404,
                message: data.message || 'No se encontró la configuración de Meta'
            }
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            // Si es 404, significa que no hay configuración
            if (error.response.status === 404) {
                return {
                    graph_api_token: '',
                    id_phone_number: 0,
                    statusCode: 404,
                    message: error.response.data?.message || 'No se encontró la configuración de Meta'
                }
            }
            
            const errorMessage = error.response.data?.message || 'Error al obtener la configuración de Meta';
            const objeto: MetaResponse = {
                graph_api_token: '',
                id_phone_number: 0,
                statusCode: error.response.status,
                message: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
                error: error.response.data?.error || 'Error desconocido'
            }
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

export { createMeta, getMeta  }