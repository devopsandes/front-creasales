import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { QueryParams, TicketsResponse, TicketResponse } from "../../interfaces/tickets.interface"
import { resolveClient } from "../apiClient"

const ticketsClient = resolveClient("tickets")

const buscarAfiliado = async (token: string, search: string) => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await ticketsClient.get(`/tickets/buscar-afiliado/${search}`, { headers })

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
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await ticketsClient.get<TicketsResponse & ErrorResponse>('/tickets', {
            headers,
            params: { limit, page }
        })

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
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await ticketsClient.get<TicketResponse & ErrorResponse>(`/tickets/${id}`, { headers })

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
        const headers = {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }

        const { data } = await ticketsClient.post<TicketResponse & ErrorResponse>(
            '/tickets',
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
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await ticketsClient.delete(`/tickets/${id}`, { headers })

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
        const url = `https://fiscalizacion.creasales.com/contratos/deuda?search=${cuil}`

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

const uploadArchivos = async (token: string, ticketId: string, files: File[]) => {
    try {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('files', file);
        });

        const headers = {
            authorization: `Bearer ${token}`
        };

        const { data } = await ticketsClient.post(`/tickets/${ticketId}/archivos`, formData, { headers });

        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export const irAZoho = async (token: string, ticketId: string) => {
    try {
        const headers = { authorization: `Bearer ${token}` };
        const { data } = await ticketsClient.post(`/tickets/${ticketId}/ir-a-zoho`, {}, { headers });
        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export { getTickets, getTicketById, createTicket, buscarAfiliado, deleteTicket, consultarDeuda, uploadArchivos }


