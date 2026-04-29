import { Link, Outlet, useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { ChatState } from "../../interfaces/chats.interface"
// import { dividirArrayEnTres } from "../../utils/functions"
// import {  getSocket, connectSocket } from "../../app/slices/socketSlice"
import { useDispatch, useSelector } from "react-redux"
// import { Socket } from "socket.io-client"
import { usuariosXRole } from "../../services/auth/auth.services"
import { Usuario } from "../../interfaces/auth.interface"
import { LuArrowDownFromLine, LuArrowUpFromLine, LuDownload, LuFilter } from "react-icons/lu";
import { Tag as TagIcon, User } from "lucide-react"
import { RootState } from "../../app/store"
import { setUserData, setViewSide, openSessionExpired, setChats, setMentionsMode, toggleMentionChatSelection, clearMentionChatSelection, toggleBulkReadChatSelection, clearBulkReadChatSelection, setChatListCacheMeta, setChatListUiState, bumpMentionsRefreshNonce } from "../../app/slices/actionSlice"
import { jwtDecode } from "jwt-decode"
import './chats.css'
import { getSocket } from "../../app/slices/socketSlice"
import { findChatById, getChatCounts, getChats, searchByConversacion } from "../../services/chats/chats.services"
import { perfMark, perfTrackNavigation } from "../../utils/perfTracker"

// Función auxiliar para capitalizar correctamente el texto
const capitalizeText = (text: string | undefined | null): string => {
    // Validar que el texto exista y no esté vacío
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

type ChatAssignment = 'bot' | 'unassigned' | 'assigned'

const getAssignment = (chat: ChatState): ChatAssignment => {
    const assignment = chat.assignment
    if (assignment === 'bot' || assignment === 'unassigned' || assignment === 'assigned') {
        return assignment
    }
    return chat.operador ? 'assigned' : 'unassigned'
};

const getEmptyStateMessageByTab = (tab: string): string => {
    if (tab === "sinAsignar") return "No tienes chats sin asignar"
    if (tab === "asig") return "No tienes chats asignados"
    if (tab === "otros") return "No se registran chats asignados a otros"
    if (tab === "archi") return "No tienes chats archivados"
    if (tab === "menciones") return "No tienes menciones"
    if (tab === "bots") return "No tienes chats de bots"
    return "No tienes chats disponibles"
}

const ListaChats = () => {
    const { id: activeChatId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectRef = useRef<HTMLSelectElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate()

    const CHAT_PAGE_LIMIT = 50
    const SCROLL_BOTTOM_THRESHOLD_PX = 260
    const MAX_CHAT_CACHE = 1000

    const [chats1, setChats1] = useState<ChatState[]>([])
    const [archivadas, setArchivadas] = useState<ChatState[]>([])
    const [asignadas, setAsignadas] = useState<ChatState[]>([])
    const [asignadasOtros, setAsignadasOtros] = useState<ChatState[]>([])
    const [bots, setBots] = useState<ChatState[]>([])
    const [sinAsignar, setSinAsignar] = useState<ChatState[]>([])
    const [menciones, setMenciones] = useState<ChatState[]>([])
    const [styleBtn, setStyleBtn] = useState<string>('otros')
    const [searchConversacion, setSearchConversacion] = useState<string>('')

    const [loading, setLoading] = useState<boolean>(true)
    const [page, setPage] = useState<number>(1)
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [users, setUsers] = useState<Usuario[]>([]);
    const [filtrados, setFiltrados] = useState<ChatState[]>([])
    const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc') // 'desc' = más reciente primero, 'asc' = más viejo primero
    const [showFilterSelect, setShowFilterSelect] = useState<boolean>(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [allTags, setAllTags] = useState<{ id: string; nombre: string }[]>([])
    const [searchChat, setSearchChat] = useState<string>('')
    const [debouncedSearch, setDebouncedSearch] = useState<string>('')
    const [selectedOperator, setSelectedOperator] = useState<string>('')
    const [hydrated, setHydrated] = useState<boolean>(false)
    // selección de menciones vive en Redux (para compartir con la vista del chat)

    const audioRef = useRef(new Audio("/audio/audio1.mp3"));
    const assignAudioRef = useRef(new Audio("/audio/audio1.mp3"));


    const dataUser = useSelector((state: RootState) => state.action.dataUser);
    const viewSide = useSelector((state: RootState) => state.action.viewSide);
    const chatsFromRedux = useSelector((state: RootState) => state.action.chats);
    const chatListLoadedQueryKey = useSelector((state: RootState) => state.action.chatListLoadedQueryKey);
    const chatListPage = useSelector((state: RootState) => state.action.chatListPage);
    const chatListHasMore = useSelector((state: RootState) => state.action.chatListHasMore);
    const chatListUpdatedAt = useSelector((state: RootState) => state.action.chatListUpdatedAt);
    const chatListTab = useSelector((state: RootState) => state.action.chatListTab);
    const chatListSearchText = useSelector((state: RootState) => state.action.chatListSearchText);
    const chatListSelectedOperator = useSelector((state: RootState) => state.action.chatListSelectedOperator);
    const chatListSelectedTag = useSelector((state: RootState) => state.action.chatListSelectedTag);
    const chatListOrdenFecha = useSelector((state: RootState) => state.action.chatListOrdenFecha);
    const chatListScrollTop = useSelector((state: RootState) => state.action.chatListScrollTop);
    const chatListFilters = useSelector((state: RootState) => state.action.chatListFilters);
    const chatsRef = useRef<ChatState[]>([])
    const mentionUnreadCount = useSelector((state: RootState) => state.action.mentionUnreadCount);
    const mentionChatIds = useSelector((state: RootState) => state.action.mentionChatIds);
    const selectedMentionChatIds = useSelector((state: RootState) => state.action.selectedMentionChatIds);
    const selectedBulkReadChatIds = useSelector((state: RootState) => state.action.selectedBulkReadChatIds);


    const socket = getSocket()

    const token = localStorage.getItem('token') || '';
    const role = localStorage.getItem('role') || '';
    const id = jwtDecode<{ id: string }>(token).id;

    const pendingCountsRefreshRef = useRef<number | null>(null)
    const countsLastSyncAtRef = useRef(0)
    const countsDirtyRef = useRef(false)
    const chatsLoadControllerRef = useRef<AbortController | null>(null)
    const loadMoreControllerRef = useRef<AbortController | null>(null)
    const countsControllerRef = useRef<AbortController | null>(null)
    const chatPatchTimersRef = useRef<Map<string, number>>(new Map())
    const chatPatchPayloadRef = useRef<Map<string, ChatState>>(new Map())
    const listRequestSeqRef = useRef(0)

    const pickChatFromPayload = (payload: any): ChatState | null => {
        if (!payload || typeof payload !== 'object') return null
        const candidates = [
            payload?.chat,
            payload?.data?.chat,
            payload?.payload?.chat,
            payload,
        ]
        for (const c of candidates) {
            if (c && typeof c === 'object' && typeof c.id === 'string') return c as ChatState
        }
        return null
    }

    
    const dedupeTags = (tags: any): any[] => {
        if (!Array.isArray(tags)) return []
        const map = new Map<string, any>()
        tags.forEach((tag: any) => {
            if (tag?.id) { const key = String(tag.id); if (!map.has(key)) map.set(key, tag) }
        })
        return Array.from(map.values())
    }

    const normalizeChat = (chat: any): any => {
        if (!chat || typeof chat !== 'object') return chat
        return { ...chat, tags: dedupeTags(chat.tags) }
    }
    const mergeChatPayload = (existing: ChatState | undefined, incoming: ChatState): ChatState => {
        if (!existing) return normalizeChat(incoming)
        const merged: any = { ...existing, ...normalizeChat(incoming) }
        if (incoming?.cliente == null) merged.cliente = existing.cliente
        if (incoming?.operador == null) merged.operador = existing.operador
        if (!Array.isArray(incoming?.tags)) merged.tags = existing.tags
        merged.tags = dedupeTags(merged.tags)
        return merged
    }

    const dispatch = useDispatch()

    const [tabCounts, setTabCounts] = useState<{
        total: number
        archived: number
        bots: number
        unassigned: number
        mine: number
        others: number
    }>({
        total: 0,
        archived: 0,
        bots: 0,
        unassigned: 0,
        mine: 0,
        others: 0,
    })

    useEffect(() => {
        chatsRef.current = Array.isArray(chatsFromRedux) ? chatsFromRedux : []
    }, [chatsFromRedux])

    const toMsSafe = (value: any): number => {
        if (!value) return 0
        const d = new Date(value)
        const ms = d.getTime()
        return Number.isNaN(ms) ? 0 : ms
    }

    const compareChatsForStore = (a: ChatState, b: ChatState): number => {
        const aMs = toMsSafe((a as any)?.lastMessageAt) || toMsSafe(a.updatedAt) || toMsSafe(a.createdAt)
        const bMs = toMsSafe((b as any)?.lastMessageAt) || toMsSafe(b.updatedAt) || toMsSafe(b.createdAt)
        if (aMs !== bMs) return bMs - aMs

        const aCreated = toMsSafe(a.createdAt)
        const bCreated = toMsSafe(b.createdAt)
        if (aCreated !== bCreated) return bCreated - aCreated

        // Desempate determinístico similar al backend
        return `${b.id}`.localeCompare(`${a.id}`)
    }

    const mergeChatsById = (current: ChatState[], incoming: ChatState[]): ChatState[] => {
        const map = new Map<string, ChatState>()
            ; (Array.isArray(current) ? current : []).forEach((c) => {
                if (c?.id) map.set(c.id, normalizeChat(c))
            })
            ; (Array.isArray(incoming) ? incoming : []).forEach((c) => {
                if (c?.id) map.set(c.id, normalizeChat(c))
            })
        return Array.from(map.values()).sort(compareChatsForStore)
    }

    const scheduleChatPatch = (incoming: ChatState) => {
        if (!incoming?.id) return
        const chatId = incoming.id
        chatPatchPayloadRef.current.set(chatId, incoming)
        const existingTimer = chatPatchTimersRef.current.get(chatId)
        if (existingTimer) {
            window.clearTimeout(existingTimer)
            chatPatchTimersRef.current.delete(chatId)
        }
        const timer = window.setTimeout(() => {
            chatPatchTimersRef.current.delete(chatId)
            const payload = chatPatchPayloadRef.current.get(chatId)
            chatPatchPayloadRef.current.delete(chatId)
            if (!payload) return
            const existing = chatsRef.current.find((c) => c.id === payload.id)
            const normalized = mergeChatPayload(existing, payload)
            const merged = mergeChatsById(chatsRef.current, [normalized])
            dispatch(setChats(merged.slice(0, MAX_CHAT_CACHE)))
            dispatch(setChatListCacheMeta({ chatListUpdatedAt: Date.now() }))
        }, 280)
        chatPatchTimersRef.current.set(chatId, timer)
    }

    const resolveHasMore = (resp: any, limit: number): boolean => {
        if (typeof resp?.hasMore === "boolean") return resp.hasMore
        const items = Array.isArray(resp?.chats) ? resp.chats : []
        return items.length >= limit
    }

    const normalizeFilterValue = (value: string) => `${value ?? ""}`.trim()

    const buildChatQueryFilters = () => {
        const q = normalizeFilterValue(debouncedSearch)
        const tagId = normalizeFilterValue(selectedTag)
        const operatorValue = normalizeFilterValue(selectedOperator)

        const filters: any = {}
        if (q) filters.q = q
        if (tagId) filters.tagId = tagId

        // Operador (UI) -> query params
        if (operatorValue && operatorValue !== "TODOS") {
            if (operatorValue === "BOT") {
                filters.assignment = "bot"
            } else {
                filters.operatorId = operatorValue
            }
        }

        // Tabs que sí son representables en backend sin romper UX existente
        if (styleBtn === "bots") {
            filters.assignment = "bot"
        } else if (styleBtn === "sinAsignar") {
            filters.assignment = "unassigned"
        } else if (styleBtn === "asig") {
            // "mis asignadas"
            filters.operatorId = id
        } else if (styleBtn === "archi") {
            filters.archived = 1
        }

        return filters
    }

    const activeFiltersRef = useRef<any>({})
    useEffect(() => {
        // Debounce simple para no spamear requests por tecla
        const t = window.setTimeout(() => setDebouncedSearch(searchChat), 350)
        return () => window.clearTimeout(t)
    }, [searchChat])

    // Contadores de pestañas fieles a BD (solo dependen de q y tagId)
    useEffect(() => {
        if (!token) return
        const q = `${debouncedSearch ?? ""}`.trim()
        const tagId = `${selectedTag ?? ""}`.trim()
        countsControllerRef.current?.abort()
        const controller = new AbortController()
        countsControllerRef.current = controller

        getChatCounts(token, {
            q: q.length ? q : undefined,
            tagId: tagId.length ? tagId : undefined,
        }, { signal: controller.signal, rateLimitMs: 1200 })
            .then((resp: any) => {
                const c = resp?.counts || {}
                setTabCounts({
                    total: Number(c.total) || 0,
                    archived: Number(c.archived) || 0,
                    bots: Number(c.bots) || 0,
                    unassigned: Number(c.unassigned) || 0,
                    mine: Number(c.mine) || 0,
                    others: Number(c.others) || 0,
                })
            })
            .catch(() => { })
        return () => {
            if (countsControllerRef.current === controller) {
                countsControllerRef.current.abort()
                countsControllerRef.current = null
            }
        }
    }, [token, debouncedSearch, selectedTag])

    useEffect(() => {
        if (!hydrated) return
        const filters = buildChatQueryFilters()
        activeFiltersRef.current = filters

        // Guardamos filtros/estado UI en Redux (SPA-only)
        const queryKey = JSON.stringify({
            tab: styleBtn,
            q: filters?.q || "",
            operatorId: filters?.operatorId || "",
            assignment: filters?.assignment || "",
            tagId: filters?.tagId || "",
            archived: filters?.archived ?? "",
        })
        dispatch(setChatListCacheMeta({ chatListQueryKey: queryKey, chatListFilters: filters }))
        dispatch(setChatListUiState({
            chatListTab: styleBtn,
            chatListSearchText: searchChat,
            chatListSelectedOperator: selectedOperator,
            chatListSelectedTag: selectedTag,
            chatListOrdenFecha: ordenFecha,
        }))
    }, [hydrated, debouncedSearch, selectedTag, selectedOperator, styleBtn, ordenFecha, searchChat, dispatch])






    useEffect(() => {

        const ejecucion = async () => {
            setLoading(false)

            // Los usuarios con rol USER no tienen permiso para listar operadores (backend devuelve 403).
            // Para evitar errores, solo pedimos la lista si el rol actual NO es USER y además validamos el shape.
            if (role !== 'USER') {
                const respUsers = await usuariosXRole('USER', token);
                const list = Array.isArray((respUsers as any)?.users) ? (respUsers as any).users : []

                const usersIds = new Set<string>()
                const uniqueUsers: Usuario[] = []

                list.forEach((user: Usuario) => {
                    if (!usersIds.has(user.id)) {
                        uniqueUsers.push(user)
                        usersIds.add(user.id)
                    }
                })

                setUsers(uniqueUsers)
            } else {
                setUsers([])
            }

        }

        dispatch(setUserData(null))
        dispatch(setViewSide(false))

        ejecucion();
    }, [])

    // Rehidratar UI/listado al volver a la vista (SPA navigation)
    useEffect(() => {
        // Importante: hidratar ANTES de permitir que otros effects guarden defaults en Redux.
        if (chatListFilters && typeof chatListFilters === "object") {
            activeFiltersRef.current = chatListFilters
            const q = `${(chatListFilters as any)?.q ?? ""}`
            if (q) setDebouncedSearch(q)
        }

        // UI
        if (typeof chatListTab === "string" && chatListTab) setStyleBtn(chatListTab)
        if (typeof chatListSearchText === "string") setSearchChat(chatListSearchText)
        if (typeof chatListSelectedOperator === "string") setSelectedOperator(chatListSelectedOperator)
        if (typeof chatListSelectedTag === "string") setSelectedTag(chatListSelectedTag)
        if (chatListOrdenFecha === "asc" || chatListOrdenFecha === "desc") setOrdenFecha(chatListOrdenFecha)

        // paging/meta
        if (typeof chatListPage === "number" && chatListPage >= 1) setPage(chatListPage)
        if (typeof chatListHasMore === "boolean") setHasMore(chatListHasMore)

        // scroll restore (si hay cache)
        if (listRef.current && typeof chatListScrollTop === "number" && chatListScrollTop > 0) {
            requestAnimationFrame(() => {
                if (listRef.current) listRef.current.scrollTop = chatListScrollTop
            })
        }

        setHydrated(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fuente de verdad: backend (q/operator/tag/assignment/archived) + paginación
    useEffect(() => {
        if (!hydrated) return
        if (!token) return
        const filters = activeFiltersRef.current || {}
        const nextKey = JSON.stringify({
            tab: styleBtn,
            q: filters?.q || "",
            operatorId: filters?.operatorId || "",
            assignment: filters?.assignment || "",
            tagId: filters?.tagId || "",
            archived: filters?.archived ?? "",
        })

        const cachedOk =
            typeof chatListLoadedQueryKey === "string" &&
            chatListLoadedQueryKey === nextKey &&
            Array.isArray(chatsFromRedux)

        // Si volvimos a la vista y el cache coincide, no resetear; opcional refresh silencioso por TTL
        const TTL_MS = 15_000
        const isStale =
            !chatListUpdatedAt || (typeof chatListUpdatedAt === "number" && Date.now() - chatListUpdatedAt > TTL_MS)

        if (cachedOk && !isStale) {
            setLoading(false)
            return
        }

        setLoading(true)
        setIsLoadingMore(false)
        setHasMore(true)
        setPage(1)
        chatsLoadControllerRef.current?.abort()
        const controller = new AbortController()
        chatsLoadControllerRef.current = controller
        const requestSeq = ++listRequestSeqRef.current

        getChats(token, "1", `${CHAT_PAGE_LIMIT}`, filters, { signal: controller.signal, rateLimitMs: 1200 })
            .then((resp: any) => {
                if (requestSeq !== listRequestSeqRef.current) return
                const items: ChatState[] = Array.isArray(resp?.chats) ? resp.chats : []
                // Si había cache, mergeamos para no "perder" páginas ya cargadas; sino reemplazo directo
                const merged = cachedOk ? mergeChatsById(chatsRef.current, items) : items
                const nextList = Array.isArray(merged) ? merged.slice(0, MAX_CHAT_CACHE) : merged
                dispatch(setChats(nextList))
                setHasMore(resolveHasMore(resp, CHAT_PAGE_LIMIT))
                dispatch(setChatListCacheMeta({
                    chatListQueryKey: nextKey,
                    chatListLoadedQueryKey: nextKey,
                    chatListHasMore: resolveHasMore(resp, CHAT_PAGE_LIMIT),
                    chatListPage: 1,
                    chatListUpdatedAt: Date.now(),
                    chatListFilters: filters,
                }))
            })
            .catch(() => {
                // noop
            })
            .finally(() => {
                if (requestSeq !== listRequestSeqRef.current) return
                if (chatsLoadControllerRef.current === controller) {
                    chatsLoadControllerRef.current = null
                }
                setLoading(false)
            })
        return () => {
            if (chatsLoadControllerRef.current === controller) {
                chatsLoadControllerRef.current.abort()
                chatsLoadControllerRef.current = null
            }
        }
    }, [hydrated, token, debouncedSearch, selectedTag, selectedOperator, styleBtn, chatListLoadedQueryKey, chatListUpdatedAt, dispatch])

    // Estado inicial: no estamos en "Menciones" hasta que el usuario toque esa pestaña
    useEffect(() => {
        dispatch(setMentionsMode(false))
        dispatch(clearMentionChatSelection())
        dispatch(clearBulkReadChatSelection())
    }, [dispatch])

    useEffect(() => {
        if (!token) return
        if (styleBtn !== 'menciones') return
        if (!Array.isArray(mentionChatIds) || mentionChatIds.length === 0) return

        const existingIds = new Set((Array.isArray(chatsRef.current) ? chatsRef.current : []).map((chat) => chat.id))
        const missingIds = mentionChatIds.filter((chatId) => !existingIds.has(chatId))
        if (missingIds.length === 0) return

        let cancelled = false
        const controller = new AbortController()
        const hydrateMentionChats = async () => {
            const responses = await Promise.all(
                missingIds.map((chatId) => findChatById(token, chatId, { signal: controller.signal, rateLimitMs: 900 }).catch(() => null))
            )

            if (cancelled) return
            if (responses.some((resp: any) => resp?.statusCode === 401)) {
                dispatch(openSessionExpired())
                return
            }

            const incoming = responses
                .map((resp: any) => resp?.chat)
                .filter((chat: any) => chat && typeof chat.id === 'string') as ChatState[]

            if (incoming.length > 0) {
                const merged = mergeChatsById(chatsRef.current, incoming)
                dispatch(setChats(merged.slice(0, 1000)))
            }
        }

        hydrateMentionChats().catch(() => { })
        return () => {
            cancelled = true
            controller.abort()
        }
    }, [styleBtn, mentionChatIds, token, dispatch])


    const loadMoreChats = async () => {
        if (!token) return
        if (loading) return
        if (isLoadingMore) return
        if (!hasMore) return

        const nextPage = page + 1
        setIsLoadingMore(true)
        loadMoreControllerRef.current?.abort()
        const controller = new AbortController()
        loadMoreControllerRef.current = controller
        try {
            const filters = activeFiltersRef.current || {}
            const resp = await getChats(token, `${nextPage}`, `${CHAT_PAGE_LIMIT}`, filters, { signal: controller.signal, rateLimitMs: 1200 })
            const incoming: ChatState[] = Array.isArray((resp as any)?.chats) ? (resp as any).chats : []
            if (incoming.length === 0) {
                setHasMore(false)
                return
            }
            const merged = mergeChatsById(chatsFromRedux, incoming)
            dispatch(setChats(merged.slice(0, MAX_CHAT_CACHE)))
            setPage(nextPage)
            setHasMore(resolveHasMore(resp, CHAT_PAGE_LIMIT))
            dispatch(setChatListCacheMeta({
                chatListPage: nextPage,
                chatListHasMore: resolveHasMore(resp, CHAT_PAGE_LIMIT),
                chatListUpdatedAt: Date.now(),
            }))
        } catch {
            // noop: no frenamos la UX por un error puntual en scroll
        } finally {
            if (loadMoreControllerRef.current === controller) {
                loadMoreControllerRef.current = null
            }
            setIsLoadingMore(false)
        }
    }

    const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        // Persistimos scroll para volver al mismo lugar
        dispatch(setChatListCacheMeta({ chatListScrollTop: el.scrollTop }))
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX
        if (nearBottom) {
            loadMoreChats()
        }
    }


    useEffect(() => {
        if (!socket) return

        const SOCKET_COUNTS_MIN_INTERVAL_MS = 5000
        const SOCKET_COUNTS_DEBOUNCE_MS = 400

        const scheduleCountsRefresh = (force = false) => {
            countsDirtyRef.current = true
            if (pendingCountsRefreshRef.current) return
            const now = Date.now()
            const elapsed = now - countsLastSyncAtRef.current
            const extraCooldown = force ? 0 : Math.max(0, SOCKET_COUNTS_MIN_INTERVAL_MS - elapsed)
            const delay = force ? 0 : Math.max(SOCKET_COUNTS_DEBOUNCE_MS, extraCooldown)
            pendingCountsRefreshRef.current = window.setTimeout(() => {
                pendingCountsRefreshRef.current = null
                if (!token) return
                if (typeof document !== 'undefined' && document.hidden) return
                if (!countsDirtyRef.current) return
                const q = `${debouncedSearch ?? ""}`.trim()
                const tagId = `${selectedTag ?? ""}`.trim()
                countsControllerRef.current?.abort()
                const controller = new AbortController()
                countsControllerRef.current = controller
                countsDirtyRef.current = false
                countsLastSyncAtRef.current = Date.now()
                getChatCounts(token, {
                    q: q.length ? q : undefined,
                    tagId: tagId.length ? tagId : undefined,
                }, { signal: controller.signal, rateLimitMs: 1200 })
                    .then((resp: any) => {
                        const c = resp?.counts || {}
                        setTabCounts({
                            total: Number(c.total) || 0,
                            archived: Number(c.archived) || 0,
                            bots: Number(c.bots) || 0,
                            unassigned: Number(c.unassigned) || 0,
                            mine: Number(c.mine) || 0,
                            others: Number(c.others) || 0,
                        })
                    })
                    .catch(() => {
                        countsDirtyRef.current = true
                    })
                    .finally(() => {
                        if (countsControllerRef.current === controller) {
                            countsControllerRef.current = null
                        }
                    })
            }, delay)
        }

        const handleVisibilityChange = () => {
            if (typeof document === 'undefined') return
            if (!document.hidden && countsDirtyRef.current) {
                scheduleCountsRefresh(true)
            }
        }

        const handleNuevoChat = async (_chat: ChatState) => {
            const t0 = performance.now()
            try {
                audioRef.current.currentTime = 0
                await audioRef.current.play()
            } catch {
                // El navegador puede bloquear autoplay si no hubo interacción
            }
            perfMark('socket.nuevo-chat.received', { chatId: _chat?.id ?? null })
            if (_chat?.id) {
                scheduleChatPatch(_chat)
                requestAnimationFrame(() => {
                    perfMark('ui.chatlist.patched', {
                        source: 'nuevo-chat',
                        chatId: _chat.id,
                        latencyMs: Math.round(performance.now() - t0),
                    })
                })
            }
            scheduleCountsRefresh()
        }

        const handleChatUpdated = (payload: any) => {
            const t0 = performance.now()
            const chatFromPayload = pickChatFromPayload(payload)
            if (chatFromPayload?.id) {
                perfMark('socket.chat.updated.received', { chatId: chatFromPayload.id })
                const existing = chatsRef.current.find((c) => c.id === chatFromPayload.id)
                const normalized = mergeChatPayload(existing, chatFromPayload)
                if (existing && normalized) {
                    const nextAssignment = getAssignment(normalized)
                    const prevOperadorId = existing?.operador?.id ?? null
                    const nextOperadorId = normalized?.operador?.id ?? null
                    const isNewAssignment =
                        nextAssignment === 'assigned' && nextOperadorId && prevOperadorId !== nextOperadorId
                    if (isNewAssignment) {
                        try {
                            const audio = assignAudioRef.current
                            audio.currentTime = 0
                            audio.playbackRate = 0.9
                            audio.play().catch(() => { })
                        } catch { }
                    }
                }
                scheduleChatPatch(normalized)
                requestAnimationFrame(() => {
                    perfMark('ui.chatlist.patched', {
                        source: 'chat.updated',
                        chatId: chatFromPayload.id,
                        latencyMs: Math.round(performance.now() - t0),
                    })
                })
                scheduleCountsRefresh()
                return
            }
            scheduleCountsRefresh()
        }

        const handleError = (error: any) => {
            if (error.name === 'TokenExpiredError') {
                dispatch(openSessionExpired())
                return
            }
            dispatch(openSessionExpired())
            return
        }

        socket.on('nuevo-chat', handleNuevoChat)
        socket.on('chat.updated', handleChatUpdated)
        socket.on('error', handleError)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange)
        }

        return () => {
            socket.off('nuevo-chat', handleNuevoChat)
            socket.off('chat.updated', handleChatUpdated)
            socket.off('error', handleError)
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange)
            }
            if (pendingCountsRefreshRef.current) {
                window.clearTimeout(pendingCountsRefreshRef.current)
                pendingCountsRefreshRef.current = null
            }
            countsControllerRef.current?.abort()
        }
    }, [socket, token, dispatch, debouncedSearch, selectedTag])

    const handleChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value
        setSelectedOperator(selectedValue)
        aplicarFiltros(selectedValue, selectedTag, undefined, searchChat)

        const newSearchParams = new URLSearchParams(searchParams);
        if (selectedValue && selectedValue !== "TODOS" && selectedValue !== "BOT") {
            newSearchParams.set('userId', selectedValue);
        } else {
            newSearchParams.delete('userId');
        }
        setSearchParams(newSearchParams);
    }

    const handleChangeTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tagValue = e.target.value
        setSelectedTag(tagValue)
        aplicarFiltros(selectRef.current?.value || '', tagValue, undefined, searchChat)
    }

    const aplicarFiltros = (_operadorValue: string, _tagValue: string, chatsBase?: ChatState[], _searchValue?: string) => {
        // Buscador y filtros (operador/etiqueta) ahora son server-side via GET /chats.
        // Esta función se mantiene para reutilizar la UI existente (tabs) sin refactor grande.
        setFiltrados(chatsBase || chats1)
    }

    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId && selectRef.current && users.length > 1) {
            selectRef.current.value = userId;
            setSelectedOperator(userId);
        }
    }, [users, searchParams])

    useEffect(() => {
        if (chatsFromRedux.length > 0) {
            const archivadasTemp: ChatState[] = []
            const botsTemp: ChatState[] = []
            const asignadasTemp: ChatState[] = []
            const asignadasOtrosTemp: ChatState[] = []
            const sinAsignarTemp: ChatState[] = []
            const mencionesTemp: ChatState[] = []
            const botsIds = new Set<string>()
            const mentionIds = new Set<string>(mentionChatIds)

            chatsFromRedux.forEach(chat => {
                if (chat.archivar) {
                    archivadasTemp.push(chat)
                }

                if (getAssignment(chat) === 'bot' && !chat.archivar) {
                    if (!botsIds.has(chat.id)) {
                        botsTemp.push(chat)
                        botsIds.add(chat.id)
                    }
                }

                if (getAssignment(chat) === 'unassigned' && !chat.archivar) {
                    sinAsignarTemp.push(chat)
                }

                if (getAssignment(chat) === 'assigned' && id === chat.operador?.id && !chat.archivar) {
                    asignadasTemp.push(chat)
                }

                if (getAssignment(chat) === 'assigned' && !chat.archivar && chat.operador?.id && chat.operador.id !== id) {
                    asignadasOtrosTemp.push(chat)
                }

                if (mentionIds.has(chat.id)) {
                    mencionesTemp.push(chat)
                }
            })

            setArchivadas(archivadasTemp)
            setBots(botsTemp)
            setAsignadas(asignadasTemp)
            setAsignadasOtros(asignadasOtrosTemp)
            setSinAsignar(sinAsignarTemp)
            setMenciones(mencionesTemp)
            setChats1(chatsFromRedux)

            // Extraer tags únicos de todos los chats
            const tagsMap = new Map<string, { id: string; nombre: string }>()
            chatsFromRedux.forEach(chat => {
                if (chat.tags && chat.tags.length > 0) {
                    chat.tags.forEach(tag => {
                        if (!tagsMap.has(tag.id)) {
                            tagsMap.set(tag.id, { id: tag.id, nombre: tag.nombre })
                        }
                    })
                }
            })
            setAllTags(Array.from(tagsMap.values()))

            let chatsBase: ChatState[] = chatsFromRedux
            if (styleBtn === "asig") {
                chatsBase = asignadasTemp
            } else if (styleBtn === "archi") {
                chatsBase = archivadasTemp
            } else if (styleBtn === "otros") {
                chatsBase = asignadasOtrosTemp
            } else if (styleBtn === "bots") {
                chatsBase = botsTemp
            } else if (styleBtn === "sinAsignar") {
                chatsBase = sinAsignarTemp
            } else if (styleBtn === "menciones") {
                chatsBase = mencionesTemp
            }

            // Aplicar filtros de operador y tag sobre la base seleccionada
            const operadorValue = selectRef.current?.value || ''
            aplicarFiltros(operadorValue, selectedTag, chatsBase, searchChat)
        }
    }, [chatsFromRedux, id, styleBtn, searchChat, selectedTag, mentionChatIds])



    const handleClickLink = () => {
        dispatch(setViewSide(true))
    }

    const toDateSafe = (value: any): Date | null => {
        if (!value) return null
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? null : d
    }

    const getUnreadCount = (chat: ChatState): number => {
        const anyChat: any = chat as any
        if (typeof anyChat?.unreadCount === 'number') return Math.max(0, anyChat.unreadCount)
        const msgs = Array.isArray(anyChat?.mensajes) ? anyChat.mensajes : []
        // Solo entrantes: lo "no leído" tiene sentido para mensajes recibidos.
        return msgs.filter((m: any) => m?.msg_entrada && m?.leido === false).length
    }

    const isManuallyUnread = (chat: ChatState): boolean => {
        const anyChat: any = chat as any
        return anyChat?.manualUnread === true
    }

    const getLastIncomingAt = (chat: ChatState): Date | null => {
        const anyChat: any = chat as any
        const direct =
            toDateSafe(anyChat?.lastIncomingMessageAt) ??
            (anyChat?.lastMessageDirection === 'incoming' ? toDateSafe(anyChat?.lastMessageAt) : null)
        if (direct) return direct

        const msgs = Array.isArray(anyChat?.mensajes) ? anyChat.mensajes : []
        let best: Date | null = null
        for (const m of msgs) {
            if (!m?.msg_entrada) continue
            const d = toDateSafe(m?.createdAt)
            if (!d) continue
            if (!best || d.getTime() > best.getTime()) best = d
        }
        return best
    }

    const formatRelativeLastIncoming = (d: Date | null): string => {
        if (!d) return ''
        const now = new Date()
        const diffMs = Math.max(0, now.getTime() - d.getTime())
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHr = Math.floor(diffMin / 60)

        const diffDays = Math.floor(diffHr / 24)
        if (diffDays >= 1) {
            return diffDays === 1 ? 'hace un día' : `hace ${diffDays} días`
        }
        if (diffHr >= 1) return diffHr === 1 ? 'hace 1 hora' : `hace ${diffHr} horas`
        if (diffMin >= 1) return diffMin === 1 ? 'hace 1 minuto' : `hace ${diffMin} minutos`
        return 'hace unos segundos'
    }

    const handleOpenChat = () => {
        // Solo navegación/UX (no marcar leído automáticamente)
        handleClickLink()
    }

    useEffect(() => {
        if (loading) return
        if (!activeChatId) return
        const visible = Array.isArray(filtrados) && filtrados.some((chat) => chat?.id === activeChatId)
        if (!visible) {
            navigate('/dashboard/chats', { replace: true })
        }
    }, [loading, activeChatId, filtrados, navigate])

    useEffect(() => {
        if (!styleBtn) return
        perfTrackNavigation('chat_tab', { tab: styleBtn })
    }, [styleBtn])

    // Nota: el "bulk mark read/unread" se ejecuta desde la vista del chat (botones al lado de Archivar).

    const ordenarChatsPorFecha = (chats: ChatState[], orden: 'desc' | 'asc'): ChatState[] => {
        return [...chats].sort((a, b) => {
            const fechaA = new Date(a.updatedAt || a.createdAt).getTime()
            const fechaB = new Date(b.updatedAt || b.createdAt).getTime()
            return orden === 'desc' ? fechaB - fechaA : fechaA - fechaB
        })
    }

    const handleOrdenarPorFecha = () => {
        const nuevoOrden = ordenFecha === 'desc' ? 'asc' : 'desc'
        setOrdenFecha(nuevoOrden)
    }

    const handleExportarConversaciones = () => {
        // Función para exportar conversaciones (implementar según necesidad)
        console.log('Exportar conversaciones')
    }

    const handleToggleFilter = () => {
        setShowFilterSelect(!showFilterSelect)
    }

    useEffect(() => {
        return () => {
            chatsLoadControllerRef.current?.abort()
            loadMoreControllerRef.current?.abort()
            countsControllerRef.current?.abort()
            chatPatchTimersRef.current.forEach((timer) => window.clearTimeout(timer))
            chatPatchTimersRef.current.clear()
            chatPatchPayloadRef.current.clear()
        }
    }, [])

    // Marcado como leído se dispara desde la vista del chat (botón al lado de "Archivar")



    return (
        <div className="chats-container">
            <div className='main-chat'>
                <div className="header-lista">
                    <div className={`header-item ${styleBtn === "sinAsignar" ? "header-item--active" : ""}`}>
                        <button
                            onClick={() => {
                                dispatch(setMentionsMode(false))
                                dispatch(clearMentionChatSelection())
                                dispatch(clearBulkReadChatSelection())
                                setStyleBtn('sinAsignar')
                                const operadorValue = selectRef.current?.value || ''
                                aplicarFiltros(operadorValue, selectedTag, sinAsignar)
                            }}
                            className="btn-item"
                        >
                            Sin asignar
                            <span>{tabCounts.unassigned}</span>
                        </button>

                    </div>

                    <div className={`header-item ${styleBtn === "asig" ? "header-item--active" : ""}`}>
                        <button
                            onClick={() => {
                                dispatch(setMentionsMode(false))
                                dispatch(clearMentionChatSelection())
                                dispatch(clearBulkReadChatSelection())
                                setStyleBtn("asig")
                                const operadorValue = selectRef.current?.value || ''
                                aplicarFiltros(operadorValue, selectedTag, asignadas)
                            }}
                            className="btn-item"
                        >
                            Asignadas a mi
                            <span>{tabCounts.mine}</span>
                        </button>

                    </div>

                    <div className={`header-item ${styleBtn === "otros" ? "header-item--active" : ""}`}>
                        <button
                            onClick={() => {
                                dispatch(setMentionsMode(false))
                                dispatch(clearMentionChatSelection())
                                dispatch(clearBulkReadChatSelection())
                                setStyleBtn("otros")
                                const operadorValue = selectRef.current?.value || ''
                                aplicarFiltros(operadorValue, selectedTag, asignadasOtros)
                            }}
                            className="btn-item"
                        >
                            Asignadas a otros
                            <span>{tabCounts.others}</span>
                        </button>

                    </div>

                    <div className={`header-item ${styleBtn === "archi" ? "header-item--active" : ""}`}>
                        <button
                            onClick={() => {
                                dispatch(setMentionsMode(false))
                                dispatch(clearMentionChatSelection())
                                dispatch(clearBulkReadChatSelection())
                                setStyleBtn("archi")
                                const operadorValue = selectRef.current?.value || ''
                                aplicarFiltros(operadorValue, selectedTag, archivadas)
                            }}
                            className="btn-item"
                        >
                            Archivadas
                            <span>{tabCounts.archived}</span>
                        </button>

                    </div>

                    <div className={`header-item ${styleBtn === "menciones" ? "header-item--active" : ""}`}>
                        <button
                            onClick={() => {
                                setStyleBtn('menciones')
                                dispatch(setMentionsMode(true))
                                dispatch(clearBulkReadChatSelection())
                                dispatch(bumpMentionsRefreshNonce())
                                const operadorValue = selectRef.current?.value || ''
                                aplicarFiltros(operadorValue, selectedTag, menciones)
                            }}
                            className="btn-item"
                        >
                            Menciones
                            <span>{mentionUnreadCount}</span>
                        </button>

                    </div>

                    <div className={`header-item ${styleBtn === "bots" ? "header-item--active" : ""}`}>
                        <button
                            onClick={() => {
                                dispatch(setMentionsMode(false))
                                dispatch(clearMentionChatSelection())
                                dispatch(clearBulkReadChatSelection())
                                setStyleBtn('bots')
                                const operadorValue = selectRef.current?.value || ''
                                aplicarFiltros(operadorValue, selectedTag, bots)
                            }}
                            className="btn-item"
                        >
                            Bots
                            <span>{tabCounts.bots}</span>
                        </button>

                    </div>

                    <div className="header-item header-item-search-conv">
                        <input
                            type="text"
                            value={searchConversacion}
                            onChange={(e) => setSearchConversacion(e.target.value)}
                            onKeyDown={async (e) => {
                                if (e.key !== 'Enter') return
                                const v = searchConversacion.trim()
                                if (!v || !/^\d+$/.test(v)) return
                                const numero = parseInt(v, 10)
                                if (isNaN(numero)) return
                                try {
                                    const resp = await searchByConversacion(token, numero)
                                    if (resp?.statusCode === 200 && resp?.chat?.id) {
                                        const chat = resp.chat
                                        const tab = resp.tab || 'sinAsignar'
                                        setStyleBtn(tab)
                                        dispatch(setMentionsMode(tab === 'menciones'))
                                        if (tab === 'menciones') dispatch(bumpMentionsRefreshNonce())
                                        dispatch(clearMentionChatSelection())
                                        dispatch(clearBulkReadChatSelection())
                                        setSearchConversacion('')
                                        const nombre = chat.cliente?.nombre || ''
                                        const telefono = chat.cliente?.telefono || ''
                                        dispatch(setChatListUiState({ chatListTab: tab }))
                                        dispatch(setChatListCacheMeta({ chatListQueryKey: '', chatListLoadedQueryKey: '', chatListUpdatedAt: 0 }))
                                        navigate(`/dashboard/chats/${chat.id}?telefono=${telefono}&nombre=${nombre}`)
                                    }
                                } catch { }
                            }}
                            placeholder="IdConversación..."
                            className="input-search-conversacion"
                        />
                    </div>
                </div>
                <div className="lista-main">
                    <div className="col-lista" ref={listRef} onScroll={handleListScroll}>
                        {chats1.length === 0 && !loading && (
                            <p className="msg-error">No hay chats disponibles</p>
                        )}
                        {chats1.length > 0 && (
                            <>
                                <div className="chat-list-controls">
                                    <div className="w-full flex justify-between px-2 items-center mb-2 py-2">
                                        <div className="flex gap-2 flex-wrap">
                                            <div
                                                className="sort-button-container border border-white rounded-none p-2 cursor-pointer relative"
                                                onClick={handleOrdenarPorFecha}
                                                title=""
                                            >
                                                {ordenFecha === 'desc' ? (
                                                    <LuArrowDownFromLine />
                                                ) : (
                                                    <LuArrowUpFromLine />
                                                )}
                                                <span className="sort-tooltip">Ordenar por fecha</span>
                                            </div>
                                            <div
                                                className="sort-button-container border border-white rounded-none p-2 cursor-pointer relative"
                                                onClick={handleExportarConversaciones}
                                                title=""
                                            >
                                                <LuDownload />
                                                <span className="sort-tooltip">Exportar conversaciones</span>
                                            </div>
                                            <div
                                                className="sort-button-container border border-white rounded-none p-2 cursor-pointer relative"
                                                onClick={handleToggleFilter}
                                                title=""
                                            >
                                                <LuFilter />
                                                <span className="sort-tooltip">Filtrar conversaciones</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 mb-2">
                                        <input
                                            type="text"
                                            value={searchChat}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                setSearchChat(v)
                                                aplicarFiltros(selectRef.current?.value || '', selectedTag, undefined, v)
                                            }}
                                            placeholder="Buscar por nombre o teléfono..."
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                                        />
                                    </div>
                                    {showFilterSelect && (
                                        <div className="w-full px-2 mb-2 space-y-2">
                                            <div className="filter-input-row">
                                                <User className="filter-input-icon" size={18} />
                                                <select
                                                    ref={selectRef}
                                                    id="operador-select"
                                                    className={`filter-select ${selectedOperator === '' ? 'filter-select--placeholder' : ''}`}
                                                    onChange={handleChangeSelect}
                                                >
                                                    <option value="">Filtrar por operador</option>
                                                    <option value="TODOS" className="bg-gray-500">TODOS</option>
                                                    <option value="BOT" className="bg-gray-500">BOT OPERADOR</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id} className="bg-gray-500">{user.apellido} {user.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="filter-input-row">
                                                <TagIcon className="filter-input-icon" size={18} />
                                                <select
                                                    id="tag-select"
                                                    className={`filter-select ${selectedTag === '' ? 'filter-select--placeholder' : ''}`}
                                                    onChange={handleChangeTagSelect}
                                                    value={selectedTag}
                                                >
                                                    <option value="">Filtrar por etiqueta</option>
                                                    {allTags.map(tag => (
                                                        <option key={tag.id} value={tag.id} className="bg-gray-500">{tag.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {/* El botón "Marcar como leído" se muestra en la vista del chat (al lado de Archivar)
                                   y solo si hay chats seleccionados en la pestaña Menciones */}
                                </div>
                                <div className="chat-list-spacing"></div>
                                {filtrados != undefined && ordenarChatsPorFecha(filtrados, ordenFecha).map(chat => (
                                    (() => {
                                        if (!chat?.id || !chat?.cliente) return null
                                        const nombre = capitalizeText(chat.cliente?.nombre)
                                        const telefono = chat.cliente?.telefono || ''
                                        const unread = getUnreadCount(chat)
                                        const lastIncoming = getLastIncomingAt(chat)
                                        const lastIncomingLabel = formatRelativeLastIncoming(lastIncoming)
                                        const manualUnread = isManuallyUnread(chat)
                                        const showMarker = unread > 0 || manualUnread
                                        const bulkChecked = (selectedBulkReadChatIds || []).includes(chat.id)
                                        return (
                                            <Link
                                                to={`/dashboard/chats/${chat.id}?telefono=${chat.cliente?.telefono || ''}&nombre=${chat.cliente?.nombre || ''}`}
                                                className={`item-lista text-left ${chat.id === activeChatId ? 'active' : ''}`}
                                                key={chat.id}
                                                onClick={handleOpenChat}
                                            >
                                                <div className="chat-item-header">
                                                    <div className="chat-item-title">
                                                        <div className="chat-item-name-row">
                                                            <span className="chat-item-name">{nombre}</span>
                                                            {showMarker && (
                                                                <span
                                                                    className="chat-unread-indicator"
                                                                    title={manualUnread ? "Marcado como no leído" : `${unread} mensaje(s) sin leer`}
                                                                    aria-label={manualUnread ? "Marcado como no leído" : `${unread} mensaje(s) sin leer`}
                                                                >
                                                                    <span className="chat-unread-dot" />
                                                                </span>
                                                            )}
                                                            {lastIncomingLabel && (
                                                                <span className="chat-last-incoming">{lastIncomingLabel}</span>
                                                            )}
                                                        </div>
                                                        <div className="chat-item-phone">{telefono}</div>
                                                    </div>
                                                </div>
                                                <div className="chat-tags-container">
                                                    {styleBtn === 'menciones' && (
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            checked={(selectedMentionChatIds || []).includes(chat.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                e.stopPropagation()
                                                                dispatch(toggleMentionChatSelection(chat.id))
                                                            }}
                                                        />
                                                    )}
                                                    {styleBtn !== 'menciones' && (
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            checked={bulkChecked}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                e.stopPropagation()
                                                                dispatch(toggleBulkReadChatSelection(chat.id))
                                                            }}
                                                            title="Seleccionar para marcar como leído"
                                                        />
                                                    )}
                                                    {chat.tags && chat.tags.length > 0 ? (
                                                        chat.tags.map(tag => (
                                                            <p key={tag.id} className="chat-tag">{tag.nombre}</p>
                                                        ))
                                                    ) : null}
                                                </div>
                                            </Link>
                                        )
                                    })()
                                ))}
                                {filtrados && filtrados.length === 0 && (
                                    <p className="msg-error px-2">No hay coincidencias</p>
                                )}
                            </>
                        )}

                    </div>
                    <div className="col-lista">
                        {loading ? (
                            <div className="chat-loader-center">
                                <div className="loader2"></div>
                                <p className="chat-empty-text">Aguarda un momento mientras cargamos la información.</p>
                            </div>
                        ) : activeChatId && Array.isArray(filtrados) && filtrados.some((chat) => chat?.id === activeChatId) ? (
                            <Outlet />
                        ) : (
                            <div className="chat-empty-prompt">
                                <p className="chat-empty-text">
                                    {Array.isArray(filtrados) && filtrados.length === 0
                                        ? getEmptyStateMessageByTab(styleBtn)
                                        : "Presiona en un chat para comenzar"}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="col-lista">
                        {viewSide && (
                            <>
                                <div className="w-full">
                                    <p className="chat-info-label">Etiquetas</p>
                                    <div className="chat-tags-panel">
                                        <p className="chat-tag">ac <span className="chat-tag-close">×</span></p>
                                        <p className="chat-tag">black <span className="chat-tag-close">×</span></p>
                                        <p className="chat-tag">deuda <span className="chat-tag-close">×</span></p>
                                    </div>
                                </div>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Canal: </span> Whatsapp</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Estado: </span>Abierto</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">ChatBot: </span>#andessalud</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Departamento: </span>Atención</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Asignado: </span>John Doe</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Email: </span>{dataUser?.mail}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Telefono: </span>{dataUser?.celular}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">TipoAltaBaja: </span>Alta</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Plan Prestacional: </span>{dataUser?.planAfiliado}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Provincia: </span>{dataUser?.provinciaDom}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Via Clinica: </span>CATEGORIA D;SC</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Cuil Afiliado: </span>{dataUser?.CUILTitular}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Id Afiliado Titular: </span>{dataUser?.IdAfiliadoTitular}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Fecha Alta: </span>{dataUser?.mesAlta}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Obra social: </span>{dataUser?.OSAndes}</p>
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Localidad: </span>{dataUser?.localidadDom}</p>
                                <p className="text-left text-gray-700 w-full p-1">
                                    &#9658;<span className="font-bold">DNI: </span>
                                    {dataUser?.CUILTitular ? dataUser.CUILTitular.toString().slice(2, -1) : ""}
                                </p>
                                {/* <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">DNI: </span>{dataUser?.CUILTitular.toString()}</p> */}
                                <p className="text-left text-gray-700 w-full p-1">&#9658;<span className="font-bold">Zoho Ticket id: </span>#260937</p>

                            </>


                        )}








                    </div>
                </div>
            </div>
        </div>

    )
}

export default ListaChats





