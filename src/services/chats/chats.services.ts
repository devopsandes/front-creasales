import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { ChatResponse, ChatsResponse, TimelineResponse } from "../../interfaces/chats.interface"
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

const findChatTimeline = async (
    token: string,
    id: string,
    params?: { page?: number; limit?: number }
): Promise<TimelineResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/chats/${id}/timeline`

        const headers = {
            authorization: `Bearer ${token}`,
        }

        const query = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 200,
        }

        const debug =
            import.meta.env.DEV &&
            typeof window !== "undefined" &&
            window.localStorage?.getItem("debugTimeline") === "1"

        if (debug) {
            console.log("[findChatTimeline] GET", url, { params: query })
        }

        const { data } = await axios.get<TimelineResponse & ErrorResponse>(url, {
            headers,
            params: query,
        })

        if (debug) {
            console.log("[findChatTimeline] OK", {
                statusCode: (data as any)?.statusCode,
                page: (data as any)?.page,
                limit: (data as any)?.limit,
                total: (data as any)?.total,
                itemsPreview: Array.isArray((data as any)?.items) ? (data as any).items.slice(0, 3) : (data as any)?.items,
            })
        }

        return data
    } catch (error) {
        const debug =
            import.meta.env.DEV &&
            typeof window !== "undefined" &&
            window.localStorage?.getItem("debugTimeline") === "1"

        if (axios.isAxiosError(error) && error.response) {
            if (debug) {
                console.log("[findChatTimeline] ERROR", {
                    url: `${import.meta.env.VITE_URL_BACKEND}/chats/${id}/timeline`,
                    status: error.response.status,
                    data: error.response.data,
                })
            }
            const objeto: TimelineResponse & ErrorResponse = error.response.data
            return objeto
        }
        if (debug) {
            console.log("[findChatTimeline] ERROR (no response)", error)
        }
        throw error
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
        const url = `${import.meta.env.VITE_URL_BACKEND}/chats?page=${page}&limit=${limit}`

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

/**
 * Backend actual:
 * - PATCH /chats/:id/read-state  body: { state: "read" | "unread" }
 * - Idempotente
 */
const setChatReadState = async (
    token: string,
    chatId: string,
    state: "read" | "unread"
): Promise<
    | ({ ok?: boolean; statusCode?: number; chatId?: string; state?: "read" | "unread"; unreadCount?: number; manualUnread?: boolean; lastIncomingMessageAt?: string | null; lastReadAt?: string | null } & ErrorResponse)
    | any
> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/chats/${chatId}/read-state`
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await axios.patch(url, { state }, { headers })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: any = error.response.data
            return objeto
        }
        throw error
    }
}


export { findChatById, findChatTimeline, getUserData, getChats, setChatReadState }