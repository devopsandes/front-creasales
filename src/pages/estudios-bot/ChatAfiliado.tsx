// src/pages/estudios-bot/ChatAfiliado.tsx
// Chat con el afiliado de una solicitud de estudio: los mensajes de la pestaña
// "Mensajes" de Expendio, que el afiliado ve y responde desde la app (7.1.9).
// Acá se leen y se le puede escribir desde CreaSales (13/11/2026).
import { useEffect, useRef, useState } from "react"
import { FaPaperPlane, FaSync, FaTimes } from "react-icons/fa"
import { enviarChatEstudio, obtenerChatEstudio } from "../../services/estudios-bot/estudiosBot.api"
import { MensajeChat } from "../../interfaces/estudios-bot.interface"

const LARGO_MAXIMO = 1000

type Props = {
    id: string
    titulo: string
    onClose: () => void
    /** Para que la lista o el detalle actualicen el contador al cerrar. */
    onCambio?: (resumen: { total: number; ultimoDeAfiliado: boolean } | null) => void
    avisar: (tipo: 'ok' | 'err', msg: string) => void
}

const fechaCorta = (m: MensajeChat) => m.fechaTexto?.replace(/:\d{2}$/, '') || m.fecha

const ChatAfiliado = ({ id, titulo, onClose, onCambio, avisar }: Props) => {
    // undefined = cargando; null = no se pudo leer.
    const [mensajes, setMensajes] = useState<MensajeChat[] | null | undefined>(undefined)
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [actualizando, setActualizando] = useState(false)
    const fin = useRef<HTMLDivElement>(null)

    const cargar = async (silencioso = false) => {
        if (!silencioso) setActualizando(true)
        try {
            const r = await obtenerChatEstudio(id)
            if (!r.mensajes) throw new Error(r.message ?? 'No se pudo leer el chat')
            setMensajes(r.mensajes)
            onCambio?.(r.resumen ?? null)
        } catch (e) {
            setMensajes(null)
            if (!silencioso) avisar('err', e instanceof Error ? e.message : 'No se pudo leer el chat')
        } finally {
            setActualizando(false)
        }
    }

    useEffect(() => { cargar(true) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }) }, [mensajes])

    const enviar = async () => {
        const limpio = texto.trim()
        if (!limpio || enviando) return
        setEnviando(true)
        try {
            const r = await enviarChatEstudio(id, limpio)
            if (!r.mensajes) {
                const m = Array.isArray(r.message) ? r.message.join(', ') : r.message
                throw new Error(m ?? 'No se pudo enviar')
            }
            setMensajes(r.mensajes)
            setTexto('')
            onCambio?.(r.resumen ?? null)
        } catch (e) {
            avisar('err', e instanceof Error ? e.message : 'No se pudo enviar')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="eb-modal-overlay" onClick={onClose}>
            <div className="eb-modal eb-modal-chat" onClick={(e) => e.stopPropagation()}>
                <div className="eb-modal-header">
                    <span className="eb-modal-title">Mensajes con el afiliado · {titulo}</span>
                    <button type="button" className="eb-modal-close" onClick={() => cargar()} title="Actualizar" disabled={actualizando}>
                        <FaSync className={actualizando ? 'spinning' : ''} />
                    </button>
                    <button type="button" className="eb-modal-close" onClick={onClose} title="Cerrar"><FaTimes /></button>
                </div>
                <div className="eb-modal-body eb-chat-cuerpo">
                    {mensajes === undefined && <div className="eb-chat-vacio">Cargando...</div>}
                    {mensajes === null && <div className="eb-chat-vacio">No se pudo leer el chat. Probá actualizar.</div>}
                    {mensajes && mensajes.length === 0 && <div className="eb-chat-vacio">Todavía no hay mensajes. Lo que escribas acá le llega al afiliado a la app.</div>}
                    {mensajes?.map((m) => (
                        <div key={m.id} className={`eb-burbuja ${m.deAfiliado ? 'eb-burbuja-afiliado' : 'eb-burbuja-nuestra'}`}>
                            <div className="eb-burbuja-quien">{m.deAfiliado ? 'Afiliado' : (m.enviadoPor || 'Andes Salud')}</div>
                            <div className="eb-burbuja-texto">{m.texto || (m.tieneImagen ? '(imagen)' : '(sin texto)')}</div>
                            <div className="eb-burbuja-fecha">{fechaCorta(m)}{m.tieneImagen && m.texto ? ' · con imagen' : ''}</div>
                        </div>
                    ))}
                    <div ref={fin} />
                </div>
                <div className="eb-chat-escribir">
                    <textarea
                        className="eb-input eb-textarea"
                        rows={2}
                        maxLength={LARGO_MAXIMO}
                        placeholder="Escribile al afiliado... (le llega a la app, en el chat de esta solicitud)"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar() }}
                        disabled={enviando}
                    />
                    <div className="eb-chat-acciones">
                        <span className="eb-hint" style={{ margin: 0 }}>{texto.length}/{LARGO_MAXIMO} · Ctrl+Enter envía</span>
                        <button type="button" className="eb-btn-primary" onClick={enviar} disabled={enviando || !texto.trim()}>
                            <FaPaperPlane /> {enviando ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatAfiliado
