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


export { createTag, getTags }
