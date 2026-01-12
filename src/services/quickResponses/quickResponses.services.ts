import axios from "axios"
import { QuickResponse } from "../../interfaces/quickResponses.interface"

export type QuickResponsesListResponse={items:QuickResponse[];total?:number;page?:number;limit?:number;paginas?:number;statusCode?:number;message?:any;error?:string}

type BackendListResponse={statusCode:number;page:number;limit:number;total:number;paginas:number;quickResponses:QuickResponse[];message?:any;error?:string}
type BackendOneResponse={statusCode:number;quickResponse:QuickResponse;message?:any;error?:string}

const baseUrl=()=>`${import.meta.env.VITE_URL_BACKEND}/quick-responses`

export const getQuickResponses=async(token:string,params?:{search?:string;page?:number;limit?:number}):Promise<QuickResponsesListResponse>=>{
  try{
    const headers={authorization:`Bearer ${token}`}
    const {data,status}=await axios.get<BackendListResponse>(baseUrl(),{headers,params})
    const code=(data as any)?.statusCode??status
    const list=Array.isArray((data as any)?.quickResponses)?(data as any).quickResponses:[]
    return{statusCode:code,page:(data as any)?.page,limit:(data as any)?.limit,total:(data as any)?.total,paginas:(data as any)?.paginas,items:list,message:(data as any)?.message,error:(data as any)?.error}
  }catch(error){
    if(axios.isAxiosError(error)&&error.response){
      return{...(error.response.data as any),statusCode:error.response.status,items:Array.isArray((error.response.data as any)?.quickResponses)?(error.response.data as any).quickResponses:[]}
    }
    throw error
  }
}

export const createQuickResponse=async(token:string,payload:{shortcut:string;text:string}):Promise<{statusCode?:number;quickResponse?:QuickResponse;message?:any;error?:string}>=>{
  try{
    const headers={authorization:`Bearer ${token}`}
    const {data,status}=await axios.post<BackendOneResponse>(baseUrl(),payload,{headers})
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
    const {data,status}=await axios.patch<BackendOneResponse>(`${baseUrl()}/${id}`,payload,{headers})
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
    const {data,status}=await axios.delete(`${baseUrl()}/${id}`,{headers})
    return{...(data as any),statusCode:(data as any)?.statusCode??status}
  }catch(error){
    if(axios.isAxiosError(error)&&error.response){
      return{...(error.response.data as any),statusCode:error.response.status}
    }
    throw error
  }
}


