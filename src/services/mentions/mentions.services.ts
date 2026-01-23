import axios from "axios"
import { ErrorResponse } from "../../interfaces/auth.interface"

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

/**
 * Backend requerido:
 * - GET /mentions/unread-count (auth requerida; roles USER|ADMIN|ROOT; scope empresa)
 */
export const getMentionsUnreadCount = async (token: string): Promise<MentionsUnreadCountResponse> => {
  try {
    const url = `${import.meta.env.VITE_URL_BACKEND}/mentions/unread-count`
    const headers = { authorization: `Bearer ${token}` }
    const { data } = await axios.get<any>(url, { headers })

    return {
      statusCode: data?.statusCode ?? 200,
      count: typeof data?.count === "number" ? data.count : 0,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        statusCode: error.response.status,
        count: 0,
        message: error.response.data?.message,
        error: error.response.data?.error,
      }
    }
    throw error
  }
}

/**
 * Backend requerido:
 * - GET /mentions/chats?unreadOnly=1&page=1&limit=100 (auth requerida; roles USER|ADMIN|ROOT; scope empresa)
 */
export const getMentionChats = async (
  token: string,
  params?: { unreadOnly?: boolean; page?: number; limit?: number }
): Promise<MentionChatsResponse> => {
  try {
    const url = `${import.meta.env.VITE_URL_BACKEND}/mentions/chats`
    const headers = { authorization: `Bearer ${token}` }
    const query = {
      unreadOnly: params?.unreadOnly ? 1 : 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
    }
    const { data } = await axios.get<any>(url, { headers, params: query })

    const items = Array.isArray(data?.items) ? data.items : []
    return { statusCode: data?.statusCode ?? 200, items }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        statusCode: error.response.status,
        items: [],
        message: error.response.data?.message,
        error: error.response.data?.error,
      }
    }
    throw error
  }
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
    const { data } = await axios.post<any>(url, body, { headers })
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


