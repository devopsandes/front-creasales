import axios from "axios"
import { resolveClient } from "../apiClient"
import {
    CrearTicketSoporteDatos, ListaTicketsSoporteResponse, RespuestaBase, TicketSoporteResponse,
} from "../../interfaces/soporte.interface"

const client = resolveClient("soporte")

// El token lo agrega el interceptor de apiClient. Los errores HTTP vuelven como data,
// igual que en el resto de los services, para que la página muestre el mensaje.
const pedir = async <T>(fn: () => Promise<{ data: T }>): Promise<T> => {
    try {
        const { data } = await fn()
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) return error.response.data as T
        throw error
    }
}

export const listarTicketsSoporte = (params: { estado?: string; page?: number; limit?: number }) =>
    pedir<ListaTicketsSoporteResponse>(() => client.get('/soporte/tickets', { params }))

export const verTicketSoporte = (id: string) =>
    pedir<TicketSoporteResponse>(() => client.get(`/soporte/tickets/${id}`))

export const crearTicketSoporte = (datos: CrearTicketSoporteDatos) =>
    pedir<TicketSoporteResponse>(() => client.post('/soporte/tickets', datos))

export const comentarTicketSoporte = (id: string, texto: string) =>
    pedir<RespuestaBase>(() => client.post(`/soporte/tickets/${id}/comentarios`, { texto }))

export const cerrarTicketSoporte = (id: string) =>
    pedir<TicketSoporteResponse>(() => client.patch(`/soporte/tickets/${id}/cerrar`, {}))

export const subirAdjuntosSoporte = (id: string, archivos: File[]) => {
    const form = new FormData()
    archivos.forEach((a) => form.append('archivos', a))
    return pedir<RespuestaBase & { adjuntos?: any[] }>(() => client.post(`/soporte/tickets/${id}/adjuntos`, form))
}