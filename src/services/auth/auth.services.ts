import axios from 'axios'
import { DataLogin, DataRegister, ErrorResponse, LoginResponse, SuccessResponse, ValidationResponse } from '../../interfaces/auth.interface'

type Objeto = {
    nombre: string;
    apellido: string;
    email: string;
    nacimiento: string;
    telefono: string;
    tipo_doc: string;
    nro_doc: number;
    password: string;
    role: string;
}


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
        let url
        if(dataRegister.empresa_id != undefined){
            url = `https://sales.createch.com.ar/api/v1/auth/signup?empresa_id=${dataRegister.empresa_id}`
        }else{
            url = `https://sales.createch.com.ar/api/v1/auth/signup`
        }

        const objeto: Objeto = {
            nombre: dataRegister.nombre,
            apellido: dataRegister.apellido,
            email: dataRegister.email,
            nacimiento: dataRegister.nacimiento,
            telefono: dataRegister.telefono,
            tipo_doc: dataRegister.tipo_doc,
            nro_doc: +dataRegister.nro_doc,
            password: dataRegister.password,
            role: dataRegister.role
        }

        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url,objeto)

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