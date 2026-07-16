import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { toast } from "react-toastify"
import { FaEye, FaPen, FaTrash, FaSync, FaPlus, FaTimes } from "react-icons/fa"
import ConfirmModal from "../../components/modal/ConfirmModal"
import { openSessionExpired } from "../../app/slices/actionSlice"
import { SpecialDayMessage } from "../../interfaces/specialDayMessages.interface"
import { createSpecialDayMessage, deleteSpecialDayMessage, getSpecialDayMessages, updateSpecialDayMessage } from "../../services/specialDayMessages/specialDayMessages.services"
import { getAuthSessionReason } from "../../utils/authSession"
import "./special-day-messages.css"

const toHHMM = (raw: string) => (raw || "").slice(0, 5) // 'HH:mm:ss' -> 'HH:mm'

const formatFechaDisplay = (raw: string) => {
    if (!raw) return ""
    const [y, m, d] = raw.split("-")
    if (!y || !m || !d) return raw
    return `${d}/${m}/${y}`
}

const truncateText = (text: string, max = 60) => {
    const t = text || ""
    return t.length > max ? `${t.slice(0, max)}...` : t
}

const SpecialDayMessagesPage = () => {
    const dispatch = useDispatch()
    const token = localStorage.getItem("token") || ""
    const [items, setItems] = useState<SpecialDayMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editing, setEditing] = useState<SpecialDayMessage | null>(null)
    const [fecha, setFecha] = useState("")
    const [horaDesde, setHoraDesde] = useState("")
    const [horaHasta, setHoraHasta] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [activo, setActivo] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState("")

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [toDelete, setToDelete] = useState<SpecialDayMessage | null>(null)

    const openAuthSessionIfNeeded = (payload: any) => {
        const authReason = getAuthSessionReason(payload)
        if (!authReason) return false
        dispatch(openSessionExpired(authReason))
        return true
    }

    const fetchList = async () => {
        if (!token) return
        setLoading(true)
        const resp = await getSpecialDayMessages(token)
        if (openAuthSessionIfNeeded(resp)) {
            setLoading(false)
            return
        }
        setItems(Array.isArray(resp.items) ? resp.items : [])
        setExpandedRow(null)
        setLoading(false)
    }

    useEffect(() => { fetchList().catch(() => setLoading(false)) }, [])

    const openCreate = () => {
        setEditing(null)
        setFecha("")
        setHoraDesde("")
        setHoraHasta("")
        setMensaje("")
        setActivo(true)
        setFormError("")
        setIsFormOpen(true)
    }

    const openEdit = (item: SpecialDayMessage) => {
        setEditing(item)
        setFecha(item.fecha)
        setHoraDesde(toHHMM(item.horaDesde))
        setHoraHasta(toHHMM(item.horaHasta))
        setMensaje(item.mensaje)
        setActivo(item.activo)
        setFormError("")
        setIsFormOpen(true)
    }

    const handleSave = async () => {
        if (!fecha) { setFormError("La fecha es requerida"); return }
        if (!horaDesde || !horaHasta) { setFormError("Debe indicar hora desde y hora hasta"); return }
        if (horaHasta <= horaDesde) { setFormError("La hora hasta debe ser posterior a la hora desde"); return }
        const t = mensaje.trim()
        if (!t) { setFormError("El mensaje es requerido"); return }

        setSaving(true)
        setFormError("")
        const payload = { fecha, hora_desde: horaDesde, hora_hasta: horaHasta, mensaje: t, activo }
        const resp = editing
            ? await updateSpecialDayMessage(token, editing.id, payload)
            : await createSpecialDayMessage(token, payload)

        if (openAuthSessionIfNeeded(resp)) { setSaving(false); return }
        const code = resp.statusCode
        if (code && code >= 400) {
            const msg = resp.message
            setFormError(Array.isArray(msg) ? msg.join(", ") : "No se pudo guardar")
            setSaving(false)
            return
        }
        toast.success(editing ? "Regla actualizada" : "Regla creada")
        setIsFormOpen(false)
        setSaving(false)
        fetchList().catch(() => { })
    }

    const requestDelete = (item: SpecialDayMessage) => {
        setToDelete(item)
        setConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (!toDelete) return
        const resp = await deleteSpecialDayMessage(token, toDelete.id)
        if (openAuthSessionIfNeeded(resp)) { setConfirmOpen(false); setToDelete(null); return }
        const code = resp.statusCode
        if (code && code >= 400) {
            toast.error("No se pudo eliminar")
            setConfirmOpen(false)
            setToDelete(null)
            return
        }
        toast.success("Regla eliminada")
        setConfirmOpen(false)
        setToDelete(null)
        fetchList().catch(() => { })
    }

    const handleToggleActivo = async (item: SpecialDayMessage) => {
        const resp = await updateSpecialDayMessage(token, item.id, { activo: !item.activo })
        if (openAuthSessionIfNeeded(resp)) return
        if (resp.statusCode && resp.statusCode >= 400) {
            toast.error("No se pudo actualizar el estado")
            return
        }
        fetchList().catch(() => { })
    }

    const sortedItems = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha))

    return (
        <div className="sdm-wrapper">
            <div className="sdm-header">
                <h2 className="sdm-header-title">Mensajes de Días Especiales</h2>
                <p className="sdm-header-description">
                    Programe mensajes personalizados para feriados u otras fechas específicas. Cuando un chat quede sin asignar
                    dentro del rango de fecha y hora configurado, se enviará este mensaje al afiliado en lugar del mensaje
                    habitual de fuera de horario.
                </p>
            </div>

            <div className="sdm-container">
                <div className="sdm-actions-bar">
                    <button type="button" onClick={() => fetchList().catch(() => { })} className="sdm-btn-refresh" disabled={loading}>
                        <FaSync className={loading ? "sdm-spinning" : ""} />
                        {loading ? "Cargando..." : "Actualizar"}
                    </button>
                    <button type="button" onClick={openCreate} className="sdm-btn-new">
                        <FaPlus />
                        Nueva regla
                    </button>
                </div>

                {loading ? (
                    <div className="sdm-loading">
                        <div className="sdm-spinner" />
                        <span>Cargando reglas...</span>
                    </div>
                ) : (
                    <div className="sdm-table-wrapper">
                        <table className="sdm-table">
                            <thead className="sdm-table-header">
                                <tr>
                                    <th className="sdm-table-header-cell">Fecha</th>
                                    <th className="sdm-table-header-cell">Horario</th>
                                    <th className="sdm-table-header-cell">Mensaje</th>
                                    <th className="sdm-table-header-cell sdm-table-header-cell-center">Estado</th>
                                    <th className="sdm-table-header-cell sdm-table-header-cell-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="sdm-empty">No hay reglas cargadas todavía</td>
                                    </tr>
                                ) : sortedItems.map((item) => {
                                    const isExpanded = expandedRow === item.id
                                    return (
                                        <>
                                            <tr key={item.id} className={`sdm-table-row ${isExpanded ? "sdm-row-expanded" : ""}`}>
                                                <td className="sdm-table-cell sdm-table-cell-fecha">{formatFechaDisplay(item.fecha)}</td>
                                                <td className="sdm-table-cell sdm-table-cell-horario">{toHHMM(item.horaDesde)} - {toHHMM(item.horaHasta)}</td>
                                                <td className="sdm-table-cell sdm-table-cell-mensaje" title={item.mensaje}>{truncateText(item.mensaje)}</td>
                                                <td className="sdm-table-cell sdm-table-cell-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActivo(item)}
                                                        className={`sdm-badge ${item.activo ? "sdm-badge-activo" : "sdm-badge-inactivo"}`}
                                                        title="Click para cambiar el estado"
                                                    >
                                                        <span className="sdm-badge-dot" />
                                                        {item.activo ? "Activo" : "Inactivo"}
                                                    </button>
                                                </td>
                                                <td className="sdm-table-cell sdm-table-cell-center">
                                                    <div className="sdm-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                                                            className={`sdm-action-button sdm-action-view ${isExpanded ? "active" : ""}`}
                                                            title="Ver mensaje completo"
                                                        ><FaEye /></button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(item)}
                                                            className="sdm-action-button sdm-action-edit"
                                                            title="Editar regla"
                                                        ><FaPen /></button>
                                                        <button
                                                            type="button"
                                                            onClick={() => requestDelete(item)}
                                                            className="sdm-action-button sdm-action-delete"
                                                            title="Eliminar regla"
                                                        ><FaTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`detail-${item.id}`} className="sdm-detail-row">
                                                    <td colSpan={5}>
                                                        <div className="sdm-detail-panel">
                                                            <span className="sdm-detail-label">Mensaje completo</span>
                                                            <p className="sdm-detail-mensaje">{item.mensaje}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <div className="sdm-modal-overlay" onClick={() => !saving && setIsFormOpen(false)}>
                    <div className="sdm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sdm-modal-header">
                            <h3 className="sdm-modal-title">{editing ? "Editar regla" : "Nueva regla de día especial"}</h3>
                            <button type="button" onClick={() => setIsFormOpen(false)} className="sdm-modal-close">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="sdm-modal-body">
                            <div className="sdm-field">
                                <label className="sdm-field-label">Fecha</label>
                                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="sdm-input" />
                            </div>
                            <div className="sdm-field-row">
                                <div className="sdm-field">
                                    <label className="sdm-field-label">Hora desde</label>
                                    <input type="time" value={horaDesde} onChange={e => setHoraDesde(e.target.value)} className="sdm-input" />
                                </div>
                                <div className="sdm-field">
                                    <label className="sdm-field-label">Hora hasta</label>
                                    <input type="time" value={horaHasta} onChange={e => setHoraHasta(e.target.value)} className="sdm-input" />
                                </div>
                            </div>
                            <div className="sdm-field">
                                <label className="sdm-field-label">Mensaje</label>
                                <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={5} className="sdm-textarea" placeholder="Escriba el mensaje que se enviará a los afiliados..." />
                            </div>
                            <div className="sdm-field-toggle">
                                <input type="checkbox" id="sdm-activo-checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} />
                                <label htmlFor="sdm-activo-checkbox">Regla activa</label>
                            </div>
                            {formError && <div className="sdm-form-error">{formError}</div>}
                        </div>
                        <div className="sdm-modal-footer">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="sdm-btn-cancel" disabled={saving}>Cancelar</button>
                            <button type="button" onClick={() => handleSave().catch(() => { })} className="sdm-btn-save" disabled={saving}>
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                title="Eliminar regla"
                message="¿Confirmas la eliminación de esta regla de día especial?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => { setConfirmOpen(false); setToDelete(null) }}
                onConfirm={() => confirmDelete().catch(() => { })}
            />
        </div>
    )
}

export default SpecialDayMessagesPage