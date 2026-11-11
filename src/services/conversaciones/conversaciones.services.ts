import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { convClient } from "../apiClient"

// ── Tipos de respuesta del endpoint /conversaciones ──

export interface ConversacionListItem {
    id: string
    numeroConversacion: number | null
    createdAt: string
    closedAt: string | null
    canal?: string | null
    chatId?: string | null
    afiliadoDni?: string | null
    cliente: {
        id: string
        nombre: string | null
        telefono: string | null
    } | null
    archivadoPor: {
        id: string
        nombre: string | null
        apellido: string | null
    } | null
}

export interface ConversacionesListResponse {
    statusCode: number
    page: number
    limit: number
    hasMore: boolean
    conversaciones: ConversacionListItem[]
}

export interface ConversacionTimelineItem {
    kind: "message" | "event"
    id: string
    createdAt: string
    // message fields
    msg_entrada?: string | null
    msg_salida?: string | null
    msg_id?: string | null
    esNota?: boolean
    type?: "text" | "image" | "document" | "audio"
    imageUrl?: { statusCode?: number; expires?: number; url?: string } | string
    documentUrl?: { statusCode?: number; expires?: number; url?: string } | string
    audioUrl?: { statusCode?: number; expires?: number; url?: string } | string
    traduccion?: string | null
    // event fields
    actorType?: string
    actorUserId?: string | null
    mensajeId?: string | null
    payload?: any
    text?: string
}

export interface ConversacionDetalleResponse {
    statusCode: number
    conversacion: {
        id: string
        numeroConversacion: number | null
        estado: "ABIERTA" | "CERRADA"
        openedAt: string | null
        closedAt: string | null
        archivadoPor: { id: string; nombre: string | null; apellido: string | null } | null
        chat: {
            id: string
            cliente: { id: string; nombre: string | null; telefono: string | null } | null
        }
    }
    items: ConversacionTimelineItem[]
}

type GetConversacionesFilters = {
    operatorId?: string
    sistema?: boolean
    /** Rango por fecha de cierre, formato AAAA-MM-DD. */
    desde?: string
    hasta?: string
    /** Nombre, teléfono o N° de conversación. */
    q?: string
    canal?: string
}

export interface ConversacionesTotalesResponse {
    statusCode: number
    total: number
    sistema: number
    items: { operatorId: string | null; nombre: string | null; apellido: string | null; total: number }[]
    cache?: boolean
}

const getConversaciones = async (
    token: string,
    page: number,
    limit: number,
    filters?: GetConversacionesFilters,
    options?: { signal?: AbortSignal }
): Promise<ConversacionesListResponse & ErrorResponse> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const params: Record<string, string> = {
            page: `${page}`,
            limit: `${limit}`,
        }
        if (filters?.operatorId) params.operatorId = filters.operatorId
        if (filters?.sistema) params.sistema = "true"
        if (filters?.desde) params.desde = filters.desde
        if (filters?.hasta) params.hasta = filters.hasta
        if (filters?.q) params.q = filters.q
        if (filters?.canal) params.canal = filters.canal

        const { data } = await convClient.get<ConversacionesListResponse & ErrorResponse>(
            "/conversaciones",
            { headers, params, signal: options?.signal }
        )
        return data
    } catch (error) {
        if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
            throw error
        }
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data as any
        }
        throw error
    }
}

const getConversacionDetalle = async (
    token: string,
    id: string,
    options?: { signal?: AbortSignal }
): Promise<ConversacionDetalleResponse & ErrorResponse> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await convClient.get<ConversacionDetalleResponse & ErrorResponse>(
            `/conversaciones/${id}`,
            { headers, signal: options?.signal }
        )
        return data
    } catch (error) {
        if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
            throw error
        }
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data as any
        }
        throw error
    }
}

const getConversacionesTotales = async (
    token: string,
    filters?: Pick<GetConversacionesFilters, "desde" | "hasta" | "q" | "canal">,
    options?: { signal?: AbortSignal }
): Promise<ConversacionesTotalesResponse & ErrorResponse> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const params: Record<string, string> = {}
        if (filters?.desde) params.desde = filters.desde
        if (filters?.hasta) params.hasta = filters.hasta
        if (filters?.q) params.q = filters.q
        if (filters?.canal) params.canal = filters.canal
        const { data } = await convClient.get<ConversacionesTotalesResponse & ErrorResponse>(
            "/conversaciones/totales",
            { headers, params, signal: options?.signal }
        )
        return data
    } catch (error) {
        if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
            throw error
        }
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data as any
        }
        throw error
    }
}

export { getConversaciones, getConversacionDetalle, getConversacionesTotales }