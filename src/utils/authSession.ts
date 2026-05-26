export type AuthSessionReason = 'expired' | 'invalid'

const TOKEN_EXPIRED_CODES = new Set(['TOKEN_EXPIRED'])
const TOKEN_INVALID_CODES = new Set(['TOKEN_INVALID', 'TOKEN_USER_NOT_FOUND'])

const normalizeCode = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim().toUpperCase()
}

export const getAuthErrorCode = (payload: any): string => {
  const data = payload?.response?.data ?? payload?.data ?? payload
  return normalizeCode(data?.code ?? data?.error?.code ?? payload?.code)
}

export const getAuthSessionReason = (payload: any): AuthSessionReason | null => {
  const code = getAuthErrorCode(payload)
  if (TOKEN_EXPIRED_CODES.has(code)) return 'expired'
  if (TOKEN_INVALID_CODES.has(code)) return 'invalid'
  return null
}

export const isTokenExpiredResponse = (payload: any): boolean => {
  return getAuthSessionReason(payload) === 'expired'
}

export const isInvalidSessionResponse = (payload: any): boolean => {
  return getAuthSessionReason(payload) === 'invalid'
}

export const isAuthSessionResponse = (payload: any): boolean => {
  return getAuthSessionReason(payload) !== null
}

export const runAuthSessionHandler = (
  payload: any,
  handler: (reason: AuthSessionReason) => void
): boolean => {
  const reason = getAuthSessionReason(payload)
  if (!reason) return false
  handler(reason)
  return true
}

export const getSocketAuthSessionReason = (error: any): AuthSessionReason | null => {
  if (error?.name === 'TokenExpiredError') return 'expired'
  return getAuthSessionReason(error)
}
