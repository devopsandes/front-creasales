import axios from "axios"
import { ErrorResponse, SuccessResponse } from "../../interfaces/auth.interface"
import { DataEmpresa, EmpresaResponse } from "../../interfaces/empresa.interface"
import { Usuario } from "../../interfaces/auth.interface"

const TTL_MS = 30_000
const empresaCache = new Map<string, { value: EmpresaResponse & ErrorResponse; expiresAt: number }>()
const operadoresCache = new Map<string, { value: { statusCode: number; users?: Usuario[] } & ErrorResponse; expiresAt: number }>()
const pendingEmpresa = new Map<string, Promise<EmpresaResponse & ErrorResponse>>()
const pendingOperadores = new Map<string, Promise<{ statusCode: number; users?: Usuario[] } & ErrorResponse>>()

const getCached = <T>(store: Map<string, { value: T; expiresAt: number }>, key: string): T | null => {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

const empresaXUser = async (token: string): Promise<EmpresaResponse & ErrorResponse> => {
  const cacheKey = token
  const cached = getCached(empresaCache, cacheKey)
  if (cached) return cached

  const inflight = pendingEmpresa.get(cacheKey)
  if (inflight) return inflight

  const task = (async (): Promise<EmpresaResponse & ErrorResponse> => {
    try {
      const url = `${import.meta.env.VITE_URL_BACKEND}/empresas/usuarios`
      const headers = { authorization: `Bearer ${token}` }
      const { data } = await axios.get<EmpresaResponse & ErrorResponse>(url, { headers })
      empresaCache.set(cacheKey, { value: data, expiresAt: Date.now() + TTL_MS })
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const objeto: EmpresaResponse & ErrorResponse = error.response.data
        return objeto
      }
      throw error
    } finally {
      pendingEmpresa.delete(cacheKey)
    }
  })()

  pendingEmpresa.set(cacheKey, task)
  return task
}

const createEmpresa = async (token: string, dataEmpresa: DataEmpresa): Promise<SuccessResponse & ErrorResponse> => {
  try {
    const url = `${import.meta.env.VITE_URL_BACKEND}/empresas`

    const headers = {
      authorization: `Bearer ${token}`
    }

    const { data } = await axios.post<SuccessResponse & ErrorResponse>(url, dataEmpresa, { headers })

    empresaCache.clear()
    pendingEmpresa.clear()

    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {

      const objeto: SuccessResponse & ErrorResponse = error.response.data
      return objeto
    }
    throw error;
  }
}

const getOperadoresEmpresa = async (token: string): Promise<{ statusCode: number; users?: Usuario[] } & ErrorResponse> => {
  const cacheKey = token
  const cached = getCached(operadoresCache, cacheKey)
  if (cached) return cached

  const inflight = pendingOperadores.get(cacheKey)
  if (inflight) return inflight

  const task = (async (): Promise<{ statusCode: number; users?: Usuario[] } & ErrorResponse> => {
    try {
      const url = `${import.meta.env.VITE_URL_BACKEND}/empresas/usuarios/operators`
      const headers = {
        authorization: `Bearer ${token}`
      }

      const { data } = await axios.get<any>(url, { headers })

      const users =
        Array.isArray(data?.users) ? data.users :
          Array.isArray(data?.operadores) ? data.operadores :
            Array.isArray(data?.data) ? data.data :
              undefined

      const payload = {
        statusCode: data?.statusCode ?? 200,
        users,
      } as any
      operadoresCache.set(cacheKey, { value: payload, expiresAt: Date.now() + TTL_MS })
      return payload
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const objeto: any = error.response.data
        return {
          statusCode: objeto?.statusCode ?? error.response.status,
          message: objeto?.message ?? ['Error al obtener operadores'],
          error: objeto?.error ?? 'Error',
          users: [],
        }
      }
      throw error
    } finally {
      pendingOperadores.delete(cacheKey)
    }
  })()

  pendingOperadores.set(cacheKey, task)
  return task
}

export { empresaXUser, createEmpresa, getOperadoresEmpresa }
