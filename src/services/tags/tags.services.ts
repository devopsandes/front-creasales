import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { TagsResponse } from "../../interfaces/tags.interface"



const createTag = async (token: string, nombre: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tags`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,{ nombre },{ headers })


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
        const url = `${import.meta.env.VITE_URL_BACKEND}/tags`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios<TagsResponse & ErrorResponse>(url,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  TagsResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}


const asignarTag = async (token: string, chatId: string, tagId: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tags/assignate`
        const body = { chatId, tagId }

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url, body, { headers })

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
        const url = `${import.meta.env.VITE_URL_BACKEND}/tags/${tagId}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.patch<SuccessResponse & ErrorResponse>(url, { nombre }, { headers })

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
        const url = `${import.meta.env.VITE_URL_BACKEND}/tags/${tagId}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.delete<SuccessResponse & ErrorResponse>(url, { headers })

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
        const url = `${import.meta.env.VITE_URL_BACKEND}/tags/assignate`
        const headers = {
            authorization: `Bearer ${token}`
        }
        const { data } = await axios.delete<SuccessResponse & ErrorResponse>(url, {
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

export { createTag, getTags, asignarTag, updateTag, deleteTag, removeTagFromChat }
