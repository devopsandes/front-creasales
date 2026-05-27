import axios from "axios"
import { QuickResponse } from "../../interfaces/quickResponses.interface"
import { resolveClient } from "../apiClient"

export type QuickResponsesListResponse={items:QuickResponse[];total?:number;page?:number;limit?:number;paginas?:number;statusCode?:number;message?:any;error?:string}
export type QuickResponsesCatalogResponse=QuickResponsesListResponse&{version?:string;updatedAt?:string;fromCache?:boolean}

type BackendListResponse={statusCode:number;page:number;limit:number;total:number;paginas:number;quickResponses:QuickResponse[];message?:any;error?:string}
type BackendOneResponse={statusCode:number;quickResponse:QuickResponse;message?:any;error?:string}

const QUICK_RESPONSES_TTL_MS = 30_000
const QUICK_RESPONSES_CATALOG_TTL_MS = 10 * 60_000
const QUICK_RESPONSES_CATALOG_LIMIT = 200
const QUICK_RESPONSES_CATALOG_STORAGE_PREFIX = "quick_responses_catalog_v1"
const quickResponsesCache = new Map<string, { value: QuickResponsesListResponse; expiresAt: number }>()
const pendingQuickResponses = new Map<string, Promise<QuickResponsesListResponse>>()
const quickResponsesCatalogCache = new Map<string, { value: QuickResponsesCatalogResponse; expiresAt: number }>()
const pendingQuickResponsesCatalog = new Map<string, Promise<QuickResponsesCatalogResponse>>()
const quickResponsesCatalogListeners = new Set<() => void>()
const quickResponsesClient = resolveClient("quickResponses")
const baseUrl = () => '/quick-responses'

const getCachedQuickResponses = (key: string): QuickResponsesListResponse | null => {
  const entry = quickResponsesCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    quickResponsesCache.delete(key)
    return null
  }
  return entry.value
}

