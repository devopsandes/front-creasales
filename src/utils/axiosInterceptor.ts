import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { isTokenExpiredOrExpiring } from './tokenUtils'

/**
 * Configura interceptores de axios para manejar tokens y renovación automática
 * 
 * NOTA: Esta implementación requiere que el backend tenga un endpoint de renovación.
 * Si no existe, el interceptor solo verificará el token antes de las peticiones.
 */
export const setupAxiosInterceptors = () => {
  // Interceptor para agregar el token a todas las peticiones
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token')
      
      if (token) {
        // Verificar si el token está próximo a expirar antes de hacer la petición
        if (isTokenExpiredOrExpiring(token, 2)) {
          console.warn('⚠️ Token próximo a expirar, considerando renovación...')
          // Aquí podrías llamar a una función de renovación si el backend lo permite
          // await refreshTokenIfNeeded()
        }

        // Agregar el token al header si no está presente
        if (!config.headers['authorization']) {
          config.headers['authorization'] = `Bearer ${token}`
        }
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Interceptor para manejar respuestas y renovar token si es necesario
  axios.interceptors.response.use(
    (response) => {
      return response
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      // Si la petición falló con 401 y no hemos intentado renovar
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        // TODO: Implementar renovación de token si el backend lo permite
        // const newToken = await refreshToken()
        // if (newToken) {
        //   localStorage.setItem('token', newToken)
        //   originalRequest.headers['authorization'] = `Bearer ${newToken}`
        //   return axios(originalRequest)
        // }

        // Si no se puede renovar, limpiar el token y redirigir
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('userId')
      }

      return Promise.reject(error)
    }
  )
}

/**
 * Función para renovar el token (requiere endpoint en el backend)
 * @returns Nuevo token o null si falla
 */
export const refreshToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    // TODO: Reemplazar con el endpoint real de renovación cuando esté disponible
    // const url = `${import.meta.env.VITE_URL_BACKEND}/auth/refresh`
    // const { data } = await axios.post(url, { token })
    // return data.token

    return null
  } catch (error) {
    console.error('Error renovando token:', error)
    return null
  }
}

