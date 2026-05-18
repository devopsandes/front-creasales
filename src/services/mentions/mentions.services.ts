import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { perfTrackRequest } from "../../utils/perfTracker"
import { resolveClient } from "../apiClient"

export type MentionChatItem = {
  chatId: string
  unreadCount?: number
  lastMentionAt?: string
}

export type Mention = {
  id: string
  chatId: string
  eventoId: string | null
  usuarioMencionadoId: string
  usuarioAutorId: string
  readAt: string | null
  createdAt: string
}

export type MentionsUnreadCountResponse = {
  statusCode: number
  count: number
} & Partial<ErrorResponse>

export type MentionChatsResponse = {
  statusCode: number
  items: MentionChatItem[]
} & Partial<ErrorResponse>

export type MisMencionesResponse = {
  statusCode: number
  page: number
  limit: number
  items: Mention[]
} & Partial<ErrorResponse>

const TTL_MS = 5000
const unreadCache = new Map<string, { value: MentionsUnreadCountResponse; expiresAt: number }>()
const chatsCache = new Map<string, { value: MentionChatsResponse; expiresAt: number }>()
const pendingUnread = new Map<string, Promise<MentionsUnreadCountResponse>>()
const pendingChats = new Map<string, Promise<MentionChatsResponse>>()
const endpointLastAt = new Map<string, number>()
const mentionsClient = resolveClient("mentions")

const getCached = <T>(store: Map<string, { value: T; expiresAt: number }>, key: string): T | null => {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

const waitForEndpointSlot = async (endpoint: string, minIntervalMs: number, signal?: AbortSignal): Promise<void> => {
  if (!minIntervalMs || minIntervalMs <= 0) return
  while (true) {
    if (signal?.aborted) throw new DOMException("Request aborted", "AbortError")
    const now = Date.now()
    const lastAt = endpointLastAt.get(endpoint) ?? 0
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

export const getMentionsUnreadCount = async (
  token: string,
  options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<MentionsUnreadCountResponse> => {
  const cacheKey = token
  const cached = getCached(unreadCache, cacheKey)
  if (cached) return cached

  const inflight = pendingUnread.get(cacheKey)
  if (inflight) return inflight

  const task = (async (): Promise<MentionsUnreadCountResponse> => {
    try {
      const headers = { authorization: `Bearer ${token}` }
      await waitForEndpointSlot("/mentions/unread-count", options?.rateLimitMs ?? 1200, options?.signal)
      perfTrackRequest("/mentions/unread-count")
      const { data } = await mentionsClient.get<any>("/mentions/unread-count", { headers, signal: options?.signal })
      const payload: MentionsUnreadCountResponse = {
        statusCode: data?.statusCode ?? 200,
        count: typeof data?.count === "number" ? data.count : 0,
      }
      unreadCache.set(cacheKey, { value: payload, expiresAt: Date.now() + TTL_MS })
      return payload
    } catch (error) {
      if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") throw error
      if (axios.isAxiosError(error) && error.response) {
        return {
          statusCode: error.response.status,
          count: 0,
          message: error.response.data?.message,
          error: error.response.data?.error,
        }
      }
      throw error
    } finally {
      pendingUnread.delete(cacheKey)
    }
  })()

  pendingUnread.set(cacheKey, task)
  return task
}

export const getMisMenciones = async (
  token: string,
  params?: { page?: number; limit?: number },
  options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<MisMencionesResponse> => {
  try {
    const headers = { authorization: `Bearer ${token}` }
    const query = { page: params?.page ?? 1, limit: params?.limit ?? 30 }
    await waitForEndpointSlot("/mentions/mis-menciones", options?.rateLimitMs ?? 1200, options?.signal)
    perfTrackRequest("/mentions/mis-menciones")
    const { data } = await mentionsClient.get<any>('/mentions/mis-menciones', { headers, params: query, signal: options?.signal })
    const items = Array.isArray(data?.items) ? data.items : []
    return { statusCode: data?.statusCode ?? 200, page: data?.page ?? 1, limit: data?.limit ?? 30, items }
  } catch (error) {
    if (axios.isCancel(error) || (error as any)?.name === 'AbortError' || (error as any)?.code === 'ERR_CANCELED') throw error
    if (axios.isAxiosError(error) && error.response) {
      return { statusCode: error.response.status, page: 1, limit: 30, items: [], message: error.response.data?.message }
    }
    throw error
  }
}

export const getMentionChats = async (
  token: string,
  params?: { unreadOnly?: boolean; page?: number; limit?: number },
  options?: { signal?: AbortSignal; rateLimitMs?: number }
): Promise<MentionChatsResponse> => {
  const query = {
    unreadOnly: params?.unreadOnly ? 1 : 0,
    page: params?.page ?? 1,
    limit: params?.limit ?? 100,
  }
  const cacheKey = `${token}:${query.unreadOnly}:${query.page}:${query.limit}`
  const cached = getCached(chatsCache, cacheKey)
  if (cached) return cached

  const inflight = pendingChats.get(cacheKey)
  if (inflight) return inflight

  const task = (async (): Promise<MentionChatsResponse> => {
    try {
      const headers = { authorization: `Bearer ${token}` }
      await waitForEndpointSlot("/mentions/chats", options?.rateLimitMs ?? 1200, options?.signal)
      perfTrackRequest("/mentions/chats")
      const { data } = await mentionsClient.get<any>("/mentions/chats", { headers, params: query, signal: options?.signal })
      const items = Array.isArray(data?.items) ? data.items : []
      const payload: MentionChatsResponse = { statusCode: data?.statusCode ?? 200, items }
      chatsCache.set(cacheKey, { value: payload, expiresAt: Date.now() + TTL_MS })
      return payload
    } catch (error) {
      if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") throw error
      if (axios.isAxiosError(error) && error.response) {
        return {
          statusCode: error.response.status,
          items: [],
          message: error.response.data?.message,
          error: error.response.data?.error,
        }
      }
      throw error
    } finally {
      pendingChats.delete(cacheKey)
    }
  })()

  pendingChats.set(cacheKey, task)
  return task
}

export const markMentionsRead = async (
  token: string,
  mentionIds: string[]
): Promise<{ statusCode: number } & Partial<ErrorResponse>> => {
  try {
    const headers = { authorization: `Bearer ${token}` }
    const body = { mentionIds }
    perfTrackRequest("/mentions/mark-read")
    const { data } = await mentionsClient.post<any>("/mentions/mark-read", body, { headers })
    unreadCache.clear()
    chatsCache.clear()
    pendingUnread.clear()
    pendingChats.clear()
    return { statusCode: data?.statusCode ?? 200 }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        statusCode: error.response.status,
        message: error.response.data?.message,
        error: error.response.data?.error,
      }
    }
    throw error
  }
}

export const markMentionsUnread = async (
  token: string,
  mentionIds: string[]
): Promise<{ statusCode: number } & Partial<ErrorResponse>> => {
  try {
    const headers = { authorization: `Bearer ${token}` }
    const body = { mentionIds }
    perfTrackRequest("/mentions/mark-unread")
    const { data } = await mentionsClient.post<any>("/mentions/mark-unread", body, { headers })
    unreadCache.clear()
    chatsCache.clear()
    pendingUnread.clear()
    pendingChats.clear()
    return { statusCode: data?.statusCode ?? 200 }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        statusCode: error.response.status,
        message: error.response.data?.message,
        error: error.response.data?.error,
      }
    }
    throw error
  }
}