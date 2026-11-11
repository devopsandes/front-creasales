// src/components/chat/TimelineItemView.tsx
//
// Cómo se pinta UN ítem de la línea de tiempo de un chat: mensaje entrante o
// saliente (texto, imagen, documento, audio), nota privada, mención y el
// resto de los eventos. Es el mismo código que estaba dentro de la pantalla
// de Chats; se sacó a un componente para que Conversaciones archivadas se vea
// exactamente igual y no vuelvan a divergir. Fede, 11/11/2026.
//
// No tiene estado ni efectos: recibe el ítem y una función para abrir la vista
// previa de documentos (cada pantalla maneja su propio overlay).
import React from "react"
import { formatCreatedAt } from "../../utils/functions"

export type DocPreview = { url: string; name: string }

export const getTicketNumberFromPayload = (payload: any): string => {
    const direct = payload?.nro ?? payload?.ticketNro ?? payload?.ticket?.nro ?? payload?.ticket?.ticketNro
    if (direct === undefined || direct === null) return ''
    return `${direct}`.trim()
}

export const resolveEventText = (evt: any): string => {
    const text = `${evt?.text ?? ""}`.trim()
    if (text) return text
    switch (evt?.type) {
        case "TICKET_CREATED": {
            const ticketNro = getTicketNumberFromPayload(evt?.payload)
            return ticketNro ? `Se creó el ticket #${ticketNro}` : "Se creó un ticket"
        }
        case "CHAT_ASSIGNED": {
            const toName = evt?.payload?.toName ?? null
            const byName = evt?.payload?.byName ?? null
            if (toName && byName) return `Esta conversación fue asignada a ${toName} por ${byName}`
            if (toName) return `Esta conversación fue asignada a ${toName}`
            return "Esta conversación fue asignada"
        }
        case "TAG_ASSIGNED": {
            const tagName = evt?.payload?.tag?.nombre ?? evt?.payload?.tagName ?? evt?.payload?.nombreTag
            return tagName ? `Se asignó la etiqueta ${tagName}` : "Se asignó una etiqueta"
        }
        default:
            return evt?.type ? `${evt.type}` : "Evento"
    }
}

export const formatAuthorName = (value: any) => {
    if (!value || typeof value !== 'string') return ''
    return value.toLowerCase().split(' ').filter(Boolean).map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

// Quién mandó un mensaje saliente: la operadora si quedó guardada, nada para
// mensajes viejos de operadoras (sin autor), y "Sistema" para el bot y los avisos.
export const autorMensajeSaliente = (msj: any): string => {
    if (msj?.authorName) return formatAuthorName(msj.authorName)
    if (msj?.origen === 'USUARIO') return ''
    return 'Sistema'
}

export const linkifyText = (text: string): React.ReactNode[] => {
    const urlRegex = /https?:\/\/\S+/gi
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let key = 0

    while ((match = urlRegex.exec(text)) !== null) {
        const url = match[0]
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
        }
        parts.push(
            <a key={key++} href={url} target="_blank" rel="noreferrer" className="chat-media-link">{url}</a>
        )
        lastIndex = match.index + url.length
    }
    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
    }
    return parts
}

export const getMediaUrl = (value: any): string | null => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof value === "object" && typeof value.url === "string") return value.url
    return null
}

/** Mismo criterio que usaba la pantalla de Chats para distinguir evento de mensaje. */
export const isTimelineEvent = (msj: any): boolean =>
    Boolean(msj?.kind === "event" || (msj?.type && (msj?.text !== undefined || msj?.payload !== undefined) && msj?.msg_entrada === undefined && msj?.msg_salida === undefined))

