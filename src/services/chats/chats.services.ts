import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { ChatResponse, ChatsResponse } from "../../interfaces/chats.interface"
import { DataUser } from "../../interfaces/action.interface"



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

const getUserData = async (telefono: string): Promise<DataUser & ErrorResponse>=> {
    try {
        const url = `https://tickets.createch.com.ar/mensajes/getUserData?telefono=${telefono}`

        const { data } = await axios.get<DataUser & ErrorResponse>(url)

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: DataUser & ErrorResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}


const getChats = async (token: string, page: string, limit: string): Promise< ChatsResponse & ErrorResponse> => {
    try {
        const url = `https://sales.createch.com.ar/api/v1/chats?page=${page}&limit=${limit}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.get<ChatsResponse & ErrorResponse>(url,{ headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ChatsResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}



export {  findChatById, getUserData, getChats }