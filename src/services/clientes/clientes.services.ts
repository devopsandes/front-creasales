import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { QueryParams } from "../../interfaces/tickets.interface"
import { ClientesResponse } from "../../interfaces/cliente.interface"
import { resolveClient } from "../apiClient"

const clientesClient = resolveClient("chats") // cae en convClient, igual que /chats

const getClientes = async (token: string, { limit, page } : QueryParams): Promise<ClientesResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/clientes?limit=${limit}&page=${page}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios<ClientesResponse & ErrorResponse>(url, { headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  ClientesResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

export interface AfiliadoBusquedaDto {
    dni: string
    nombre: string | null
    apellido: string | null
    telefono: string
    cuil: string | null
    plan: string | null
    provincia: string | null
}

export interface BuscarClientePorDniResponse {
    statusCode?: number
    afiliado?: AfiliadoBusquedaDto
    telefonoYaExiste?: boolean
}

export interface CrearClienteManualPayload {
    dni: string
    telefono: string
    nombre?: string | null
    apellido?: string | null
}

export interface CrearClienteManualResponse {
    statusCode?: number
    cliente?: any
    chat?: any
}

const buscarClientePorDni = async (
    token: string,
    dni: string
): Promise<BuscarClientePorDniResponse & ErrorResponse> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await clientesClient.get(`/clientes/buscar-por-dni/${dni}`, { headers })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) return error.response.data as any
        throw error
    }
}

const crearClienteManual = async (
    token: string,
    payload: CrearClienteManualPayload
): Promise<CrearClienteManualResponse & ErrorResponse> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await clientesClient.post('/clientes/crear-manual', payload, { headers })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) return error.response.data as any
        throw error
    }
}

export { getClientes, buscarClientePorDni, crearClienteManual }