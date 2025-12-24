import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { openSessionExpired } from '../app/slices/actionSlice'
import { isTokenExpiredOrExpiring, getTokenTimeRemaining } from '../utils/tokenUtils'

/**
 * Hook para verificar periódicamente el estado del token y alertar si está por expirar
 * @param checkIntervalMinutes - Intervalo en minutos para verificar el token (default: 2)
 * @param warningMinutes - Minutos antes de la expiración para mostrar advertencia (default: 5)
 */
export const useTokenRefresh = (
  checkIntervalMinutes: number = 2,
  warningMinutes: number = 5
) => {
  const dispatch = useDispatch()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      // Verificar si el token está expirado o próximo a expirar
      if (isTokenExpiredOrExpiring(token, warningMinutes)) {
        const timeRemaining = getTokenTimeRemaining(token)
        
        if (timeRemaining === null || timeRemaining <= 0) {
          // Token ya expirado
          dispatch(openSessionExpired())
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        } else if (timeRemaining <= warningMinutes) {
          // Token próximo a expirar - podrías mostrar una notificación aquí
          console.warn(`⚠️ Tu sesión expirará en aproximadamente ${timeRemaining} minutos`)
          // TODO: Opcionalmente mostrar un toast o modal de advertencia
        }
      }
    }

    // Verificar inmediatamente
    checkToken()

    // Configurar verificación periódica
    const intervalMs = checkIntervalMinutes * 60 * 1000
    intervalRef.current = setInterval(checkToken, intervalMs)

    // Limpiar intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [dispatch, checkIntervalMinutes, warningMinutes])
}

