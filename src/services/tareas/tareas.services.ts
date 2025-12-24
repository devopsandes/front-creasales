import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { DataTarea } from "../../interfaces/tareas.interface"



const createTarea = async (token: string, dataTarea: DataTarea): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `${import.meta.env.VITE_URL_BACKEND}/tareas`

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,dataTarea,{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  SuccessResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}





export { createTarea  }