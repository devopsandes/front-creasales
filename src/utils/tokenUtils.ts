/**
 * Utilidades para manejo de tokens JWT
 */

export interface DecodedToken {
  id?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica un token JWT y retorna su payload
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decodificando token:', error)
    return null
  }
}

/**
 * Verifica si un token está expirado o próximo a expirar
 * @param token - Token JWT a verificar
 * @param bufferMinutes - Minutos de anticipación antes de considerar el token como próximo a expirar (default: 5)
 * @returns true si el token está expirado o próximo a expirar
 */
export const isTokenExpiredOrExpiring = (token: string, bufferMinutes: number = 5): boolean => {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return true // Si no se puede decodificar o no tiene exp, considerarlo expirado
  }

  const expirationTime = decoded.exp * 1000 // Convertir a milisegundos
  const currentTime = Date.now()
  const bufferTime = bufferMinutes * 60 * 1000 // Convertir minutos a milisegundos

  // Verificar si está expirado o próximo a expirar (dentro del buffer)
  return currentTime >= (expirationTime - bufferTime)
}

/**
 * Obtiene el tiempo restante hasta la expiración del token en minutos
 * @param token - Token JWT
 * @returns Minutos restantes hasta la expiración, o null si no se puede determinar
 */
export const getTokenTimeRemaining = (token: string): number | null => {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return null
  }

  const expirationTime = decoded.exp * 1000
  const currentTime = Date.now()
  const remainingMs = expirationTime - currentTime
  const remainingMinutes = Math.floor(remainingMs / (60 * 1000))

  return remainingMinutes > 0 ? remainingMinutes : 0
}

/**
 * Verifica si el token almacenado en localStorage está válido
 */
export const isStoredTokenValid = (): boolean => {
  const token = localStorage.getItem('token')
  if (!token) return false
  return !isTokenExpiredOrExpiring(token)
}

