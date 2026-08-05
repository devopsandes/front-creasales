import { useEffect, useRef, useState } from "react"
import { Link, Outlet, useParams } from "react-router-dom"
import { User } from "lucide-react"
import { getConversaciones, ConversacionListItem } from "../../services/conversaciones/conversaciones.services"
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
                const resp = await usuariosXRole("USER", token)
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
        if (selectedFilter === "SISTEMA") return { sistema: true }
        if (selectedFilter) return { operatorId: selectedFilter }
        return {}
    }

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
    }, [token, selectedFilter])

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
                        <div className="w-full px-2 mb-2 mt-2">
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
                        </div>

                        {loading && (
                            <div className="chat-loader-center">
                                <div className="loader2"></div>
                            </div>
                        )}
                        {!loading && conversaciones.length === 0 && (
                            <div className="chat-filter-empty-state">
                                <p className="chat-filter-empty-title">No hay conversaciones archivadas</p>
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
                                            <div className="chat-item-phone">{telefono}</div>
                                            <div className="chat-item-phone">Archivó: {formatArchivadoPor(conv)}</div>
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
                </div>
            </div>
        </div>
    )
}

export default ListaConversaciones