import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"
import { perfTrackRequest } from "../../utils/perfTracker"

export type MentionChatItem = {
  chatId: string
  unreadCount?: number
  lastMentionAt?: string
}

export type MentionsUnreadCountResponse = {
  statusCode: number
  count: number
} & Partial<ErrorResponse>

export type MentionChatsResponse = {
  statusCode: number
  items: MentionChatItem[]
} & Partial<ErrorResponse>

const TTL_MS = 5000
const unreadCache = new Map<string, { value: MentionsUnreadCountResponse; expiresAt: number }>()
const chatsCache = new Map<string, { value: MentionChatsResponse; expiresAt: number }>()
const pendingUnread = new Map<string, Promise<MentionsUnreadCountResponse>>()
const pendingChats = new Map<string, Promise<MentionChatsResponse>>()
const endpointLastAt = new Map<string, number>()

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

/**
 * Backend requerido:
 * - GET /mentions/unread-count (auth requerida; roles USER|ADMIN|ROOT; scope empresa)
 */
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
      const url = `${import.meta.env.VITE_URL_BACKEND}/mentions/unread-count`
      const headers = { authorization: `Bearer ${token}` }
      await waitForEndpointSlot("/mentions/unread-count", options?.rateLimitMs ?? 1200, options?.signal)
      perfTrackRequest("/mentions/unread-count")
      const { data } = await axios.get<any>(url, { headers, signal: options?.signal })

      const payload: MentionsUnreadCountResponse = {
        statusCode: data?.statusCode ?? 200,
        count: typeof data?.count === "number" ? data.count : 0,
      }
      unreadCache.set(cacheKey, { value: payload, expiresAt: Date.now() + TTL_MS })
      return payload
    } catch (error) {
      if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
        throw error
      }
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

/**
 * Backend requerido:
 * - GET /mentions/chats?unreadOnly=1&page=1&limit=100 (auth requerida; roles USER|ADMIN|ROOT; scope empresa)
 */
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
      const url = `${import.meta.env.VITE_URL_BACKEND}/mentions/chats`
      const headers = { authorization: `Bearer ${token}` }
      await waitForEndpointSlot("/mentions/chats", options?.rateLimitMs ?? 1200, options?.signal)
      perfTrackRequest("/mentions/chats")
      const { data } = await axios.get<any>(url, { headers, params: query, signal: options?.signal })

      const items = Array.isArray(data?.items) ? data.items : []
      const payload: MentionChatsResponse = { statusCode: data?.statusCode ?? 200, items }
      chatsCache.set(cacheKey, { value: payload, expiresAt: Date.now() + TTL_MS })
      return payload
    } catch (error) {
      if (axios.isCancel(error) || (error as any)?.name === "AbortError" || (error as any)?.code === "ERR_CANCELED") {
        throw error
      }
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

/**
 * Backend requerido:
 * - POST /mentions/mark-read  body: { chatId } o { chatIds } (auth requerida; roles USER|ADMIN|ROOT; scope empresa)
 */
export const markMentionsRead = async (
  token: string,
  chatIdOrIds: string | string[]
): Promise<{ statusCode: number } & Partial<ErrorResponse>> => {
  try {
    const url = `${import.meta.env.VITE_URL_BACKEND}/mentions/mark-read`
    const headers = { authorization: `Bearer ${token}` }
    const body = Array.isArray(chatIdOrIds) ? { chatIds: chatIdOrIds } : { chatId: chatIdOrIds }
    perfTrackRequest("/mentions/mark-read")
    const { data } = await axios.post<any>(url, body, { headers })

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
