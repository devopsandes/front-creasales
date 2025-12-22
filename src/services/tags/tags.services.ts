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
            console.log(error.response.data);
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
      
        // Log para debugging
        console.log('=== ASIGNAR TAG - REQUEST ===')
        console.log('URL:', url)
        console.log('Method: POST')
        console.log('Headers:', headers)
        console.log('Body:', body)
        console.log('ChatId:', chatId)
        console.log('TagId:', tagId)
        console.log('============================')
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url, body, { headers })

        console.log('=== ASIGNAR TAG - RESPONSE ===')
        console.log('Status:', '200/201')
        console.log('Data:', data)
        console.log('=============================')

        return data
    } catch (error) {
        console.log('=== ASIGNAR TAG - ERROR ===')
        if (axios.isAxiosError(error)) {
            console.log('Error Type: Axios Error')
            if (error.response) {
                console.log('Status:', error.response.status)
                console.log('Status Text:', error.response.statusText)
                console.log('Response Data:', error.response.data)
                console.log('Response Headers:', error.response.headers)
            } else if (error.request) {
                console.log('Request made but no response received:', error.request)
            } else {
                console.log('Error setting up request:', error.message)
            }
        } else {
            console.log('Unknown error:', error)
        }
        console.log('===========================')
        
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

export { createTag, getTags, asignarTag, updateTag, deleteTag }
