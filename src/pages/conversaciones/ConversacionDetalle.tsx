import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { useDispatch } from "react-redux"
import {
    getConversacionDetalle,
    ConversacionDetalleResponse,
    ConversacionTimelineItem,
} from "../../services/conversaciones/conversaciones.services"
import { formatCreatedAt } from "../../utils/functions"
import { getAuthSessionReason } from "../../utils/authSession"
import { openSessionExpired } from "../../app/slices/actionSlice"
import "../chats/chats.css"

const capitalizeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== "string") return ""
    return text.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

const getMediaUrl = (value: any): string | null => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof value === "object" && typeof value.url === "string") return value.url
    return null
}

const resolveEventText = (evt: ConversacionTimelineItem): string => {
    const text = `${evt?.text ?? ""}`.trim()
    if (text) return text
    return evt?.type ? `${evt.type}` : "Evento"
}

const MessageContent = ({ msg }: { msg: ConversacionTimelineItem }) => {
    const fallbackText = (msg?.msg_entrada ?? msg?.msg_salida ?? "") as string
    if (msg?.type === "image") {
        const url = getMediaUrl(msg?.imageUrl)
        if (!url) return <span className="chat-text">{fallbackText}</span>
        return <img src={url} alt="imagen" className="chat-media-img" loading="lazy" />
    }
    if (msg?.type === "document") {
        const url = getMediaUrl(msg?.documentUrl)
        if (!url) return <span className="chat-text">{fallbackText}</span>
        return (
            <div className="chat-media-doc">
                <a href={url} target="_blank" rel="noreferrer" className="chat-media-link">Abrir / Descargar documento</a>
            </div>
        )
    }
    if (msg?.type === "audio") {
        const url = getMediaUrl(msg?.audioUrl)
        if (!url) return <span className="chat-text">{fallbackText}</span>
        return (
            <div className="chat-media-audio">
                <audio controls src={url} className="chat-media-audio-player" />
                {!!msg?.traduccion && <div className="chat-media-transcripcion">{msg.traduccion}</div>}
            </div>
        )
    }
    return <span className="chat-text" style={{ whiteSpace: "pre-wrap" }}>{fallbackText}</span>
}

const ConversacionDetalle = () => {
    const { id } = useParams()
    const dispatch = useDispatch()
    const token = localStorage.getItem("token") || ""

    const [loading, setLoading] = useState<boolean>(true)
    const [data, setData] = useState<ConversacionDetalleResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

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
                    {items.map((msj) => {
                        const key = msj.id ?? `${msj.createdAt}`
                        if (msj.kind === "event") {
                            return (
                                <div className="contenedor-archivado" key={key}>
                                    <p className="mensaje-archivado">{resolveEventText(msj)}</p>
                                    <span className="timestamp">{formatCreatedAt(`${msj.createdAt}`)}</span>
                                </div>
                            )
                        }
                        return (
                            <div key={key} className={`${msj.msg_entrada ? "contenedor-entrada" : "contenedor-salida"}`}>
                                <div className={`${msj.msg_entrada ? "mensaje-entrada" : "mensaje-salida"}`}>
                                    <MessageContent msg={msj} />
                                </div>
                                <span className="timestamp">{formatCreatedAt(`${msj.createdAt}`)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ConversacionDetalle