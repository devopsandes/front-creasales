import { useEffect, useRef, useState } from "react"
import { useDispatch } from "react-redux"
import { toast } from "react-toastify"
import ConfirmModal from "../../components/modal/ConfirmModal"
import { openSessionExpired } from "../../app/slices/actionSlice"
import { QuickResponse } from "../../interfaces/quickResponses.interface"
import { createQuickResponse, deleteQuickResponse, getQuickResponses, updateQuickResponse } from "../../services/quickResponses/quickResponses.services"
import { getAuthSessionReason } from "../../utils/authSession"
import "./respuestas-rapidas.css"

const normalizeShortcut = (raw: string) => {
  const firstTrim = (raw || "").trim()
  const withoutFirstSlash = firstTrim.startsWith("/") ? firstTrim.slice(1) : firstTrim
  return withoutFirstSlash.trim().toLowerCase()
}

const RespuestasRapidasPage = () => {
  const dispatch = useDispatch()
  const token = localStorage.getItem("token") || ""
  const [items, setItems] = useState<QuickResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const searchRef = useRef<number | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<QuickResponse | null>(null)
  const [originalShortcut, setOriginalShortcut] = useState("")
  const [shortcut, setShortcut] = useState("")
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<QuickResponse | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getShortcutOrder = (shortcut: string): number => {
    const match = `${shortcut ?? ''}`.match(/^(\d+)/)
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
  }

  const sortedItems = [...items].sort((a, b) => getShortcutOrder(a.shortcut) - getShortcutOrder(b.shortcut))

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }
  const openAuthSessionIfNeeded = (payload: any) => {
    const authReason = getAuthSessionReason(payload)
    if (!authReason) return false
    dispatch(openSessionExpired(authReason))
    return true
  }

  const fetchList = async (nextSearch?: string) => {
    if (!token) return
    setLoading(true)
    const q = (nextSearch !== undefined ? nextSearch : search).trim()
    const resp = await getQuickResponses(token, { search: q || undefined, page: 1, limit: 500 })
    if (openAuthSessionIfNeeded(resp)) {
      setLoading(false)
      return
    }
    const list = Array.isArray((resp as any)?.items) ? (resp as any).items : []
    setItems(list)
    setLoading(false)
  }

  useEffect(() => { fetchList().catch(() => setLoading(false)) }, [])

  useEffect(() => {
    if (!token) return
    if (searchRef.current) window.clearTimeout(searchRef.current)
    searchRef.current = window.setTimeout(() => { fetchList(search).catch(() => { }) }, 300)
    return () => { if (searchRef.current) window.clearTimeout(searchRef.current) }
  }, [search, token])

  const openCreate = () => {
    setEditing(null)
    setOriginalShortcut("")
    setShortcut("")
    setText("")
    setFormError("")
    setIsFormOpen(true)
  }

  const openEdit = (qr: QuickResponse) => {
    setEditing(qr)
    setOriginalShortcut(normalizeShortcut(qr.shortcut || ""))
    setShortcut(qr.shortcut || "")
    setText(qr.text || "")
    setFormError("")
    setIsFormOpen(true)
  }

  const openDuplicate = (qr: QuickResponse) => {
    setEditing(null)
    setOriginalShortcut("")
    const base = normalizeShortcut(qr.shortcut || "")
    setShortcut(base ? `${base}_copia` : "copia")
    setText(qr.text || "")
    setFormError("")
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    const rawShortcut = shortcut || ""
    const rawText = text || ""
    if (/[\r\n]/.test(rawShortcut)) {
      setFormError("El atajo no puede contener saltos de línea")
      return
    }
    const s = normalizeShortcut(rawShortcut)
    const t = rawText.trim()
    if (!s) {
      setFormError("El atajo es requerido")
      return
    }
    if (s.length > 50) {
      setFormError("El atajo debe tener entre 1 y 50 caracteres")
      return
    }
    if (!t) {
      setFormError("El mensaje es requerido")
      return
    }
    if (t.length > 5000) {
      setFormError("El mensaje no puede superar 5000 caracteres")
      return
    }
    setSaving(true)
    setFormError("")
    const shortcutChanged = editing ? normalizeShortcut(rawShortcut) !== originalShortcut : true
    const resp = editing
      ? await updateQuickResponse(token, editing.id, { ...(shortcutChanged ? { shortcut: s } : {}), text: t })
      : await createQuickResponse(token, { shortcut: s, text: t })
    const code = (resp as any)?.statusCode
    if (openAuthSessionIfNeeded(resp)) {
      setSaving(false)
      return
    }
    if (code === 409) {
      const msg = (resp as any)?.message
      setFormError(Array.isArray(msg) ? msg.join(", ") : "El atajo ya existe")
      setSaving(false)
      return
    }
    if (code && code >= 400) {
      const msg = (resp as any)?.message
      setFormError(Array.isArray(msg) ? msg.join(", ") : "No se pudo guardar")
      setSaving(false)
      return
    }
    toast.success("Guardado")
    setIsFormOpen(false)
    setSaving(false)
    fetchList().catch(() => { })
  }

  const requestDelete = (qr: QuickResponse) => {
    setToDelete(qr)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const resp = await deleteQuickResponse(token, toDelete.id)
    const code = (resp as any)?.statusCode
    if (openAuthSessionIfNeeded(resp)) {
      setConfirmOpen(false)
      setToDelete(null)
      return
    }
    if (code && code >= 400) {
      toast.error("No se pudo eliminar")
      setConfirmOpen(false)
      setToDelete(null)
      return
    }
    toast.success("Eliminado")
    setConfirmOpen(false)
    setToDelete(null)
    fetchList().catch(() => { })
  }

  const copyShortcut = async (qr: QuickResponse) => {
    try {
      await navigator.clipboard.writeText(`/${qr.shortcut}`)
      toast.success("Copiado")
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  return (
    <div className="quick-wrapper">
      <div className="quick-header">
        <h2 className="quick-header-title">Gestión de Respuestas Rápidas</h2>
        <p className="quick-header-description">Cree, edite y elimine respuestas reutilizables para acelerar la escritura en conversaciones. Luego podrá insertarlas desde el chat escribiendo / y seleccionando la opción deseada.</p>
      </div>
      <div className="w-full flex justify-center px-4 md:px-8">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-5">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por atajo o contenido"
              className="w-full sm:max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Nuevo</button>
              <button type="button" onClick={() => fetchList().catch(() => { })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Actualizar</button>
              <button type="button" onClick={() => setSearch("")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Limpiar</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>
          ) : sortedItems.length ? (
            <div className="flex flex-col gap-2">
              {sortedItems.map(qr => {
                const isExpanded = expandedId === qr.id
                return (
                  <div key={qr.id} className={`rounded-xl border bg-white transition-colors ${isExpanded ? "border-blue-400 shadow-sm" : "border-slate-200"}`}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(qr.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-800">/{qr.shortcut}</span>
                      <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180 text-blue-600" : ""}`} viewBox="0 0 20 20" fill="none">
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-100">
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{qr.text}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => copyShortcut(qr)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Copiar atajo</button>
                          <button type="button" onClick={() => openEdit(qr)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Editar</button>
                          <button type="button" onClick={() => openDuplicate(qr)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Duplicar</button>
                          <button type="button" onClick={() => requestDelete(qr)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">Sin resultados</div>
          )}
        </div>
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 text-left shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{editing ? "Editar" : "Nueva"} respuesta rápida</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Atajo</label>
                <input value={shortcut} onChange={e => setShortcut(e.target.value)} placeholder="bienvenida" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p className="mt-1 text-xs text-slate-500">Se guarda en minúsculas,sin el primer /,sin saltos de línea,1 a 50 caracteres</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Mensaje</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={6} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {formError && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</div>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={saving}>Cancelar</button>
                <button type="button" onClick={() => handleSave().catch(() => { })} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={confirmOpen} title="Eliminar respuesta rápida" message="¿Confirmas la eliminación?" confirmText="Eliminar" cancelText="Cancelar" onClose={() => { setConfirmOpen(false); setToDelete(null) }} onConfirm={() => confirmDelete().catch(() => { })} />
    </div>
  )
}

export default RespuestasRapidasPage

