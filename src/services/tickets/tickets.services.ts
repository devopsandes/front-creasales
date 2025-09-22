import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { QueryParams, TicketsResponse, TicketResponse } from "../../interfaces/tickets.interface"



const getTickets = async (token: string, { limit, page } : QueryParams): Promise<TicketsResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets?limit=${limit}&page=${page}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios<TicketsResponse & ErrorResponse>(url, { headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  TicketsResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const getTicketById = async (token: string,  id : string): Promise<TicketResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tickets/${id}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios<TicketResponse & ErrorResponse>(url, { headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  TicketResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}





export { getTickets, getTicketById  }