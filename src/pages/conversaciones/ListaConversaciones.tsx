import { useEffect, useRef, useState } from "react"
import { Link, Outlet, useParams } from "react-router-dom"
import { Calendar, Search, User, Radio } from "lucide-react"
import { getConversaciones, getConversacionesTotales, ConversacionListItem, ConversacionesTotalesResponse } from "../../services/conversaciones/conversaciones.services"
import { usuariosXRole } from "../../services/auth/auth.services"
import { Usuario } from "../../interfaces/auth.interface"
import { getAuthSessionReason } from "../../utils/authSession"
import { useDispatch } from "react-redux"
import { openSessionExpired } from "../../app/slices/actionSlice"
import "../chats/chats.css"

const capitalizeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== "string") return ""
    return text.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

const formatArchivadoPor = (item: ConversacionListItem): string => {
    if (!item.archivadoPor) return "Sistema"
    const nombre = capitalizeText(item.archivadoPor.nombre)
    const apellido = capitalizeText(item.archivadoPor.apellido)
    return [nombre, apellido].filter(Boolean).join(" ") || "Sistema"
}

const formatFecha = (value: string | null): string => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ""
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d)
}

const PAGE_LIMIT = 30
const SCROLL_BOTTOM_THRESHOLD_PX = 260

const CANAL_LABELS: Record<string, string> = { WHATSAPP: 'WhatsApp', WEB: 'Web', ANDROID: 'App Android', IOS: 'App iOS' }
const canalLabel = (canal?: string | null) => CANAL_LABELS[String(canal ?? 'WHATSAPP').toUpperCase()] ?? String(canal)

/** AAAA-MM-DD en hora local, para los inputs de fecha. */
const toInputDate = (d: Date) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}
const hoy = () => toInputDate(new Date())
const haceDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toInputDate(d) }

