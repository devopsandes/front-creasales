import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { useDispatch } from "react-redux"
import {
    getConversacionDetalle,
    ConversacionDetalleResponse,
} from "../../services/conversaciones/conversaciones.services"
import { getAuthSessionReason } from "../../utils/authSession"
import TimelineItemView, { DocPreview, DocPreviewModal } from "../../components/chat/TimelineItemView"
import { openSessionExpired } from "../../app/slices/actionSlice"
import AfiliadoConversacionCard from "../../components/afiliado/AfiliadoConversacionCard"
import "../chats/chats.css"

const capitalizeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== "string") return ""
    return text.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

const ConversacionDetalle = () => {
    const { id } = useParams()
    const dispatch = useDispatch()
    const token = localStorage.getItem("token") || ""

    const [loading, setLoading] = useState<boolean>(true)
    const [data, setData] = useState<ConversacionDetalleResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [docPreview, setDocPreview] = useState<DocPreview | null>(null)

    useEffect(() => {
        if (!id || !token) return
        const controller = new AbortController()
        setLoading(true)
        setError(null)
        getConversacionDetalle(token, id, { signal: controller.signal })
            .then((resp: any) => {
                const authReason = getAuthSessionReason(resp)
                if (authReason) {
                    dispatch(openSessionExpired(authReason))
                    return
                }
                if (((resp as any)?.statusCode ?? 200) >= 400) {
                    setError("No se pudo cargar la conversación.")
                    return
                }
                setData(resp)
            })
            .catch((err: any) => {
                if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return
                setError("No se pudo cargar la conversación.")
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [id, token, dispatch])

    if (loading) {
        return (
            <div className="chat-loader-center">
                <div className="loader2"></div>
            </div>
        )
    }

    if (error || !data?.conversacion) {
        return (
            <div className="chat-empty-prompt">
                <p className="chat-empty-text">{error ?? "Conversación no encontrada."}</p>
            </div>
        )
    }

    const { conversacion, items } = data
    const nombre = conversacion.chat?.cliente?.nombre ?? ""
    const telefono = conversacion.chat?.cliente?.telefono ?? ""
    const archivadoPorLabel = conversacion.archivadoPor
        ? [capitalizeText(conversacion.archivadoPor.nombre), capitalizeText(conversacion.archivadoPor.apellido)].filter(Boolean).join(" ")
        : "Sistema"
    const onAuthExpired = (resp: any): boolean => {
        const reason = getAuthSessionReason(resp)
        if (!reason) return false
        dispatch(openSessionExpired(reason))
        return true
    }
    const fmt = (v: string | null | undefined) => v ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)) : "—"

    return (
        <div className="chat-with-panel">
            <div className="chat-main-col">
                <div className="header-chat">
                    <div className="header-icon">
                        <FaCircleUser size={25} />
                    </div>
                    <p className="nombre-chat">
                        <span>{nombre}</span>
                        <span>+{telefono}</span>
                    </p>
                    {conversacion.numeroConversacion && (
                        <span className="chat-conversacion-id">Nro.Conversación: {conversacion.numeroConversacion}</span>
                    )}
                    <span className="chat-conversacion-id">Archivó: {archivadoPorLabel}</span>
                </div>

                <div className="body-chat">
                    {items.length === 0 && (
                        <div className="chat-filter-empty-state">
                            <p className="chat-filter-empty-title">Esta conversación no tiene mensajes.</p>
                        </div>
                    )}
                    {/* Mismo pintado que la pantalla de Chats (notas, menciones, autor, adjuntos). */}
                    {items.map((msj, index) => (
                        <TimelineItemView key={msj.id ?? `${msj.createdAt}-${index}`} item={msj} onPreview={setDocPreview} />
                    ))}
                </div>

                <DocPreviewModal preview={docPreview} onClose={() => setDocPreview(null)} />
            </div>

            {/* Panel derecho: la conversación y quién habló en ella (en vivo desde Andes). */}
            <div className="chat-info-panel chat-info-panel--open conv-detalle-panel">
                <div className="chat-info-panel-content">
                    <div className="chat-info-panel-header">
                        <h3>Conversación{conversacion.numeroConversacion ? ` N° ${conversacion.numeroConversacion}` : ''}</h3>
                    </div>
                    <div className="chat-info-panel-body">
                        <div className="chat-info-panel-section">
                            <div className="chat-info-panel-section-title">Datos de la Conversación</div>
                            <div className="chat-info-panel-rows">
                                <div className="chat-info-panel-row"><span className="chat-info-panel-label">Responsable (archivó)</span><span className="chat-info-panel-value">{archivadoPorLabel}</span></div>
                                <div className="chat-info-panel-row"><span className="chat-info-panel-label">Abierta</span><span className="chat-info-panel-value">{fmt(conversacion.openedAt)}</span></div>
                                <div className="chat-info-panel-row"><span className="chat-info-panel-label">Archivada</span><span className="chat-info-panel-value">{fmt(conversacion.closedAt)}</span></div>
                            </div>
                        </div>
                        <AfiliadoConversacionCard token={token} chatId={conversacion.chat?.id} conversacionId={conversacion.id} onAuthExpired={onAuthExpired} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConversacionDetalle