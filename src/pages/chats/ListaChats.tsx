import { Link, Outlet, useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChatState } from "../../interfaces/chats.interface"
import { useDispatch, useSelector } from "react-redux"
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
import { isLightFeatureDisabled } from "../../config/runtimeConfig"
import { getTagsByChatIds } from "../../services/tags/tags.services"
import { getAuthSessionReason, getSocketAuthSessionReason } from "../../utils/authSession"

const capitalizeText = (text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

type ChatAssignment = 'bot' | 'unassigned' | 'assigned' | 'archived'

const getAssignment = (chat: ChatState): ChatAssignment => {
    const assignment = chat.assignment
    if (assignment === 'bot' || assignment === 'unassigned' || assignment === 'assigned' || assignment === 'archived') {
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

type CachedChatTags = {
    tags: any[];
    fetchedAt: number;
}

const ListaChats = () => {
    const { id: activeChatId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentEventoId = searchParams.get('eventoId')
    const selectRef = useRef<HTMLSelectElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate()
    const mentionsEnabled = !isLightFeatureDisabled('mentions')
    const tagsDisabled = isLightFeatureDisabled('tags')

    const CHAT_PAGE_LIMIT = 50
    const SCROLL_BOTTOM_THRESHOLD_PX = 260
    const MAX_CHAT_CACHE = 1000
    const TAGS_BATCH_LIMIT = 50
    const TAGS_CACHE_TTL_MS = 90_000
    const TAGS_EVENT_DEBOUNCE_MS = 500
    const TAGS_BATCH_RATE_LIMIT_MS = 900

    const [chats1, setChats1] = useState<ChatState[]>([])
    const [archivadas, setArchivadas] = useState<ChatState[]>([])
    const [asignadas, setAsignadas] = useState<ChatState[]>([])
    const [asignadasOtros, setAsignadasOtros] = useState<ChatState[]>([])
    const [bots, setBots] = useState<ChatState[]>([])
    const [sinAsignar, setSinAsignar] = useState<ChatState[]>([])
    const [menciones, setMenciones] = useState<any[]>([]) // Mention[]
    const [styleBtn, setStyleBtn] = useState<string>('otros')
    const [searchConversacion, setSearchConversacion] = useState<string>('')

    const [loading, setLoading] = useState<boolean>(true)
    const [page, setPage] = useState<number>(1)
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [users, setUsers] = useState<Usuario[]>([]);
    const [filtrados, setFiltrados] = useState<ChatState[]>([])
    const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc')
    const [showFilterSelect, setShowFilterSelect] = useState<boolean>(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [allTags, setAllTags] = useState<{ id: string; nombre: string }[]>([])
    const [searchChat, setSearchChat] = useState<string>('')
    const [debouncedSearch, setDebouncedSearch] = useState<string>('')
    const [selectedOperator, setSelectedOperator] = useState<string>('')
    const [hydrated, setHydrated] = useState<boolean>(false)
    const [adminTagsByChatId, setAdminTagsByChatId] = useState<Record<string, any[]>>({})

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
    const mentionChatIds = useSelector((state: RootState) => state.action.mentionChatIds); // Mention[]
    const selectedMentionChatIds = useSelector((state: RootState) => state.action.selectedMentionChatIds); // mentionIds seleccionados
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
    const chatTagsCacheRef = useRef<Map<string, CachedChatTags>>(new Map())
    const chatTagsControllersRef = useRef<AbortController[]>([])
    const chatTagsBackoffUntilRef = useRef(0)
    const chatTagsEventTimersRef = useRef<Map<string, number>>(new Map())
    const chatTagsActiveRef = useRef(false)
    const queuedChatTagIdsRef = useRef<Set<string>>(new Set())
    const chatTagsMountedRef = useRef(true)
    const adminTagsByChatIdRef = useRef<Record<string, any[]>>({})

    const pickChatFromPayload = (payload: any): ChatState | null => {
        if (!payload || typeof payload !== 'object') return null
        const candidates = [payload?.chat, payload?.data?.chat, payload?.payload?.chat, payload]
        for (const c of candidates) {
            if (c && typeof c === 'object' && typeof c.id === 'string') return c as ChatState
        }
        return null
    }

    const dedupeTags = (tags: any): any[] => {
        if (!Array.isArray(tags)) return []
        const map = new Map<string, any>()
        tags.forEach((tag: any) => {
            const tagId = tag?.id ?? tag?.tagId
            const nombre = tag?.nombre ?? tag?.name
            if (nombre !== undefined && nombre !== null) {
                const sid = tagId ? String(tagId) : String(nombre)
                const key = tagId ? `id:${sid}` : `name:${String(nombre).trim().toLowerCase()}`
                if (!map.has(key)) map.set(key, { ...tag, id: sid, nombre: String(nombre) })
            }
        })
        return Array.from(map.values())
    }

    const getTagEventType = (payload: any): string => {
        return `${payload?.type ?? payload?.eventType ?? payload?.event ?? payload?.payload?.type ?? payload?.payload?.eventType ?? payload?.data?.type ?? payload?.data?.eventType ?? ''}`.trim()
    }

    const getTagEventChatId = (payload: any): string | null => {
        const chatId = payload?.chatId ?? payload?.payload?.chatId ?? payload?.data?.chatId ?? payload?.chat?.id ?? payload?.payload?.chat?.id ?? payload?.data?.chat?.id
        return chatId ? String(chatId) : null
    }

    const getTagsFromEventPayload = (payload: any): any[] | null => {
        const candidates = [
            payload?.tags,
            payload?.payload?.tags,
            payload?.data?.tags,
            payload?.chat?.tags,
            payload?.payload?.chat?.tags,
            payload?.data?.chat?.tags,
            payload?.items,
            payload?.payload?.items,
            payload?.data?.items,
        ]
        const raw = candidates.find(Array.isArray)
        return Array.isArray(raw) ? dedupeTags(raw) : null
    }

    const getSingleTagFromEventPayload = (payload: any): any | null => {
        const candidates = [payload?.tag, payload?.payload?.tag, payload?.data?.tag]
        const tagObject = candidates.find((candidate) => candidate && typeof candidate === 'object')
        if (tagObject) return dedupeTags([tagObject])[0] ?? null
        const tagId = payload?.tagId ?? payload?.payload?.tagId ?? payload?.data?.tagId
        const nombre = payload?.nombre ?? payload?.name ?? payload?.tagName ?? payload?.payload?.nombre ?? payload?.payload?.name ?? payload?.payload?.tagName ?? payload?.data?.nombre ?? payload?.data?.name ?? payload?.data?.tagName
        return dedupeTags([{ id: tagId, nombre }])[0] ?? null
    }

    const getBulkItemChatId = (item: any): string => {
        const chatId = item?.chatId ?? item?.chat_id ?? item?.idChat ?? item?.chat?.id
        return chatId ? String(chatId) : ''
    }

    const normalizeChat = (chat: any): any => {
        if (!chat || typeof chat !== 'object') return chat
        if (!Array.isArray(chat.tags)) return chat
        return { ...chat, tags: dedupeTags(chat.tags) }
    }

    const mergeChatPayload = (existing: ChatState | undefined, incoming: ChatState): ChatState => {
        if (!existing) return normalizeChat(incoming)
        const merged: any = { ...existing, ...normalizeChat(incoming) }
        if (incoming?.cliente == null) merged.cliente = existing.cliente
        if (incoming?.operador == null) merged.operador = existing.operador
        const incomingTags = Array.isArray(incoming?.tags) ? dedupeTags(incoming.tags) : null
        const existingTags = Array.isArray(existing?.tags) ? existing.tags : adminTagsByChatIdRef.current[existing.id]
        merged.tags = incomingTags && incomingTags.length > 0 ? incomingTags : existingTags
        return merged
    }

    const dispatch = useDispatch()
    const openAuthSessionIfNeeded = useCallback((payload: any): boolean => {
        const authReason = getAuthSessionReason(payload)
        if (!authReason) return false
        dispatch(openSessionExpired(authReason))
        return true
    }, [dispatch])

    const [tabCounts, setTabCounts] = useState<{
        total: number; archived: number; bots: number; unassigned: number; mine: number; others: number;
    }>({ total: 0, archived: 0, bots: 0, unassigned: 0, mine: 0, others: 0 })

    useEffect(() => {
        chatsRef.current = Array.isArray(chatsFromRedux) ? chatsFromRedux : []
    }, [chatsFromRedux])

    useEffect(() => {
        adminTagsByChatIdRef.current = adminTagsByChatId
    }, [adminTagsByChatId])

    useEffect(() => {
        return () => {
            chatTagsMountedRef.current = false
            chatTagsControllersRef.current.forEach((controller) => controller.abort())
            chatTagsControllersRef.current = []
            chatTagsEventTimersRef.current.forEach((timer) => window.clearTimeout(timer))
            chatTagsEventTimersRef.current.clear()
            queuedChatTagIdsRef.current.clear()
        }
    }, [])

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
        return `${b.id}`.localeCompare(`${a.id}`)
    }

    const mergeChatsById = (current: ChatState[], incoming: ChatState[]): ChatState[] => {
        const map = new Map<string, ChatState>()
            ; (Array.isArray(current) ? current : []).forEach((c) => { if (c?.id) map.set(c.id, normalizeChat(c)) })
            ; (Array.isArray(incoming) ? incoming : []).forEach((c) => {
                if (!c?.id) return
                map.set(c.id, mergeChatPayload(map.get(c.id), c))
            })
        return Array.from(map.values()).sort(compareChatsForStore)
    }

    const mergeChatTagsIntoStore = useCallback((items: { chatId: string; tags: any[] }[]): boolean => {
        if (!Array.isArray(items) || items.length === 0) return false
        const tagsByChatId = new Map<string, any[]>()
        items.forEach((item) => {
            if (!item?.chatId) return
            tagsByChatId.set(String(item.chatId), dedupeTags(item.tags))
        })
        if (tagsByChatId.size === 0) return false

        setAdminTagsByChatId((prev) => {
            const next = { ...prev }
            tagsByChatId.forEach((tags, chatId) => {
                next[chatId] = tags
            })
            return next
        })

        let changed = false
        const next = (Array.isArray(chatsRef.current) ? chatsRef.current : []).map((chat: any) => {
            if (!chat?.id || !tagsByChatId.has(chat.id)) return chat
            changed = true
            return { ...chat, tags: tagsByChatId.get(chat.id) || [] }
        })
        if (changed) dispatch(setChats(next.slice(0, MAX_CHAT_CACHE)))
        return changed
    }, [dispatch])

    const replaceChatTagsFromAdmin = useCallback((chatId: string, tags: any[]): boolean => {
        if (!chatId) return false
        const normalizedTags = dedupeTags(tags)
        chatTagsCacheRef.current.set(chatId, { tags: normalizedTags, fetchedAt: Date.now() })
        return mergeChatTagsIntoStore([{ chatId, tags: normalizedTags }])
    }, [mergeChatTagsIntoStore])

    const applyGranularTagEvent = useCallback((chatId: string, payload: any, mode: 'assign' | 'unassign'): boolean => {
        if (!chatId) return false
        const eventTag = getSingleTagFromEventPayload(payload)
        const tagId = eventTag?.id ?? payload?.tagId ?? payload?.payload?.tagId ?? payload?.data?.tagId
        if (mode === 'assign' && !eventTag) return false
        if (mode === 'unassign' && !tagId) return false

        const currentTags =
            adminTagsByChatIdRef.current[chatId]
            ?? chatsRef.current.find((chat: any) => chat?.id === chatId)?.tags
            ?? []
        const nextTags = mode === 'assign'
            ? dedupeTags([...currentTags, eventTag])
            : dedupeTags(currentTags).filter((tag: any) => String(tag?.id) !== String(tagId))
        replaceChatTagsFromAdmin(chatId, nextTags)
        return true
    }, [replaceChatTagsFromAdmin])

    const applyTagsEventPayload = useCallback((payload: any): boolean => {
        if (tagsDisabled) return false
        const type = getTagEventType(payload)
        const chatId = getTagEventChatId(payload)
        if (!chatId) return false

        if (type === 'TAGS_UPDATED' || type === 'TAGS_REPLACED') {
            const eventTags = getTagsFromEventPayload(payload)
            if (!eventTags) return false
            replaceChatTagsFromAdmin(chatId, eventTags)
            return true
        }

        if (type === 'TAG_ASSIGNED') {
            return applyGranularTagEvent(chatId, payload, 'assign')
        }

        if (type === 'TAG_REMOVED' || type === 'TAG_UNASSIGNED') {
            return applyGranularTagEvent(chatId, payload, 'unassign')
        }

        return false
    }, [tagsDisabled, replaceChatTagsFromAdmin, applyGranularTagEvent])

    const hydrateChatTagsForIds = useCallback(async (ids: string[], options?: { force?: boolean }) => {
        if (tagsDisabled || !token) return
        if (typeof document !== 'undefined' && document.hidden && !options?.force) return
        if (Date.now() < chatTagsBackoffUntilRef.current && !options?.force) return

        const now = Date.now()
        const uniqueIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map((chatId) => `${chatId}`.trim()).filter(Boolean)))
        const missingIds = uniqueIds.filter((chatId) => {
            const cached = chatTagsCacheRef.current.get(chatId)
            if (options?.force) return true
            return !cached || now - cached.fetchedAt > TAGS_CACHE_TTL_MS
        }).slice(0, TAGS_BATCH_LIMIT)
        if (missingIds.length === 0) return

        if (chatTagsActiveRef.current) {
            missingIds.forEach((chatId) => queuedChatTagIdsRef.current.add(chatId))
            return
        }

        const controller = new AbortController()
        chatTagsActiveRef.current = true
        chatTagsControllersRef.current.push(controller)
        try {
            const resp = await getTagsByChatIds(token, missingIds, { signal: controller.signal, rateLimitMs: TAGS_BATCH_RATE_LIMIT_MS })
            if (openAuthSessionIfNeeded(resp)) {
                return
            }
            const code = (resp as any)?.statusCode ?? 200
            if (code === 429 || code >= 500) {
                chatTagsBackoffUntilRef.current = Date.now() + 5_000
                return
            }
            if (code >= 400) return

            const rawItems = Array.isArray((resp as any)?.items) ? (resp as any).items : []
            const normalizedItems = rawItems
                .map((item: any) => ({ chatId: getBulkItemChatId(item), tags: dedupeTags(item?.tags) }))
                .filter((item: any) => item.chatId)

            const returnedIds = new Set(normalizedItems.map((item: any) => item.chatId))
            missingIds.forEach((chatId) => {
                if (!returnedIds.has(chatId)) normalizedItems.push({ chatId, tags: [] })
            })

            normalizedItems.forEach((item: any) => {
                chatTagsCacheRef.current.set(item.chatId, { tags: item.tags, fetchedAt: Date.now() })
            })
            if (chatTagsMountedRef.current) mergeChatTagsIntoStore(normalizedItems)
        } catch (error: any) {
            if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') return
            chatTagsBackoffUntilRef.current = Date.now() + 5_000
        } finally {
            chatTagsControllersRef.current = chatTagsControllersRef.current.filter((c) => c !== controller)
            chatTagsActiveRef.current = false
            const queuedIds = Array.from(queuedChatTagIdsRef.current).slice(0, TAGS_BATCH_LIMIT)
            queuedIds.forEach((chatId) => queuedChatTagIdsRef.current.delete(chatId))
            if (chatTagsMountedRef.current && queuedIds.length > 0) {
                window.setTimeout(() => {
                    hydrateChatTagsForIds(queuedIds)
                }, TAGS_BATCH_RATE_LIMIT_MS)
            }
        }
    }, [tagsDisabled, token, openAuthSessionIfNeeded, mergeChatTagsIntoStore])

    const scheduleChatTagsRefresh = useCallback((chatId: string) => {
        if (tagsDisabled || !chatId) return
        const existingTimer = chatTagsEventTimersRef.current.get(chatId)
        if (existingTimer) window.clearTimeout(existingTimer)
        const timer = window.setTimeout(() => {
            chatTagsEventTimersRef.current.delete(chatId)
            hydrateChatTagsForIds([chatId], { force: true })
        }, TAGS_EVENT_DEBOUNCE_MS)
        chatTagsEventTimersRef.current.set(chatId, timer)
    }, [tagsDisabled, hydrateChatTagsForIds])

    const scheduleChatPatch = (incoming: ChatState) => {
        if (!incoming?.id) return
        const chatId = incoming.id
        chatPatchPayloadRef.current.set(chatId, incoming)
        const existingTimer = chatPatchTimersRef.current.get(chatId)
        if (existingTimer) { window.clearTimeout(existingTimer); chatPatchTimersRef.current.delete(chatId) }
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
        if (!tagsDisabled && tagId) filters.tagId = tagId
        if (operatorValue && operatorValue !== "TODOS") {
            if (operatorValue === "BOT") filters.assignment = "bot"
            else filters.operatorId = operatorValue
        }
        if (styleBtn === "bots") filters.assignment = "bot"
        else if (styleBtn === "sinAsignar") filters.assignment = "unassigned"
        else if (styleBtn === "asig") filters.operatorId = id
        else if (styleBtn === "archi") filters.archived = 1
        return filters
    }

    const activeFiltersRef = useRef<any>({})

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedSearch(searchChat), 350)
        return () => window.clearTimeout(t)
    }, [searchChat])

    useEffect(() => {
        if (!tagsDisabled) return
        if (selectedTag) setSelectedTag('')
    }, [tagsDisabled, selectedTag])

    useEffect(() => {
        if (mentionsEnabled) return
        dispatch(setMentionsMode(false))
        dispatch(clearMentionChatSelection())
        dispatch(clearBulkReadChatSelection())
        if (styleBtn === 'menciones') setStyleBtn('otros')
    }, [mentionsEnabled, styleBtn, dispatch])

    useEffect(() => {
        if (!token) return
        const q = `${debouncedSearch ?? ""}`.trim()
        const tagId = tagsDisabled ? '' : `${selectedTag ?? ""}`.trim()
        countsControllerRef.current?.abort()
        const controller = new AbortController()
        countsControllerRef.current = controller
        getChatCounts(token, { q: q.length ? q : undefined, tagId: tagId.length ? tagId : undefined }, { signal: controller.signal, rateLimitMs: 1200 })
            .then((resp: any) => {
                const c = resp?.counts || {}
                setTabCounts({
                    total: Number(c.total) || 0, archived: Number(c.archived) || 0,
                    bots: Number(c.bots) || 0, unassigned: Number(c.unassigned) || 0,
                    mine: Number(c.mine) || 0, others: Number(c.others) || 0,
                })
            })
            .catch(() => { })
        return () => { if (countsControllerRef.current === controller) { countsControllerRef.current.abort(); countsControllerRef.current = null } }
    }, [token, debouncedSearch, selectedTag, tagsDisabled])

    useEffect(() => {
        if (!hydrated) return
        const filters = buildChatQueryFilters()
        activeFiltersRef.current = filters
        const queryKey = JSON.stringify({ tab: styleBtn, q: filters?.q || "", operatorId: filters?.operatorId || "", assignment: filters?.assignment || "", tagId: filters?.tagId || "", archived: filters?.archived ?? "" })
        dispatch(setChatListCacheMeta({ chatListQueryKey: queryKey, chatListFilters: filters }))
        dispatch(setChatListUiState({ chatListTab: styleBtn, chatListSearchText: searchChat, chatListSelectedOperator: selectedOperator, chatListSelectedTag: selectedTag, chatListOrdenFecha: ordenFecha }))
    }, [hydrated, debouncedSearch, selectedTag, selectedOperator, styleBtn, ordenFecha, searchChat, dispatch])

    useEffect(() => {
        const ejecucion = async () => {
            setLoading(false)
            if (role !== 'USER') {
                const respUsers = await usuariosXRole('USER', token);
                const list = Array.isArray((respUsers as any)?.users) ? (respUsers as any).users : []
                const usersIds = new Set<string>()
                const uniqueUsers: Usuario[] = []
                list.forEach((user: Usuario) => { if (!usersIds.has(user.id)) { uniqueUsers.push(user); usersIds.add(user.id) } })
                setUsers(uniqueUsers)
            } else { setUsers([]) }
        }
        dispatch(setUserData(null))
        dispatch(setViewSide(false))
        ejecucion();
    }, [])

    useEffect(() => {
        if (chatListFilters && typeof chatListFilters === "object") {
            activeFiltersRef.current = chatListFilters
            const q = `${(chatListFilters as any)?.q ?? ""}`
            if (q) setDebouncedSearch(q)
        }
        if (typeof chatListTab === "string" && chatListTab) setStyleBtn(chatListTab)
        if (typeof chatListSearchText === "string") setSearchChat(chatListSearchText)
        if (typeof chatListSelectedOperator === "string") setSelectedOperator(chatListSelectedOperator)
        if (typeof chatListSelectedTag === "string") setSelectedTag(chatListSelectedTag)
        if (chatListOrdenFecha === "asc" || chatListOrdenFecha === "desc") setOrdenFecha(chatListOrdenFecha)
        if (typeof chatListPage === "number" && chatListPage >= 1) setPage(chatListPage)
        if (typeof chatListHasMore === "boolean") setHasMore(chatListHasMore)
        if (listRef.current && typeof chatListScrollTop === "number" && chatListScrollTop > 0) {
            requestAnimationFrame(() => { if (listRef.current) listRef.current.scrollTop = chatListScrollTop })
        }
        setHydrated(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!hydrated) return
        if (!token) return
        const filters = activeFiltersRef.current || {}
        const nextKey = JSON.stringify({ tab: styleBtn, q: filters?.q || "", operatorId: filters?.operatorId || "", assignment: filters?.assignment || "", tagId: filters?.tagId || "", archived: filters?.archived ?? "" })
        const cachedOk = typeof chatListLoadedQueryKey === "string" && chatListLoadedQueryKey === nextKey && Array.isArray(chatsFromRedux)
        const TTL_MS = 15_000
        const isStale = !chatListUpdatedAt || (typeof chatListUpdatedAt === "number" && Date.now() - chatListUpdatedAt > TTL_MS)
        if (cachedOk && !isStale) {
            setLoading(false)
            return
        }
        setLoading(true); setIsLoadingMore(false); setHasMore(true); setPage(1)
        chatsLoadControllerRef.current?.abort()
        const controller = new AbortController()
        chatsLoadControllerRef.current = controller
        const requestSeq = ++listRequestSeqRef.current
        getChats(token, "1", `${CHAT_PAGE_LIMIT}`, filters, { signal: controller.signal, rateLimitMs: 1200 })
            .then((resp: any) => {
                if (requestSeq !== listRequestSeqRef.current) return
                const items: ChatState[] = Array.isArray(resp?.chats) ? resp.chats : []
                const merged = cachedOk ? mergeChatsById(chatsRef.current, items) : items
                const nextList = Array.isArray(merged) ? merged.slice(0, MAX_CHAT_CACHE) : merged
                dispatch(setChats(nextList))
                setHasMore(resolveHasMore(resp, CHAT_PAGE_LIMIT))
                dispatch(setChatListCacheMeta({ chatListQueryKey: nextKey, chatListLoadedQueryKey: nextKey, chatListHasMore: resolveHasMore(resp, CHAT_PAGE_LIMIT), chatListPage: 1, chatListUpdatedAt: Date.now(), chatListFilters: filters }))
            })
            .catch(() => { })
            .finally(() => {
                if (requestSeq !== listRequestSeqRef.current) return
                if (chatsLoadControllerRef.current === controller) chatsLoadControllerRef.current = null
                setLoading(false)
            })
        return () => { if (chatsLoadControllerRef.current === controller) { chatsLoadControllerRef.current.abort(); chatsLoadControllerRef.current = null } }
    }, [hydrated, token, debouncedSearch, selectedTag, selectedOperator, styleBtn, chatListLoadedQueryKey, chatListUpdatedAt, dispatch, tagsDisabled, hydrateChatTagsForIds])

    useEffect(() => {
        dispatch(setMentionsMode(false))
        dispatch(clearMentionChatSelection())
        dispatch(clearBulkReadChatSelection())
    }, [dispatch])

    // Hidratar chats de menciones que no estén en Redux
    useEffect(() => {
        if (!token) return
        if (!mentionsEnabled) return
        if (styleBtn !== 'menciones') return
        if (!Array.isArray(mentionChatIds) || mentionChatIds.length === 0) return

        const existingIds = new Set((Array.isArray(chatsRef.current) ? chatsRef.current : []).map((chat) => chat.id))
        const uniqueChatIds = Array.from(new Set(mentionChatIds.map((m: any) => m?.chatId ?? m).filter(Boolean)))
        const missingIds = uniqueChatIds.filter((chatId) => !existingIds.has(chatId))
        if (missingIds.length === 0) return

        let cancelled = false
        const controller = new AbortController()
        const hydrateMentionChats = async () => {
            const responses = await Promise.all(
                missingIds.map((chatId) => findChatById(token, chatId, { signal: controller.signal, rateLimitMs: 900 }).catch(() => null))
            )
            if (cancelled) return
            const authResponse = responses.find((resp: any) => getAuthSessionReason(resp))
            if (openAuthSessionIfNeeded(authResponse)) return
            const incoming = responses.map((resp: any) => resp?.chat).filter((chat: any) => chat && typeof chat.id === 'string') as ChatState[]
            if (incoming.length > 0) {
                const merged = mergeChatsById(chatsRef.current, incoming)
                dispatch(setChats(merged.slice(0, 1000)))
            }
        }
        hydrateMentionChats().catch(() => { })
        return () => { cancelled = true; controller.abort() }
    }, [styleBtn, mentionChatIds, token, dispatch, mentionsEnabled])

    // Sincronizar menciones desde Redux a estado local
    useEffect(() => {
        const mencionesTemp: any[] = Array.isArray(mentionChatIds) ? mentionChatIds : []
        setMenciones(mencionesTemp)
    }, [mentionChatIds])

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
            if (incoming.length === 0) { setHasMore(false); return }
            const merged = mergeChatsById(chatsFromRedux, incoming)
            dispatch(setChats(merged.slice(0, MAX_CHAT_CACHE)))
            setPage(nextPage)
            setHasMore(resolveHasMore(resp, CHAT_PAGE_LIMIT))
            dispatch(setChatListCacheMeta({ chatListPage: nextPage, chatListHasMore: resolveHasMore(resp, CHAT_PAGE_LIMIT), chatListUpdatedAt: Date.now() }))
        } catch {
            // noop
        } finally {
            if (loadMoreControllerRef.current === controller) loadMoreControllerRef.current = null
            setIsLoadingMore(false)
        }
    }

    const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        dispatch(setChatListCacheMeta({ chatListScrollTop: el.scrollTop }))
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX
        if (nearBottom) loadMoreChats()
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
                const tagId = tagsDisabled ? '' : `${selectedTag ?? ""}`.trim()
                countsControllerRef.current?.abort()
                const controller = new AbortController()
                countsControllerRef.current = controller
                countsDirtyRef.current = false
                countsLastSyncAtRef.current = Date.now()
                getChatCounts(token, { q: q.length ? q : undefined, tagId: tagId.length ? tagId : undefined }, { signal: controller.signal, rateLimitMs: 1200 })
                    .then((resp: any) => {
                        const c = resp?.counts || {}
                        setTabCounts({ total: Number(c.total) || 0, archived: Number(c.archived) || 0, bots: Number(c.bots) || 0, unassigned: Number(c.unassigned) || 0, mine: Number(c.mine) || 0, others: Number(c.others) || 0 })
                    })
                    .catch(() => { countsDirtyRef.current = true })
                    .finally(() => { if (countsControllerRef.current === controller) countsControllerRef.current = null })
            }, delay)
        }
        const handleVisibilityChange = () => {
            if (typeof document === 'undefined') return
            if (!document.hidden && countsDirtyRef.current) scheduleCountsRefresh(true)
        }
        const handleNuevoChat = async (_chat: ChatState) => {
            const t0 = performance.now()
            try { audioRef.current.currentTime = 0; await audioRef.current.play() } catch { }
            perfMark('socket.nuevo-chat.received', { chatId: _chat?.id ?? null })
            if (_chat?.id) {
                scheduleChatPatch(_chat)
                requestAnimationFrame(() => { perfMark('ui.chatlist.patched', { source: 'nuevo-chat', chatId: _chat.id, latencyMs: Math.round(performance.now() - t0) }) })
            }
            scheduleCountsRefresh()
        }
        const handleChatUpdated = (payload: any) => {
            const t0 = performance.now()
            const tagEventApplied = applyTagsEventPayload(payload)
            const tagEventChatId = getTagEventChatId(payload)
            if (!tagsDisabled && tagEventChatId && !tagEventApplied) {
                scheduleChatTagsRefresh(tagEventChatId)
            }
            const chatFromPayload = pickChatFromPayload(payload)
            if (chatFromPayload?.id) {
                perfMark('socket.chat.updated.received', { chatId: chatFromPayload.id })
                const existing = chatsRef.current.find((c) => c.id === chatFromPayload.id)
                const normalized = mergeChatPayload(existing, chatFromPayload)
                if (existing && normalized) {
                    const nextAssignment = getAssignment(normalized)
                    const prevOperadorId = existing?.operador?.id ?? null
                    const nextOperadorId = normalized?.operador?.id ?? null
                    const isNewAssignment = nextAssignment === 'assigned' && nextOperadorId && prevOperadorId !== nextOperadorId
                    if (isNewAssignment) {
                        try { const audio = assignAudioRef.current; audio.currentTime = 0; audio.playbackRate = 0.9; audio.play().catch(() => { }) } catch { }
                    }
                }
                scheduleChatPatch(normalized)
                requestAnimationFrame(() => { perfMark('ui.chatlist.patched', { source: 'chat.updated', chatId: chatFromPayload.id, latencyMs: Math.round(performance.now() - t0) }) })
                scheduleCountsRefresh()
                return
            }
            scheduleCountsRefresh()
        }
        const handleTagEvent = (payload: any) => {
            const tagEventApplied = applyTagsEventPayload(payload)
            const tagEventChatId = getTagEventChatId(payload)
            if (!tagsDisabled && tagEventChatId && !tagEventApplied) scheduleChatTagsRefresh(tagEventChatId)
        }
        const handleTagsUpdatedEvent = (payload: any) => handleTagEvent({ ...(payload || {}), type: getTagEventType(payload) || 'TAGS_UPDATED' })
        const handleTagAssignedEvent = (payload: any) => handleTagEvent({ ...(payload || {}), type: getTagEventType(payload) || 'TAG_ASSIGNED' })
        const handleTagUnassignedEvent = (payload: any) => handleTagEvent({ ...(payload || {}), type: getTagEventType(payload) || 'TAG_UNASSIGNED' })
        const handleTagRemovedEvent = (payload: any) => handleTagEvent({ ...(payload || {}), type: getTagEventType(payload) || 'TAG_REMOVED' })
        const handleError = (error: any) => {
            const authReason = getSocketAuthSessionReason(error)
            if (authReason === 'expired') { dispatch(openSessionExpired('expired')); return }
            console.warn('Socket error sin expiración explícita de token:', error)
        }
        socket.on('nuevo-chat', handleNuevoChat)
        socket.on('chat.updated', handleChatUpdated)
        socket.on('chat-event', handleTagEvent)
        socket.on('TAGS_UPDATED', handleTagsUpdatedEvent)
        socket.on('TAG_ASSIGNED', handleTagAssignedEvent)
        socket.on('TAG_UNASSIGNED', handleTagUnassignedEvent)
        socket.on('TAG_REMOVED', handleTagRemovedEvent)
        socket.on('error', handleError)
        if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            socket.off('nuevo-chat', handleNuevoChat)
            socket.off('chat.updated', handleChatUpdated)
            socket.off('chat-event', handleTagEvent)
            socket.off('TAGS_UPDATED', handleTagsUpdatedEvent)
            socket.off('TAG_ASSIGNED', handleTagAssignedEvent)
            socket.off('TAG_UNASSIGNED', handleTagUnassignedEvent)
            socket.off('TAG_REMOVED', handleTagRemovedEvent)
            socket.off('error', handleError)
            if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (pendingCountsRefreshRef.current) { window.clearTimeout(pendingCountsRefreshRef.current); pendingCountsRefreshRef.current = null }
            countsControllerRef.current?.abort()
        }
    }, [socket, token, dispatch, debouncedSearch, selectedTag, tagsDisabled, hydrateChatTagsForIds, scheduleChatTagsRefresh, applyTagsEventPayload])

    const handleChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value
        setSelectedOperator(selectedValue)
        aplicarFiltros(selectedValue, selectedTag, undefined, searchChat)
        const newSearchParams = new URLSearchParams(searchParams);
        if (selectedValue && selectedValue !== "TODOS" && selectedValue !== "BOT") newSearchParams.set('userId', selectedValue)
        else newSearchParams.delete('userId')
        setSearchParams(newSearchParams);
    }

    const handleChangeTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tagValue = e.target.value
        setSelectedTag(tagValue)
        aplicarFiltros(selectRef.current?.value || '', tagValue, undefined, searchChat)
    }

    const aplicarFiltros = (_operadorValue: string, _tagValue: string, chatsBase?: ChatState[], _searchValue?: string) => {
        setFiltrados(chatsBase || chats1)
    }

    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId && selectRef.current && users.length > 1) { selectRef.current.value = userId; setSelectedOperator(userId) }
    }, [users, searchParams])

    useEffect(() => {
        if (chatsFromRedux.length === 0) {
            setArchivadas([]); setBots([]); setAsignadas([]); setAsignadasOtros([])
            setSinAsignar([]); setChats1([]); setAllTags([]); setFiltrados([])
            return
        }
        if (chatsFromRedux.length > 0) {
            const archivadasTemp: ChatState[] = []
            const botsTemp: ChatState[] = []
            const asignadasTemp: ChatState[] = []
            const asignadasOtrosTemp: ChatState[] = []
            const sinAsignarTemp: ChatState[] = []
            const botsIds = new Set<string>()

            chatsFromRedux.forEach(chat => {
                if (getAssignment(chat) === 'archived') archivadasTemp.push(chat)
                if (getAssignment(chat) === 'bot') { if (!botsIds.has(chat.id)) { botsTemp.push(chat); botsIds.add(chat.id) } }
                if (getAssignment(chat) === 'unassigned') sinAsignarTemp.push(chat)
                if (getAssignment(chat) === 'assigned' && id === chat.operador?.id) asignadasTemp.push(chat)
                if (getAssignment(chat) === 'assigned' && chat.operador?.id && chat.operador.id !== id) asignadasOtrosTemp.push(chat)
            })

            setArchivadas(archivadasTemp); setBots(botsTemp); setAsignadas(asignadasTemp)
            setAsignadasOtros(asignadasOtrosTemp); setSinAsignar(sinAsignarTemp)
            setChats1(chatsFromRedux)

            if (tagsDisabled) {
                setAllTags([])
            } else {
                const tagsMap = new Map<string, { id: string; nombre: string }>()
                chatsFromRedux.forEach(chat => {
                    if (chat.tags && chat.tags.length > 0) {
                        chat.tags.forEach(tag => { if (!tagsMap.has(tag.id)) tagsMap.set(tag.id, { id: tag.id, nombre: tag.nombre }) })
                    }
                })
                Object.values(adminTagsByChatId).forEach((tags) => {
                    if (Array.isArray(tags)) {
                        tags.forEach((tag: any) => { if (tag?.id && !tagsMap.has(tag.id)) tagsMap.set(tag.id, { id: tag.id, nombre: tag.nombre }) })
                    }
                })
                setAllTags(Array.from(tagsMap.values()))
            }

            let chatsBase: ChatState[] = chatsFromRedux
            if (styleBtn === "asig") chatsBase = asignadasTemp
            else if (styleBtn === "archi") chatsBase = archivadasTemp
            else if (styleBtn === "otros") chatsBase = asignadasOtrosTemp
            else if (styleBtn === "bots") chatsBase = botsTemp
            else if (styleBtn === "sinAsignar") chatsBase = sinAsignarTemp
            else if (styleBtn === "menciones") chatsBase = []

            const operadorValue = selectRef.current?.value || ''
            aplicarFiltros(operadorValue, selectedTag, chatsBase, searchChat)
        }
    }, [chatsFromRedux, id, styleBtn, searchChat, selectedTag, tagsDisabled, adminTagsByChatId])

    const handleClickLink = () => { dispatch(setViewSide(true)) }

    const toDateSafe = (value: any): Date | null => {
        if (!value) return null
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? null : d
    }

    const getUnreadCount = (chat: ChatState): number => {
        const anyChat: any = chat as any
        if (typeof anyChat?.unreadCount === 'number') return Math.max(0, anyChat.unreadCount)
        const msgs = Array.isArray(anyChat?.mensajes) ? anyChat.mensajes : []
        return msgs.filter((m: any) => m?.msg_entrada && m?.leido === false).length
    }

    const isManuallyUnread = (chat: ChatState): boolean => { return (chat as any)?.manualUnread === true }

    const getLastIncomingAt = (chat: ChatState): Date | null => {
        const anyChat: any = chat as any
        const direct = toDateSafe(anyChat?.lastIncomingMessageAt) ?? (anyChat?.lastMessageDirection === 'incoming' ? toDateSafe(anyChat?.lastMessageAt) : null)
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
        if (diffDays >= 1) return diffDays === 1 ? 'hace un día' : `hace ${diffDays} días`
        if (diffHr >= 1) return diffHr === 1 ? 'hace 1 hora' : `hace ${diffHr} horas`
        if (diffMin >= 1) return diffMin === 1 ? 'hace 1 minuto' : `hace ${diffMin} minutos`
        return 'hace unos segundos'
    }

    const handleOpenChat = () => { handleClickLink() }

    useEffect(() => {
        if (!styleBtn) return
        perfTrackNavigation('chat_tab', { tab: styleBtn })
    }, [styleBtn])

    const ordenarChatsPorFecha = (chats: ChatState[], orden: 'desc' | 'asc'): ChatState[] => {
        return [...chats].sort((a, b) => {
            const fechaA = new Date(a.updatedAt || a.createdAt).getTime()
            const fechaB = new Date(b.updatedAt || b.createdAt).getTime()
            return orden === 'desc' ? fechaB - fechaA : fechaA - fechaB
        })
    }

    const visibleChatIdsForTags = useMemo(() => {
        if (tagsDisabled || styleBtn === 'menciones') return []
        if (!Array.isArray(filtrados) || filtrados.length === 0) return []
        return ordenarChatsPorFecha(filtrados, ordenFecha)
            .slice(0, TAGS_BATCH_LIMIT)
            .map((chat) => chat?.id)
            .filter(Boolean)
    }, [filtrados, ordenFecha, styleBtn, tagsDisabled])

    useEffect(() => {
        if (visibleChatIdsForTags.length === 0) return
        hydrateChatTagsForIds(visibleChatIdsForTags)
    }, [visibleChatIdsForTags, hydrateChatTagsForIds])

    const getRenderTags = (chat: ChatState): any[] => {
        const adminTags = adminTagsByChatId[chat.id]
        if (Array.isArray(adminTags)) return adminTags
        return Array.isArray(chat.tags) ? chat.tags : []
    }

    const activeChatForSidePanel = activeChatId
        ? (Array.isArray(chatsFromRedux) ? chatsFromRedux : []).find((chat) => chat?.id === activeChatId)
        : null
    const activeChatTags = activeChatForSidePanel ? getRenderTags(activeChatForSidePanel) : []

    const handleOrdenarPorFecha = () => { setOrdenFecha(ordenFecha === 'desc' ? 'asc' : 'desc') }
    const handleExportarConversaciones = () => { console.log('Exportar conversaciones') }
    const handleToggleFilter = () => { setShowFilterSelect(!showFilterSelect) }

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

    return (
        <div className="chats-container">
            <div className='main-chat'>
                <div className="header-lista">
                    <div className={`header-item ${styleBtn === "sinAsignar" ? "header-item--active" : ""}`}>
                        <button onClick={() => { dispatch(setMentionsMode(false)); dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection()); setStyleBtn('sinAsignar'); aplicarFiltros(selectRef.current?.value || '', selectedTag, sinAsignar) }} className="btn-item">
                            Sin asignar <span>{tabCounts.unassigned}</span>
                        </button>
                    </div>
                    <div className={`header-item ${styleBtn === "asig" ? "header-item--active" : ""}`}>
                        <button onClick={() => { dispatch(setMentionsMode(false)); dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection()); setStyleBtn("asig"); aplicarFiltros(selectRef.current?.value || '', selectedTag, asignadas) }} className="btn-item">
                            Asignadas a mi <span>{tabCounts.mine}</span>
                        </button>
                    </div>
                    <div className={`header-item ${styleBtn === "otros" ? "header-item--active" : ""}`}>
                        <button onClick={() => { dispatch(setMentionsMode(false)); dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection()); setStyleBtn("otros"); aplicarFiltros(selectRef.current?.value || '', selectedTag, asignadasOtros) }} className="btn-item">
                            Asignadas a otros <span>{tabCounts.others}</span>
                        </button>
                    </div>
                    <div className={`header-item ${styleBtn === "archi" ? "header-item--active" : ""}`}>
                        <button onClick={() => { dispatch(setMentionsMode(false)); dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection()); setStyleBtn("archi"); aplicarFiltros(selectRef.current?.value || '', selectedTag, archivadas) }} className="btn-item">
                            Archivadas <span>{tabCounts.archived}</span>
                        </button>
                    </div>
                    {mentionsEnabled && (
                        <div className={`header-item ${styleBtn === "menciones" ? "header-item--active" : ""}`}>
                            <button onClick={() => { setStyleBtn('menciones'); dispatch(setMentionsMode(true)); dispatch(clearBulkReadChatSelection()); dispatch(bumpMentionsRefreshNonce()); aplicarFiltros(selectRef.current?.value || '', selectedTag, []) }} className="btn-item">
                                Menciones <span>{mentionUnreadCount}</span>
                            </button>
                        </div>
                    )}
                    <div className={`header-item ${styleBtn === "bots" ? "header-item--active" : ""}`}>
                        <button onClick={() => { dispatch(setMentionsMode(false)); dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection()); setStyleBtn('bots'); aplicarFiltros(selectRef.current?.value || '', selectedTag, bots) }} className="btn-item">
                            Bots <span>{tabCounts.bots}</span>
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
                                        const requestedTab = resp.tab || 'sinAsignar'
                                        const tab = !mentionsEnabled && requestedTab === 'menciones' ? 'otros' : requestedTab
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
                                        navigate(`/dashboard/chats/${chat.id}?telefono=${telefono}&nombre=${nombre}&scrollToConversacion=${numero}`)
                                    }
                                } catch { }
                            }}
                            placeholder="Nro.Conversación..."
                            className="input-search-conversacion"
                        />
                    </div>
                </div>
                <div className="lista-main">
                    <div className="col-lista" ref={listRef} onScroll={handleListScroll}>
                        {chats1.length === 0 && !loading && styleBtn !== 'menciones' && (
                            <p className="msg-error">No hay chats disponibles</p>
                        )}
                        {(chats1.length > 0 || styleBtn === 'menciones') && (
                            <>
                                <div className="chat-list-controls">
                                    <div className="w-full flex justify-between px-2 items-center mb-2 py-2">
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="sort-button-container border border-white rounded-none p-2 cursor-pointer relative" onClick={handleOrdenarPorFecha} title="">
                                                {ordenFecha === 'desc' ? <LuArrowDownFromLine /> : <LuArrowUpFromLine />}
                                                <span className="sort-tooltip">Ordenar por fecha</span>
                                            </div>
                                            <div className="sort-button-container border border-white rounded-none p-2 cursor-pointer relative" onClick={handleExportarConversaciones} title="">
                                                <LuDownload />
                                                <span className="sort-tooltip">Exportar conversaciones</span>
                                            </div>
                                            <div className="sort-button-container border border-white rounded-none p-2 cursor-pointer relative" onClick={handleToggleFilter} title="">
                                                <LuFilter />
                                                <span className="sort-tooltip">Filtrar conversaciones</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full px-2 mb-2">
                                        <input
                                            type="text"
                                            value={searchChat}
                                            onChange={(e) => { const v = e.target.value; setSearchChat(v); aplicarFiltros(selectRef.current?.value || '', selectedTag, undefined, v) }}
                                            placeholder="Buscar por nombre o teléfono..."
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                                        />
                                    </div>
                                    {showFilterSelect && (
                                        <div className="w-full px-2 mb-2 space-y-2">
                                            <div className="filter-input-row">
                                                <User className="filter-input-icon" size={18} />
                                                <select ref={selectRef} id="operador-select" className={`filter-select ${selectedOperator === '' ? 'filter-select--placeholder' : ''}`} onChange={handleChangeSelect}>
                                                    <option value="">Filtrar por operador</option>
                                                    <option value="TODOS" className="bg-gray-500">TODOS</option>
                                                    <option value="BOT" className="bg-gray-500">BOT OPERADOR</option>
                                                    {users.map(user => (<option key={user.id} value={user.id} className="bg-gray-500">{user.apellido} {user.nombre}</option>))}
                                                </select>
                                            </div>
                                            {!tagsDisabled && (
                                                <div className="filter-input-row">
                                                    <TagIcon className="filter-input-icon" size={18} />
                                                    <select id="tag-select" className={`filter-select ${selectedTag === '' ? 'filter-select--placeholder' : ''}`} onChange={handleChangeTagSelect} value={selectedTag}>
                                                        <option value="">Filtrar por etiqueta</option>
                                                        {allTags.map(tag => (<option key={tag.id} value={tag.id} className="bg-gray-500">{tag.nombre}</option>))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-list-spacing"></div>

                                {/* PESTAÑA MENCIONES — instancias individuales */}
                                {styleBtn === 'menciones' && menciones.map((mention: any) => {
                                    const chatId = mention?.chatId
                                    const chat = (Array.isArray(chatsFromRedux) ? chatsFromRedux : []).find((c: any) => c?.id === chatId)
                                    if (!chatId || !chat?.cliente) return null
                                    const nombre = capitalizeText(chat.cliente?.nombre)
                                    const telefono = chat.cliente?.telefono || ''
                                    const isRead = !!mention?.readAt
                                    const mentionId = mention?.id
                                    const mentionChecked = (selectedMentionChatIds || []).includes(mentionId)
                                    return (
                                        <Link
                                            to={`/dashboard/chats/${chatId}?telefono=${telefono}&nombre=${chat.cliente?.nombre || ''}&eventoId=${mention?.eventoId ?? ''}`}
                                            className={`item-lista text-left ${mention?.eventoId != null && mention?.eventoId === currentEventoId ? 'active' : ''} ${isRead ? 'opacity-50' : ''}`}
                                            key={mentionId}
                                            onClick={() => { handleOpenChat() }}
                                        >
                                            <div className="chat-item-header">
                                                <div className="chat-item-title">
                                                    <div className="chat-item-name-row">
                                                        <span className="chat-item-name">{nombre}</span>
                                                        {!isRead && <span className="chat-unread-dot" />}
                                                    </div>
                                                    <div className="chat-item-phone">{telefono}</div>
                                                </div>
                                            </div>
                                            <div className="chat-tags-container">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    checked={mentionChecked}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => { e.stopPropagation(); dispatch(toggleMentionChatSelection(mentionId)) }}
                                                />
                                            </div>
                                        </Link>
                                    )
                                })}
                                {styleBtn === 'menciones' && menciones.length === 0 && (
                                    <p className="msg-error px-2">No tenés menciones</p>
                                )}

                                {/* OTRAS PESTAÑAS */}
                                {styleBtn !== 'menciones' && filtrados != undefined && ordenarChatsPorFecha(filtrados, ordenFecha).map(chat => (
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
                                        const chatTags = getRenderTags(chat)
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
                                                                <span className="chat-unread-indicator" title={manualUnread ? "Marcado como no leído" : `${unread} mensaje(s) sin leer`} aria-label={manualUnread ? "Marcado como no leído" : `${unread} mensaje(s) sin leer`}>
                                                                    <span className="chat-unread-dot" />
                                                                </span>
                                                            )}
                                                            {lastIncomingLabel && <span className="chat-last-incoming">{lastIncomingLabel}</span>}
                                                        </div>
                                                        <div className="chat-item-phone">{telefono}</div>
                                                    </div>
                                                </div>
                                                <div className="chat-tags-container">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox"
                                                        checked={bulkChecked}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => { e.stopPropagation(); dispatch(toggleBulkReadChatSelection(chat.id)) }}
                                                        title="Seleccionar para marcar como leído"
                                                    />
                                                    {!tagsDisabled && chatTags.length > 0 ? (
                                                        chatTags.map(tag => (<p key={tag.id} className="chat-tag">{tag.nombre}</p>))
                                                    ) : null}
                                                </div>
                                            </Link>
                                        )
                                    })()
                                ))}
                                {styleBtn !== 'menciones' && filtrados && filtrados.length === 0 && (
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
                        ) : activeChatId ? (
                            <Outlet />
                        ) : (
                            <div className="chat-empty-prompt">
                                <p className="chat-empty-text">
                                    {styleBtn === 'menciones'
                                        ? menciones.length === 0 ? "No tenés menciones" : "Presiona en una mención para comenzar"
                                        : Array.isArray(filtrados) && filtrados.length === 0
                                            ? getEmptyStateMessageByTab(styleBtn)
                                            : "Presiona en un chat para comenzar"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="col-lista">
                        {viewSide && (
                            <>
                                {!tagsDisabled && (
                                    <div className="w-full">
                                        <p className="chat-info-label">Etiquetas</p>
                                        <div className="chat-tags-panel">
                                            {activeChatTags.length > 0 ? (
                                                activeChatTags.map((tag: any) => (
                                                    <p key={tag.id} className="chat-tag">{tag.nombre}</p>
                                                ))
                                            ) : (
                                                <span className="chat-info-empty">Sin etiquetas</span>
                                            )}
                                        </div>
                                    </div>
                                )}
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
