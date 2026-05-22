import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { findChatById, findChatMessagesLite, findChatTimeline, getUserData, setChatBotState } from '../../services/chats/chats.services'
import { MessageLiteItem, TimelineItem } from '../../interfaces/chats.interface'
import { formatCreatedAt, menos24hs } from '../../utils/functions'
import { getSocket, connectSocket } from '../../app/slices/socketSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../app/store'
import UserSearchModal from '../../components/modal/UserSearchModal'
import ArchiveModal from '../../components/modal/ArchiveModal'
import DeleteModal from '../../components/modal/DeleteModal'
import ErrorModal from '../../components/modal/ErrorModal'
import { FaFileArrowDown } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { Bot, BotOff, CheckCheck, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { openModal, setUserData, setViewSide, switchModalPlantilla, openSessionExpired, clearMentionChatSelection, setChats } from '../../app/slices/actionSlice'
import { ChatTag } from '../../interfaces/chats.interface'
import { IoIosAttach } from "react-icons/io";
import PlantillaModal from '../../components/modal/PlantillaModal'
import './chats.css'
import { toast } from 'react-toastify'
import { Usuario } from '../../interfaces/auth.interface'
import axios from 'axios'
import { getOperadoresEmpresa } from '../../services/empresas/empresa.services'
import { getMentionsUnreadCount, markMentionsRead } from '../../services/mentions/mentions.services'
import { bumpMentionsRefreshNonce, clearBulkReadChatSelection, markChatReadLocal, markChatUnreadLocal, setMentionUnreadCount } from '../../app/slices/actionSlice'
import SuccessModal from '../../components/modal/SuccessModal'
import { QuickResponse } from '../../interfaces/quickResponses.interface'
import { getQuickResponses } from '../../services/quickResponses/quickResponses.services'
import { setChatReadState } from '../../services/chats/chats.services'
import { jwtDecode } from "jwt-decode"
import AddTagModal from '../../components/modal/AddTagModal'
import RemoveTagFromChatModal from '../../components/modal/RemoveTagFromChatModal'
import { getTagsByChatId } from '../../services/tags/tags.services'
import { perfMark, perfTrackMemory, perfTrackNavigation } from '../../utils/perfTracker'
import { getTimelineEventsSource, isLightFeatureDisabled } from '../../config/runtimeConfig'
import { convClient } from '../../services/apiClient'
import MentionModal from '../../components/modal/MentionModal'

/** Normaliza GET /tags/chat/:chatId (admin); admite `tags` o `items` y aliases de campo. */
const normalizeChatTagsFromApi = (resp: any): ChatTag[] => {
    const raw = Array.isArray(resp?.tags) ? resp.tags : Array.isArray(resp?.items) ? resp.items : []
    const mapped: ChatTag[] = []
    const seen = new Set<string>()
    for (const t of raw) {
        const tid = t?.id ?? t?.tagId
        const nombre = t?.nombre ?? t?.name
        if (!tid || nombre === undefined || nombre === null) continue
        const sid = String(tid)
        if (seen.has(sid)) continue
        seen.add(sid)
        mapped.push({
            id: sid,
            nombre: String(nombre),
            createdAt: t?.createdAt ?? '',
            updatedAt: t?.updatedAt ?? t?.createdAt ?? '',
        })
    }
    return mapped
}

const dedupeTagsById = (tags: any): any[] => {
    if (!Array.isArray(tags)) return []
    const map = new Map<string, any>()
    tags.forEach((tag: any) => {
        if (tag?.id) {
            const key = String(tag.id)
            if (!map.has(key)) map.set(key, tag)
        }
    })
    return Array.from(map.values())
}

const Chats = () => {
    const mentionsDisabled = isLightFeatureDisabled('mentions')
    const tagsDisabled = isLightFeatureDisabled('tags')
    const quickResponsesDisabled = isLightFeatureDisabled('quickResponses')
    const TIMELINE_WINDOW_LIMIT = 30
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [selectedMentionUsers, setSelectedMentionUsers] = useState<Usuario[]>([])
    const [mensajes, setMensajes] = useState<TimelineItem[]>([])
    const [timelineCursor, setTimelineCursor] = useState<string | null>(null)
    const [timelineHasMore, setTimelineHasMore] = useState<boolean>(false)
    const [timelineLoadingMore, setTimelineLoadingMore] = useState<boolean>(false)
    const [timelineSource, setTimelineSource] = useState<'timeline' | 'messages-lite'>('timeline')
    const [timelineError, setTimelineError] = useState<string | null>(null)
    const [docPreview, setDocPreview] = useState<{ url: string; name: string } | null>(null)
    const [mensaje, setMensaje] = useState<string>('')
    const [condChat, setCondChat] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [archivos, setArchivos] = useState<File[]>([])
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [showMentionReadSuccess, setShowMentionReadSuccess] = useState(false)
    const [mentionReadSuccessMsg, setMentionReadSuccessMsg] = useState<string>('El chat fue marcado como leído exitosamente.')
    const [isTogglingBot, setIsTogglingBot] = useState(false)
    const [infoPanelOpen, setInfoPanelOpen] = useState(true)
    const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false)
    const [isRemoveTagModalOpen, setIsRemoveTagModalOpen] = useState(false)
    const [tagToRemove, setTagToRemove] = useState<ChatTag | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const mensajeInputRef = useRef<HTMLTextAreaElement | null>(null);
    const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([])
    const [qrOpen, setQrOpen] = useState(false)
    const [qrFiltered, setQrFiltered] = useState<QuickResponse[]>([])
    const [qrActiveIndex, setQrActiveIndex] = useState(0)
    const [qrTriggerRange, setQrTriggerRange] = useState<{ start: number; end: number } | null>(null)
    const [conversacionNumero, setConversacionNumero] = useState<number | null>(null)
    const [isMentionModalOpen, setIsMentionModalOpen] = useState(false)
    const [detailChatTags, setDetailChatTags] = useState<ChatTag[]>([])
    const [detailTagsFetched, setDetailTagsFetched] = useState(false)

    const isSendingRef = useRef(false)
    const lastSentMessageRef = useRef<string | null>(null)
    const uploadPreviewUrlsRef = useRef<Record<string, string>>({})
    const pendingChatRefreshRef = useRef<number | null>(null)
    const mensajesLenRef = useRef(0)
    const chatLoadControllerRef = useRef<AbortController | null>(null)
    const timelineLoadControllerRef = useRef<AbortController | null>(null)
    const timelineOlderControllerRef = useRef<AbortController | null>(null)
    const refreshCurrentChatControllerRef = useRef<AbortController | null>(null)
    const chatTagsFetchControllerRef = useRef<AbortController | null>(null)
    const pendingChatTagsRefreshRef = useRef<number | null>(null)
    const hasSocketConnectedOnceRef = useRef(false)
    const renderedEventKeysRef = useRef<Set<string>>(new Set())

    const MAX_FILES_PER_MESSAGE = 5

    const token = localStorage.getItem('token') || ''
    const role = localStorage.getItem('role') || ''

    const location = useLocation()
    const navigate = useNavigate()

    const id = useParams().id
    const queryParams = new URLSearchParams(location.search);
    const telefono = queryParams.get('telefono');
    const nombre = queryParams.get('nombre');
    const eventoId = queryParams.get('eventoId');
    const scrollToConversacion = queryParams.get('scrollToConversacion') ? Number(queryParams.get('scrollToConversacion')) : null
    const [searchingConversacion, setSearchingConversacion] = useState(false)
    const conversacionFoundRef = useRef(false)

    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    const scrollRestoreRef = useRef<{ height: number; top: number } | null>(null)
    const dispatch = useDispatch()
    const dataUser = useSelector((state: RootState) => state.action.dataUser)
    const mentionsMode = useSelector((state: RootState) => state.action.mentionsMode)
    const selectedMentionChatIds = useSelector((state: RootState) => state.action.selectedMentionChatIds)
    const selectedBulkReadChatIds = useSelector((state: RootState) => state.action.selectedBulkReadChatIds)
    const chats = useSelector((state: RootState) => state.action.chats)
    const socketConnected = useSelector((state: RootState) => state.socket.isConnected)
    const chatsRef = useRef<any[]>(Array.isArray(chats) ? chats : [])
    const currentChat = chats.find(chat => chat.id === id)
    const chatTags: ChatTag[] = useMemo(() => {
        if (tagsDisabled) return []
        if (detailTagsFetched) return dedupeTagsById(detailChatTags)
        return dedupeTagsById(currentChat?.tags || [])
    }, [tagsDisabled, detailTagsFetched, detailChatTags, currentChat?.tags])
    const botEnabled = (currentChat as any)?.botEnabled
    const effectiveBotEnabled = typeof botEnabled === "boolean" ? botEnabled : true
    const operador = currentChat?.operador

    const userIdFromToken = useMemo(() => {
        try {
            if (!token) return null
            return jwtDecode<{ id?: string }>(token)?.id ?? null
        } catch {
            return null
        }
    }, [token])

    const canToggleBot = useMemo(() => {
        if (role === 'USER') return true
        if (role !== 'USER') return true
        if (!currentChat || !userIdFromToken) return false
        const assignment = (() => {
            const a = (currentChat as any)?.assignment
            if (a === 'bot' || a === 'unassigned' || a === 'assigned') return a
            return (currentChat as any)?.operador ? 'assigned' : 'unassigned'
        })()
        return assignment === 'assigned' && (currentChat as any)?.operador?.id === userIdFromToken
    }, [role, currentChat, userIdFromToken])

    const normalizeTimelineItem = (raw: any): TimelineItem => {
        const it = raw?.item ?? raw?.event ?? raw
        const createdAt = it?.createdAt ?? it?.created_at ?? it?.timestamp ?? null
        if (it?.kind === "event" || it?.kind === "message") return createdAt ? { ...it, createdAt } : it
        if (it?.type && (it?.text !== undefined || it?.payload !== undefined)) return createdAt ? { ...it, kind: "event" as const, createdAt } : { ...it, kind: "event" as const }
        if (it?.msg_entrada !== undefined || it?.msg_salida !== undefined) return createdAt ? { ...it, kind: "message" as const, createdAt } : { ...it, kind: "message" as const }
        return it
    }

    const mapMessagesLiteItemToTimeline = (item: MessageLiteItem): TimelineItem => {
        const baseText = `${item?.text ?? ''}`.trim()
        const mediaPlaceholder =
            item?.mediaKey
                ? item.type === 'image'
                    ? '[Imagen]'
                    : item.type === 'audio'
                        ? '[Audio]'
                        : item.type === 'document'
                            ? '[Documento]'
                            : ''
                : ''
        const noteText = `${item?.note ?? ''}`.trim()
        const resolvedText = baseText || mediaPlaceholder || noteText
        if (item.direction === 'incoming') {
            return {
                kind: "message",
                id: item.id,
                createdAt: item.createdAt,
                dayKey: item.dayKey ?? null,
                msg_entrada: resolvedText,
                type: item.type,
                leido: Boolean(item.read),
            } as any
        }
        return {
            kind: "message",
            id: item.id,
            createdAt: item.createdAt,
            dayKey: item.dayKey ?? null,
            msg_salida: resolvedText,
            type: item.type,
            leido: Boolean(item.read),
        } as any
    }

    const getTimelineKey = (it: any) => {
        const id = it?.id
        if (id) return `id:${id}`
        const createdAt = it?.createdAt ?? ''
        const kind = it?.kind ?? (it?.type ? 'event' : 'message')
        const evtType = it?.type ?? ''
        const ticketNro = getTicketNumberFromPayload(it?.payload)
        const msgIn = it?.msg_entrada ?? ''
        const msgOut = it?.msg_salida ?? ''
        const text = it?.text ?? ''
        return `k:${kind}|t:${createdAt}|type:${evtType}|ticket:${ticketNro}|in:${msgIn}|out:${msgOut}|text:${text}`
    }

    const mergeTimeline = (prev: TimelineItem[], incoming: TimelineItem[], mode: 'append' | 'prepend') => {
        const seen = new Set<string>(prev.map(getTimelineKey))
        const filtered = incoming.filter((it) => {
            const key = getTimelineKey(it)
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        return mode === 'prepend' ? [...filtered, ...prev] : [...prev, ...filtered]
    }

    const resolveEventText = (evt: any): string => {
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

    const formatAuthorName = (value: any) => {
        if (!value || typeof value !== 'string') return ''
        return value.toLowerCase().split(' ').filter(Boolean).map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    }

    const getMediaUrl = (value: any): string | null => {
        if (!value) return null
        if (typeof value === "string") return value
        if (typeof value === "object" && typeof value.url === "string") return value.url
        return null
    }

    const MessageContent = ({ msg }: { msg: any }) => {
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
                    <button type="button" className="chat-media-link" onClick={() => setDocPreview({ url, name: fileName })}>Ver documento</button>
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
        return <span className="chat-text">{fallbackText}</span>
    }

    type DateSeparator = { kind: "date_separator"; id: string; createdAt: string | Date; label: string; }
    type ConversationSeparator = { kind: "conversation_separator"; id: string; createdAt: string | Date; numero: number; }
    type RenderItem = TimelineItem | DateSeparator | ConversationSeparator

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const toDayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const normalizeDayKey = (value: any): string | null => {
        if (!value || typeof value !== 'string') return null
        const trimmed = value.trim()
        return trimmed.length ? trimmed : null
    }
    const formatDayLabel = (date: Date) => {
        const now = new Date()
        const today0 = startOfDay(now)
        const d0 = startOfDay(date)
        const msPerDay = 86400000
        const diffDays = Math.floor((today0.getTime() - d0.getTime()) / msPerDay)
        if (diffDays === 0) return "Hoy"
        if (diffDays === 1) return "Ayer"
        return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(d0)
    }

    const withDateSeparators = (items: TimelineItem[]): RenderItem[] => {
        const out: RenderItem[] = []
        let prevDayKey: string | null = null
        let prevNumeroConversacion: number | null = null
        for (const it of items) {
            const d = new Date((it as any)?.createdAt)
            if (Number.isNaN(d.getTime())) { out.push(it); continue }

            // Separador de conversación — solo para mensajes con numeroConversacion
            const numeroConversacion = (it as any)?.kind === 'message' ? ((it as any)?.numeroConversacion ?? null) : null
            if (numeroConversacion !== null && numeroConversacion !== prevNumeroConversacion) {
                out.push({
                    kind: "conversation_separator",
                    id: `conv-sep-${numeroConversacion}`,
                    createdAt: it.createdAt,
                    numero: numeroConversacion,
                })
                prevNumeroConversacion = numeroConversacion
            }

            // Separador de fecha
            const key = normalizeDayKey((it as any)?.dayKey) ?? toDayKey(d)
            if (key !== prevDayKey) {
                out.push({ kind: "date_separator", id: `sep-${key}`, createdAt: it.createdAt, label: formatDayLabel(d) })
                prevDayKey = key
            }

            out.push(it)
        }
        return out
    }

    const renderItems = useMemo(() => withDateSeparators(mensajes), [mensajes])
    const debugTimeline = typeof window !== 'undefined' && window.localStorage?.getItem("debugTimeline") === "1"
    const timelineEventsSource = getTimelineEventsSource()
    const SOCKET_EVENTS_CACHE_PREFIX = 'timeline_socket_events_v1'
    const SOCKET_EVENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000
    const SOCKET_EVENTS_CACHE_MAX_PER_CHAT = 120

    type CachedSocketEvent = {
        chatId: string
        id?: string
        kind: "event"
        type?: string
        text?: string
        payload?: any
        createdAt: string
        cachedAt: number
    }

    const debugSocketLog = (phase: string, payload?: Record<string, any>) => {
        if (!debugTimeline) return
        console.log('[timeline.debug]', {
            phase,
            chatId: id ?? null,
            timestamp: new Date().toISOString(),
            ...(payload || {}),
        })
    }

    const getTicketNumberFromPayload = (payload: any): string => {
        const direct = payload?.nro ?? payload?.ticketNro ?? payload?.ticket?.nro ?? payload?.ticket?.ticketNro
        if (direct === undefined || direct === null) return ''
        return `${direct}`.trim()
    }

    const getEventCacheKey = (evt: any, chatId: string): string => {
        if (evt?.id) return `id:${evt.id}`
        const createdAt = `${evt?.createdAt ?? ''}`
        const type = `${evt?.type ?? ''}`
        const ticketNro = getTicketNumberFromPayload(evt?.payload)
        return `hash:${type}|${createdAt}|${ticketNro}|${chatId}`
    }

    const getSocketEventCacheStorageKey = (chatId: string) => `${SOCKET_EVENTS_CACHE_PREFIX}:${chatId}`

    const readSocketEventCache = (chatId: string): CachedSocketEvent[] => {
        if (!chatId) return []
        try {
            const raw = localStorage.getItem(getSocketEventCacheStorageKey(chatId))
            if (!raw) return []
            const parsed = JSON.parse(raw)
            const list: CachedSocketEvent[] = Array.isArray(parsed?.events)
                ? parsed.events
                : Array.isArray(parsed)
                    ? parsed
                    : []
            const now = Date.now()
            return list.filter((evt) => {
                const cachedAt = Number(evt?.cachedAt || 0)
                const createdAt = new Date(`${evt?.createdAt ?? ''}`).getTime()
                const isFreshByCache = cachedAt > 0 && now - cachedAt <= SOCKET_EVENTS_CACHE_TTL_MS
                const isFreshByCreatedAt = Number.isFinite(createdAt) && now - createdAt <= SOCKET_EVENTS_CACHE_TTL_MS
                return evt?.kind === 'event' && Boolean(evt?.createdAt) && (isFreshByCache || isFreshByCreatedAt)
            })
        } catch {
            return []
        }
    }

    const writeSocketEventCache = (chatId: string, events: CachedSocketEvent[]) => {
        if (!chatId) return
        try {
            localStorage.setItem(
                getSocketEventCacheStorageKey(chatId),
                JSON.stringify({
                    updatedAt: Date.now(),
                    events: events.slice(-SOCKET_EVENTS_CACHE_MAX_PER_CHAT),
                })
            )
        } catch { }
    }

    const cacheSocketEvent = (chatId: string, evt: any) => {
        if (!chatId || timelineEventsSource === 'legacy') return
        if (!evt || evt?.kind !== 'event') return
        const parsedCreatedAt = new Date(`${evt?.createdAt ?? ''}`)
        const normalizedCreatedAt = Number.isNaN(parsedCreatedAt.getTime())
            ? new Date().toISOString()
            : parsedCreatedAt.toISOString()
        const cacheItem: CachedSocketEvent = {
            chatId,
            id: evt?.id,
            kind: 'event',
            type: evt?.type,
            text: evt?.text,
            payload: evt?.payload,
            createdAt: normalizedCreatedAt,
            cachedAt: Date.now(),
        }
        const current = readSocketEventCache(chatId)
        const seen = new Set(current.map((item) => getEventCacheKey(item, chatId)))
        const key = getEventCacheKey(cacheItem, chatId)
        if (seen.has(key)) return
        writeSocketEventCache(chatId, [...current, cacheItem])
        debugSocketLog('socket-event.cached', {
            eventType: cacheItem.type ?? null,
            cacheSize: current.length + 1,
            cacheKey: key,
        })
    }

    const shouldMergeSocketCache = (items: TimelineItem[]): boolean => {
        if (timelineEventsSource === 'legacy') return false
        if (timelineEventsSource === 'socket_cache') return true
        const hasAnyEvent = items.some((it: any) => it?.kind === 'event')
        return !hasAnyEvent
    }

    const mergeWithSocketEventCache = (chatId: string, baseItems: TimelineItem[]): TimelineItem[] => {
        if (!chatId) return baseItems
        if (!shouldMergeSocketCache(baseItems)) return baseItems
        const cached = readSocketEventCache(chatId)
        if (cached.length === 0) return baseItems
        const cachedTimelineItems = cached.map((item) => normalizeTimelineItem(item)).filter(Boolean)
        const merged = mergeTimeline(baseItems, cachedTimelineItems as TimelineItem[], 'append')
        debugSocketLog('timeline.cache-merge.applied', {
            source: timelineEventsSource,
            baseItems: baseItems.length,
            cacheItems: cachedTimelineItems.length,
            mergedItems: merged.length,
        })
        return sortTimelineItems(merged)
    }

    const sortTimelineItems = (items: TimelineItem[]) => {
        return items.sort((a, b) => {
            const ta = new Date((a as any)?.createdAt ?? 0).getTime()
            const tb = new Date((b as any)?.createdAt ?? 0).getTime()
            return ta - tb
        })
    }

    const isBackendLightModeResponse = (resp: any): boolean => {
        return resp?.lightMode === true || resp?.coreLightMode === true || resp?.mode === 'light'
    }

    const loadMessagesLiteWindow = async (
        chatId: string,
        signal?: AbortSignal,
        before?: string | null
    ) => {
        const liteData = await findChatMessagesLite(token!, chatId, { limit: TIMELINE_WINDOW_LIMIT, before: before ?? null }, { signal, rateLimitMs: 1000 })
        if (liteData.statusCode === 401) { dispatch(openSessionExpired()); return null }
        if (((liteData as any)?.statusCode ?? 200) >= 400) {
            throw new Error('messages_lite_unavailable')
        }
        const rawLiteItems: any[] = Array.isArray((liteData as any)?.items) ? (liteData as any).items : []
        const liteItems = sortTimelineItems(rawLiteItems.map(mapMessagesLiteItemToTimeline))
        return {
            items: liteItems,
            nextCursor: (liteData as any)?.nextBefore ?? null,
            hasMore: Boolean((liteData as any)?.hasMore),
        }
    }

    const clearInvalidChatAndReturnToList = () => {
        setMensajes([])
        setTimelineCursor(null)
        setTimelineHasMore(false)
        setTimelineError(null)
        setLoading(false)
        navigate('/dashboard/chats', { replace: true })
    }

    const showHistoryFallbackExhausted = (reason: string, payload?: Record<string, any>) => {
        perfMark('timeline_failed_and_messages_lite_failed', {
            chatId: id ?? null,
            reason,
            ...(payload || {}),
        })
        setMensajes([])
        setTimelineCursor(null)
        setTimelineHasMore(false)
        setTimelineError('No pudimos cargar el historial de este chat. Intentá abrirlo nuevamente en unos minutos.')
        setCondChat(true)
        setLoading(false)
    }

    useEffect(() => {
        chatsRef.current = Array.isArray(chats) ? chats : []
    }, [chats])

    const normalizeChat = (chat: any): any => {
        if (!chat || typeof chat !== 'object') return chat
        return { ...chat, tags: dedupeTagsById(chat.tags) }
    }
    const patchCurrentChatInStore = (incomingChat: any) => {
        if (!incomingChat?.id) return
        const normalizedIncoming = normalizeChat(incomingChat)
        const base = Array.isArray(chatsRef.current) ? chatsRef.current : []
        let found = false
        const patched = base.map((chat: any) => {
            if (chat?.id !== normalizedIncoming.id) return chat
            found = true
            return {
                ...chat,
                ...normalizedIncoming,
                cliente: normalizedIncoming?.cliente ?? chat?.cliente,
                operador: normalizedIncoming?.operador ?? chat?.operador,
                tags: dedupeTagsById(Array.isArray(normalizedIncoming?.tags) ? normalizedIncoming.tags : chat?.tags),
            }
        })
        const next = found ? patched : [normalizedIncoming, ...patched]
        dispatch(setChats(next))
    }

    const fetchChatTagsFromAdmin = useCallback(async () => {
        if (tagsDisabled || !id || !token) return
        const chatId = id
        chatTagsFetchControllerRef.current?.abort()
        const controller = new AbortController()
        chatTagsFetchControllerRef.current = controller
        try {
            const resp = await getTagsByChatId(token, chatId, { signal: controller.signal })
            if ((resp as any)?.statusCode === 401) {
                dispatch(openSessionExpired())
                return
            }
            if (chatTagsFetchControllerRef.current !== controller) return
            const code = (resp as any)?.statusCode ?? 200
            if (code >= 400) {
                setDetailChatTags([])
                setDetailTagsFetched(true)
                return
            }
            const normalized = normalizeChatTagsFromApi(resp)
            setDetailChatTags(normalized)
            setDetailTagsFetched(true)
            patchCurrentChatInStore({ id: chatId, tags: normalized })
        } catch (e: any) {
            if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return
            setDetailTagsFetched(true)
        }
    }, [tagsDisabled, id, token, dispatch])

    const scheduleRefreshChatTagsFromAdmin = useCallback(() => {
        if (tagsDisabled || !id || !token) return
        if (pendingChatTagsRefreshRef.current) {
            window.clearTimeout(pendingChatTagsRefreshRef.current)
            pendingChatTagsRefreshRef.current = null
        }
        pendingChatTagsRefreshRef.current = window.setTimeout(() => {
            pendingChatTagsRefreshRef.current = null
            fetchChatTagsFromAdmin()
        }, 450)
    }, [tagsDisabled, id, token, fetchChatTagsFromAdmin])

    useEffect(() => {
        setDetailChatTags([])
        setDetailTagsFetched(false)
        if (tagsDisabled || !id || !token) return
        fetchChatTagsFromAdmin()
        return () => {
            chatTagsFetchControllerRef.current?.abort()
            if (pendingChatTagsRefreshRef.current) {
                window.clearTimeout(pendingChatTagsRefreshRef.current)
                pendingChatTagsRefreshRef.current = null
            }
        }
    }, [id, tagsDisabled, token, fetchChatTagsFromAdmin])

    const scheduleRefreshCurrentChat = () => {
        if (!id || !token) return
        if (pendingChatRefreshRef.current) {
            window.clearTimeout(pendingChatRefreshRef.current)
            pendingChatRefreshRef.current = null
        }
        pendingChatRefreshRef.current = window.setTimeout(async () => {
            pendingChatRefreshRef.current = null
            try {
                refreshCurrentChatControllerRef.current?.abort()
                const controller = new AbortController()
                refreshCurrentChatControllerRef.current = controller
                const chatResp = await findChatById(token, id, { signal: controller.signal, rateLimitMs: 900 })
                if ((chatResp as any)?.statusCode === 401) {
                    dispatch(openSessionExpired())
                    return
                }
                if ((chatResp as any)?.chat) {
                    patchCurrentChatInStore((chatResp as any).chat)
                }
                if (refreshCurrentChatControllerRef.current === controller) {
                    refreshCurrentChatControllerRef.current = null
                }
            } catch { }
        }, 350)
    }

    const handleNotaPrivada = async () => {
        if ((!mensaje || mensaje.trim().length === 0) && archivos.length === 0) {
            setErrorModalMessage('Debe escribir una nota o pegar una imagen')
            setIsErrorModalOpen(true)
            return
        }
        const socket = getSocket()
        if (socket && socket.connected) {
            const mentions = mentionsDisabled ? [] : selectedMentionUsers.map((user) => ({ userId: user.id }))
            const payload: any = {
                chatId: id,
                mensaje: mensaje.trim() || null,
                token,
                mentions
            }

            // Si hay imagen pegada, convertir a base64
            if (archivos.length > 0 && archivos[0].type.startsWith('image/')) {
                const file = archivos[0]
                const ext = file.name.split('.').pop() || 'png'
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const result = reader.result as string
                        resolve(result.split(',')[1])
                    }
                    reader.readAsDataURL(file)
                })
                payload.image = { base64, ext }
            }

            setMensaje("")
            setArchivos([])
            setSelectedMentionUsers([])
            socket.emit("nota-privada", payload, (ack: any) => {
                if (debugTimeline) console.log("[nota-privada ACK]", ack)
            })
        }
    }

    const handleMentionConfirm = (users: Usuario[]) => {
        setSelectedMentionUsers(users)
        setIsMentionModalOpen(false)
    }

    const handleMarkMentionRead = async () => {
        if (mentionsDisabled) return
        if (!token) return
        const ids = Array.isArray(selectedMentionChatIds) ? selectedMentionChatIds : []
        if (!mentionsMode || ids.length === 0) return
        const resp = await markMentionsRead(token, ids)
        if ((resp as any)?.statusCode === 401) { dispatch(openSessionExpired()); return }
        const countResp = await getMentionsUnreadCount(token)
        if ((countResp as any)?.statusCode === 401) { dispatch(openSessionExpired()); return }
        dispatch(setMentionUnreadCount((countResp as any)?.count ?? 0))
        dispatch(bumpMentionsRefreshNonce())
        dispatch(clearMentionChatSelection())
        setMentionReadSuccessMsg(ids.length === 1 ? 'El chat fue marcado como leído exitosamente.' : 'Los chats seleccionados fueron marcados como leídos exitosamente.')
        setShowMentionReadSuccess(true)
    }

    const handleBulkSetReadState = async (state: "read" | "unread") => {
        if (!token) return
        if (mentionsMode) return
        const ids = Array.isArray(selectedBulkReadChatIds) ? selectedBulkReadChatIds : []
        if (ids.length === 0) return
        if (state === "read") { ids.forEach((chatId) => dispatch(markChatReadLocal(chatId))) }
        else { ids.forEach((chatId) => dispatch(markChatUnreadLocal(chatId))) }
        try {
            const results = await Promise.all(ids.map((chatId) => setChatReadState(token, chatId, state)))
            if (results.some((r: any) => r?.statusCode === 401)) { dispatch(openSessionExpired()); return }
        } catch { } finally { dispatch(clearBulkReadChatSelection()) }
    }

    useEffect(() => {
        const ejecucion = async () => {
            try {
                const resp = await getOperadoresEmpresa(token)
                const list = Array.isArray((resp as any)?.users) ? (resp as any).users : []
                const ordered = [...list].sort((a: Usuario, b: Usuario) => {
                    const aa = `${a.apellido ?? ''} ${a.nombre ?? ''}`.trim().toLowerCase()
                    const bb = `${b.apellido ?? ''} ${b.nombre ?? ''}`.trim().toLowerCase()
                    return aa.localeCompare(bb)
                })
                setUsuarios(ordered)
            } catch { setUsuarios([]) }
        }
        ejecucion();
    }, [])

    useEffect(() => {
        const ejecucion = async () => {
            const resp = await getUserData(telefono!);
            dispatch(setUserData(resp));
            dispatch(setViewSide(true))
            if (resp.statusCode === 401) { dispatch(openSessionExpired()); return }
        }
        ejecucion();
    }, [, location])

    useEffect(() => {
        const socket = getSocket()
        if (!socket) {
            dispatch(connectSocket())
            return
        }
        debugSocketLog('socket.register.emit', { telefono: telefono ?? null, connected: socket.connected })
        socket?.emit('register', telefono)
        return () => { }
    }, [dispatch, telefono, socketConnected])

    useEffect(() => {
        const socket = getSocket()
        if (!socket) {
            debugSocketLog('socket.subscription.skip.no-socket')
            return
        }
        if (!id) {
            debugSocketLog('socket.subscription.skip.no-chat-id')
            return
        }
        renderedEventKeysRef.current.clear()
        const activeChatId = id
        const messageEventName = `new-message-${activeChatId}`
        const chatEventName = `chat-event-${activeChatId}`
        const emitJoinChat = (origin: string) => {
            debugSocketLog('socket.join-chat.emit', { origin, eventName: chatEventName, connected: socket.connected })
            socket.emit('join-chat', activeChatId, (ack: any) => {
                debugSocketLog('socket.join-chat.ack', {
                    origin,
                    eventName: chatEventName,
                    ack: ack ?? null,
                })
            })
        }
        const handleConnect = () => {
            const connectMode = hasSocketConnectedOnceRef.current ? 'reconnect' : 'connect'
            hasSocketConnectedOnceRef.current = true
            debugSocketLog('socket.connected', { mode: connectMode, socketId: socket.id ?? null })
            emitJoinChat(connectMode)
        }
        const handleDisconnect = (reason: any) => {
            debugSocketLog('socket.disconnected', { reason: reason ?? null, socketId: socket.id ?? null })
        }
        const handleConnectError = (err: any) => {
            debugSocketLog('socket.connect_error', {
                message: err?.message ?? null,
                description: err?.description ?? null,
            })
        }
        const handleArchivarAck = (_data: any) => { }
        const handleNotaPrivadaAck = (_data: any) => { }
        const handleNewMessage = (mensaje: any) => {
            const t0 = performance.now()
            if (debugTimeline) console.log("[socket] new-message", messageEventName, mensaje)
            const item: TimelineItem = { ...mensaje, kind: "message" as const }
            perfMark('socket.new-message.received', { chatId: id, messageId: mensaje?.id ?? null })
            setCondChat(menos24hs(new Date(mensaje.createdAt)))
            setMensajes(prev => { const merged = mergeTimeline(prev, [item], 'append'); return merged.length > 1000 ? merged.slice(-1000) : merged })
            requestAnimationFrame(() => {
                perfMark('ui.timeline.patched', {
                    source: 'new-message',
                    chatId: id,
                    messageId: mensaje?.id ?? null,
                    latencyMs: Math.round(performance.now() - t0),
                })
            })
        }
        const handleChatEvent = (evt: any) => {
            debugSocketLog('socket.chat-event.received', {
                eventName: chatEventName,
                payload: evt ?? null,
                eventType: evt?.type ?? null,
            })
            const normalized = normalizeTimelineItem(evt)
            if (!normalized || !(normalized as any)?.createdAt) {
                debugSocketLog('socket.chat-event.drop.invalid-shape', {
                    eventName: chatEventName,
                    payload: evt ?? null,
                })
                return
            }
            debugSocketLog('socket.chat-event.normalized', {
                eventName: chatEventName,
                eventType: (normalized as any)?.type ?? null,
                kind: (normalized as any)?.kind ?? null,
                createdAt: (normalized as any)?.createdAt ?? null,
            })
            cacheSocketEvent(activeChatId, normalized)
            setMensajes(prev => { const merged = mergeTimeline(prev, [normalized], 'append'); return merged.length > 1000 ? merged.slice(-1000) : merged })
            if ((normalized as any)?.type === 'NEW_CONVERSATION_STARTED' && (normalized as any)?.payload?.numeroConversacion) {
                setConversacionNumero((normalized as any).payload.numeroConversacion)
            }
            const evtType = (normalized as any)?.type
            if (!tagsDisabled && (evtType === 'TAG_ASSIGNED' || evtType === 'TAG_REMOVED' || evtType === 'TAG_UNASSIGNED')) {
                scheduleRefreshChatTagsFromAdmin()
            }
        }
        const handleChatUpdated = (payload: any) => {
            const t0 = performance.now()
            const incoming = payload?.chat && typeof payload.chat === 'object'
                ? payload.chat
                : (payload && typeof payload === 'object' ? payload : null)
            if (!incoming?.id || incoming.id !== id) return
            if (debugTimeline) console.log("[socket] chat.updated", incoming)
            perfMark('socket.chat.updated.received', { chatId: id })
            const current = chatsRef.current.find((c: any) => c?.id === id)
            if (!current) return
            const normalizedIncoming = normalizeChat(incoming)
            const patched = {
                ...current,
                ...normalizedIncoming,
                cliente: normalizedIncoming?.cliente ?? current?.cliente,
                operador: normalizedIncoming?.operador ?? current?.operador,
                tags: dedupeTagsById(Array.isArray(normalizedIncoming?.tags) ? normalizedIncoming.tags : current?.tags),
            }
            const next = chatsRef.current.map((c: any) => (c?.id === id ? patched : c))
            dispatch(setChats(next))
            if (!tagsDisabled) {
                scheduleRefreshChatTagsFromAdmin()
            }
            requestAnimationFrame(() => {
                perfMark('ui.chat.patched', {
                    source: 'chat.updated',
                    chatId: id,
                    latencyMs: Math.round(performance.now() - t0),
                })
            })
        }
        const handleError = (error: any) => {
            if (error?.name === 'TokenExpiredError') { dispatch(openSessionExpired()); return }
        }
        debugSocketLog('socket.subscription.attach', {
            chatEventName,
            messageEventName,
            connected: socket.connected,
        })
        socket.on("connect", handleConnect)
        socket.on("disconnect", handleDisconnect)
        socket.on("connect_error", handleConnectError)
        socket.on("archivar-ack", handleArchivarAck)
        socket.on("nota-privada-ack", handleNotaPrivadaAck)
        socket.on(messageEventName, handleNewMessage)
        socket.on(chatEventName, handleChatEvent)
        socket.on("chat.updated", handleChatUpdated)
        socket.on('error', handleError)
        emitJoinChat('effect_mount')
        return () => {
            debugSocketLog('socket.subscription.detach', {
                chatEventName,
                messageEventName,
            })
            socket.emit('leave-chat', activeChatId)
            socket.off("connect", handleConnect)
            socket.off("disconnect", handleDisconnect)
            socket.off("connect_error", handleConnectError)
            socket.off("archivar-ack", handleArchivarAck)
            socket.off("nota-privada-ack", handleNotaPrivadaAck)
            socket.off(messageEventName, handleNewMessage)
            socket.off(chatEventName, handleChatEvent)
            socket.off("chat.updated", handleChatUpdated)
            socket.off('error', handleError)
        }
    }, [id, dispatch, debugTimeline, socketConnected, tagsDisabled, scheduleRefreshChatTagsFromAdmin])

    useEffect(() => {
        const inicio = async () => {
            if (!id) return
            setTimelineError(null)
            setMensajes([])
            try {
                chatLoadControllerRef.current?.abort()
                timelineLoadControllerRef.current?.abort()
                const chatController = new AbortController()
                const timelineController = new AbortController()
                chatLoadControllerRef.current = chatController
                timelineLoadControllerRef.current = timelineController
                const chatData = await findChatById(token, id, { signal: chatController.signal, rateLimitMs: 900 })
                if ((chatData as any)?.statusCode === 401) { dispatch(openSessionExpired()); return }
                if (((chatData as any)?.statusCode ?? 200) >= 400 || !(chatData as any)?.chat) {
                    clearInvalidChatAndReturnToList()
                    return
                }
                setConversacionNumero((chatData as any)?.chat?.lastConversacionNumero ?? null)
            } catch (error) {
                if ((error as any)?.name === 'AbortError' || (error as any)?.code === 'ERR_CANCELED') return
                setConversacionNumero(null)
            }
            setTimelineCursor(null)
            setTimelineHasMore(false)
            setTimelineSource('timeline')
            try {
                const data = await findChatTimeline(token!, id!, { limit: TIMELINE_WINDOW_LIMIT }, { signal: timelineLoadControllerRef.current?.signal, rateLimitMs: 1000 })
                if (data.statusCode === 401) { dispatch(openSessionExpired()); return }
                const timelineOk = ((data as any)?.statusCode ?? 200) < 400 && Array.isArray((data as any)?.items)
                if (!timelineOk) {
                    throw new Error('timeline_unavailable')
                }
                const rawItems: any[] = (data as any).items || []
                if (rawItems.length === 0 || isBackendLightModeResponse(data)) {
                    try {
                        const liteWindow = await loadMessagesLiteWindow(id, timelineLoadControllerRef.current?.signal)
                        if (!liteWindow) {
                            setLoading(false)
                            return
                        }
                        setTimelineSource('messages-lite')
                        const mergedWithCache = mergeWithSocketEventCache(id, liteWindow.items)
                        setMensajes(mergedWithCache)
                        setTimelineCursor(liteWindow.nextCursor)
                        setTimelineHasMore(liteWindow.hasMore)
                        const lastLiteMessage = [...mergedWithCache].reverse().find((x: any) => x && x.kind === "message")
                        if (lastLiteMessage?.createdAt) { setCondChat(menos24hs(new Date(lastLiteMessage.createdAt))) }
                        else { setCondChat(true) }
                        setLoading(false)
                        return
                    } catch (messagesLiteError) {
                        if ((messagesLiteError as any)?.name === 'AbortError' || (messagesLiteError as any)?.code === 'ERR_CANCELED') return
                        showHistoryFallbackExhausted(rawItems.length === 0 ? 'timeline_empty_messages_lite_failed' : 'light_mode_messages_lite_failed', {
                            messagesLiteError: (messagesLiteError as any)?.message ?? null,
                        })
                        return
                    }
                }
                const items = sortTimelineItems(rawItems.map(normalizeTimelineItem))
                const mergedWithCache = mergeWithSocketEventCache(id, items)
                setMensajes(mergedWithCache)
                setTimelineCursor((data as any)?.nextCursor ?? null)
                setTimelineHasMore(Boolean((data as any)?.hasMore))
                const lastMessage = [...mergedWithCache].reverse().find((x: any) => x && x.kind === "message")
                if (lastMessage?.createdAt) { setCondChat(menos24hs(new Date(lastMessage.createdAt))) }
                else { setCondChat(true) }
                setLoading(false)
            } catch (timelineError) {
                if ((timelineError as any)?.name === 'AbortError' || (timelineError as any)?.code === 'ERR_CANCELED') return
                try {
                    const liteWindow = await loadMessagesLiteWindow(id, timelineLoadControllerRef.current?.signal)
                    if (!liteWindow) {
                        setLoading(false)
                        return
                    }
                    setTimelineSource('messages-lite')
                    const mergedWithCache = mergeWithSocketEventCache(id, liteWindow.items)
                    setMensajes(mergedWithCache)
                    setTimelineCursor(liteWindow.nextCursor)
                    setTimelineHasMore(liteWindow.hasMore)
                    const lastMessage = [...mergedWithCache].reverse().find((x: any) => x && x.kind === "message")
                    if (lastMessage?.createdAt) { setCondChat(menos24hs(new Date(lastMessage.createdAt))) }
                    else { setCondChat(true) }
                    setLoading(false)
                } catch (messagesLiteError) {
                    if ((messagesLiteError as any)?.name === 'AbortError' || (messagesLiteError as any)?.code === 'ERR_CANCELED') return
                    showHistoryFallbackExhausted('initial_load_failed', {
                        timelineError: (timelineError as any)?.message ?? null,
                        messagesLiteError: (messagesLiteError as any)?.message ?? null,
                    })
                }
            }
        }
        inicio()
        return () => {
            chatLoadControllerRef.current?.abort()
            timelineLoadControllerRef.current?.abort()
        }
    }, [id, token, dispatch])

    const loadOlderTimeline = async () => {
        if (!id || !token) return
        if (!timelineHasMore || !timelineCursor || timelineLoadingMore) return
        const container = mensajesContainerRef.current
        if (container) { scrollRestoreRef.current = { height: container.scrollHeight, top: container.scrollTop } }
        setTimelineLoadingMore(true)
        timelineOlderControllerRef.current?.abort()
        const controller = new AbortController()
        timelineOlderControllerRef.current = controller
        try {
            if (timelineSource === 'messages-lite') {
                const liteWindow = await loadMessagesLiteWindow(id, controller.signal, timelineCursor)
                if (!liteWindow) return
                setMensajes((prev) => mergeTimeline(prev, liteWindow.items, 'prepend'))
                setTimelineCursor(liteWindow.nextCursor)
                setTimelineHasMore(liteWindow.hasMore)
            } else {
                const data = await findChatTimeline(token!, id!, { limit: TIMELINE_WINDOW_LIMIT, cursor: timelineCursor }, { signal: controller.signal, rateLimitMs: 1000 })
                if (data.statusCode === 401) { dispatch(openSessionExpired()); return }
                if (((data as any)?.statusCode ?? 200) >= 400) {
                    throw new Error('timeline_page_unavailable')
                }
                const rawItems: any[] = (data as any).items || []
                const items = sortTimelineItems(rawItems.map(normalizeTimelineItem))
                setMensajes((prev) => mergeTimeline(prev, items, 'prepend'))
                setTimelineCursor((data as any)?.nextCursor ?? null)
                setTimelineHasMore(Boolean((data as any)?.hasMore))
            }
        } catch (error) {
            if ((error as any)?.name !== 'AbortError' && (error as any)?.code !== 'ERR_CANCELED') {
                perfMark('timeline_failed_and_messages_lite_failed', {
                    chatId: id,
                    reason: 'load_more_failed',
                    source: timelineSource,
                    error: (error as any)?.message ?? null,
                })
                setTimelineHasMore(false)
                setTimelineError('No pudimos cargar más historial de este chat.')
            }
        } finally {
            if (timelineOlderControllerRef.current === controller) {
                timelineOlderControllerRef.current = null
            }
            setTimelineLoadingMore(false)
            if (mensajesContainerRef.current && scrollRestoreRef.current) {
                const prev = scrollRestoreRef.current
                const newHeight = mensajesContainerRef.current.scrollHeight
                mensajesContainerRef.current.scrollTop = newHeight - prev.height + prev.top
                scrollRestoreRef.current = null
            }
        }
    }

    useEffect(() => {
        const container = mensajesContainerRef.current
        if (!container) return
        const onScroll = () => { if (container.scrollTop <= 120) { loadOlderTimeline() } }
        container.addEventListener('scroll', onScroll)
        return () => { container.removeEventListener('scroll', onScroll) }
    }, [timelineHasMore, timelineCursor, timelineLoadingMore, id, token, timelineSource])

    const isInitialLoadRef = useRef(true)

    useEffect(() => {
        if (isInitialLoadRef.current && mensajes.length > 0) {
            if (mensajesContainerRef.current) {
                mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight
            }
            isInitialLoadRef.current = false
        }
    }, [mensajes])

    useEffect(() => {
        isInitialLoadRef.current = true
    }, [id])

    useEffect(() => {
        if (!eventoId || loading) return
        // Esperar a que el DOM esté listo
        const timer = window.setTimeout(() => {
            const el = document.getElementById(`event-${eventoId}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.classList.add('mention-highlight')
                window.setTimeout(() => el.classList.remove('mention-highlight'), 2000)
            }
        }, 300)
        return () => window.clearTimeout(timer)
    }, [eventoId, loading, mensajes])

    useEffect(() => {
        if (!scrollToConversacion || loading) return
        conversacionFoundRef.current = false

        const tryScrollToConversacion = () => {
            const el = document.getElementById(`conv-sep-${scrollToConversacion}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.classList.add('mention-highlight')
                window.setTimeout(() => el.classList.remove('mention-highlight'), 2000)
                conversacionFoundRef.current = true
                setSearchingConversacion(false)
                return true
            }
            return false
        }

        // Intentar scroll inmediato
        const timer = window.setTimeout(() => {
            if (tryScrollToConversacion()) return

            // Si no está en el DOM, cargar páginas anteriores hasta encontrarla
            setSearchingConversacion(true)
            const loadUntilFound = async () => {
                let attempts = 0
                const MAX_ATTEMPTS = 10
                while (attempts < MAX_ATTEMPTS && !conversacionFoundRef.current) {
                    if (!timelineHasMore || !timelineCursor) break
                    await loadOlderTimeline()
                    await new Promise(resolve => window.setTimeout(resolve, 400))
                    if (tryScrollToConversacion()) return
                    attempts++
                }
                setSearchingConversacion(false)
                if (!conversacionFoundRef.current) {
                    toast.info(`No se encontró la conversación ${scrollToConversacion} en el historial cargado`)
                }
            }
            loadUntilFound()
        }, 400)

        return () => window.clearTimeout(timer)
    }, [scrollToConversacion, loading])

    useEffect(() => {
        mensajesLenRef.current = Array.isArray(mensajes) ? mensajes.length : 0
    }, [mensajes])

    useEffect(() => {
        if (!debugTimeline) return
        const events = (Array.isArray(mensajes) ? mensajes : []).filter((it: any) => it?.kind === 'event')
        const last = events.length ? events[events.length - 1] : null
        debugSocketLog('timeline.state.updated', {
            totalItems: mensajes.length,
            totalEvents: events.length,
            lastEventType: (last as any)?.type ?? null,
            lastEventCreatedAt: (last as any)?.createdAt ?? null,
        })
    }, [mensajes, debugTimeline])

    useEffect(() => {
        if (!id) return
        perfTrackNavigation('chat_open', { chatId: id })
    }, [id])

    useEffect(() => {
        const interval = window.setInterval(() => {
            perfTrackMemory('chats.timeline', {
                chatId: id ?? null,
                timelineItems: mensajesLenRef.current,
                chatsCacheSize: Array.isArray(chatsRef.current) ? chatsRef.current.length : 0,
            })
        }, 60_000)
        return () => {
            window.clearInterval(interval)
        }
    }, [id])

    useEffect(() => {
        if (!mentionsDisabled) return
        setSelectedMentionUsers([])
    }, [mentionsDisabled])

    useEffect(() => {
        if (quickResponsesDisabled) {
            setQuickResponses([])
            setQrOpen(false)
            setQrFiltered([])
            return
        }
        const run = async () => {
            if (!token) return
            const resp = await getQuickResponses(token, { page: 1, limit: 200 })
            if ((resp as any)?.statusCode === 401) { dispatch(openSessionExpired()); return }
            const list = Array.isArray((resp as any)?.items) ? (resp as any).items : []
            setQuickResponses(list)
        }
        run().catch(() => { })
    }, [token, quickResponsesDisabled])

    useEffect(() => {
        const el = mensajeInputRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
        }
    }, [mensaje])

    const handleTagConfirm = async (_tagId: string) => {
        if (tagsDisabled) return
        scheduleRefreshCurrentChat()
        scheduleRefreshChatTagsFromAdmin()
    }

    const handleTagRemoveClick = (tag: ChatTag) => {
        if (tagsDisabled) return
        setTagToRemove(tag)
        setIsRemoveTagModalOpen(true)
    }

    const handleRemoveTagSuccess = async () => {
        if (tagsDisabled) return
        scheduleRefreshCurrentChat()
        scheduleRefreshChatTagsFromAdmin()
    }

    const handleClickBtn = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()
            const trimmedMessage = mensaje.trim()
            const hasFiles = archivos.length > 0
            const mentions = mentionsDisabled ? [] : selectedMentionUsers.map((user) => ({ userId: user.id }))
            if (trimmedMessage.length === 0 && !hasFiles) { setErrorModalMessage('Debe escribir un mensaje'); setIsErrorModalOpen(true); return }
            if (isSendingRef.current) return
            if (lastSentMessageRef.current === trimmedMessage && !hasFiles) return
            isSendingRef.current = true
            const socket = getSocket()
            if (hasFiles) {
                if (!id) { setErrorModalMessage("Chat inválido"); setIsErrorModalOpen(true); isSendingRef.current = false; return }
                const createdAt = new Date().toISOString()
                const optimisticItems = archivos.map((file, idx) => {
                    const clientId = `local-upload:${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`
                    const isImage = file.type.startsWith("image/")
                    const previewUrl = URL.createObjectURL(file)
                    uploadPreviewUrlsRef.current[clientId] = previewUrl
                    return { id: clientId, kind: "message" as const, createdAt, msg_salida: file.name, type: (isImage ? "image" : "document") as "image" | "document", imageUrl: isImage ? previewUrl : undefined, documentUrl: !isImage ? previewUrl : undefined, uploading: true }
                })
                const uploadQueue = optimisticItems.map((item, idx) => ({ item, file: archivos[idx] }))
                setMensajes((prev) => { const merged = mergeTimeline(prev, optimisticItems, "append"); return merged.length > 1000 ? merged.slice(-1000) : merged })
                const removeOptimistic = (clientId: string) => {
                    const url = uploadPreviewUrlsRef.current[clientId]
                    if (url) { URL.revokeObjectURL(url); delete uploadPreviewUrlsRef.current[clientId] }
                    setMensajes((prev) => prev.filter((m: any) => m?.id !== clientId))
                }
                if (trimmedMessage.length > 0) {
                    if (socket && socket.connected) { socket.emit("enviar-mensaje", { mensaje: trimmedMessage, chatId: id, telefono, token, mentions }) }
                    else { await convClient.post('/chats/send-message', { chatId: id, text: trimmedMessage, mentions }, { headers: { Authorization: `Bearer ${token}` } }) }
                    lastSentMessageRef.current = trimmedMessage
                    setMensaje("")
                    setSelectedMentionUsers([])
                }
                for (const { item, file } of uploadQueue) {
                    const formData = new FormData()
                    formData.append("chatId", id)
                    formData.append("file", file)
                    try { await convClient.post('/chats/send-message', formData, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }) }
                    catch (err) { toast.error(`No se pudo subir ${file.name}`) }
                    finally { removeOptimistic(item.id) }
                }
                setArchivos([])
                isSendingRef.current = false
                return
            }
            if (socket && socket.connected) {
                socket.emit("enviar-mensaje", { mensaje, chatId: id, telefono, token, mentions })
                lastSentMessageRef.current = trimmedMessage
                setMensaje('')
                setArchivos([])
                setSelectedMentionUsers([])
                isSendingRef.current = false
            } else {
                await convClient.post('/chats/send-message', { chatId: id, text: mensaje, mentions }, { headers: { Authorization: `Bearer ${token}` } })
                setMensaje('')
                setSelectedMentionUsers([])
                isSendingRef.current = false
            }
        } catch (error) { console.log(error); isSendingRef.current = false }
    }

    const handleArchivarClick = () => { setIsArchiveModalOpen(true); }

    const handleToggleBot = async () => {
        if (!token || !id) return
        if (isTogglingBot) return
        if (!canToggleBot) { toast.error('No tenés permisos para cambiar el estado del bot en este chat'); return }
        const nextEnabled = !effectiveBotEnabled
        setIsTogglingBot(true)
        try {
            const resp: any = await setChatBotState(token, id, nextEnabled)
            if (resp?.statusCode === 401) { dispatch(openSessionExpired()); return }
            if (resp?.statusCode && resp.statusCode >= 400) { toast.error(resp?.message || 'No se pudo actualizar el estado del bot'); return }
            const patch = { botEnabled: resp?.botEnabled ?? nextEnabled, botDisabledAt: resp?.botDisabledAt ?? null, botDisabledByUserId: resp?.botDisabledByUserId ?? null, botDisableReason: resp?.botDisableReason ?? null }
            const updated = (Array.isArray(chats) ? chats : []).map((c: any) => c?.id === id ? { ...c, ...patch } : c)
            dispatch(setChats(updated))
            toast.success(nextEnabled ? 'Bot conectado' : 'Bot desconectado')
        } catch (e) { toast.error('Error al actualizar el estado del bot') }
        finally { setIsTogglingBot(false) }
    }

    const handleArchivarConfirm = () => {
        try {
            const socket = getSocket()
            if (socket && socket.connected) {
                const objMsj = { mensaje, chatId: id, telefono, token }
                socket.emit("archivar", objMsj, (ack: any) => {
                    if (!ack?.ok) return
                    setMensajes((prev) => {
                        const evt: TimelineItem = {
                            kind: "event" as const,
                            createdAt: new Date().toISOString(),
                            type: "CHAT_ARCHIVED",
                            text: "Archivado",
                        } as any
                        if (id) cacheSocketEvent(id, evt)
                        const merged = mergeTimeline(prev, [evt], "append")
                        return merged.length > 1000 ? merged.slice(-1000) : merged
                    })
                })
            }
            setIsArchiveModalOpen(false);
        } catch (error) { console.log(error); }
    }

    useEffect(() => {
        return () => {
            if (pendingChatRefreshRef.current) {
                window.clearTimeout(pendingChatRefreshRef.current)
                pendingChatRefreshRef.current = null
            }
            refreshCurrentChatControllerRef.current?.abort()
            chatLoadControllerRef.current?.abort()
            timelineLoadControllerRef.current?.abort()
            timelineOlderControllerRef.current?.abort()
        }
    }, [])

    const handleArchivarCancel = () => { setIsArchiveModalOpen(false); }
    const handleDeleteClick = () => { setIsDeleteModalOpen(true); }

    const handleDeleteConfirm = async () => {
        try {
            if (!id) return
            const response = await convClient.delete(`/chats/${id}/messages`, { headers: { authorization: `Bearer ${token}` } })
            if (response.status === 200 || response.status === 204) {
                toast.success('Chat eliminado correctamente');
                setIsDeleteModalOpen(false);
                setMensajes([]); setMensaje(''); setArchivos([]); setCondChat(false)
                dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection())
                const next = (Array.isArray(chatsRef.current) ? chatsRef.current : []).filter((c: any) => c?.id !== id)
                dispatch(setChats(next))
                navigate('/dashboard/chats')
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) { dispatch(openSessionExpired()); }
                else { toast.error('Error al eliminar el chat'); }
            } else { toast.error('Error al eliminar el chat'); }
            setIsDeleteModalOpen(false);
        }
    }

    const handleDeleteCancel = () => { setIsDeleteModalOpen(false); }

    const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        const files = Array.from(e.target.files ?? [])
        if (files.length === 0) return;
        const tipos = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        const valid: File[] = []
        let hasSizeError = false
        let hasTypeError = false
        for (const file of files) {
            if (file.size >= MAX_FILE_SIZE) { hasSizeError = true; continue }
            if (!tipos.includes(file.type)) { hasTypeError = true; continue }
            valid.push(file)
        }
        if (hasSizeError) toast.error("El archivo debe pesar menos de 50MB");
        if (hasTypeError) toast.error("Solo se permiten archivos pdf, jpeg, png");
        if (valid.length > MAX_FILES_PER_MESSAGE) { toast.error(`Solo se permiten hasta ${MAX_FILES_PER_MESSAGE} archivos por mensaje`); valid.splice(MAX_FILES_PER_MESSAGE) }
        if (valid.length > 0) setArchivos(valid);
        e.target.value = "";
    };

    const handleClickFile = () => { fileInputRef.current?.click(); };

    const closeQuickMenu = () => { setQrOpen(false); setQrFiltered([]); setQrActiveIndex(0); setQrTriggerRange(null) }

    const insertQuickResponse = (qr: QuickResponse) => {
        const range = qrTriggerRange
        const input = mensajeInputRef.current
        if (!range || !input) return
        const current = input.value
        const newValue = current.slice(0, range.start) + (qr.text || '') + current.slice(range.end)
        setMensaje(newValue)
        closeQuickMenu()
        requestAnimationFrame(() => { const caret = range.start + (qr.text || '').length; input.focus(); input.setSelectionRange(caret, caret) })
    }

    const handleKeyDownText = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!qrOpen) return
        if (e.key === 'Escape') { e.preventDefault(); closeQuickMenu(); return }
        if (!qrFiltered.length) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setQrActiveIndex((prev) => (prev + 1) % qrFiltered.length); return }
        if (e.key === 'ArrowUp') { e.preventDefault(); setQrActiveIndex((prev) => (prev - 1 + qrFiltered.length) % qrFiltered.length); return }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); const selected = qrFiltered[qrActiveIndex]; if (selected) insertQuickResponse(selected) }
    }

    const handleChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setMensaje(value);
        const caretPos = e.target.selectionStart ?? value.length
        const leftText = value.slice(0, caretPos)
        const slashMatch = leftText.match(/\/(\w*)$/)
        if (!quickResponsesDisabled && slashMatch) {
            const q = (slashMatch[1] || '').toLowerCase()
            const start = caretPos - slashMatch[0].length
            const end = caretPos
            const norm = (s: string) => (s || '').toLowerCase()
            const filtered = quickResponses.filter((qr) => { const a = norm(qr.shortcut); const b = norm(qr.text); if (!q) return true; return a.includes(q) || b.includes(q) })
            setQrTriggerRange({ start, end })
            setQrFiltered(filtered)
            setQrActiveIndex(0)
            setQrOpen(true)

            return
        } else { closeQuickMenu() }
        if (mentionsDisabled) {

            return
        }

    }

    const handlePasteInput = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) { setArchivos([file]); e.preventDefault() }
            }
        }
    }

    return (
        <div className='chats-container'>
            {loading && (
                <div className='spinner-lista'>
                    <div className='loader2'></div>
                </div>
            )}
            {!loading && (
                <div className='main-chat'>
                    {/* Layout principal: chat + panel info */}
                    <div className='chat-with-panel'>
                        {/* Columna del chat */}
                        <div className='chat-main-col'>
                            <div className='header-chat'>
                                <div className='header-icon'>
                                    <FaCircleUser size={25} />
                                </div>
                                <p className='nombre-chat'>
                                    <span>{nombre}</span>
                                    <span>+{telefono}</span>
                                </p>
                                {conversacionNumero && (
                                    <span className='chat-conversacion-id'>IdConversación: {conversacionNumero}</span>
                                )}
                                <div className='header-chat-actions'>
                                    {canToggleBot && (
                                        <button
                                            onClick={handleToggleBot}
                                            className={`chat-action-button ${effectiveBotEnabled ? "chat-button-bot-on" : "chat-button-bot-off"} ${isTogglingBot ? "chat-button-bot-loading" : ""}`}
                                            disabled={isTogglingBot}
                                            title={effectiveBotEnabled ? "Bot conectado" : "Bot desconectado"}
                                        >
                                            {effectiveBotEnabled ? <BotOff /> : <Bot />}
                                            <span>{effectiveBotEnabled ? "Desconectar Bot" : "Conectar Bot"}</span>
                                        </button>
                                    )}
                                    <button onClick={() => dispatch(openModal())} className="chat-action-button chat-button-assign">
                                        <IoPersonAdd />
                                        <span>Asignar</span>
                                    </button>
                                    {!mentionsDisabled && (
                                        <button onClick={() => setIsMentionModalOpen(true)} className="chat-action-button chat-button-assign">
                                            <span>@ Mencionar</span>
                                        </button>
                                    )}
                                    <button onClick={handleArchivarClick} className="chat-action-button chat-button-archive">
                                        <FaFileArrowDown />
                                        <span>Archivar</span>
                                    </button>
                                    {!mentionsMode && Array.isArray(selectedBulkReadChatIds) && selectedBulkReadChatIds.length > 0 && (
                                        <>
                                            <button onClick={() => handleBulkSetReadState("read")} className="chat-action-button chat-button-mention-read">
                                                <CheckCheck size={16} />
                                                <span>Marcar como leído</span>
                                            </button>
                                            <button onClick={() => handleBulkSetReadState("unread")} className="chat-action-button chat-button-mark-unread">
                                                <CheckCheck size={16} />
                                                <span>Marcar como no leído</span>
                                            </button>
                                        </>
                                    )}
                                    {!mentionsDisabled && mentionsMode && Array.isArray(selectedMentionChatIds) && selectedMentionChatIds.length > 0 && (
                                        <button onClick={handleMarkMentionRead} className="chat-action-button chat-button-mention-read">
                                            <CheckCheck size={16} />
                                            <span>Marcar como leído</span>
                                        </button>
                                    )}
                                    {role !== 'USER' && (
                                        <button onClick={handleDeleteClick} className="chat-action-button chat-button-delete">
                                            <Trash2 size={16} />
                                            <span>Eliminar</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className='body-chat' ref={mensajesContainerRef}>
                                {timelineError && (
                                    <div className='contenedor-archivado contenedor-aviso-24h'>
                                        <p className='mensaje-archivado mensaje-aviso-24h'>
                                            {timelineError}
                                        </p>
                                    </div>
                                )}
                                {timelineLoadingMore && (
                                    <div className='timeline-loader'>
                                        <div className='loader2'></div>
                                    </div>
                                )}
                                {searchingConversacion && (
                                    <div className='timeline-loader'>
                                        <div className='loader2'></div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
                                            Buscando conversación {scrollToConversacion}...
                                        </span>
                                    </div>
                                )}
                                {renderItems.map((msj: any, index) => {
                                    const key = msj?.id ?? `${msj?.createdAt ?? "no-date"}-${index}`
                                    if (msj?.kind === "date_separator") {
                                        return (
                                            <div className='date-separator' key={key}>
                                                <span className='date-separator-label'>{msj.label}</span>
                                            </div>
                                        )
                                    }

                                    if (msj?.kind === "conversation_separator") {
                                        return (
                                            <div className='conversation-separator' key={key} id={`conv-sep-${msj.numero}`}>
                                                <span className='conversation-separator-label'>Conversación Número {msj.numero}</span>
                                            </div>
                                        )
                                    }
                                    const isEvent = msj?.kind === "event" || (msj?.type && (msj?.text !== undefined || msj?.payload !== undefined) && msj?.msg_entrada === undefined && msj?.msg_salida === undefined)
                                    if (isEvent) {
                                        const eventRenderKey = getTimelineKey(msj)
                                        if (debugTimeline && !renderedEventKeysRef.current.has(eventRenderKey)) {
                                            renderedEventKeysRef.current.add(eventRenderKey)
                                            debugSocketLog('timeline.event.rendered', {
                                                eventType: msj?.type ?? null,
                                                createdAt: msj?.createdAt ?? null,
                                                eventKey: eventRenderKey,
                                            })
                                        }
                                        if (msj?.type === "PRIVATE_NOTE_CREATED") {
                                            return (
                                                <div className='contenedor-nota-privada' key={key} id={msj?.id ? `event-${msj.id}` : undefined}>
                                                    <div className='mensaje-nota-privada'>
                                                        <span className='mensaje-nota-privada-text'>{resolveEventText(msj)}</span>
                                                        {msj?.payload?.imageUrl && (
                                                            <img
                                                                src={msj.payload.imageUrl}
                                                                alt="imagen nota privada"
                                                                className="chat-media-img"
                                                                style={{ maxWidth: '300px', borderRadius: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}
                                                                loading="lazy"
                                                                onClick={() => setDocPreview({ url: msj.payload.imageUrl, name: 'Imagen nota privada' })}
                                                            />
                                                        )}
                                                        {msj?.payload?.authorName && <span className='mensaje-nota-privada-author'>{formatAuthorName(msj.payload.authorName)}</span>}
                                                    </div>
                                                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                                </div>
                                            )
                                        }
                                        if (msj?.type === "MENTION_CREATED") {
                                            return (
                                                <div className='contenedor-nota-privada' key={key} id={msj?.id ? `event-${msj.id}` : undefined}>
                                                    <div className='mensaje-nota-privada'>
                                                        <span className='mensaje-nota-privada-text'>{resolveEventText(msj)}</span>
                                                        {msj?.payload?.text && (
                                                            <span className='mensaje-nota-privada-text' style={{ display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                                                                "{msj.payload.text}"
                                                            </span>
                                                        )}
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
                                                <div className='contenedor-nueva-conversacion' key={key}>
                                                    <p className='mensaje-nueva-conversacion'>{resolveEventText(msj)}</p>
                                                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                                </div>
                                            )
                                        }
                                        return (
                                            <div
                                                className='contenedor-archivado'
                                                key={key}
                                                id={msj?.id ? `event-${msj.id}` : undefined}
                                            >
                                                <p className='mensaje-archivado'>{resolveEventText(msj)}</p>
                                                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                            </div>
                                        )
                                    }
                                    if (msj?.msg_salida === '%archivado%') {
                                        return (
                                            <div className='contenedor-archivado' key={key}>
                                                <p className='mensaje-archivado'>Archivado</p>
                                                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                            </div>
                                        )
                                    }

                                    if (msj?.esNota && msj?.msg_salida) {
                                        return (
                                            <div className='contenedor-nota-privada' key={key}>
                                                <div className='mensaje-nota-privada'>
                                                    <span className='mensaje-nota-privada-text'>{msj.msg_salida}</span>
                                                </div>
                                                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={key} className={`${msj.msg_entrada ? 'contenedor-entrada' : 'contenedor-salida'}`}>
                                            <div className={`${msj.msg_entrada ? 'mensaje-entrada' : 'mensaje-salida'}`}>
                                                <MessageContent msg={msj} />
                                            </div>
                                            {!msj.msg_entrada && msj?.authorName && (
                                                <span className='mensaje-nota-privada-author'>{formatAuthorName(msj.authorName)}</span>
                                            )}
                                            <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                        </div>
                                    )
                                })}
                                {!condChat && (
                                    <div className='contenedor-archivado contenedor-aviso-24h'>
                                        <p className='mensaje-archivado mensaje-aviso-24h'>
                                            Como pasaron 24 horas del último mensaje recibido debes iniciar esta conversación con una plantilla, cuando te responda podrás conversar libremente.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {docPreview && (
                                <div className='doc-preview-overlay' onClick={() => setDocPreview(null)}>
                                    <div className='doc-preview-modal' onClick={(e) => e.stopPropagation()}>
                                        <div className='doc-preview-header'>
                                            <span className='doc-preview-title'>{docPreview.name}</span>
                                            <button className='doc-preview-close' onClick={() => setDocPreview(null)}>Cerrar</button>
                                        </div>
                                        <iframe src={docPreview.url} title={docPreview.name} className='doc-preview-iframe' />
                                    </div>
                                </div>
                            )}

                            <div className='footer-chat'>
                                {archivos.length > 0 && (
                                    <div className='w-full p-1 text-red-600 text-center text-sm flex items-center justify-center gap-2'>
                                        {archivos.length === 1 ? archivos[0].name : `${archivos.length} archivos seleccionados: ${archivos.map((f) => f.name).join(', ')}`}
                                        <button type='button' onClick={() => setArchivos([])} className='text-red-600 hover:text-red-800 font-bold'>✕</button>
                                    </div>
                                )}
                                {condChat ? (
                                    <form action="" className='enviar-msj gap-1 relative w-full' onSubmit={handleClickBtn}>
                                        <button type='button' className='btn-msg btn-nota-privada' onClick={handleNotaPrivada}>Nota Privada</button>
                                        <textarea
                                            placeholder='Escriba un mensaje'
                                            className='input-msg'
                                            value={mensaje}
                                            onChange={handleChangeText}
                                            onKeyDown={handleKeyDownText}
                                            onPaste={handlePasteInput}
                                            ref={mensajeInputRef}
                                            rows={1}
                                            style={{
                                                resize: 'none',
                                                overflowY: 'auto',
                                                maxHeight: '120px',
                                                lineHeight: '1.5rem',
                                            }}
                                        />
                                        <button type='button' onClick={handleClickFile}>
                                            <IoIosAttach size={25} className='text-gray-700 cursor-pointer' />
                                        </button>
                                        <input type="file" accept="application/pdf, image/jpeg, image/png, image/webp, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" id="fileInput" ref={fileInputRef} style={{ display: "none" }} multiple onChange={handleAddFile} />
                                        {qrOpen && (
                                            <ul className="absolute bottom-12 left-2 w-96 max-h-60 overflow-y-auto z-10 [&::-webkit-scrollbar]:hidden rounded-xl bg-slate-50/95 backdrop-blur-sm shadow-lg ring-1 ring-slate-200">
                                                {qrFiltered.length ? (
                                                    qrFiltered.map((qr, idx) => (
                                                        <li key={qr.id} onMouseDown={(e) => { e.preventDefault(); insertQuickResponse(qr) }} className={`px-3 py-2 cursor-pointer text-slate-700 text-left hover:bg-indigo-50 hover:text-slate-900 transition-colors ${idx === qrActiveIndex ? 'bg-indigo-50 text-slate-900' : ''}`}>
                                                            <div className="font-semibold">/{qr.shortcut}</div>
                                                            <div className="text-xs text-slate-500 truncate">{qr.text}</div>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-3 py-2 text-gray-400">No hay coincidencias</li>
                                                )}
                                            </ul>
                                        )}
                                        <button type='button' className='btn-msg btn-plantilla' onClick={() => dispatch(switchModalPlantilla())}>Plantilla</button>
                                        <button type='submit' className='btn-msg' disabled={isSendingRef.current}>Enviar</button>
                                    </form>
                                ) : (
                                    <div className='no-chat'>
                                        <button type='button' className='btn-msg btn-nota-privada' onClick={handleNotaPrivada}>Nota Privada</button>
                                        <textarea
                                            placeholder='Escribir nota privada...'
                                            className='input-msg'
                                            value={mensaje}
                                            onChange={handleChangeText}
                                            onPaste={handlePasteInput}
                                            ref={mensajeInputRef}
                                            rows={1}
                                            style={{
                                                resize: 'none',
                                                overflowY: 'auto',
                                                maxHeight: '120px',
                                                lineHeight: '1.5rem',
                                            }}
                                        />
                                        <button onClick={() => dispatch(switchModalPlantilla())} className="btn flex gap-2 rounded-xl cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 shadow transition duration-200">
                                            Enviar plantilla
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel de información lateral colapsable */}
                        <div className={`chat-info-panel ${infoPanelOpen ? 'chat-info-panel--open' : 'chat-info-panel--closed'}`}>
                            {/* Botón colapsar/expandir */}
                            <button
                                className='chat-info-panel-toggle'
                                onClick={() => setInfoPanelOpen(!infoPanelOpen)}
                                title={infoPanelOpen ? 'Colapsar panel' : 'Expandir panel'}
                            >
                                {infoPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                            </button>

                            {infoPanelOpen && (
                                <div className='chat-info-panel-content'>
                                    <div className='chat-info-panel-header'>
                                        <h3>Información del Chat</h3>
                                    </div>

                                    <div className='chat-info-panel-body'>
                                        {/* Etiquetas */}
                                        <div className='chat-info-panel-section'>
                                            <div className='chat-info-panel-section-title'>
                                                <span>Etiquetas</span>
                                                {!tagsDisabled && (
                                                    <button
                                                        className='chat-info-panel-add-tag'
                                                        onClick={() => setIsAddTagModalOpen(true)}
                                                        title='Agregar etiqueta'
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className='chat-tags-panel'>
                                                {tagsDisabled ? (
                                                    <span className='chat-info-empty'>Temporalmente deshabilitada</span>
                                                ) : chatTags && chatTags.length > 0 ? (
                                                    chatTags.map(tag => (
                                                        <p key={tag.id} className='chat-tag'>
                                                            {tag.nombre}
                                                            <span className='chat-tag-close' onClick={() => handleTagRemoveClick(tag)} style={{ cursor: 'pointer' }}>×</span>
                                                        </p>
                                                    ))
                                                ) : (
                                                    <span className='chat-info-empty'>Sin etiquetas</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Datos del afiliado */}
                                        <div className='chat-info-panel-section'>
                                            <div className='chat-info-panel-section-title'>Datos del Afiliado</div>
                                            <div className='chat-info-panel-rows'>
                                                {dataUser?.mail && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Email</span>
                                                        <span className='chat-info-panel-value'>{dataUser.mail}</span>
                                                    </div>
                                                )}
                                                {dataUser?.celular && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Teléfono</span>
                                                        <span className='chat-info-panel-value'>{dataUser.celular}</span>
                                                    </div>
                                                )}
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Tipo Alta/Baja</span>
                                                    <span className='chat-info-panel-value'>Sin Datos</span>
                                                </div>
                                                {dataUser?.planAfiliado && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Plan</span>
                                                        <span className='chat-info-panel-value'>{dataUser.planAfiliado}</span>
                                                    </div>
                                                )}
                                                {dataUser?.provinciaDom && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Provincia</span>
                                                        <span className='chat-info-panel-value'>{dataUser.provinciaDom}</span>
                                                    </div>
                                                )}
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Vía Clínica</span>
                                                    <span className='chat-info-panel-value'>Sin Datos</span>
                                                </div>
                                                {dataUser?.CUILTitular && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>CUIL</span>
                                                        <span className='chat-info-panel-value'>{dataUser.CUILTitular}</span>
                                                    </div>
                                                )}
                                                {dataUser?.IdAfiliadoTitular && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Id Titular</span>
                                                        <span className='chat-info-panel-value'>{dataUser.IdAfiliadoTitular}</span>
                                                    </div>
                                                )}
                                                {dataUser?.mesAlta && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Fecha Alta</span>
                                                        <span className='chat-info-panel-value'>{dataUser.mesAlta}</span>
                                                    </div>
                                                )}
                                                {dataUser?.OSAndes && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Obra Social</span>
                                                        <span className='chat-info-panel-value'>{dataUser.OSAndes}</span>
                                                    </div>
                                                )}
                                                {dataUser?.localidadDom && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>Localidad</span>
                                                        <span className='chat-info-panel-value'>{dataUser.localidadDom}</span>
                                                    </div>
                                                )}
                                                {dataUser?.CUILTitular && (
                                                    <div className='chat-info-panel-row'>
                                                        <span className='chat-info-panel-label'>DNI</span>
                                                        <span className='chat-info-panel-value'>{dataUser.CUILTitular.toString().slice(2, -1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Datos del chat */}
                                        <div className='chat-info-panel-section'>
                                            <div className='chat-info-panel-section-title'>Datos del Chat</div>
                                            <div className='chat-info-panel-rows'>
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Canal</span>
                                                    <span className='chat-info-panel-value'>WhatsApp</span>
                                                </div>
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Estado</span>
                                                    <span className='chat-info-panel-value'>Abierto</span>
                                                </div>
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>ChatBot</span>
                                                    <span className='chat-info-panel-value'>Sin Datos</span>
                                                </div>
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Departamento</span>
                                                    <span className='chat-info-panel-value'>Sin Datos</span>
                                                </div>
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Asignado</span>
                                                    <span className='chat-info-panel-value'>
                                                        {operador ? `${operador.nombre} ${operador.apellido}` : 'Sin asignar'}
                                                    </span>
                                                </div>
                                                <div className='chat-info-panel-row'>
                                                    <span className='chat-info-panel-label'>Zoho Ticket</span>
                                                    <span className='chat-info-panel-value'>Sin Datos</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <PlantillaModal />
                    <UserSearchModal />
                    <ArchiveModal isOpen={isArchiveModalOpen} onClose={handleArchivarCancel} onConfirm={handleArchivarConfirm} />
                    <DeleteModal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} />
                    <ErrorModal isOpen={isErrorModalOpen} onClose={() => { setIsErrorModalOpen(false); setErrorModalMessage('') }} title="Atención" message={errorModalMessage || 'Debe escribir un mensaje'} />
                    <SuccessModal isOpen={showMentionReadSuccess} onClose={() => setShowMentionReadSuccess(false)} title="Listo" message={mentionReadSuccessMsg} />
                    {!mentionsDisabled && (
                        <MentionModal
                            isOpen={isMentionModalOpen}
                            usuarios={usuarios}
                            onClose={() => setIsMentionModalOpen(false)}
                            onConfirm={handleMentionConfirm}
                        />
                    )}
                    {!tagsDisabled && <AddTagModal isOpen={isAddTagModalOpen} onClose={() => setIsAddTagModalOpen(false)} onConfirm={handleTagConfirm} chatId={id} />}
                    {!tagsDisabled && <RemoveTagFromChatModal isOpen={isRemoveTagModalOpen} onClose={() => { setIsRemoveTagModalOpen(false); setTagToRemove(null) }} tag={tagToRemove} chatId={id} onSuccess={handleRemoveTagSuccess} />}
                </div>
            )}
        </div>
    )
}

export default Chats


