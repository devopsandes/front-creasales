import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { QueryParams } from "../../interfaces/tickets.interface"
import { ClientesResponse } from "../../interfaces/cliente.interface"



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





export { getClientes  }