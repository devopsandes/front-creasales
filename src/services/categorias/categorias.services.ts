import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { DataCategoria, FindCategoriasResponse } from "../../interfaces/categorias.interface"



const createCategoria = async (token: string, dataCategoria: DataCategoria): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/categorias`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,dataCategoria,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  SuccessResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const findAllCategorias = async (token: string, id: string): Promise<FindCategoriasResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/categorias?id=${id}`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.get<FindCategoriasResponse & ErrorResponse>(url,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  FindCategoriasResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}



export { createCategoria, findAllCategorias  }