import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios"

type BackendDomain = "admin" | "conversation"

type EndpointKey =
  | "tickets"
  | "tags"
  | "mentions"
  | "quickResponses"
  | "backoffice"
  | "chats"
  | "timeline"
  | "messages"
  | "whatsapp"
  | "bot"
  | "default"

const API_PREFIX = "/api/v1"

const readEnv = (key: string): string => `${(import.meta.env as Record<string, unknown>)?.[key] ?? ""}`.trim()

const parseBoolean = (value: string, defaultValue = false): boolean => {
  if (!value) return defaultValue
  const normalized = value.trim().toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on"
}

const ensureApiPrefix = (base: string): string => {
  const trimmed = `${base ?? ""}`.trim()
  if (!trimmed) return API_PREFIX
  const sanitized = trimmed.replace(/\/+$/, "")
  if (/\/api\/v1$/i.test(sanitized)) return sanitized
  return `${sanitized}${API_PREFIX}`
}

const getLegacyBase = (): string => {
  const legacyBackend = readEnv("VITE_URL_BACKEND") || readEnv("VITE_URL_BACK")
  return ensureApiPrefix(legacyBackend || API_PREFIX)
}

const splitEnabled = parseBoolean(
  readEnv("FRONT_SPLIT_BACKENDS_ENABLED") || readEnv("VITE_FRONT_SPLIT_BACKENDS_ENABLED"),
  false
)

const adminBase = ensureApiPrefix(
  splitEnabled
    ? readEnv("FRONT_API_ADMIN_BASE") || readEnv("VITE_FRONT_API_ADMIN_BASE") || getLegacyBase()
    : getLegacyBase()
)

const convBase = ensureApiPrefix(
  splitEnabled
    ? readEnv("FRONT_API_CONV_BASE") || readEnv("VITE_FRONT_API_CONV_BASE") || getLegacyBase()
    : getLegacyBase()
)

const buildRequestId = (): string => {
  const random = Math.random().toString(36).slice(2, 10)
  return `front-${Date.now()}-${random}`
}

const attachSharedInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const nextConfig = config
    const token = localStorage.getItem("token")
    if (token && !nextConfig.headers.authorization) {
      nextConfig.headers.authorization = `Bearer ${token}`
    }
    if (!nextConfig.headers["Content-Type"] && nextConfig.data && !(nextConfig.data instanceof FormData)) {
      nextConfig.headers["Content-Type"] = "application/json"
    }
    if (!nextConfig.headers["x-request-id"]) {
      nextConfig.headers["x-request-id"] = buildRequestId()
    }
    return nextConfig
  })

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (!error.response) return Promise.reject(error)
      const status = error.response.status
      if (status === 401 || status === 403 || status >= 500) {
        ;(error as any).isDomainHandledError = true
      }
      return Promise.reject(error)
    }
  )
}

export const adminClient = axios.create({ baseURL: adminBase, withCredentials: true })
export const convClient = axios.create({ baseURL: convBase, withCredentials: true })

attachSharedInterceptors(adminClient)
attachSharedInterceptors(convClient)

const adminEndpoints = new Set<EndpointKey>(["tickets", "tags", "mentions", "quickResponses", "backoffice"])

export const resolveClient = (endpointKey: EndpointKey): AxiosInstance => {
  if (adminEndpoints.has(endpointKey)) return adminClient
  return convClient
}

export const getApiRouteMap = (): Record<BackendDomain, string> => ({
  admin: adminBase,
  conversation: convBase,
})

export const isSplitBackendsEnabled = (): boolean => splitEnabled

export const getConversationSocketUrl = (): string => {
  const explicitSocketUrl =
    readEnv("FRONT_SOCKET_CONV_URL") ||
    readEnv("VITE_FRONT_SOCKET_CONV_URL") ||
    readEnv("VITE_URL_BACK") ||
    ""
  if (explicitSocketUrl) return explicitSocketUrl.replace(/\/+$/, "")

  const fromConvBase = convBase.replace(/\/api\/v1$/i, "")
  return fromConvBase.replace(/\/+$/, "")
}

