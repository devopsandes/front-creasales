import axios from 'axios'
import { DataLogin, DataRegister, ErrorResponse, LoginResponse, SuccessResponse, UsersResponse, ValidationResponse } from '../../interfaces/auth.interface'
import { convClient } from '../apiClient'

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

const USERS_TTL_MS = 30_000
const usersRoleCache = new Map<string, { value: UsersResponse & ErrorResponse; expiresAt: number }>()
const pendingUsersRole = new Map<string, Promise<UsersResponse & ErrorResponse>>()

const getCachedUsersRole = (key: string): (UsersResponse & ErrorResponse) | null => {
    const entry = usersRoleCache.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
        usersRoleCache.delete(key)
        return null
    }
    return entry.value
}

const authLogin = async ({ email, password }: DataLogin): Promise<LoginResponse & ErrorResponse> => {
    try {
        const url = 'https://sales.createch.com.ar/api/v1/auth/signin'

        const { data } = await axios.post<LoginResponse & ErrorResponse>(url, { email, password })



        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & LoginResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const authRegister = async (dataRegister: DataRegister): Promise<SuccessResponse & ErrorResponse> => {
    try {
        let url
        if (dataRegister.empresa_id != undefined) {
            url = `https://sales.createch.com.ar/api/v1/auth/signup?empresa_id=${dataRegister.empresa_id}`
        } else {
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

        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url, objeto)

        return data

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse = error.response.data
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
            const objeto: ErrorResponse & ValidationResponse = error.response.data
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
            const objeto: ErrorResponse & SuccessResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const cambiarPassword = async (token: string, password: string): Promise<SuccessResponse & ErrorResponse> => {
    try {

        const url = `https://sales.createch.com.ar/api/v1/auth/cambiar-pass?token=${token}`

        const { data } = await axios.post<SuccessResponse & ErrorResponse>(url, { password })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const usuariosXRole = async (role: string, token: string): Promise<UsersResponse & ErrorResponse> => {
    const normalizedRole = `${role ?? ''}`
    const cacheKey = `${token}:${normalizedRole}`
    const cached = getCachedUsersRole(cacheKey)
    if (cached) return cached

    const inflight = pendingUsersRole.get(cacheKey)
    if (inflight) return inflight

    const task = (async (): Promise<UsersResponse & ErrorResponse> => {
        try {
            let url = ''
            if (normalizedRole === '')
                url = `https://sales.createch.com.ar/api/v1/auth/usuarios`
            else
                url = `https://sales.createch.com.ar/api/v1/auth/usuarios?role=${normalizedRole}`

            const headers = {
                authorization: `Bearer ${token}`
            }

            const { data } = await axios<UsersResponse & ErrorResponse>(url, { headers })
            usersRoleCache.set(cacheKey, { value: data, expiresAt: Date.now() + USERS_TTL_MS })
            return data
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const objeto: ErrorResponse & UsersResponse = error.response.data
                return objeto
            }
            throw error
        } finally {
            pendingUsersRole.delete(cacheKey)
        }
    })()

    pendingUsersRole.set(cacheKey, task)
    return task
}

const switchActivo = async (userId: string | undefined, token: string, activo: boolean | undefined): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `https://sales.createch.com.ar/api/v1/auth/usuarios/${userId}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.patch<SuccessResponse & ErrorResponse>(url, { activo }, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & UsersResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const asignarOperador = async (chat_id: string, user_id: string, token: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`,
        }

        const body = {
            chatId: chat_id,
            userId: user_id,
        }

        const { data } = await convClient.post<SuccessResponse & ErrorResponse>('/chats/operators', body, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const objeto: ErrorResponse & SuccessResponse = error.response.data
                return objeto
            }
        }

        // Si no hay respuesta, retornar un error genérico
        return {
            statusCode: 500,
            message: ['Error de conexión. Por favor, intenta nuevamente.'],
            error: 'Connection Error'
        } as ErrorResponse & SuccessResponse
    }
}

const deleteUser = async (userId: string, token: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `https://sales.createch.com.ar/api/v1/auth/user/${userId}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.delete<SuccessResponse & ErrorResponse>(url, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse = error.response.data
            return objeto
        }
        throw error;
    }
}

const updateUser = async (
    userId: string,
    token: string,
    userData: Partial<Objeto & { activo?: boolean; role?: string }>
): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const url = `https://sales.createch.com.ar/api/v1/auth/usuarios/${userId}`

        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await axios.patch<SuccessResponse & ErrorResponse>(url, userData, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse = error.response.data
            return objeto
        }
        throw error;
    }
}

const resyncAdminUser = async (email: string, token: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await convClient.post<SuccessResponse & ErrorResponse>(
            '/auth/usuarios/resync-admin',
            null,
            {
                headers,
                params: { email }
            }
        )

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ErrorResponse & SuccessResponse = error.response.data
            return objeto
        }
        throw error;
    }
}



export { authLogin, authRegister, tokenValidacion, sendEmailRecuperarPass, cambiarPassword, usuariosXRole, asignarOperador, switchActivo, deleteUser, updateUser, resyncAdminUser }