const ListaConversaciones = () => {
    const { id: activeConversacionId } = useParams()
    const dispatch = useDispatch()

    const token = localStorage.getItem("token") || ""

    const [conversaciones, setConversaciones] = useState<ConversacionListItem[]>([])
    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(true)
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
    const [selectedFilter, setSelectedFilter] = useState<string>("") // "" | "SISTEMA" | operatorId
    const [operadores, setOperadores] = useState<Usuario[]>([])
    // Rango por fecha de cierre: arranca en los últimos 7 días para no recorrer
    // todo el histórico sin querer. Búsqueda y canal, opcionales.
    const [desde, setDesde] = useState<string>(haceDias(7))
    const [hasta, setHasta] = useState<string>(hoy())
    const [busqueda, setBusqueda] = useState<string>("")
    const [q, setQ] = useState<string>("")
    const [canal, setCanal] = useState<string>("")
    const [totales, setTotales] = useState<ConversacionesTotalesResponse | null>(null)

    const listRef = useRef<HTMLDivElement>(null)
    const loadControllerRef = useRef<AbortController | null>(null)
    const loadMoreControllerRef = useRef<AbortController | null>(null)

    const openAuthSessionIfNeeded = (payload: any): boolean => {
        const authReason = getAuthSessionReason(payload)
        if (!authReason) return false
        dispatch(openSessionExpired(authReason))
        return true
    }

    // Cargar lista de operadores para el filtro
    useEffect(() => {
        const ejecucion = async () => {
            try {
                const resp = await usuariosXRole("", token)
                const list = Array.isArray((resp as any)?.users) ? (resp as any).users : []
                const ordered = [...list].sort((a: Usuario, b: Usuario) => {
                    const aa = `${a.apellido ?? ""} ${a.nombre ?? ""}`.trim().toLowerCase()
                    const bb = `${b.apellido ?? ""} ${b.nombre ?? ""}`.trim().toLowerCase()
                    return aa.localeCompare(bb)
                })
                setOperadores(ordered)
            } catch {
                setOperadores([])
            }
        }
        ejecucion()
    }, [token])

    const buildFilters = () => {
        const base = { desde: desde || undefined, hasta: hasta || undefined, q: q || undefined, canal: canal || undefined }
        if (selectedFilter === "SISTEMA") return { ...base, sistema: true }
        if (selectedFilter) return { ...base, operatorId: selectedFilter }
        return base
    }

    // Totales por operadora para el rango, la búsqueda y el canal (sin el filtro
    // de operadora: así se ven todas y se puede tocar una para filtrar).
    useEffect(() => {
        if (!token) return
        const controller = new AbortController()
        getConversacionesTotales(token, { desde: desde || undefined, hasta: hasta || undefined, q: q || undefined, canal: canal || undefined }, { signal: controller.signal })
            .then((resp: any) => {
                if (openAuthSessionIfNeeded(resp)) return
                setTotales(Array.isArray(resp?.items) ? resp : null)
            })
            .catch(() => { })
        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, desde, hasta, q, canal])

    // Carga inicial / al cambiar filtro
    useEffect(() => {
        if (!token) return
        setLoading(true)
        setPage(1)
        setHasMore(true)
        loadControllerRef.current?.abort()
        const controller = new AbortController()
        loadControllerRef.current = controller

        getConversaciones(token, 1, PAGE_LIMIT, buildFilters(), { signal: controller.signal })
            .then((resp: any) => {
                if (openAuthSessionIfNeeded(resp)) return
                const items = Array.isArray(resp?.conversaciones) ? resp.conversaciones : []
                setConversaciones(items)
                setHasMore(Boolean(resp?.hasMore))
            })
            .catch((error: any) => {
                if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") return
                setConversaciones([])
                setHasMore(false)
            })
            .finally(() => {
                if (loadControllerRef.current === controller) loadControllerRef.current = null
                setLoading(false)
            })

        return () => { controller.abort() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedFilter, desde, hasta, q, canal])

    const loadMore = async () => {
        if (!token) return
        if (loading || isLoadingMore || !hasMore) return
        const nextPage = page + 1
        setIsLoadingMore(true)
        loadMoreControllerRef.current?.abort()
        const controller = new AbortController()
        loadMoreControllerRef.current = controller
        try {
            const resp = await getConversaciones(token, nextPage, PAGE_LIMIT, buildFilters(), { signal: controller.signal })
            if (openAuthSessionIfNeeded(resp)) return
            const items = Array.isArray((resp as any)?.conversaciones) ? (resp as any).conversaciones : []
            if (items.length === 0) { setHasMore(false); return }
            setConversaciones((prev) => [...prev, ...items])
            setPage(nextPage)
            setHasMore(Boolean((resp as any)?.hasMore))
        } catch (error: any) {
            if (error?.name !== "AbortError" && error?.code !== "ERR_CANCELED") {
                setHasMore(false)
            }
        } finally {
            if (loadMoreControllerRef.current === controller) loadMoreControllerRef.current = null
            setIsLoadingMore(false)
        }
    }

    const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX
        if (nearBottom) loadMore()
    }

    useEffect(() => {
        return () => {
            loadControllerRef.current?.abort()
            loadMoreControllerRef.current?.abort()
        }
    }, [])

    return (
        <div className="chats-container">
            <div className="main-chat">
                <div className="header-lista">
                    <div className="header-item header-item--active">
                        <span className="btn-item">Conversaciones archivadas</span>
                    </div>
                </div>
                <div className="lista-main">
                    <div className="col-lista" ref={listRef} onScroll={handleListScroll}>
                        <div className="w-full px-2 mb-2 mt-2 conv-filtros">
                            <div className="filter-input-row">
                                <Search className="filter-input-icon" size={18} />
                                <input
                                    className="filter-select"
                                    placeholder="Nombre, teléfono o N° de conversación"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setQ(busqueda.trim()) }}
                                    onBlur={() => setQ(busqueda.trim())}
                                />
                            </div>
                            <div className="conv-filtros-fechas">
                                <div className="filter-input-row">
                                    <Calendar className="filter-input-icon" size={16} />
                                    <input type="date" className="filter-select" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} title="Desde" />
                                </div>
                                <div className="filter-input-row">
                                    <Calendar className="filter-input-icon" size={16} />
                                    <input type="date" className="filter-select" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} title="Hasta" />
                                </div>
                            </div>
                            <div className="conv-filtros-rapidos">
                                <button type="button" className={`conv-chip ${desde === hoy() && hasta === hoy() ? 'conv-chip--on' : ''}`} onClick={() => { setDesde(hoy()); setHasta(hoy()) }}>Hoy</button>
                                <button type="button" className={`conv-chip ${desde === haceDias(7) && hasta === hoy() ? 'conv-chip--on' : ''}`} onClick={() => { setDesde(haceDias(7)); setHasta(hoy()) }}>7 días</button>
                                <button type="button" className={`conv-chip ${desde === haceDias(30) && hasta === hoy() ? 'conv-chip--on' : ''}`} onClick={() => { setDesde(haceDias(30)); setHasta(hoy()) }}>30 días</button>
                            </div>
                            <div className="filter-input-row">
                                <User className="filter-input-icon" size={18} />
                                <select
                                    className={`filter-select ${selectedFilter === "" ? "filter-select--placeholder" : ""}`}
                                    value={selectedFilter}
                                    onChange={(e) => setSelectedFilter(e.target.value)}
                                >
                                    <option value="">Todos los operadores</option>
                                    <option value="SISTEMA">Sistema</option>
                                    {operadores.map((op) => (
                                        <option key={op.id} value={op.id}>{op.apellido} {op.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-input-row">
                                <Radio className="filter-input-icon" size={18} />
                                <select className={`filter-select ${canal === "" ? "filter-select--placeholder" : ""}`} value={canal} onChange={(e) => setCanal(e.target.value)}>
                                    <option value="">Todos los canales</option>
                                    <option value="WHATSAPP">WhatsApp</option>
                                    <option value="WEB">Web</option>
                                    <option value="ANDROID">App Android</option>
                                    <option value="IOS">App iOS</option>
                                </select>
                            </div>

                            {totales && (
                                <div className="conv-totales" title="Conversaciones archivadas en el rango, por quién las archivó">
                                    <button type="button" className={`conv-total ${selectedFilter === '' ? 'conv-total--on' : ''}`} onClick={() => setSelectedFilter('')}>
                                        <span className="conv-total-n">{totales.total}</span><span className="conv-total-l">Total</span>
                                    </button>
                                    {totales.items.map((t) => {
                                        const key = t.operatorId ?? 'SISTEMA'
                                        const label = t.operatorId ? [capitalizeText(t.nombre), capitalizeText(t.apellido)].filter(Boolean).join(' ') || 'Operador' : 'Sistema'
                                        return (
                                            <button type="button" key={key} className={`conv-total ${selectedFilter === key ? 'conv-total--on' : ''} ${!t.operatorId ? 'conv-total--sistema' : ''}`} onClick={() => setSelectedFilter(selectedFilter === key ? '' : key)} title={label}>
                                                <span className="conv-total-n">{t.total}</span><span className="conv-total-l">{label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {loading && (
                            <div className="chat-loader-center">
                                <div className="loader2"></div>
                            </div>
                        )}
                        {!loading && conversaciones.length === 0 && (
                            <div className="chat-filter-empty-state">
                                <p className="chat-filter-empty-title">No hay conversaciones archivadas para estos filtros</p>
                            </div>
                        )}
                        {!loading && conversaciones.map((conv) => {
                            const nombre = capitalizeText(conv.cliente?.nombre)
                            const telefono = conv.cliente?.telefono || ""
                            return (
                                <Link
                                    to={`/dashboard/conversaciones/${conv.id}`}
                                    className={`item-lista text-left ${conv.id === activeConversacionId ? "active" : ""}`}
                                    key={conv.id}
                                >
                                    <div className="chat-item-header">
                                        <div className="chat-item-title">
                                            <div className="chat-item-name-row">
                                                <span className="chat-item-name">{nombre}</span>
                                            </div>
                                            <div className="chat-item-phone">
                                                {telefono}
                                                <span className={`conv-canal conv-canal--${String(conv.canal ?? 'WHATSAPP').toLowerCase()}`}>{canalLabel(conv.canal)}</span>
                                                {conv.numeroConversacion ? <span className="conv-nro">N° {conv.numeroConversacion}</span> : null}
                                            </div>
                                            <div className="chat-item-phone">Archivó: <b>{formatArchivadoPor(conv)}</b></div>
                                            <div className="chat-item-phone">{formatFecha(conv.closedAt)}</div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                        {isLoadingMore && (
                            <div className="timeline-loader">
                                <div className="loader2"></div>
                            </div>
                        )}
                    </div>

                    <div className="col-lista">
                        {activeConversacionId ? (
                            <Outlet />
                        ) : (
                            <div className="chat-empty-prompt">
                                <p className="chat-empty-text">Seleccioná una conversación para ver el detalle</p>
                            </div>
                        )}
                    </div>

                    {/* Columna dummy: en chats.css, .col-lista:last-child se oculta a propósito
                        (era el panel lateral legacy). Sin esta 3ra columna, la del detalle
                        pasaría a ser :last-child y quedaría oculta por CSS. */}
                    <div className="col-lista"></div>
                </div>
            </div>
        </div>
    )
}

export default ListaConversaciones