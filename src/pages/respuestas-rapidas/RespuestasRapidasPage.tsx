import { useEffect, useRef, useState } from "react"
import { useDispatch } from "react-redux"
import { toast } from "react-toastify"
import ConfirmModal from "../../components/modal/ConfirmModal"
import { openSessionExpired } from "../../app/slices/actionSlice"
import { QuickResponse } from "../../interfaces/quickResponses.interface"
import { createQuickResponse, deleteQuickResponse, getQuickResponses, updateQuickResponse } from "../../services/quickResponses/quickResponses.services"
import "./respuestas-rapidas.css"

const normalizeShortcut=(raw:string)=>{
  const s=(raw||"").trim().replace(/^\//,"").toLowerCase()
  return s
}

const isValidShortcut=(s:string)=>{
  if(!s)return false
  if(s.length<1||s.length>50)return false
  return/^[a-z0-9_]+$/.test(s)
}

const RespuestasRapidasPage=()=>{
  const dispatch=useDispatch()
  const token=localStorage.getItem("token")||""
  const [items,setItems]=useState<QuickResponse[]>([])
  const [loading,setLoading]=useState(false)
  const [search,setSearch]=useState("")
  const searchRef=useRef<number|undefined>(undefined)
  const [isFormOpen,setIsFormOpen]=useState(false)
  const [editing,setEditing]=useState<QuickResponse|null>(null)
  const [shortcut,setShortcut]=useState("")
  const [text,setText]=useState("")
  const [saving,setSaving]=useState(false)
  const [formError,setFormError]=useState("")
  const [confirmOpen,setConfirmOpen]=useState(false)
  const [toDelete,setToDelete]=useState<QuickResponse|null>(null)

  const fetchList=async(nextSearch?:string)=>{
    if(!token)return
    setLoading(true)
    const q=(nextSearch!==undefined?nextSearch:search).trim()
    const resp=await getQuickResponses(token,{search:q||undefined,page:1,limit:50})
    if((resp as any)?.statusCode===401){
      dispatch(openSessionExpired())
      setLoading(false)
      return
    }
    const list=Array.isArray((resp as any)?.items)?(resp as any).items:[]
    setItems(list)
    setLoading(false)
  }

  useEffect(()=>{fetchList().catch(()=>setLoading(false))},[])

  useEffect(()=>{
    if(!token)return
    if(searchRef.current)window.clearTimeout(searchRef.current)
    searchRef.current=window.setTimeout(()=>{fetchList(search).catch(()=>{})},300)
    return()=>{if(searchRef.current)window.clearTimeout(searchRef.current)}
  },[search,token])

  const openCreate=()=>{
    setEditing(null)
    setShortcut("")
    setText("")
    setFormError("")
    setIsFormOpen(true)
  }

  const openEdit=(qr:QuickResponse)=>{
    setEditing(qr)
    setShortcut(qr.shortcut||"")
    setText(qr.text||"")
    setFormError("")
    setIsFormOpen(true)
  }

  const openDuplicate=(qr:QuickResponse)=>{
    setEditing(null)
    const base=normalizeShortcut(qr.shortcut||"")
    setShortcut(base?`${base}_copia`:"copia")
    setText(qr.text||"")
    setFormError("")
    setIsFormOpen(true)
  }

  const handleSave=async()=>{
    const s=normalizeShortcut(shortcut)
    const t=(text||"").trim()
    if(!isValidShortcut(s)){
      setFormError("Atajo inválido")
      return
    }
    if(!t){
      setFormError("El mensaje es requerido")
      return
    }
    setSaving(true)
    setFormError("")
    const payload={shortcut:s,text:t}
    const resp=editing?await updateQuickResponse(token,editing.id,payload):await createQuickResponse(token,payload)
    const code=(resp as any)?.statusCode
    if(code===401){
      dispatch(openSessionExpired())
      setSaving(false)
      return
    }
    if(code===409){
      setFormError("El atajo ya existe")
      setSaving(false)
      return
    }
    if(code&&code>=400){
      setFormError("No se pudo guardar")
      setSaving(false)
      return
    }
    toast.success("Guardado")
    setIsFormOpen(false)
    setSaving(false)
    fetchList().catch(()=>{})
  }

  const requestDelete=(qr:QuickResponse)=>{
    setToDelete(qr)
    setConfirmOpen(true)
  }

  const confirmDelete=async()=>{
    if(!toDelete)return
    const resp=await deleteQuickResponse(token,toDelete.id)
    const code=(resp as any)?.statusCode
    if(code===401){
      dispatch(openSessionExpired())
      setConfirmOpen(false)
      setToDelete(null)
      return
    }
    if(code&&code>=400){
      toast.error("No se pudo eliminar")
      setConfirmOpen(false)
      setToDelete(null)
      return
    }
    toast.success("Eliminado")
    setConfirmOpen(false)
    setToDelete(null)
    fetchList().catch(()=>{})
  }

  const copyShortcut=async(qr:QuickResponse)=>{
    try{
      await navigator.clipboard.writeText(`/${qr.shortcut}`)
      toast.success("Copiado")
    }catch{
      toast.error("No se pudo copiar")
    }
  }

  return(
    <div className="quick-wrapper">
      <div className="quick-header">
        <h2 className="quick-header-title">Gestión de Respuestas Rápidas</h2>
        <p className="quick-header-description">Cree, edite y elimine respuestas reutilizables para acelerar la escritura en conversaciones. Luego podrá insertarlas desde el chat escribiendo / y seleccionando la opción deseada.</p>
      </div>
      <div className="quick-container">
        <div className="quick-content">
          <div className="quick-actions">
            <div className="quick-actions-row">
              <div className="quick-actions-row-inner">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por atajo o contenido" className="quick-input"/>
              </div>
              <div className="quick-btn-row">
                <button type="button" onClick={openCreate} className="quick-btn quick-btn-primary">Nuevo</button>
                <button type="button" onClick={()=>fetchList().catch(()=>{})} className="quick-btn">Actualizar</button>
                <button type="button" onClick={()=>setSearch("")} className="quick-btn">Limpiar</button>
              </div>
            </div>
          </div>
          <div className="quick-table-wrapper">
            <div className="quick-table-head">
              <div>Atajo</div>
              <div>Texto</div>
              <div style={{textAlign:"right"}}>Acciones</div>
            </div>
            {loading?(
              <div className="quick-loading">Cargando...</div>
            ):items.length?(
              <div>
                {items.map(qr=>(
                  <div key={qr.id} className="quick-row">
                    <div className="quick-shortcut">
                      <span>/{qr.shortcut}</span>
                      <button type="button" onClick={()=>copyShortcut(qr)} className="quick-mini">Copiar</button>
                    </div>
                    <div className="quick-text">{qr.text}</div>
                    <div className="quick-actions-cell">
                      <button type="button" onClick={()=>openEdit(qr)} className="quick-mini">Editar</button>
                      <button type="button" onClick={()=>openDuplicate(qr)} className="quick-mini">Duplicar</button>
                      <button type="button" onClick={()=>requestDelete(qr)} className="quick-mini">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            ):(
              <div className="quick-empty">Sin resultados</div>
            )}
          </div>
        </div>
      </div>
      {isFormOpen&&(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 text-left shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{editing?"Editar":"Nueva"} respuesta rápida</h2>
              <button type="button" onClick={()=>setIsFormOpen(false)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Atajo</label>
                <input value={shortcut} onChange={e=>setShortcut(e.target.value)} placeholder="bienvenida" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                <p className="mt-1 text-xs text-slate-500">Solo letras,números y _</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Mensaje</label>
                <textarea value={text} onChange={e=>setText(e.target.value)} rows={6} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              {formError&&(
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</div>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <button type="button" onClick={()=>setIsFormOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={saving}>Cancelar</button>
                <button type="button" onClick={()=>handleSave().catch(()=>{})} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={confirmOpen} title="Eliminar respuesta rápida" message="¿Confirmas la eliminación?" confirmText="Eliminar" cancelText="Cancelar" onClose={()=>{setConfirmOpen(false);setToDelete(null)}} onConfirm={()=>confirmDelete().catch(()=>{})}/>
    </div>
  )
}

export default RespuestasRapidasPage


