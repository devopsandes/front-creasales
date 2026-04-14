import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { findChatTimeline, getChats, getUserData, setChatBotState } from '../../services/chats/chats.services'
import { TimelineItem } from '../../interfaces/chats.interface'
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

const Chats = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [selectedMentionUser, setSelectedMentionUser] = useState<Usuario | null>(null)
    const [mensajes, setMensajes] = useState<TimelineItem[]>([])
    const [timelineCursor, setTimelineCursor] = useState<string | null>(null)
    const [timelineHasMore, setTimelineHasMore] = useState<boolean>(false)
    const [timelineLoadingMore, setTimelineLoadingMore] = useState<boolean>(false)
    const [docPreview, setDocPreview] = useState<{ url: string; name: string } | null>(null)
    const [mensaje, setMensaje] = useState<string>('')
    const [condChat, setCondChat] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [archivos, setArchivos] = useState<File[]>([])
    const [showList, setShowList] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<Usuario[]>([]);
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

    const isSendingRef = useRef(false)
    const lastSentMessageRef = useRef<string | null>(null)
    const uploadPreviewUrlsRef = useRef<Record<string, string>>({})

    const MAX_FILES_PER_MESSAGE = 5

    const token = localStorage.getItem('token') || ''
    const role = localStorage.getItem('role') || ''

    const location = useLocation()
    const navigate = useNavigate()

    const id = useParams().id
    const queryParams = new URLSearchParams(location.search);
    const telefono = queryParams.get('telefono');
    const nombre = queryParams.get('nombre');

    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    const scrollRestoreRef = useRef<{ height: number; top: number } | null>(null)
    const dispatch = useDispatch()
    const dataUser = useSelector((state: RootState) => state.action.dataUser)
    const mentionsMode = useSelector((state: RootState) => state.action.mentionsMode)
    const selectedMentionChatIds = useSelector((state: RootState) => state.action.selectedMentionChatIds)
    const selectedBulkReadChatIds = useSelector((state: RootState) => state.action.selectedBulkReadChatIds)
    const chats = useSelector((state: RootState) => state.action.chats)
    const chatListFilters = useSelector((state: RootState) => state.action.chatListFilters)
    const currentChat = chats.find(chat => chat.id === id)
    const chatTags: ChatTag[] = currentChat?.tags || []
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
        if (it?.kind === "event" || it?.kind === "message") return it
        if (it?.type && it?.text !== undefined) return { ...it, kind: "event" as const }
        if (it?.msg_entrada !== undefined || it?.msg_salida !== undefined) return { ...it, kind: "message" as const }
        return it
    }

    const getTimelineKey = (it: any) => {
        const id = it?.id
        if (id) return `id:${id}`
        const createdAt = it?.createdAt ?? ''
        const kind = it?.kind ?? (it?.type ? 'event' : 'message')
        const msgIn = it?.msg_entrada ?? ''
        const msgOut = it?.msg_salida ?? ''
        const text = it?.text ?? ''
        return `k:${kind}|t:${createdAt}|in:${msgIn}|out:${msgOut}|text:${text}`
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
            case "CHAT_ASSIGNED": {
                const nombre = evt?.payload?.operador?.nombre ?? evt?.payload?.operator?.nombre ?? evt?.payload?.user?.nombre
                const apellido = evt?.payload?.operador?.apellido ?? evt?.payload?.operator?.apellido ?? evt?.payload?.user?.apellido
                const fullName = [nombre, apellido].filter(Boolean).join(" ").trim()
                return fullName ? `Esta conversación fue asignada a ${fullName}` : "Esta conversación fue asignada"
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

    const toTitleCase = (value: any) => {
        if (!value || typeof value !== 'string') return ''
        return value.trim().toLowerCase().split(/\s+/).filter(Boolean).map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
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
    type RenderItem = TimelineItem | DateSeparator

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const toDayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
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
        let prevKey: string | null = null
        for (const it of items) {
            const d = new Date((it as any)?.createdAt)
            if (Number.isNaN(d.getTime())) { out.push(it); continue }
            const key = toDayKey(d)
            if (key !== prevKey) {
                out.push({ kind: "date_separator", id: `sep-${key}`, createdAt: it.createdAt, label: formatDayLabel(d) })
                prevKey = key
            }
            out.push(it)
        }
        return out
    }

    const renderItems = useMemo(() => withDateSeparators(mensajes), [mensajes])
    const debugTimeline = import.meta.env.DEV && localStorage.getItem("debugTimeline") === "1"

    const handleNotaPrivada = async () => {
        if ((!mensaje || mensaje.trim().length === 0) && archivos.length === 0) {
            setErrorModalMessage('Debe escribir una nota o pegar una imagen')
            setIsErrorModalOpen(true)
            return
        }
        const socket = getSocket()
        if (socket && socket.connected) {
            const payload: any = {
                chatId: id,
                mensaje: mensaje.trim() || null,
                token,
                mentions: selectedMentionUser ? [{ userId: selectedMentionUser.id }] : []
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
            setSelectedMentionUser(null)
            socket.emit("nota-privada", payload, (ack: any) => {
                if (debugTimeline) console.log("[nota-privada ACK]", ack)
            })
        }
    }

    const handleMarkMentionRead = async () => {
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
        dispatch(connectSocket())
        const socket = getSocket()
        setLoading(true)
        socket?.emit('register', telefono)
        if (id) socket?.emit('join-chat', id)
        return () => { }
    }, [dispatch, telefono, id])

    useEffect(() => {
        const socket = getSocket()
        if (!socket || !id) return
        const messageEventName = `new-message-${id}`
        const chatEventName = `chat-event-${id}`
        const handleConnect = () => { socket.emit('join-chat', id) }
        const handleDisconnect = (_reason: any) => { }
        const handleConnectError = (_err: any) => { }
        const handleArchivarAck = (_data: any) => { }
        const handleNotaPrivadaAck = (_data: any) => { }
        const handleAny = (eventName: string, ...args: any[]) => {
            if (!debugTimeline) return
            const shouldLog = eventName === chatEventName || eventName === messageEventName || eventName === "archivar-ack" || eventName === "nota-privada-ack" || eventName === "error" || eventName.toLowerCase().includes("chat-event") || eventName.toLowerCase().includes("new-message")
            if (shouldLog) console.log("[socket] onAny", eventName, ...args)
        }
        const handleNewMessage = (mensaje: any) => {
            const item: TimelineItem = { ...mensaje, kind: "message" as const }
            setCondChat(menos24hs(new Date(mensaje.createdAt)))
            setMensajes(prev => { const merged = mergeTimeline(prev, [item], 'append'); return merged.length > 1000 ? merged.slice(-1000) : merged })
        }
        const handleChatEvent = (evt: any) => {
            setMensajes(prev => { const merged = mergeTimeline(prev, [normalizeTimelineItem(evt)], 'append'); return merged.length > 1000 ? merged.slice(-1000) : merged })
        }
        const handleError = (error: any) => {
            if (error?.name === 'TokenExpiredError') { dispatch(openSessionExpired()); return }
        }
        socket.on("connect", handleConnect)
        socket.on("disconnect", handleDisconnect)
        socket.on("connect_error", handleConnectError)
        socket.on("archivar-ack", handleArchivarAck)
        socket.on("nota-privada-ack", handleNotaPrivadaAck)
        socket.onAny(handleAny)
        socket.on(messageEventName, handleNewMessage)
        socket.on(chatEventName, handleChatEvent)
        socket.on('error', handleError)
        socket.emit('join-chat', id)
        return () => {
            socket.emit('leave-chat', id)
            socket.off("connect", handleConnect)
            socket.off("disconnect", handleDisconnect)
            socket.off("connect_error", handleConnectError)
            socket.off("archivar-ack", handleArchivarAck)
            socket.off("nota-privada-ack", handleNotaPrivadaAck)
            socket.offAny(handleAny)
            socket.off(messageEventName, handleNewMessage)
            socket.off(chatEventName, handleChatEvent)
            socket.off('error', handleError)
        }
    }, [id, dispatch])

    useEffect(() => {
        const inicio = async () => {
            if (!id) return
            setTimelineCursor(null)
            setTimelineHasMore(false)
            const data = await findChatTimeline(token!, id!, { limit: 200 })
            if (data.statusCode === 401) { dispatch(openSessionExpired()); return }
            const rawItems: any[] = (data as any).items || []
            const items = rawItems.map(normalizeTimelineItem).sort((a, b) => {
                const ta = new Date((a as any)?.createdAt ?? 0).getTime()
                const tb = new Date((b as any)?.createdAt ?? 0).getTime()
                return ta - tb
            })
            setMensajes(items)
            setTimelineCursor((data as any)?.nextCursor ?? null)
            setTimelineHasMore(Boolean((data as any)?.hasMore))
            const lastMessage = [...items].reverse().find((x: any) => x && x.kind === "message")
            if (lastMessage?.createdAt) { setCondChat(menos24hs(new Date(lastMessage.createdAt))) }
            else { setCondChat(false) }
            setLoading(false)
        }
        inicio()
    }, [id, token])

    const loadOlderTimeline = async () => {
        if (!id || !token) return
        if (!timelineHasMore || !timelineCursor || timelineLoadingMore) return
        const container = mensajesContainerRef.current
        if (container) { scrollRestoreRef.current = { height: container.scrollHeight, top: container.scrollTop } }
        setTimelineLoadingMore(true)
        try {
            const data = await findChatTimeline(token!, id!, { limit: 200, cursor: timelineCursor })
            if (data.statusCode === 401) { dispatch(openSessionExpired()); return }
            const rawItems: any[] = (data as any).items || []
            const items = rawItems.map(normalizeTimelineItem).sort((a, b) => {
                const ta = new Date((a as any)?.createdAt ?? 0).getTime()
                const tb = new Date((b as any)?.createdAt ?? 0).getTime()
                return ta - tb
            })
            setMensajes((prev) => mergeTimeline(prev, items, 'prepend'))
            setTimelineCursor((data as any)?.nextCursor ?? null)
            setTimelineHasMore(Boolean((data as any)?.hasMore))
        } finally {
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
    }, [timelineHasMore, timelineCursor, timelineLoadingMore, id, token])

    useEffect(() => {
        if (mensajesContainerRef.current) { mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight }
    }, [mensajes])

    useEffect(() => {
        const run = async () => {
            if (!token) return
            const resp = await getQuickResponses(token, { page: 1, limit: 200 })
            if ((resp as any)?.statusCode === 401) { dispatch(openSessionExpired()); return }
            const list = Array.isArray((resp as any)?.items) ? (resp as any).items : []
            setQuickResponses(list)
        }
        run().catch(() => { })
    }, [token])

    useEffect(() => {
        const el = mensajeInputRef.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
        }
    }, [mensaje])

    const handleTagConfirm = async (_tagId: string) => {
        try {
            const chatos = await getChats(token, '1', '100', chatListFilters)
            const incoming = Array.isArray((chatos as any)?.chats) ? (chatos as any).chats : []
            dispatch(setChats(incoming))
        } catch (error) { console.error('Error refreshing chats after tag assignment:', error) }
    }

    const handleTagRemoveClick = (tag: ChatTag) => {
        setTagToRemove(tag)
        setIsRemoveTagModalOpen(true)
    }

    const handleRemoveTagSuccess = async () => {
        try {
            const chatos = await getChats(token, '1', '100', chatListFilters)
            const incoming = Array.isArray((chatos as any)?.chats) ? (chatos as any).chats : []
            dispatch(setChats(incoming))
        } catch (error) { console.error('Error refreshing chats:', error) }
    }

    const handleClickBtn = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()
            const trimmedMessage = mensaje.trim()
            const hasFiles = archivos.length > 0
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
                    if (socket && socket.connected) { socket.emit("enviar-mensaje", { mensaje: trimmedMessage, chatId: id, telefono, token }) }
                    else { await axios.post(`${import.meta.env.VITE_URL_BACK}/api/v1/chats/send-message`, { chatId: id, text: trimmedMessage }, { headers: { Authorization: `Bearer ${token}` } }) }
                    lastSentMessageRef.current = trimmedMessage
                    setMensaje("")
                }
                for (const { item, file } of uploadQueue) {
                    const formData = new FormData()
                    formData.append("chatId", id)
                    formData.append("file", file)
                    try { await axios.post(`${import.meta.env.VITE_URL_BACK}/api/v1/chats/send-message`, formData, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }) }
                    catch (err) { toast.error(`No se pudo subir ${file.name}`) }
                    finally { removeOptimistic(item.id) }
                }
                setArchivos([])
                isSendingRef.current = false
                return
            }
            if (socket && socket.connected) {
                socket.emit("enviar-mensaje", { mensaje, chatId: id, telefono, token })
                lastSentMessageRef.current = trimmedMessage
                setMensaje('')
                setArchivos([])
                isSendingRef.current = false
            } else {
                await axios.post(`${import.meta.env.VITE_URL_BACK}/api/v1/chats/send-message`, { chatId: id, text: mensaje }, { headers: { Authorization: `Bearer ${token}` } })
                setMensaje('')
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
                const refreshTimeline = async () => {
                    try {
                        if (!id) return
                        const data = await findChatTimeline(token!, id!, { limit: 200 })
                        if (data.statusCode === 401) { dispatch(openSessionExpired()); return }
                        const rawItems: any[] = (data as any).items || []
                        const items = rawItems.map(normalizeTimelineItem).sort((a, b) => new Date((a as any)?.createdAt ?? 0).getTime() - new Date((b as any)?.createdAt ?? 0).getTime())
                        setMensajes(items)
                        setTimelineCursor((data as any)?.nextCursor ?? null)
                        setTimelineHasMore(Boolean((data as any)?.hasMore))
                    } catch (e) { }
                }
                socket.emit("archivar", objMsj, (ack: any) => { if (ack?.ok) { refreshTimeline() } })
                refreshTimeline()
                setTimeout(refreshTimeline, 800)
            }
            setIsArchiveModalOpen(false);
        } catch (error) { console.log(error); }
    }

    const handleArchivarCancel = () => { setIsArchiveModalOpen(false); }
    const handleDeleteClick = () => { setIsDeleteModalOpen(true); }

    const handleDeleteConfirm = async () => {
        try {
            if (!id) return
            const url = `${import.meta.env.VITE_URL_BACKEND}/chats/${id}/messages`
            const response = await axios.delete(url, { headers: { authorization: `Bearer ${token}` } })
            if (response.status === 200 || response.status === 204) {
                toast.success('Chat eliminado correctamente');
                setIsDeleteModalOpen(false);
                setMensajes([]); setMensaje(''); setArchivos([]); setCondChat(false)
                dispatch(clearMentionChatSelection()); dispatch(clearBulkReadChatSelection())
                try {
                    const chatos = await getChats(token, '1', '100', chatListFilters)
                    if ((chatos as any)?.statusCode === 401) { dispatch(openSessionExpired()) }
                    else if (Array.isArray((chatos as any)?.chats)) {
                        const incoming = (chatos as any).chats as any[]
                        const base = Array.isArray(chats) ? chats.filter((c: any) => c?.id !== id) : []
                        const map = new Map<string, any>()
                        base.forEach((c: any) => { if (c?.id) map.set(c.id, c) })
                        incoming.forEach((c: any) => { if (c?.id) map.set(c.id, c) })
                        const merged = Array.from(map.values()).sort((a: any, b: any) => {
                            const aMs = new Date(a?.lastMessageAt || a?.updatedAt || a?.createdAt || 0).getTime()
                            const bMs = new Date(b?.lastMessageAt || b?.updatedAt || b?.createdAt || 0).getTime()
                            if (aMs !== bMs) return bMs - aMs
                            return `${b?.id ?? ""}`.localeCompare(`${a?.id ?? ""}`)
                        })
                        dispatch(setChats(merged))
                    }
                } catch { }
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
        if (slashMatch) {
            const q = (slashMatch[1] || '').toLowerCase()
            const start = caretPos - slashMatch[0].length
            const end = caretPos
            const norm = (s: string) => (s || '').toLowerCase()
            const filtered = quickResponses.filter((qr) => { const a = norm(qr.shortcut); const b = norm(qr.text); if (!q) return true; return a.includes(q) || b.includes(q) })
            setQrTriggerRange({ start, end })
            setQrFiltered(filtered)
            setQrActiveIndex(0)
            setQrOpen(true)
            setShowList(false)
            return
        } else { closeQuickMenu() }
        const match = value.match(/@([^\s@]*)$/);
        if (match) {
            const query = (match[1] || '').toLowerCase();
            const normalize = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const q = normalize(query)
            const results = usuarios.filter((u) => { const full = normalize(`${u.nombre ?? ''} ${u.apellido ?? ''}`.trim()); if (!q) return true; return full.includes(q) })
            setFilteredUsers(results);
            setShowList(true);
        } else { setShowList(false); }
    }

    const handleSelectUser = (user: any) => {
        const toHandle = (u: Usuario) => (u?.nombre || 'usuario').trim().toLowerCase().replace(/\s+/g, '')
        const handle = toHandle(user)
        setMensaje((prev) => prev.replace(/@([^\s@]*)$/, `@${handle} `));
        setSelectedMentionUser(user as Usuario)
        setShowList(false);
    };

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
                                    {mentionsMode && Array.isArray(selectedMentionChatIds) && selectedMentionChatIds.length > 0 && (
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
                                {timelineLoadingMore && (
                                    <div className='timeline-loader'>
                                        <div className='loader2'></div>
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
                                    const isEvent = msj?.kind === "event" || (msj?.type && msj?.text !== undefined && msj?.msg_entrada === undefined && msj?.msg_salida === undefined)
                                    if (isEvent) {
                                        if (msj?.type === "PRIVATE_NOTE_CREATED") {
                                            return (
                                                <div className='contenedor-nota-privada' key={key}>
                                                    <div className='mensaje-nota-privada'>
                                                        <span className='mensaje-nota-privada-text'>{resolveEventText(msj)}</span>
                                                        {msj?.payload?.imageUrl && (
                                                            <img
                                                                src={msj.payload.imageUrl}
                                                                alt="imagen nota privada"
                                                                className="chat-media-img"
                                                                style={{ maxWidth: '300px', borderRadius: '0.5rem', marginTop: '0.5rem' }}
                                                                loading="lazy"
                                                            />
                                                        )}
                                                        {msj?.payload?.authorName && <span className='mensaje-nota-privada-author'>{formatAuthorName(msj.payload.authorName)}</span>}
                                                    </div>
                                                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                                </div>
                                            )
                                        }
                                        return (
                                            <div className='contenedor-archivado' key={key}>
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
                                    return (
                                        <div key={key} className={`${msj.msg_entrada ? 'contenedor-entrada' : 'contenedor-salida'}`}>
                                            <div className={`${msj.msg_entrada ? 'mensaje-entrada' : 'mensaje-salida'}`}>
                                                <MessageContent msg={msj} />
                                            </div>
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
                                        {showList && (
                                            <ul className="absolute bottom-12 left-2 w-80 max-h-48 overflow-y-auto z-10 [&::-webkit-scrollbar]:hidden rounded-xl bg-slate-50/95 backdrop-blur-sm shadow-lg ring-1 ring-slate-200">
                                                {filteredUsers.length ? (
                                                    filteredUsers.map((user) => (
                                                        <li key={user.id} onClick={() => handleSelectUser(user)} className="px-3 py-2 cursor-pointer text-slate-700 text-left whitespace-nowrap overflow-hidden text-ellipsis hover:bg-indigo-50 hover:text-slate-900 transition-colors">
                                                            @{(user.nombre || '').toLowerCase().replace(/\s+/g, '')}{" "}
                                                            <span className="text-gray-500">— {toTitleCase(user.apellido)} {toTitleCase(user.nombre)}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-3 py-2 text-gray-400">No hay coincidencias</li>
                                                )}
                                            </ul>
                                        )}
                                        <button type='button' className='btn-msg btn-plantilla' onClick={() => dispatch(switchModalPlantilla())}>Plantilla</button>
                                        <button type='button' className='btn-msg btn-nota-privada' onClick={handleNotaPrivada}>Nota Privada</button>
                                        <button type='submit' className='btn-msg' disabled={isSendingRef.current}>Enviar</button>
                                    </form>
                                ) : (
                                    <div className='no-chat'>
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
                                                <button
                                                    className='chat-info-panel-add-tag'
                                                    onClick={() => setIsAddTagModalOpen(true)}
                                                    title='Agregar etiqueta'
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <div className='chat-tags-panel'>
                                                {chatTags && chatTags.length > 0 ? (
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
                    <AddTagModal isOpen={isAddTagModalOpen} onClose={() => setIsAddTagModalOpen(false)} onConfirm={handleTagConfirm} chatId={id} />
                    <RemoveTagFromChatModal isOpen={isRemoveTagModalOpen} onClose={() => { setIsRemoveTagModalOpen(false); setTagToRemove(null) }} tag={tagToRemove} chatId={id} onSuccess={handleRemoveTagSuccess} />
                </div>
            )}
        </div>
    )
}

export default Chats
