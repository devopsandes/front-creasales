import axios from "axios"
import { QuickResponse } from "../../interfaces/quickResponses.interface"
import { resolveClient } from "../apiClient"

export type QuickResponsesListResponse={items:QuickResponse[];total?:number;page?:number;limit?:number;paginas?:number;statusCode?:number;message?:any;error?:string}

type BackendListResponse={statusCode:number;page:number;limit:number;total:number;paginas:number;quickResponses:QuickResponse[];message?:any;error?:string}
type BackendOneResponse={statusCode:number;quickResponse:QuickResponse;message?:any;error?:string}

const QUICK_RESPONSES_TTL_MS = 30_000
const quickResponsesCache = new Map<string, { value: QuickResponsesListResponse; expiresAt: number }>()
const pendingQuickResponses = new Map<string, Promise<QuickResponsesListResponse>>()
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

export const getQuickResponses=async(token:string,params?:{search?:string;page?:number;limit?:number}):Promise<QuickResponsesListResponse>=>{
  const normalizedSearch=(params?.search??"").trim().toLowerCase()
  const normalizedPage=params?.page??1
  const normalizedLimit=params?.limit??200
  const cacheKey=`${token}:${normalizedSearch}:${normalizedPage}:${normalizedLimit}`
  const useCache=normalizedSearch.length===0 && normalizedPage===1 && normalizedLimit===200

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

export const createQuickResponse=async(token:string,payload:{shortcut:string;text:string}):Promise<{statusCode?:number;quickResponse?:QuickResponse;message?:any;error?:string}>=>{
  try{
    const headers={authorization:`Bearer ${token}`}
    const {data,status}=await quickResponsesClient.post<BackendOneResponse>(baseUrl(),payload,{headers})
    quickResponsesCache.clear()
    pendingQuickResponses.clear()
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
    quickResponsesCache.clear()
    pendingQuickResponses.clear()
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
    quickResponsesCache.clear()
    pendingQuickResponses.clear()
    return{...(data as any),statusCode:(data as any)?.statusCode??status}
  }catch(error){
    if(axios.isAxiosError(error)&&error.response){
      return{...(error.response.data as any),statusCode:error.response.status}
    }
    throw error
  }
}
