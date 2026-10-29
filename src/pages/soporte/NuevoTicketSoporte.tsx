import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaArrowLeft, FaPaperclip, FaPaperPlane, FaTimes, FaTimesCircle } from "react-icons/fa"
import { crearTicketSoporte, subirAdjuntosSoporte } from "../../services/soporte/soporte.services"
import { CATEGORIAS_SOPORTE, GRAVEDADES_SOPORTE, GravedadSoporte } from "../../interfaces/soporte.interface"
import '../estudios-bot/estudios-bot.css'
import './soporte.css'

export const ADJUNTO_MAX_BYTES = 50 * 1024 * 1024
export const ADJUNTOS_MAX = 10

export const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const PLANTILLA_DESCRIPCION = `Qué pasó:

Qué esperabas que pasara:

Pasos para reproducirlo:

Desde cuándo:
`

const NuevoTicketSoporte = () => {
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)
    const [titulo, setTitulo] = useState('')
    const [categoria, setCategoria] = useState('')
    const [gravedad, setGravedad] = useState<GravedadSoporte>('media')
    const [pantalla, setPantalla] = useState('')
    const [descripcion, setDescripcion] = useState(PLANTILLA_DESCRIPCION)
    const [archivos, setArchivos] = useState<File[]>([])
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const gravedadSel = GRAVEDADES_SOPORTE.find((g) => g.valor === gravedad)

    const agregarArchivos = (lista: FileList | null) => {
        if (!lista) return
        const nuevos = Array.from(lista)
        const grandes = nuevos.filter((a) => a.size > ADJUNTO_MAX_BYTES)
        if (grandes.length) setError(`Estos archivos superan 50 MB y no se van a adjuntar: ${grandes.map((a) => a.name).join(', ')}`)
        const validos = nuevos.filter((a) => a.size <= ADJUNTO_MAX_BYTES)
        setArchivos((prev) => [...prev, ...validos].slice(0, ADJUNTOS_MAX))
        if (inputRef.current) inputRef.current.value = ''
    }

    const enviar = async () => {
        setError(null)
        if (!titulo.trim()) return setError('Poné un título que resuma el problema')
        if (!categoria) return setError('Elegí una categoría')
        if (!descripcion.trim() || descripcion.trim() === PLANTILLA_DESCRIPCION.trim()) return setError('Completá la descripción')

        setEnviando(true)
        try {
            const r = await crearTicketSoporte({
                titulo: titulo.trim(), categoria, gravedad, descripcion: descripcion.trim(), pantalla: pantalla.trim() || undefined,
            })
            if (!r.ticket?.id) throw new Error(Array.isArray(r.message) ? r.message.join(', ') : (r.message ?? 'No se pudo crear el ticket'))

            const fallidos: string[] = []
            for (const a of archivos) {
                const s = await subirAdjuntosSoporte(r.ticket.id, [a])
                if (!s.adjuntos?.length) fallidos.push(a.name)
            }
            if (fallidos.length) window.alert(`El ticket ${r.ticket.numero} se creó, pero no se pudieron adjuntar: ${fallidos.join(', ')}. Podés volver a adjuntarlos desde el ticket.`)

            // replace: "volver" no tiene que traer al formulario ya enviado
            navigate(`/dashboard/soporte/${r.ticket.id}`, { replace: true })
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="eb-wrapper">
            <div className="eb-header">
                <button className="eb-btn-link" onClick={() => navigate('/dashboard/soporte')}><FaArrowLeft /> Volver a la mesa de ayuda</button>
                <h2 className="eb-header-title" style={{ marginTop: '.5rem' }}>Nuevo ticket de soporte</h2>
                <p className="eb-header-description">
                    Contá el problema con el mayor detalle posible: qué pasó, en qué pantalla y desde cuándo. Si podés, adjuntá una captura.
                </p>
            </div>

            <div className="eb-container">
                {error && <div className="eb-error-banner"><FaTimesCircle /> <span>{error}</span></div>}

                <div className="eb-card sp-form">
                    <div>
                        <label className="eb-label">Título</label>
                        <input className="eb-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200}
                            placeholder="Ej.: El bot no responde en WhatsApp desde las 10:20" />
                    </div>

                    <div className="sp-form-row">
                        <div>
                            <label className="eb-label">Categoría</label>
                            <select className="eb-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                <option value="">Elegí una...</option>
                                {Object.entries(CATEGORIAS_SOPORTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="eb-label">Gravedad</label>
                            <select className="eb-input" value={gravedad} onChange={(e) => setGravedad(e.target.value as GravedadSoporte)}>
                                {GRAVEDADES_SOPORTE.map((g) => <option key={g.valor} value={g.valor}>{g.label}: {g.descripcion}</option>)}
                            </select>
                            {gravedadSel && <div className="sp-gravedad-ayuda">{gravedadSel.descripcion}</div>}
                        </div>
                    </div>

                    <div>
                        <label className="eb-label">Pantalla donde pasa (opcional)</label>
                        <input className="eb-input" value={pantalla} onChange={(e) => setPantalla(e.target.value)} maxLength={200}
                            placeholder="Ej.: Chats, Tickets, Estudios (bot)..." />
                    </div>

                    <div>
                        <label className="eb-label">Descripción</label>
                        <textarea className="eb-input eb-textarea" rows={10} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                        <span className="eb-hint">Las cuatro preguntas son una guía: completalas o borralas y escribí libre.</span>
                    </div>

                    <div>
                        <label className="eb-label">Adjuntos (opcional)</label>
                        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => agregarArchivos(e.target.files)} />
                        <button className="eb-btn-secondary" onClick={() => inputRef.current?.click()} disabled={archivos.length >= ADJUNTOS_MAX}>
                            <FaPaperclip /> Agregar archivos
                        </button>
                        <span className="eb-hint">Hasta {ADJUNTOS_MAX} archivos de 50 MB. Una captura de pantalla ayuda mucho.</span>
                        {archivos.length > 0 && (
                            <div className="sp-archivos">
                                {archivos.map((a, i) => (
                                    <span key={`${a.name}-${i}`} className="sp-archivo-chip">
                                        {a.name} <small>({formatTamano(a.size)})</small>
                                        <button onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))} title="Quitar"><FaTimes /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="eb-actions">
                        <button className="eb-btn-primary" onClick={enviar} disabled={enviando}>
                            <FaPaperPlane /> {enviando ? 'Enviando...' : 'Enviar a soporte'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NuevoTicketSoporte