const hashString = (value: string): string => {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

const getCatalogKey = (token: string): string => `catalog:${hashString(token || "anonymous")}`
const getCatalogStorageKey = (token: string): string => `${QUICK_RESPONSES_CATALOG_STORAGE_PREFIX}:${hashString(token || "anonymous")}`

const getCatalogVersion = (items: QuickResponse[]): { version: string; updatedAt: string } => {
  const latest = items.reduce((acc, item) => {
    const ts = item.updatedAt ? new Date(item.updatedAt).getTime() : 0
    return Number.isFinite(ts) && ts > acc ? ts : acc
  }, 0)
  const updatedAt = latest > 0 ? new Date(latest).toISOString() : ""
  return { version: `${items.length}:${updatedAt}`, updatedAt }
}

const readStoredCatalog = (token: string): QuickResponsesCatalogResponse | null => {
  try {
    const raw = localStorage.getItem(getCatalogStorageKey(token))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const cachedAt = Number(parsed?.cachedAt || 0)
    if (!cachedAt || Date.now() - cachedAt > QUICK_RESPONSES_CATALOG_TTL_MS) return null
    const items = Array.isArray(parsed?.items) ? parsed.items : []
    return {
      statusCode: 200,
      items,
      total: items.length,
      page: 1,
      limit: QUICK_RESPONSES_CATALOG_LIMIT,
      version: typeof parsed?.version === "string" ? parsed.version : undefined,
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : undefined,
      fromCache: true,
    }
  } catch {
    return null
  }
}

const writeStoredCatalog = (token: string, payload: QuickResponsesCatalogResponse) => {
  try {
    localStorage.setItem(getCatalogStorageKey(token), JSON.stringify({
      cachedAt: Date.now(),
      version: payload.version,
      updatedAt: payload.updatedAt,
      items: payload.items,
    }))
  } catch { }
}

const notifyQuickResponsesCatalogListeners = () => {
  quickResponsesCatalogListeners.forEach((listener) => {
    try { listener() } catch { }
  })
}

export const subscribeQuickResponsesCatalogInvalidation = (listener: () => void): (() => void) => {
  quickResponsesCatalogListeners.add(listener)
  return () => { quickResponsesCatalogListeners.delete(listener) }
}

export const invalidateQuickResponsesCatalog = (token?: string, options?: { notify?: boolean }) => {
  if (token) {
    quickResponsesCatalogCache.delete(getCatalogKey(token))
    pendingQuickResponsesCatalog.delete(getCatalogKey(token))
    try { localStorage.removeItem(getCatalogStorageKey(token)) } catch { }
  } else {
    quickResponsesCatalogCache.clear()
    pendingQuickResponsesCatalog.clear()
  }
  quickResponsesCache.clear()
  pendingQuickResponses.clear()
  if (options?.notify !== false) notifyQuickResponsesCatalogListeners()
}

export const getQuickResponses=async(token:string,params?:{search?:string;page?:number;limit?:number},options?:{skipCache?:boolean}):Promise<QuickResponsesListResponse>=>{
  const normalizedSearch=(params?.search??"").trim().toLowerCase()
  const normalizedPage=params?.page??1
  const normalizedLimit=params?.limit??200
  const cacheKey=`${token}:${normalizedSearch}:${normalizedPage}:${normalizedLimit}`
  const useCache=!options?.skipCache && normalizedSearch.length===0 && normalizedPage===1 && normalizedLimit===200

  if(useCache){
    const cached=getCachedQuickResponses(cacheKey)
    if(cached)return cached
    const inflight=pendingQuickResponses.get(cacheKey)
    if(inflight)return inflight
  }

  const task=(async():Promise<QuickResponsesListResponse>=>{
    try{
      const headers={authorization:`Bearer ${token}`}
      const {data,status}=await quickResponsesClient.get<BackendListResponse>(baseUrl(),{headers,params})
      const code=(data as any)?.statusCode??status
      const list=Array.isArray((data as any)?.quickResponses)?(data as any).quickResponses:[]
      const payload={statusCode:code,page:(data as any)?.page,limit:(data as any)?.limit,total:(data as any)?.total,paginas:(data as any)?.paginas,items:list,message:(data as any)?.message,error:(data as any)?.error}
      if(useCache){
        quickResponsesCache.set(cacheKey,{value:payload,expiresAt:Date.now()+QUICK_RESPONSES_TTL_MS})
      }
      return payload
    }catch(error){
      if(axios.isAxiosError(error)&&error.response){
        return{...(error.response.data as any),statusCode:error.response.status,items:Array.isArray((error.response.data as any)?.quickResponses)?(error.response.data as any).quickResponses:[]}
      }
      throw error
    }finally{
      if(useCache)pendingQuickResponses.delete(cacheKey)
    }
  })()

  if(useCache)pendingQuickResponses.set(cacheKey,task)
  return task
}

export const getQuickResponsesCatalog=async(token:string,options?:{forceRefresh?:boolean}):Promise<QuickResponsesCatalogResponse>=>{
  if(!token)return{statusCode:401,items:[]}
  const cacheKey=getCatalogKey(token)
  if(!options?.forceRefresh){
    const memory=quickResponsesCatalogCache.get(cacheKey)
    if(memory&&memory.expiresAt>Date.now())return{...memory.value,fromCache:true}
    const stored=readStoredCatalog(token)
    if(stored){
      quickResponsesCatalogCache.set(cacheKey,{value:stored,expiresAt:Date.now()+QUICK_RESPONSES_CATALOG_TTL_MS})
      return stored
    }
    const inflight=pendingQuickResponsesCatalog.get(cacheKey)
    if(inflight)return inflight
  }

  const task=(async():Promise<QuickResponsesCatalogResponse>=>{
    const resp=await getQuickResponses(token,{page:1,limit:QUICK_RESPONSES_CATALOG_LIMIT},{skipCache:options?.forceRefresh})
    const items=Array.isArray(resp.items)?resp.items:[]
    const meta=getCatalogVersion(items)
    const payload:QuickResponsesCatalogResponse={...resp,items,total:resp.total??items.length,version:meta.version,updatedAt:meta.updatedAt,fromCache:false}
    const code=payload.statusCode??200
    if(code<400){
      quickResponsesCatalogCache.set(cacheKey,{value:payload,expiresAt:Date.now()+QUICK_RESPONSES_CATALOG_TTL_MS})
      writeStoredCatalog(token,payload)
    }
    return payload
  })()

  pendingQuickResponsesCatalog.set(cacheKey,task)
  try{return await task}
  finally{pendingQuickResponsesCatalog.delete(cacheKey)}
}

export const createQuickResponse=async(token:string,payload:{shortcut:string;text:string}):Promise<{statusCode?:number;quickResponse?:QuickResponse;message?:any;error?:string}>=>{
  try{
    const headers={authorization:`Bearer ${token}`}
    const {data,status}=await quickResponsesClient.post<BackendOneResponse>(baseUrl(),payload,{headers})
    invalidateQuickResponsesCatalog(token)
    return{statusCode:(data as any)?.statusCode??status,quickResponse:(data as any)?.quickResponse,message:(data as any)?.message,error:(data as any)?.error}
  }catch(error){
    if(axios.isAxiosError(error)&&error.response){
      return{...(error.response.data as any),statusCode:error.response.status}
    }
    throw error
  }
}

export const updateQuickResponse=async(token:string,id:string,payload:{shortcut?:string;text?:string}):Promise<{statusCode?:number;quickResponse?:QuickResponse;message?:any;error?:string}>=>{
  try{
    const headers={authorization:`Bearer ${token}`}
    const {data,status}=await quickResponsesClient.patch<BackendOneResponse>(`${baseUrl()}/${id}`,payload,{headers})
    invalidateQuickResponsesCatalog(token)
    return{statusCode:(data as any)?.statusCode??status,quickResponse:(data as any)?.quickResponse,message:(data as any)?.message,error:(data as any)?.error}
  }catch(error){
    if(axios.isAxiosError(error)&&error.response){
      return{...(error.response.data as any),statusCode:error.response.status}
    }
    throw error
  }
}

export const deleteQuickResponse=async(token:string,id:string):Promise<{statusCode?:number;message?:any}>=>{
  try{
    const headers={authorization:`Bearer ${token}`}
    const {data,status}=await quickResponsesClient.delete(`${baseUrl()}/${id}`,{headers})
    invalidateQuickResponsesCatalog(token)
    return{...(data as any),statusCode:(data as any)?.statusCode??status}
  }catch(error){
    if(axios.isAxiosError(error)&&error.response){
      return{...(error.response.data as any),statusCode:error.response.status}
    }
    throw error
  }
}
