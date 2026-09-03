import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { ChatCountsResponse, ChatResponse, ChatsResponse, MessagesLiteResponse, OperatorChatCountsResponse, TimelineResponse } from "../../interfaces/chats.interface"
import { DataUser } from "../../interfaces/action.interface"
import { perfCounter, perfLog, perfTrackRequest } from "../../utils/perfTracker"
import { resolveClient } from "../apiClient"



const pendingTimeline = new Map<string, Promise<TimelineResponse & ErrorResponse>>()
const pendingMessagesLite = new Map<string, Promise<MessagesLiteResponse & ErrorResponse>>()
const pendingCounts = new Map<string, Promise<ChatCountsResponse & ErrorResponse>>()
const pendingChats = new Map<string, Promise<ChatsResponse & ErrorResponse>>()
const pendingChatById = new Map<string, Promise<ChatResponse & ErrorResponse>>()
const endpointLastAt = new Map<string, number>()
const chatsClient = resolveClient("chats")

const getAfiliadoIdentificado = async (
    token: string,
    chatId: string,
    options?: { signal?: AbortSignal }
): Promise<{ statusCode?: number; afiliado?: any } & ErrorResponse> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await chatsClient.get(`/chats/${chatId}/afiliado-identificado`, { headers, signal: options?.signal })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) return error.response.data as any
        throw error
    }
}

const withPending = async <T>(store: Map<string, Promise<T>>, key: string, taskFactory: () => Promise<T>): Promise<T> => {
    const inflight = store.get(key)
    if (inflight) return inflight
    const task = taskFactory().finally(() => {
        store.delete(key)
    })
    store.set(key, task)
    return task
}

const waitForEndpointSlot = async (endpoint: string, minIntervalMs: number, signal?: AbortSignal): Promise<void> => {
    if (!minIntervalMs || minIntervalMs <= 0) return
    while (true) {
        if (signal?.aborted) throw new DOMException("Request aborted", "AbortError")
        const lastAt = endpointLastAt.get(endpoint) ?? 0
        const now = Date.now()
        const elapsed = now - lastAt
        if (elapsed >= minIntervalMs) {
            endpointLastAt.set(endpoint, now)
            return
        }
        const waitMs = Math.max(0, minIntervalMs - elapsed)
        await new Promise<void>((resolve, reject) => {
            const timer = window.setTimeout(() => {
                signal?.removeEventListener("abort", onAbort)
                resolve()
            }, waitMs)
            const onAbort = () => {
                window.clearTimeout(timer)
                signal?.removeEventListener("abort", onAbort)
                reject(new DOMException("Request aborted", "AbortError"))
            }
            signal?.addEventListener("abort", onAbort)
        })
    }
}

const findChatById = async (
    token: string,
    id: string,
    options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<ChatResponse & ErrorResponse> => {
    const pendingKey = `${token}:${id}`
    return withPending(pendingChatById, pendingKey, async () => {
        try {
            const headers = {
                authorization: `Bearer ${token}`
            }
            perfCounter("findChatById")
            await waitForEndpointSlot(`/chats/${id}`, options?.rateLimitMs ?? 800, options?.signal)
            perfTrackRequest("/chats/:id")
            const { data } = await chatsClient.get<ChatResponse & ErrorResponse>(`/chats/${id}`, { headers, signal: options?.signal })
            return data
        } catch (error) {
            if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
                throw error
            }
            if (axios.isAxiosError(error) && error.response) {
                const objeto: ChatResponse & ErrorResponse = error.response.data
                return objeto
            }
            throw error
        }
    })
}

const findChatTimeline = async (
    token: string,
    id: string,
    params?: { page?: number; limit?: number; cursor?: string | null },
    options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<TimelineResponse & ErrorResponse> => {
    const limit = Math.min(params?.limit ?? 30, 30)
    const query = {
        limit,
        cursor: params?.cursor ?? null,
        page: params?.cursor ? null : 1,
    }
    const pendingKey = `${token}:${id}:${query.limit}:${query.cursor ?? ""}:${query.page ?? ""}`
    return withPending(pendingTimeline, pendingKey, async () => {
        const startedAt = performance.now()
        perfCounter("findChatTimeline")
        try {
            const headers = {
                authorization: `Bearer ${token}`,
            }

            const requestQuery: any = {
                limit: query.limit,
            }

            if (query.cursor) {
                requestQuery.cursor = query.cursor
            } else {
                requestQuery.page = query.page ?? 1
            }

            const debug =
                import.meta.env.DEV &&
                typeof window !== "undefined" &&
                window.localStorage?.getItem("debugTimeline") === "1"

            if (debug) {
                console.log("[findChatTimeline] GET", `${chatsClient.defaults.baseURL}/chats/${id}/timeline`, { params: requestQuery })
            }

            await waitForEndpointSlot("/chats/:id/timeline", options?.rateLimitMs ?? 900, options?.signal)
            const { data } = await chatsClient.get<TimelineResponse & ErrorResponse>(`/chats/${id}/timeline`, {
                headers,
                params: requestQuery,
                signal: options?.signal,
            })
            perfTrackRequest("/chats/:id/timeline")

            perfLog("api.findChatTimeline", {
                chatId: id,
                durationMs: Math.round(performance.now() - startedAt),
                rows: Array.isArray((data as any)?.items) ? (data as any).items.length : null,
                cursor: Boolean(query.cursor),
            })

            if (debug) {
                console.log("[findChatTimeline] OK", {
                    statusCode: (data as any)?.statusCode,
                    page: (data as any)?.page,
                    limit: (data as any)?.limit,
                    total: (data as any)?.total,
                    itemsPreview: Array.isArray((data as any)?.items) ? (data as any).items.slice(0, 3) : (data as any)?.items,
                })
            }

            return data
        } catch (error) {
            if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
                throw error
            }
            const debug =
                import.meta.env.DEV &&
                typeof window !== "undefined" &&
                window.localStorage?.getItem("debugTimeline") === "1"

            if (axios.isAxiosError(error) && error.response) {
                if (debug) {
                    console.log("[findChatTimeline] ERROR", {
                        url: `${chatsClient.defaults.baseURL}/chats/${id}/timeline`,
                        baseURL: chatsClient.defaults.baseURL,
                        status: error.response.status,
                        data: error.response.data,
                    })
                }
                const objeto: TimelineResponse & ErrorResponse = error.response.data
                return objeto
            }
            if (debug) {
                console.log("[findChatTimeline] ERROR (no response)", error)
            }
            throw error
        }
    })
}

const findChatMessagesLite = async (
    token: string,
    id: string,
    params?: { limit?: number; before?: string | null },
    options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<MessagesLiteResponse & ErrorResponse> => {
    const limit = Math.min(params?.limit ?? 30, 30)
    const before = params?.before ?? null
    const pendingKey = `${token}:${id}:${limit}:${before ?? ""}`
    return withPending(pendingMessagesLite, pendingKey, async () => {
        const startedAt = performance.now()
        perfCounter("findChatMessagesLite")
        try {
            const headers = {
                authorization: `Bearer ${token}`,
            }

            const requestQuery: any = { limit }
            if (before) requestQuery.before = before

            await waitForEndpointSlot("/chats/:id/messages-lite", options?.rateLimitMs ?? 900, options?.signal)
            const { data } = await chatsClient.get<MessagesLiteResponse & ErrorResponse>(`/chats/${id}/messages-lite`, {
                headers,
                params: requestQuery,
                signal: options?.signal,
            })
            perfTrackRequest("/chats/:id/messages-lite")
            perfLog("api.findChatMessagesLite", {
                chatId: id,
                durationMs: Math.round(performance.now() - startedAt),
                rows: Array.isArray((data as any)?.items) ? (data as any).items.length : null,
                before: before ?? null,
            })
            return data
        } catch (error) {
            if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
                throw error
            }
            if (axios.isAxiosError(error) && error.response) {
                const objeto: MessagesLiteResponse & ErrorResponse = error.response.data
                return objeto
            }
            throw error
        }
    })
}

