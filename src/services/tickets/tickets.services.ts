import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { QueryParams, TicketsResponse, TicketResponse } from "../../interfaces/tickets.interface"

const buscarAfiliado = async (token: string, search: string) => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets/buscar-afiliado/${search}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.get(url, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data
        }
        throw error;
    }
}

const getTickets = async (token: string, { limit, page }: QueryParams): Promise<TicketsResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets?limit=${limit}&page=${page}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios<TicketsResponse & ErrorResponse>(url, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: TicketsResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error;
    }
}

const getTicketById = async (token: string, id: string): Promise<TicketResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets/${id}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios<TicketResponse & ErrorResponse>(url, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: TicketResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error;
    }
}

const createTicket = async (
    token: string,
    ticketData: {
        nombre: string;
        descripcion: string;
        departamento: string;
        tipificacion: string;
        afiliadoData: any;
        chat_id?: string;
        archivos?: string;
    }
): Promise<TicketResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets`

        const headers = {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }

        const { data } = await axios.post<TicketResponse & ErrorResponse>(
            url,
            ticketData,
            { headers }
        )

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data
        }
        throw error;
    }
}

const deleteTicket = async (token: string, id: string): Promise<any> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets/${id}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.delete(url, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data
        }
        throw error;
    }
}

const consultarDeuda = async (token: string, cuil: string) => {
    try {
        const url = `https://fiscalizacion.createch.com.ar/contratos/deuda?search=${cuil}`

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }

        const { data } = await axios.post(url, {}, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data
        }
        throw error;
    }
}

export { getTickets, getTicketById, createTicket, buscarAfiliado, deleteTicket, consultarDeuda }


