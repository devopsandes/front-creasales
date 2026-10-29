import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaCheck, FaExclamationTriangle, FaPaperclip, FaPaperPlane, FaSync, FaTimesCircle } from "react-icons/fa"
import {
    cerrarTicketSoporte, comentarTicketSoporte, subirAdjuntosSoporte, verTicketSoporte,
} from "../../services/soporte/soporte.services"
import { ESTADOS_SOPORTE, GRAVEDADES_SOPORTE, TicketSoporteDetalle } from "../../interfaces/soporte.interface"
import { esAdminSoporte, formatFechaSoporte } from "./MesaAyuda"
import { ADJUNTO_MAX_BYTES, formatTamano } from "./NuevoTicketSoporte"
import '../estudios-bot/estudios-bot.css'
import './soporte.css'

const REFRESCO_MS = 30000

const TicketSoporte = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const admin = esAdminSoporte()
    const inputRef = useRef<HTMLInputElement>(null)
    const [ticket, setTicket] = useState<TicketSoporteDetalle | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [subiendo, setSubiendo] = useState(false)

    const cargar = useCallback(async (silencioso = false) => {
        if (!id) return
        if (!silencioso) setCargando(true)
        try {
            const r = await verTicketSoporte(id)
            if (!r.ticket) throw new Error(Array.isArray(r.message) ? r.message.join(', ') : (r.message ?? 'No se encontró el ticket'))
            setTicket(r.ticket)
            setError(null)
        } catch (e) {
            if (!silencioso) setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [id])

    useEffect(() => { cargar() }, [cargar])

    // Refresco silencioso cada 30 s, solo con la pestaña visible: así se ven las respuestas de soporte sin recargar.
    useEffect(() => {
        const t = setInterval(() => { if (document.visibilityState === 'visible') cargar(true) }, REFRESCO_MS)
        return () => clearInterval(t)
    }, [cargar])

    const comentar = async () => {
        if (!id || !texto.trim()) return
        setEnviando(true)
        try {
            const r = await comentarTicketSoporte(id, texto.trim())
            if (r.statusCode !== 201) throw new Error(Array.isArray(r.message) ? r.message.join(', ') : (r.message ?? 'No se pudo enviar'))
            setTexto('')
            await cargar(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setEnviando(false)
        }
    }

    const adjuntar = async (lista: FileList | null) => {
        if (!id || !lista?.length) return
        const archivos = Array.from(lista)
        const grandes = archivos.filter((a) => a.size > ADJUNTO_MAX_BYTES)
        if (grandes.length) return setError(`Supera 50 MB: ${grandes.map((a) => a.name).join(', ')}`)
        setSubiendo(true)
        try {
            const r = await subirAdjuntosSoporte(id, archivos)
            if (!r.adjuntos?.length) throw new Error(Array.isArray(r.message) ? r.message.join(', ') : (r.message ?? 'No se pudo adjuntar'))
            await cargar(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setSubiendo(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const cerrar = async () => {
        if (!id || !ticket) return
        if (!window.confirm(`¿Cerrar el ticket ${ticket.numero}? Soporte va a dejar de trabajarlo.`)) return
        const r = await cerrarTicketSoporte(id)
        if (r.ticket) setTicket((prev) => prev ? { ...prev, ...r.ticket } : prev)
        else setError(Array.isArray(r.message) ? r.message.join(', ') : (r.message ?? 'No se pudo cerrar'))
    }

    if (cargando && !ticket) return <div className="eb-wrapper"><div className="eb-loading">Cargando ticket...</div></div>
    if (!ticket) return (
        <div className="eb-wrapper"><div className="eb-container">
            <div className="eb-error-banner"><FaTimesCircle /> <span>{error ?? 'No se encontró el ticket'}</span></div>
            <button className="eb-btn-link" onClick={() => navigate('/dashboard/soporte')}><FaArrowLeft /> Volver</button>
        </div></div>
    )

    const est = ESTADOS_SOPORTE[ticket.estado] ?? { label: ticket.estado, cls: '', ayuda: '' }
    const grav = GRAVEDADES_SOPORTE.find((g) => g.valor === ticket.gravedad)
    const cerrado = ticket.estado === 'cerrado'

    return (
        <div className="eb-wrapper">
            <div className="eb-header eb-header-detalle">
                <button className="eb-btn-link" onClick={() => navigate('/dashboard/soporte')}><FaArrowLeft /> Volver a la mesa de ayuda</button>
                <div className="eb-cabecera">
                    <div>
                        <div className="eb-cab-nombre">{ticket.numero} · {ticket.titulo ?? '(sin título)'}</div>
                        <div className="eb-cab-sub">
                            {ticket.referenciaExterna ? `N° en soporte: ${ticket.referenciaExterna} · ` : 'Todavía sin número de soporte · '}
                            creado por {ticket.autorNombre ?? '—'} el {formatFechaSoporte(ticket.createdAt)}
                        </div>
                    </div>
                    <div className="eb-cab-veredicto">
                        <span className={`eb-badge eb-badge-lg ${est.cls}`}>{est.label}</span>
                        <span className="eb-cab-motivo">{est.ayuda}</span>
                    </div>
                </div>
            </div>

            <div className="eb-container">
                {ticket.estado === 'esperando-cliente' && (
                    <div className="sp-banner"><FaExclamationTriangle /> Soporte espera tu respuesta: leé el último mensaje y contestá abajo.</div>
                )}
                {error && <div className="eb-error-banner"><FaTimesCircle /> <span>{error}</span></div>}

                <div className="sp-detalle-grid">
                    <div className="sp-col">
                        <div className="eb-card">
                            <div className="eb-card-title">Descripción</div>
                            <p className="sp-descripcion">{ticket.descripcion ?? '—'}</p>
                        </div>

                        <div className="eb-card">
                            <div className="eb-card-title">
                                Conversación con soporte
                                <button className="eb-btn-link" onClick={() => cargar(true)}><FaSync /> Actualizar</button>
                            </div>
                            <div className="sp-conversacion">
                                {ticket.comentarios.length === 0 && <div className="eb-empty-sm">Todavía no hay mensajes. Soporte responde acá.</div>}
                                {ticket.comentarios.map((c) => (
                                    <div key={c.id} className={`sp-msg ${c.autorTipo === 'soporte' ? 'sp-msg-soporte' : 'sp-msg-usuario'}`}>
                                        <span className="sp-msg-meta">{c.autor ?? (c.autorTipo === 'soporte' ? 'Soporte' : 'Vos')} · {formatFechaSoporte(c.fecha)}</span>
                                        {c.texto}
                                    </div>
                                ))}
                            </div>
                            {cerrado
                                ? <span className="eb-hint">El ticket está cerrado. Si el problema sigue, abrí uno nuevo.</span>
                                : (
                                    <div className="sp-comentar">
                                        <textarea className="eb-input eb-textarea" placeholder="Escribí tu respuesta o agregá información..." value={texto}
                                            onChange={(e) => setTexto(e.target.value)} disabled={enviando} />
                                        <button className="eb-btn-primary" onClick={comentar} disabled={enviando || !texto.trim()}>
                                            <FaPaperPlane /> {enviando ? 'Enviando...' : 'Enviar'}
                                        </button>
                                    </div>
                                )}
                        </div>
                    </div>

                    <div className="sp-col">
                        <div className="eb-card">
                            <div className="eb-card-title">Datos</div>
                            <div className="sp-info-grid">
                                <div className="sp-info-item"><span className="eb-label">Categoría</span><div className="sp-info-valor">{ticket.categoriaNombre ?? '—'}</div></div>
                                <div className="sp-info-item"><span className="eb-label">Gravedad</span><div className="sp-info-valor">{grav ? <span className={`eb-badge ${grav.cls}`}>{grav.label}</span> : '—'}</div></div>
                                <div className="sp-info-item"><span className="eb-label">Pantalla</span><div className="sp-info-valor">{ticket.pantalla ?? '—'}</div></div>
                                <div className="sp-info-item"><span className="eb-label">Última actualización</span><div className="sp-info-valor">{formatFechaSoporte(ticket.updatedAt)}</div></div>
                                {ticket.closedAt && <div className="sp-info-item"><span className="eb-label">Cerrado</span><div className="sp-info-valor">{formatFechaSoporte(ticket.closedAt)}</div></div>}
                            </div>
                            {!cerrado && (
                                <div className="eb-actions">
                                    <button className="eb-btn-secondary" onClick={cerrar}><FaCheck /> Cerrar ticket</button>
                                </div>
                            )}
                        </div>

                        <div className="eb-card">
                            <div className="eb-card-title">
                                Adjuntos
                                {!cerrado && (
                                    <>
                                        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => adjuntar(e.target.files)} />
                                        <button className="eb-btn-link" onClick={() => inputRef.current?.click()} disabled={subiendo}>
                                            <FaPaperclip /> {subiendo ? 'Subiendo...' : 'Agregar'}
                                        </button>
                                    </>
                                )}
                            </div>
                            {ticket.adjuntos.length === 0
                                ? <div className="eb-empty-sm">Sin adjuntos</div>
                                : (
                                    <ul className="sp-adjuntos-lista">
                                        {ticket.adjuntos.map((a) => (
                                            <li key={a.id} className="sp-adjunto">
                                                <FaPaperclip style={{ color: '#6b7280' }} />
                                                {a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.nombre}</a> : <span>{a.nombre}</span>}
                                                <span className="sp-adjunto-meta">{formatTamano(a.tamano)} · {a.subidoPor ?? ''}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                        </div>

                        {admin && ticket.envios && (
                            <div className="eb-card">
                                <div className="eb-card-title">Envíos a Createch</div>
                                <table className="eb-mini-table">
                                    <thead><tr><th>Evento</th><th>Estado</th><th>Intentos</th></tr></thead>
                                    <tbody>
                                        {ticket.envios.map((e) => (
                                            <tr key={e.id}>
                                                <td>{e.evento.replace('soporte.ticket.', '')}</td>
                                                <td style={{ color: e.estado === 'enviado' ? '#065f46' : e.estado === 'fallido' ? '#991b1b' : '#92400e', fontWeight: 600 }}>
                                                    {e.estado}{e.ultimoStatus ? ` (${e.ultimoStatus})` : ''}
                                                </td>
                                                <td>{e.intentos}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TicketSoporte