import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { BulkChatTagsResponse, ChatTagsResponse, TagsResponse } from "../../interfaces/tags.interface"
import { resolveClient } from "../apiClient"



const tagsClient = resolveClient("tags")
const pendingBulkChatTags = new Map<string, Promise<BulkChatTagsResponse & ErrorResponse>>()
const endpointLastAt = new Map<string, number>()

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

const createTag = async (token: string, nombre: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.post<SuccessResponse & ErrorResponse>('/tags',{ nombre },{ headers })


        return data
    } catch (error) {
        
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  SuccessResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const getTags = async (token: string): Promise<TagsResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.get<TagsResponse & ErrorResponse>('/tags',{ headers })


        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto:  TagsResponse & ErrorResponse  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

/**
 * Etiquetas asignadas a un chat (admin como fuente de verdad).
 * GET /api/v1/tags/chat/:chatId
 */
const getTagsByChatId = async (
    token: string,
    chatId: string,
    options?: { signal?: AbortSignal }
): Promise<ChatTagsResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }

        const { data } = await tagsClient.get<ChatTagsResponse & ErrorResponse>(`/tags/chat/${chatId}`, {
            headers,
            signal: options?.signal,
        })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: ChatTagsResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

/**
 * Etiquetas asignadas a varios chats (admin como fuente de verdad).
 * POST /api/v1/tags/chats/bulk
 */
const getTagsByChatIds = async (
    token: string,
    chatIds: string[],
    options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<BulkChatTagsResponse & ErrorResponse> => {
    const uniqueIds = Array.from(new Set((Array.isArray(chatIds) ? chatIds : []).map((id) => `${id}`.trim()).filter(Boolean))).slice(0, 100)
    const pendingKey = `${token}:${uniqueIds.slice().sort().join(",")}`

    return withPending(pendingBulkChatTags, pendingKey, async () => {
        try {
            const headers = {
                authorization: `Bearer ${token}`
            }

            await waitForEndpointSlot("/tags/chats/bulk", options?.rateLimitMs ?? 900, options?.signal)
            const { data } = await tagsClient.post<BulkChatTagsResponse & ErrorResponse>('/tags/chats/bulk', {
                chatIds: uniqueIds,
            }, {
                headers,
                signal: options?.signal,
            })

            return data
        } catch (error) {
            if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
                throw error
            }
            if (axios.isAxiosError(error) && error.response) {
                const objeto: BulkChatTagsResponse & ErrorResponse = error.response.data
                return objeto
            }
            throw error
        }
    })
}


const asignarTag = async (token: string, chatId: string, tagId: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const body = { chatId, tagId }

        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.post<SuccessResponse & ErrorResponse>('/tags/assignate', body, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

const updateTag = async (token: string, tagId: string, nombre: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.patch<SuccessResponse & ErrorResponse>(`/tags/${tagId}`, { nombre }, { headers })

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
        const headers = {
            authorization: `Bearer ${token}`
        }
      
        const { data } = await tagsClient.delete<SuccessResponse & ErrorResponse>(`/tags/${tagId}`, { headers })

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

const removeTagFromChat = async (token: string, chatId: string, tagId: string): Promise<SuccessResponse & ErrorResponse> => {
    try {
        const headers = {
            authorization: `Bearer ${token}`
        }
        const { data } = await tagsClient.delete<SuccessResponse & ErrorResponse>('/tags/assignate', {
            headers,
            data: { chatId, tagId }
        })
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: SuccessResponse & ErrorResponse = error.response.data
            return objeto
        }
        throw error
    }
}

export { createTag, getTags, getTagsByChatId, getTagsByChatIds, asignarTag, updateTag, deleteTag, removeTagFromChat }