const getUserData = async (telefono: string): Promise<DataUser & ErrorResponse> => {
    try {
        const url = `https://tickets.creasales.com/mensajes/getUserData?telefono=${telefono}`

        const { data } = await axios.get<DataUser & ErrorResponse>(url)

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: DataUser & ErrorResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}


type GetChatsFilters = {
    q?: string
    operatorId?: string
    assignment?: string
    tagId?: string
    archived?: string | number | boolean
}

const getChatCounts = async (
    token: string,
    params?: { q?: string; tagId?: string },
    options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<ChatCountsResponse & ErrorResponse> => {
    const pendingKey = `${token}:${params?.q ?? ""}:${params?.tagId ?? ""}`
    return withPending(pendingCounts, pendingKey, async () => {
        const startedAt = performance.now()
        perfCounter("getChatCounts")
        try {
            const qs = new URLSearchParams()
            if (params?.q) qs.set("q", `${params.q}`)
            if (params?.tagId) qs.set("tagId", `${params.tagId}`)

            const headers = { authorization: `Bearer ${token}` }
            await waitForEndpointSlot("/chats/counts", options?.rateLimitMs ?? 1200, options?.signal)
            perfTrackRequest("/chats/counts")
            const { data } = await chatsClient.get<ChatCountsResponse & ErrorResponse>('/chats/counts', {
                headers,
                signal: options?.signal,
                params: Object.fromEntries(qs.entries()),
            })
            perfLog("api.getChatCounts", {
                durationMs: Math.round(performance.now() - startedAt),
                q: params?.q ?? null,
                tagId: params?.tagId ?? null,
            })
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
    })
}

const getChats = async (
    token: string,
    page: string,
    limit: string,
    filters?: GetChatsFilters,
    options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<ChatsResponse & ErrorResponse> => {
    const pendingKey = `${token}:${page}:${limit}:${JSON.stringify(filters ?? {})}`
    return withPending(pendingChats, pendingKey, async () => {
        const startedAt = performance.now()
        perfCounter("getChats")
        try {
            const params = new URLSearchParams()
            params.set("page", `${page}`)
            params.set("limit", `${limit}`)

            if (filters?.q) params.set("q", `${filters.q}`)
            if (filters?.operatorId) params.set("operatorId", `${filters.operatorId}`)
            if (filters?.assignment) params.set("assignment", `${filters.assignment}`)
            if (filters?.tagId) params.set("tagId", `${filters.tagId}`)
            if (filters?.archived !== undefined && filters?.archived !== null && `${filters.archived}` !== "") {
                params.set("archived", `${filters.archived}`)
            }

            const headers = {
                authorization: `Bearer ${token}`
            }
            await waitForEndpointSlot("/chats", options?.rateLimitMs ?? 1200, options?.signal)
            perfTrackRequest("/chats")
            const { data } = await chatsClient.get<ChatsResponse & ErrorResponse>('/chats', {
                headers,
                signal: options?.signal,
                params: Object.fromEntries(params.entries()),
            })

            perfLog("api.getChats", {
                durationMs: Math.round(performance.now() - startedAt),
                page,
                limit,
                rows: Array.isArray((data as any)?.chats) ? (data as any).chats.length : null,
                filters: filters ?? null,
            })

            return data
        } catch (error) {
            if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
                throw error
            }
            if (axios.isAxiosError(error) && error.response) {
                const objeto: ChatsResponse & ErrorResponse = error.response.data
                return objeto
            }
            throw error
        }
    })
}

const getChatCountsByOperator = async (
    token: string
): Promise<OperatorChatCountsResponse & ErrorResponse> => {
    const startedAt = performance.now()
    perfCounter("getChatCountsByOperator")
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await chatsClient.get<OperatorChatCountsResponse & ErrorResponse>('/chats/counts-by-operator', { headers })
        perfLog("api.getChatCountsByOperator", {
            durationMs: Math.round(performance.now() - startedAt),
            rows: Array.isArray((data as any)?.counts) ? (data as any).counts.length : null,
        })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data as any
        }
        throw error
    }
}

/**
 * Backend actual:
 * - PATCH /chats/:id/read-state  body: { state: "read" | "unread" }
 * - Idempotente
 */
const setChatReadState = async (
    token: string,
    chatId: string,
    state: "read" | "unread"
): Promise<
    | ({ ok?: boolean; statusCode?: number; chatId?: string; state?: "read" | "unread"; unreadCount?: number; manualUnread?: boolean; lastIncomingMessageAt?: string | null; lastReadAt?: string | null } & ErrorResponse)
    | any
> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await chatsClient.patch(`/chats/${chatId}/read-state`, { state }, { headers })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: any = error.response.data
            return objeto
        }
        throw error
    }
}

/**
 * Toggle Bot por conversación (backend nuevo)
 * PATCH /api/v1/chats/:id/bot-state
 * Body: { enabled: boolean, reason?: string }
 * Respuesta incluye auditoría: botEnabled, botDisabledAt, botDisabledByUserId, botDisableReason
 */
const setChatBotState = async (
    token: string,
    chatId: string,
    enabled: boolean,
    reason?: string
): Promise<
    | ({
        botEnabled?: boolean;
        botDisabledAt?: string | Date | null;
        botDisabledByUserId?: string | null;
        botDisableReason?: string | null;
        statusCode?: number;
    } & ErrorResponse)
    | any
> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const body: any = { enabled }
        if (typeof reason === "string" && reason.trim().length > 0) {
            body.reason = reason.trim().slice(0, 255)
        }
        const { data } = await chatsClient.patch(`/chats/${chatId}/bot-state`, body, { headers })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: any = error.response.data
            return objeto
        }
        throw error
    }
}

const searchByConversacion = async (
    token: string,
    numero: number
): Promise<any> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await chatsClient.get('/chats/search-conversacion', { headers, params: { numero } })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data
        }
        throw error
    }
}

const desasignarChat = async (
    token: string,
    chatId: string
): Promise<any> => {
    try {
        const headers = { authorization: `Bearer ${token}` }
        const { data } = await chatsClient.post('/chats/unassign', { chatId }, { headers })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data
        }
        throw error
    }
}


export { findChatById, findChatTimeline, findChatMessagesLite, getUserData, getChats, getChatCounts, getChatCountsByOperator, setChatReadState, setChatBotState, searchByConversacion, desasignarChat, getAfiliadoIdentificado }