import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { ChatResponse } from "../../interfaces/chats.interface"



const findChatById = async (token: string, id: string): Promise<ChatResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/chats/${id}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.get<ChatResponse & ErrorResponse>(url,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  ChatResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}



export {  findChatById  }