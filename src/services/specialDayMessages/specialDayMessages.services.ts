import axios from "axios"
import { SpecialDayMessage } from "../../interfaces/specialDayMessages.interface"
import { convClient } from "../apiClient"

const baseUrl = () => "/special-day-messages"

export type SpecialDayMessagePayload = {
    fecha: string          // 'YYYY-MM-DD'
    hora_desde: string     // 'HH:mm'
    hora_hasta: string     // 'HH:mm'
    mensaje: string
    activo?: boolean
}

export const getSpecialDayMessages = async (token: string): Promise<{ items: SpecialDayMessage[]; statusCode?: number; message?: any }> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data, status } = await convClient.get<SpecialDayMessage[]>(baseUrl(), { headers })
        return { items: Array.isArray(data) ? data : [], statusCode: status }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { items: [], statusCode: error.response.status, message: (error.response.data as any)?.message }
        }
        throw error
    }
}

export const createSpecialDayMessage = async (token: string, payload: SpecialDayMessagePayload): Promise<{ item?: SpecialDayMessage; statusCode?: number; message?: any }> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data, status } = await convClient.post<SpecialDayMessage>(baseUrl(), payload, { headers })
        return { item: data, statusCode: status }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { statusCode: error.response.status, message: (error.response.data as any)?.message }
        }
        throw error
    }
}

export const updateSpecialDayMessage = async (token: string, id: string, payload: Partial<SpecialDayMessagePayload>): Promise<{ item?: SpecialDayMessage; statusCode?: number; message?: any }> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data, status } = await convClient.patch<SpecialDayMessage>(`${baseUrl()}/${id}`, payload, { headers })
        return { item: data, statusCode: status }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { statusCode: error.response.status, message: (error.response.data as any)?.message }
        }
        throw error
    }
}

export const deleteSpecialDayMessage = async (token: string, id: string): Promise<{ statusCode?: number; message?: any }> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data, status } = await convClient.delete(`${baseUrl()}/${id}`, { headers })
        return { ...(data as any), statusCode: (data as any)?.statusCode ?? status }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { statusCode: error.response.status, message: (error.response.data as any)?.message }
        }
        throw error
    }
}