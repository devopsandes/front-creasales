import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { ChatTagsResponse, TagsResponse } from "../../interfaces/tags.interface"
import { resolveClient } from "../apiClient"



const tagsClient = resolveClient("tags")

const createTag = async (token: string, nombre: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.post<SuccessResponse & ErrorResponse>('/tags',{ nombre },{ headers })


        return data
    } catch (error) {
        
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  SuccessResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const getTags = async (token: string): Promise<TagsResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.get<TagsResponse & ErrorResponse>('/tags',{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  TagsResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

/**
 * Etiquetas asignadas a un chat (admin como fuente de verdad).
 * GET /api/v1/tags/chat/:chatId
 */
const getTagsByChatId = async (
    token: string,
    chatId: string,
    options?: { signal?: AbortSignal }
): Promise<ChatTagsResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await tagsClient.get<ChatTagsResponse & ErrorResponse>(`/tags/chat/${chatId}`, {
            headers,
            signal: options?.signal,
        })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ChatTagsResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}


const asignarTag = async (token: string, chatId: string, tagId: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const body = { chatId, tagId }

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.post<SuccessResponse & ErrorResponse>('/tags/assignate', body, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

const updateTag = async (token: string, tagId: string, nombre: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.patch<SuccessResponse & ErrorResponse>(`/tags/${tagId}`, { nombre }, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

const deleteTag = async (token: string, tagId: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.delete<SuccessResponse & ErrorResponse>(`/tags/${tagId}`, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

const removeTagFromChat = async (token: string, chatId: string, tagId: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
        const { data } = await tagsClient.delete<SuccessResponse & ErrorResponse>('/tags/assignate', {
            headers,
            data: { chatId, tagId }
        })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

export { createTag, getTags, getTagsByChatId, asignarTag, updateTag, deleteTag, removeTagFromChat }
