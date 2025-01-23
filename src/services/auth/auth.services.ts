import axios from 'axios'
import { DataLogin, DataRegister, ErrorResponse, LoginResponse, SuccessResponse, ValidationResponse } from '../../interfaces/auth.interface'

const authLogin = async ({email,password}: DataLogin): Promise<LoginResponse & ErrorResponse> => {
    try {
        const url = 'https://sales.createch.com.ar/api/v1/auth/signin'
      
        const { data } = await axios.post<LoginResponse & ErrorResponse>(url,{email,password})


     
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & LoginResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const authRegister = async (dataRegister: DataRegister): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = 'https://sales.createch.com.ar/api/v1/auth/signup'

        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,dataRegister)

        return data

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const tokenValidacion = async (token: string): Promise<ValidationResponse & ErrorResponse> => {
    try {
        const url = `https://sales.createch.com.ar/api/v1/auth/user?token=${token}`

        const { data } = await axios<ValidationResponse & ErrorResponse>(url)

        return data

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & ValidationResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
} 

const sendEmailRecuperarPass = async (email: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `https://sales.createch.com.ar/api/v1/auth/recuperar-pass?email=${email}`

        const { data } = await axios<SuccessResponse & ErrorResponse>(url)

        return data
    } catch (error) {
         if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const cambiarPassword = async (token: string, password: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        console.log(token);
        
        const url = `https://sales.createch.com.ar/api/v1/auth/cambiar-pass?token=${token}`

        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,{password})

        return data
    } catch (error) {
         if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}



export { authLogin, authRegister, tokenValidacion, sendEmailRecuperarPass, cambiarPassword }