export const MessageContent = ({ msg, onPreview }: { msg: any; onPreview: (doc: DocPreview) => void }) => {
    const fallbackText = (msg?.msg_entrada ?? msg?.msg_salida ?? "") as string
    if (msg?.type === "image") {
        const url = getMediaUrl(msg?.imageUrl)
        if (!url) return <span className="chat-text">{fallbackText}</span>
        return <img src={url} alt="imagen" className="chat-media-img" loading="lazy" />
    }
    if (msg?.type === "document") {
        const url = getMediaUrl(msg?.documentUrl)
        if (!url) return <span className="chat-text">{fallbackText}</span>
        const fileName = `${msg?.msg_entrada ?? msg?.msg_salida ?? "documento"}`
        return (
            <div className="chat-media-doc">
                <button type="button" className="chat-media-link" onClick={() => onPreview({ url, name: fileName })}>Ver documento</button>
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

    const hasUrl = /https?:\/\/\S+/i.test(fallbackText)
    if (hasUrl) {
        return (
            <span className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>
                {linkifyText(fallbackText)}
            </span>
        )
    }

    return <span className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>{fallbackText}</span>
}

export const renderDocumentoNota = (payload: any, onPreview: (doc: DocPreview) => void) => {
    const url = payload?.documentUrl
    if (!url) return null
    const nombreDoc = `${payload?.documentName ?? 'Documento'}`
    const esPdf = payload?.documentMimeType === 'application/pdf' || /\.pdf$/i.test(nombreDoc)
    return (
        <div className="chat-media-doc" style={{ marginTop: '0.5rem' }}>
            <span className='mensaje-nota-privada-text'>📄 {nombreDoc}</span>
            {esPdf && (
                <button type="button" className="chat-media-link" onClick={() => onPreview({ url, name: nombreDoc })}>Ver documento</button>
            )}
            <a href={url} target="_blank" rel="noreferrer" className="chat-media-link">Abrir / Descargar documento</a>
        </div>
    )
}

type Props = {
    item: any
    onPreview: (doc: DocPreview) => void
}

/** Un evento o un mensaje, pintado igual en Chats y en Conversaciones archivadas. */
const TimelineItemView = ({ item: msj, onPreview }: Props) => {
    if (isTimelineEvent(msj)) {
        if (msj?.type === "PRIVATE_NOTE_CREATED") {
            return (
                <div className='contenedor-nota-privada' id={msj?.id ? `event-${msj.id}` : undefined}>
                    <div className='mensaje-nota-privada'>
                        <span className='mensaje-nota-privada-text'>{resolveEventText(msj)}</span>
                        {msj?.payload?.imageUrl && (
                            <img
                                src={msj.payload.imageUrl}
                                alt="imagen nota privada"
                                className="chat-media-img"
                                style={{ maxWidth: '300px', borderRadius: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}
                                loading="lazy"
                                onClick={() => onPreview({ url: msj.payload.imageUrl, name: 'Imagen nota privada' })}
                            />
                        )}
                        {renderDocumentoNota(msj?.payload, onPreview)}
                        {msj?.payload?.authorName && <span className='mensaje-nota-privada-author'>{formatAuthorName(msj.payload.authorName)}</span>}
                    </div>
                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                </div>
            )
        }
        if (msj?.type === "MENTION_CREATED") {
            return (
                <div className='contenedor-nota-privada' id={msj?.id ? `event-${msj.id}` : undefined}>
                    <div className='mensaje-nota-privada'>
                        <span className='mensaje-nota-privada-text'>{resolveEventText(msj)}</span>
                        {msj?.payload?.text && (
                            <span className='mensaje-nota-privada-text' style={{ display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                                "{msj.payload.text}"
                            </span>
                        )}
                        {msj?.payload?.imageUrl && (
                            <img
                                src={msj.payload.imageUrl}
                                alt="imagen mención"
                                className="chat-media-img"
                                style={{ maxWidth: '300px', borderRadius: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}
                                loading="lazy"
                                onClick={() => onPreview({ url: msj.payload.imageUrl, name: 'Imagen mención' })}
                            />
                        )}
                        {renderDocumentoNota(msj?.payload, onPreview)}
                        {msj?.payload?.authorName && (
                            <span className='mensaje-nota-privada-author'>{formatAuthorName(msj.payload.authorName)}</span>
                        )}
                    </div>
                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                </div>
            )
        }
        if (msj?.type === "NEW_CONVERSATION_STARTED") {
            return (
                <div className='contenedor-nueva-conversacion'>
                    <p className='mensaje-nueva-conversacion'>{resolveEventText(msj)}</p>
                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                </div>
            )
        }
        return (
            <div className='contenedor-archivado' id={msj?.id ? `event-${msj.id}` : undefined}>
                <p className='mensaje-archivado'>{resolveEventText(msj)}</p>
                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
            </div>
        )
    }

    if (msj?.msg_salida === '%archivado%') {
        return (
            <div className='contenedor-archivado'>
                <p className='mensaje-archivado'>Archivado</p>
                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
            </div>
        )
    }

    if (msj?.esNota && msj?.msg_salida) {
        return (
            <div className='contenedor-nota-privada'>
                <div className='mensaje-nota-privada'>
                    <span className='mensaje-nota-privada-text'>{msj.msg_salida}</span>
                </div>
                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
            </div>
        )
    }

    return (
        <div className={`${msj.msg_entrada ? 'contenedor-entrada' : 'contenedor-salida'}`}>
            <div className={`${msj.msg_entrada ? 'mensaje-entrada' : 'mensaje-salida'}`}>
                <MessageContent msg={msj} onPreview={onPreview} />
            </div>
            <span className='timestamp'>
                {formatCreatedAt(`${msj.createdAt}`)}
                {!msj.msg_entrada && autorMensajeSaliente(msj) ? ` · ${autorMensajeSaliente(msj)}` : ''}
            </span>
        </div>
    )
}

export default TimelineItemView
