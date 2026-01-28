import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { findChatTimeline, getUserData } from '../../services/chats/chats.services'
import { TimelineItem } from '../../interfaces/chats.interface'
import { formatCreatedAt, menos24hs } from '../../utils/functions'
import { getSocket, connectSocket } from '../../app/slices/socketSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../app/store'
import UserSearchModal from '../../components/modal/UserSearchModal'
import ArchiveModal from '../../components/modal/ArchiveModal'
import DeleteModal from '../../components/modal/DeleteModal'
import ErrorModal from '../../components/modal/ErrorModal'
import ChatInfoDropdown from '../../components/dropdown/ChatInfoDropdown'
import { FaFileArrowDown } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { CheckCheck, Trash2 } from "lucide-react";
import { openModal, setUserData, setViewSide, switchModalPlantilla, openSessionExpired, clearMentionChatSelection } from '../../app/slices/actionSlice'
import { ChatTag } from '../../interfaces/chats.interface'
import { IoIosAttach } from "react-icons/io";
/* import { FaMicrophone } from "react-icons/fa"; */
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






const Chats = () => {
    const [usuarios,setUsuarios] = useState<Usuario[]>([])
    const [selectedMentionUser, setSelectedMentionUser] = useState<Usuario | null>(null)
    const [mensajes, setMensajes] = useState<TimelineItem[]>([])
    const [mensaje, setMensaje] = useState<string>('')
    const [condChat, setCondChat] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [archivo, setArchivo] = useState<File | null>(null);
    const [showList, setShowList] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<Usuario[]>([]);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [showMentionReadSuccess, setShowMentionReadSuccess] = useState(false)
    const [mentionReadSuccessMsg, setMentionReadSuccessMsg] = useState<string>('El chat fue marcado como leído exitosamente.')

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const mensajeInputRef = useRef<HTMLInputElement | null>(null);
    const [quickResponses,setQuickResponses] = useState<QuickResponse[]>([])
    const [qrOpen,setQrOpen] = useState(false)
    const [qrFiltered,setQrFiltered] = useState<QuickResponse[]>([])
    const [qrActiveIndex,setQrActiveIndex] = useState(0)
    const [qrTriggerRange,setQrTriggerRange] = useState<{start:number;end:number}|null>(null)



    const token = localStorage.getItem('token') || ''
    const role = localStorage.getItem('role') || ''

    const location = useLocation()
    
   
    const id = useParams().id 
    const queryParams = new URLSearchParams(location.search);
    const telefono = queryParams.get('telefono');
    const nombre = queryParams.get('nombre');

  

    // Referencia para el contenedor de mensajes
    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    const dispatch = useDispatch()
    const dataUser = useSelector((state: RootState) => state.action.dataUser)
    const mentionsMode = useSelector((state: RootState) => state.action.mentionsMode)
    const selectedMentionChatIds = useSelector((state: RootState) => state.action.selectedMentionChatIds)
    const selectedBulkReadChatIds = useSelector((state: RootState) => state.action.selectedBulkReadChatIds)
    const chats = useSelector((state: RootState) => state.action.chats)
    const currentChat = chats.find(chat => chat.id === id)
    const chatTags: ChatTag[] = currentChat?.tags || []

    const normalizeTimelineItem = (raw: any): TimelineItem => {
        // algunos backends envuelven el payload
        const it = raw?.item ?? raw?.event ?? raw

        if (it?.kind === "event" || it?.kind === "message") return it

        // Evento “nuevo” pero sin kind (caso típico: {type, text, createdAt, ...})
        if (it?.type && it?.text !== undefined) {
            return { ...it, kind: "event" as const }
        }

        // Mensaje legacy sin kind (msg_entrada / msg_salida)
        if (it?.msg_entrada !== undefined || it?.msg_salida !== undefined) {
            return { ...it, kind: "message" as const }
        }

        // fallback: si no se puede inferir, lo dejamos como viene
        return it
    }

    const resolveEventText = (evt: any): string => {
        const text = `${evt?.text ?? ""}`.trim()
        if (text) return text

        // Fallbacks defensivos por tipo, por si el backend aún no envía `text`
        switch (evt?.type) {
            case "CHAT_ASSIGNED": {
                const nombre =
                    evt?.payload?.operador?.nombre ??
                    evt?.payload?.operador?.name ??
                    evt?.payload?.operator?.nombre ??
                    evt?.payload?.operator?.name ??
                    evt?.payload?.user?.nombre ??
                    evt?.payload?.user?.name
                const apellido =
                    evt?.payload?.operador?.apellido ??
                    evt?.payload?.operator?.apellido ??
                    evt?.payload?.user?.apellido
                const fullName = [nombre, apellido].filter(Boolean).join(" ").trim()
                return fullName
                    ? `Esta conversación fue asignada a ${fullName}`
                    : "Esta conversación fue asignada"
            }
            case "TAG_ASSIGNED": {
                const tagName =
                    evt?.payload?.tag?.nombre ??
                    evt?.payload?.tagName ??
                    evt?.payload?.nombreTag
                return tagName ? `Se asignó la etiqueta ${tagName}` : "Se asignó una etiqueta"
            }
            default:
                return evt?.type ? `${evt.type}` : "Evento"
        }
    }

    const formatAuthorName = (value: any) => {
        if (!value || typeof value !== 'string') return ''
        return value
            .toLowerCase()
            .split(' ')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
    }

    const toTitleCase = (value: any) => {
        if (!value || typeof value !== 'string') return ''
        return value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
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
            const isPdf = fileName.toLowerCase().endsWith(".pdf")

            return (
                <div className="chat-media-doc">
                    {isPdf && (
                        <iframe
                            src={url}
                            title={fileName}
                            className="chat-media-iframe"
                        />
                    )}
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="chat-media-link"
                    >
                        Abrir / Descargar {isPdf ? "PDF" : "documento"}
                    </a>
                </div>
            )
        }

        if (msg?.type === "audio") {
            const url = getMediaUrl(msg?.audioUrl)
            if (!url) return <span className="chat-text">{fallbackText}</span>
            return (
                <div className="chat-media-audio">
                    <audio controls src={url} className="chat-media-audio-player" />
                    {!!msg?.traduccion && (
                        <div className="chat-media-transcripcion">{msg.traduccion}</div>
                    )}
                </div>
            )
        }

        return <span className="chat-text">{fallbackText}</span>
    }

    type DateSeparator = {
        kind: "date_separator";
        id: string;
        createdAt: string | Date;
        label: string;
    }

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

        return new Intl.DateTimeFormat("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(d0)
    }

    const withDateSeparators = (items: TimelineItem[]): RenderItem[] => {
        const out: RenderItem[] = []
        let prevKey: string | null = null

        for (const it of items) {
            const d = new Date((it as any)?.createdAt)
            if (Number.isNaN(d.getTime())) {
                out.push(it)
                continue
            }

            const key = toDayKey(d)
            if (key !== prevKey) {
                out.push({
                    kind: "date_separator",
                    id: `sep-${key}`,
                    createdAt: it.createdAt,
                    label: formatDayLabel(d),
                })
                prevKey = key
            }

            out.push(it)
        }

        return out
    }

    const renderItems = useMemo(() => withDateSeparators(mensajes), [mensajes])

    const debugTimeline =
        import.meta.env.DEV && localStorage.getItem("debugTimeline") === "1"

    const handleNotaPrivada = () => {
        if (!mensaje || mensaje.trim().length === 0) {
            setErrorModalMessage('Debe escribir una nota')
            setIsErrorModalOpen(true)
            return
        }

        const socket = getSocket()
        if (socket && socket.connected) {
            // Backward-compatible: el backend actual puede ignorar `mentions`.
            const payload: any = {
                chatId: id,
                mensaje,
                token,
                mentions: selectedMentionUser ? [{ userId: selectedMentionUser.id }] : [],
            }
            console.log("[mentions][nota-privada] mensaje:", mensaje)
            console.log("[mentions][nota-privada] selectedMentionUser:", selectedMentionUser)
            console.log("[mentions][nota-privada] payload.mentions:", payload.mentions)
            setMensaje("")
            setSelectedMentionUser(null)
            socket.emit("nota-privada", payload, (ack: any) => {
                if (debugTimeline) console.log("[nota-privada ACK]", ack)
            })
        }
    }

    const handleMarkMentionRead = async () => {
        if (!token) return

        // Solo disponible si el usuario está en "Menciones" y seleccionó al menos un chat con checkbox
        const ids = Array.isArray(selectedMentionChatIds) ? selectedMentionChatIds : []
        if (!mentionsMode || ids.length === 0) return

        const resp = await markMentionsRead(token, ids)
        if ((resp as any)?.statusCode === 401) {
            dispatch(openSessionExpired())
            return
        }
        const countResp = await getMentionsUnreadCount(token)
        if ((countResp as any)?.statusCode === 401) {
            dispatch(openSessionExpired())
            return
        }
        dispatch(setMentionUnreadCount((countResp as any)?.count ?? 0))
        dispatch(bumpMentionsRefreshNonce())
        dispatch(clearMentionChatSelection())
        setMentionReadSuccessMsg(
            ids.length === 1
                ? 'El chat fue marcado como leído exitosamente.'
                : 'Los chats seleccionados fueron marcados como leídos exitosamente.'
        )
        setShowMentionReadSuccess(true)
    }

    const handleBulkSetReadState = async (state: "read" | "unread") => {
        if (!token) return
        // Importante: NO aplica en Menciones (no tocar su flujo)
        if (mentionsMode) return

        const ids = Array.isArray(selectedBulkReadChatIds) ? selectedBulkReadChatIds : []
        if (ids.length === 0) return

        // Optimistic UI sobre Redux (ListaChats recalcula desde chatsFromRedux)
        if (state === "read") {
            ids.forEach((chatId) => dispatch(markChatReadLocal(chatId)))
        } else {
            ids.forEach((chatId) => dispatch(markChatUnreadLocal(chatId)))
        }

        try {
            const results = await Promise.all(ids.map((chatId) => setChatReadState(token, chatId, state)))
            if (results.some((r: any) => r?.statusCode === 401)) {
                dispatch(openSessionExpired())
                return
            }
        } catch {
            // noop: optimistic ya aplicado
        } finally {
            dispatch(clearBulkReadChatSelection())
        }
    }

    useEffect(() => {
        const ejecucion = async () => {
            // Para menciones necesitamos "operadores" de la empresa del usuario, sin importar rol.
            // Esto depende de un endpoint backend con scope por empresa (ver empresa.services.ts).
            try {
                const resp = await getOperadoresEmpresa(token)
                const list = Array.isArray((resp as any)?.users) ? (resp as any).users : []
                // Orden prolijo: Apellido, Nombre
                const ordered = [...list].sort((a: Usuario, b: Usuario) => {
                    const aa = `${a.apellido ?? ''} ${a.nombre ?? ''}`.trim().toLowerCase()
                    const bb = `${b.apellido ?? ''} ${b.nombre ?? ''}`.trim().toLowerCase()
                    return aa.localeCompare(bb)
                })
                setUsuarios(ordered)
            } catch {
                // fallback seguro: no rompemos el chat si no hay endpoint todavía
                setUsuarios([])
            }
        }
        ejecucion();
    }, [])


    useEffect(() => {
        const ejecucion = async () => {
            const resp = await getUserData(telefono!);
            dispatch(setUserData(resp));
            dispatch(setViewSide(true))
            
            if (resp.statusCode === 401) {
                dispatch(openSessionExpired())
                return
            }
        }
        ejecucion();
    },[, location])

    // Importante UX: NO marcamos menciones como leídas al abrir el chat.
    // Solo se marcarán como leídas cuando el usuario lo haga explícitamente (botón "Marcar como leído").

  

    
    
    useEffect(()=>{
        dispatch(connectSocket())
        const socket = getSocket()
        setLoading(true)
        socket?.emit('register',telefono)
        return () => {
            // dispatch(disconnectSocket())
        }
    },[dispatch, telefono])
    
   

    useEffect(() => {
        const socket = getSocket()
        if (!socket || !id) return

        const messageEventName = `new-message-${id}`
        const chatEventName = `chat-event-${id}`

        if (debugTimeline) {
            console.log("[socket] init", {
                connected: socket.connected,
                id: socket.id,
                messageEventName,
                chatEventName,
            })
        }

        const handleConnect = () => {
            if (debugTimeline) console.log("[socket] connect", { id: socket.id })
        }

        const handleDisconnect = (reason: any) => {
            if (debugTimeline) console.log("[socket] disconnect", { reason })
        }

        const handleConnectError = (err: any) => {
            if (debugTimeline) console.log("[socket] connect_error", err)
        }

        const handleArchivarAck = (data: any) => {
            if (debugTimeline) console.log("[socket] archivar-ack", data)
        }

        const handleNotaPrivadaAck = (data: any) => {
            if (debugTimeline) console.log("[socket] nota-privada-ack", data)
        }

        const handleAny = (eventName: string, ...args: any[]) => {
            if (!debugTimeline) return
            // Evitamos ruido excesivo: logueamos eventos del chat o errores
            const shouldLog =
                eventName === chatEventName ||
                eventName === messageEventName ||
                eventName === "archivar-ack" ||
                eventName === "nota-privada-ack" ||
                eventName === "error" ||
                eventName.toLowerCase().includes("chat-event") ||
                eventName.toLowerCase().includes("new-message")
            if (shouldLog) console.log("[socket] onAny", eventName, ...args)
        }

        const handleNewMessage = (mensaje: any) => {
            const item: TimelineItem = { ...mensaje, kind: "message" as const }
            setCondChat(menos24hs(new Date(mensaje.createdAt)))
            setMensajes(prev => [...prev, item])
            if (debugTimeline) console.log("[socket] new-message", messageEventName, mensaje)
        }

        const handleChatEvent = (evt: any) => {
            // Normalizamos porque algunos eventos pueden venir sin `kind`
            if (debugTimeline) console.log("[socket] chat-event", chatEventName, evt)
            setMensajes(prev => [...prev, normalizeTimelineItem(evt)])
        }

        const handleError = (error: any) => {
            console.log(error)
            if (error?.name === 'TokenExpiredError') {
                dispatch(openSessionExpired())
                return
            }
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

        return () => {
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
        // Obtener los mensajes del chat
        const inicio = async () => {
            if (!id) return

            if (debugTimeline) {
                console.log("[Chats] timeline load start", {
                    chatId: id,
                    backend: import.meta.env.VITE_URL_BACKEND,
                    page: 1,
                    limit: 200,
                })
            }

            const data = await findChatTimeline(token!, id!, { page: 1, limit: 200 })
            if (data.statusCode === 401) {
                dispatch(openSessionExpired())
                return
            }
            
            const rawItems: any[] = (data as any).items || []
            if (debugTimeline) {
                console.log("[Chats] timeline raw items", {
                    count: rawItems.length,
                    preview: rawItems.slice(0, 3),
                })
            }

            // Asegura orden ascendente para que el scroll al final funcione bien
            const items = rawItems
                .map(normalizeTimelineItem)
                .sort((a, b) => {
                const ta = new Date((a as any)?.createdAt ?? 0).getTime()
                const tb = new Date((b as any)?.createdAt ?? 0).getTime()
                return ta - tb
            })

            setMensajes(items)
            if (debugTimeline) {
                console.log("[Chats] timeline normalized items", {
                    count: items.length,
                    events: items.filter((x: any) => x?.kind === "event").slice(0, 5),
                })
            }

            // condChat: tomar el último item "message" real (ignorar eventos)
            const lastMessage = [...items]
                .reverse()
                .find((x: any) => x && x.kind === "message")

            if (lastMessage?.createdAt) {
                setCondChat(menos24hs(new Date(lastMessage.createdAt)))
            } else {
                setCondChat(false)
            }

            setLoading(false)
            
        }
        inicio()
    }, [id, token])

    // Efecto para desplazar el scroll al final cuando se actualizan los mensajes
    useEffect(() => {
        if (mensajesContainerRef.current) {
            mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight
        }
    }, [mensajes]) // Este efecto se ejecuta cada vez que `mensajes` cambia

    useEffect(() => {
        const run = async () => {
            if (!token) return
            const resp = await getQuickResponses(token, { page: 1, limit: 200 })
            if ((resp as any)?.statusCode === 401) {
                dispatch(openSessionExpired())
                return
            }
            const list = Array.isArray((resp as any)?.items) ? (resp as any).items : []
            setQuickResponses(list)
        }
        run().catch(() => {})
    }, [token])

    const handleClickBtn = (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()
            console.log(archivo == null);
            
            if(mensaje.length === 0 && archivo == null) {
                setErrorModalMessage('Debe escribir un mensaje')
                setIsErrorModalOpen(true)
                return
            }
            const socket = getSocket()
            if (socket && socket.connected) {
                const objMsj = {
                    mensaje,
                    chatId: id,
                    telefono,
                    token,
                    archivo,
                    fileName: archivo?.name,
                    ext: archivo?.type.split('/')[1]
                }
                setMensaje('')
                setArchivo(null)
                socket.emit("enviar-mensaje", objMsj);
            } else {
                console.warn("Socket desconectado, enviando por HTTP...");
                //await axios.post("/api/mensajes", { contenido: mensaje, usuarioId: "12345", chatId: "67890" });
            }
        } catch (error) {
            console.log(error);
        }
     
    }

    const handleArchivarClick = () => {
        setIsArchiveModalOpen(true);
    }

    const handleArchivarConfirm = () => {
        try {
            const socket = getSocket()
            if (socket && socket.connected) {
               const objMsj = {
                mensaje,
                chatId: id,
                telefono,
                token
               }
               
                if (debugTimeline) {
                    console.log("[socket] emit archivar", objMsj, {
                        connected: socket.connected,
                        socketId: socket.id,
                    })
                }

                const refreshTimeline = async () => {
                    try {
                        if (!id) return
                        const data = await findChatTimeline(token!, id!, { page: 1, limit: 200 })
                        if (data.statusCode === 401) {
                            dispatch(openSessionExpired())
                            return
                        }
                        const rawItems: any[] = (data as any).items || []
                        const items = rawItems
                            .map(normalizeTimelineItem)
                            .sort(
                                (a, b) =>
                                    new Date((a as any)?.createdAt ?? 0).getTime() -
                                    new Date((b as any)?.createdAt ?? 0).getTime()
                            )
                        setMensajes(items)
                    } catch (e) {
                        if (debugTimeline) console.log("[Chats] timeline refresh after archivar failed", e)
                    }
                }

                // ACK: confirma si el backend terminó el flujo (y si generó eventId)
                socket.emit("archivar", objMsj, (ack: any) => {
                    if (debugTimeline) console.log("[socket] archivar ack", ack)
                    // Si ok, refrescamos para asegurar que el hito persistido aparezca aunque el realtime no llegue
                    if (ack?.ok) {
                        refreshTimeline()
                    }
                })

                // Fallback: si no hay ack o el evento tarda en persistir/emitir, refrescamos igual.
                refreshTimeline()
                setTimeout(refreshTimeline, 800)
            } else {
                console.warn("Socket desconectado, enviando por HTTP...");
                //await axios.post("/api/mensajes", { contenido: mensaje, usuarioId: "12345", chatId: "67890" });
            }
            setIsArchiveModalOpen(false);
        } catch (error) {
            console.log(error);
        }
    }

    const handleArchivarCancel = () => {
        setIsArchiveModalOpen(false);
    }

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    }

    // Función original comentada temporalmente
    // const handleDeleteConfirm = () => {
    //     try {
    //         socket = getSocket()
    //         if (socket && socket.connected) {
    //            const objMsj = {
    //             chatId: id,
    //             telefono,
    //             token
    //            }
    //            
    //             socket.emit("eliminar", objMsj);
    //             toast.success('Chat eliminado correctamente');
    //         } else {
    //             console.warn("Socket desconectado, enviando por HTTP...");
    //         }
    //         setIsDeleteModalOpen(false);
    //     } catch (error) {
    //         console.log(error);
    //         toast.error('Error al eliminar el chat');
    //     }
    // }

    const handleDeleteConfirm = async () => {
        try {
            const url = `https://sales.createch.com.ar/api/v1/chats/${id}/messages`
            
            const headers = {
                authorization: `Bearer ${token}`
            }

            const body = {
                chatId: id,
                telefono,
                token
            }

            const response = await axios.delete(url, {
                headers,
                data: body
            })

            if (response.status === 200 || response.status === 204) {
                toast.success('Chat eliminado correctamente');
                setIsDeleteModalOpen(false);
            }
        } catch (error) {
            console.log(error);
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) {
                    dispatch(openSessionExpired());
                } else {
                    toast.error('Error al eliminar el chat');
                }
            } else {
                toast.error('Error al eliminar el chat');
            }
            setIsDeleteModalOpen(false);
        }
    }

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
    }

    

    
    // El tipo correcto para el evento de input tipo file es React.ChangeEvent<HTMLInputElement></HTMLInputElement>
    const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files![0];


        const tipos = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        ]

        if(file.size >= 5242880 ){

            toast.error(`El archivo debe pesar menos de 5MB`);
            return
        }

        // if (regex.test(file.name)) {
        if (tipos.includes(file.type)) {
            setArchivo(file);
        } else {
            toast.error(`Solo se permiten archivos pdf, jpeg, png`);
        }
    };

    const handleClickFile = () => {
        fileInputRef.current?.click(); // dispara el file picker
    };

    const closeQuickMenu = () => {
        setQrOpen(false)
        setQrFiltered([])
        setQrActiveIndex(0)
        setQrTriggerRange(null)
    }

    const insertQuickResponse = (qr: QuickResponse) => {
        const range = qrTriggerRange
        const input = mensajeInputRef.current
        if (!range || !input) return
        const current = input.value
        const start = range.start
        const end = range.end
        const newValue = current.slice(0, start) + (qr.text || '') + current.slice(end)
        setMensaje(newValue)
        closeQuickMenu()
        requestAnimationFrame(() => {
            const caret = start + (qr.text || '').length
            input.focus()
            input.setSelectionRange(caret, caret)
        })
    }

    const handleKeyDownText = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!qrOpen) return
        if (e.key === 'Escape') {
            e.preventDefault()
            closeQuickMenu()
            return
        }
        if (!qrFiltered.length) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setQrActiveIndex((prev) => (prev + 1) % qrFiltered.length)
            return
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setQrActiveIndex((prev) => (prev - 1 + qrFiltered.length) % qrFiltered.length)
            return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault()
            const selected = qrFiltered[qrActiveIndex]
            if (selected) insertQuickResponse(selected)
        }
    }


    const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const filtered = quickResponses.filter((qr) => {
                const a = norm(qr.shortcut)
                const b = norm(qr.text)
                if (!q) return true
                return a.includes(q) || b.includes(q)
            })
            setQrTriggerRange({ start, end })
            setQrFiltered(filtered)
            setQrActiveIndex(0)
            setQrOpen(true)
            setShowList(false)
            return
        } else {
            closeQuickMenu()
        }

        const match = value.match(/@([^\s@]*)$/);
        if (match) {
            const query = (match[1] || '').toLowerCase();

            const normalize = (s: string) =>
                (s || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')

            const q = normalize(query)
            const results = usuarios
                .filter((u) => {
                    const full = normalize(`${u.nombre ?? ''} ${u.apellido ?? ''}`.trim())
                    if (!q) return true
                    return full.includes(q)
                })

            setFilteredUsers(results);
            setShowList(true);
        } else {
            setShowList(false);
        }
    }

    const handleSelectUser = (user: any) => {
        const toHandle = (u: Usuario) =>
            (u?.nombre || 'usuario')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '')

        const handle = toHandle(user)
        setMensaje((prev) => prev.replace(/@([^\s@]*)$/, `@${handle} `));
        setSelectedMentionUser(user as Usuario)
        setShowList(false);
        // textareaRef.current!.focus();
    };

   

    return (
        <div className='chats-container'>
            {loading && (
                <div className='spinner-lista'>
                    <div className='loader2'></div>
                </div>
            )}
            {!loading && (
                <div className='main-chat'>
                    <div className='header-chat'>
                       
                        <div className='header-icon'>
                            <FaCircleUser size={25} />
                        </div>
                        <p className='nombre-chat'>
                            <span className=''>{nombre}</span>
                            <span className=''>+{telefono}</span>
                        </p>
                        <div className='header-chat-actions'>
                            {role !== 'USER' && (
                                <button
                                    onClick={() => dispatch(openModal())}
                                    className="chat-action-button chat-button-assign"
                                >
                                    <IoPersonAdd />
                                    <span>Asignar</span>
                                </button>
                            )}
                            <button
                                onClick={handleArchivarClick}
                                className="chat-action-button chat-button-archive"
                            >
                                <FaFileArrowDown />
                                <span>Archivar</span>
                            </button>
                            {!mentionsMode && Array.isArray(selectedBulkReadChatIds) && selectedBulkReadChatIds.length > 0 && (
                                <>
                                    <button
                                        onClick={() => handleBulkSetReadState("read")}
                                        className="chat-action-button chat-button-mention-read"
                                    >
                                        <CheckCheck size={16} />
                                        <span>Marcar como leído</span>
                                    </button>
                                    <button
                                        onClick={() => handleBulkSetReadState("unread")}
                                        className="chat-action-button chat-button-mark-unread"
                                    >
                                        <CheckCheck size={16} />
                                        <span>Marcar como no leído</span>
                                    </button>
                                </>
                            )}
                            {mentionsMode && Array.isArray(selectedMentionChatIds) && selectedMentionChatIds.length > 0 && (
                                <button
                                    onClick={handleMarkMentionRead}
                                    className="chat-action-button chat-button-mention-read"
                                >
                                    <CheckCheck size={16} />
                                    <span>Marcar como leído</span>
                                </button>
                            )}
                            {role !== 'USER' && (
                                <button
                                    onClick={handleDeleteClick}
                                    className="chat-action-button chat-button-delete"
                                >
                                    <Trash2 size={16} />
                                    <span>Eliminar</span>
                                </button>
                            )}
                            <ChatInfoDropdown dataUser={dataUser} tags={chatTags} />
                        </div>
                    </div>
                    <div className='body-chat' ref={mensajesContainerRef}>
                        {renderItems.map((msj: any, index) => {
                            const key = msj?.id ?? `${msj?.createdAt ?? "no-date"}-${index}`

                            if (msj?.kind === "date_separator") {
                                return (
                                    <div className='date-separator' key={key}>
                                        <span className='date-separator-label'>{msj.label}</span>
                                    </div>
                                )
                            }

                            // soporta eventos con y sin kind (por compatibilidad)
                            const isEvent = msj?.kind === "event" || (msj?.type && msj?.text !== undefined && msj?.msg_entrada === undefined && msj?.msg_salida === undefined)

                            if (isEvent) {
                                if (msj?.type === "PRIVATE_NOTE_CREATED") {
                                    return (
                                        <div className='contenedor-nota-privada' key={key}>
                                            <div className='mensaje-nota-privada'>
                                                <span className='mensaje-nota-privada-text'>{resolveEventText(msj)}</span>
                                                {msj?.payload?.authorName && (
                                                    <span className='mensaje-nota-privada-author'>{formatAuthorName(msj.payload.authorName)}</span>
                                                )}
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
                                        <p className='mensaje-archivado'> Archivado</p>
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
                    <div className='footer-chat'>
                        {archivo && (
                            <p className='w-full p-1 text-red-600 text-center text-sm'>{archivo.name}</p>
                        )}
                        {condChat ? (
                            
                            <form action="" className='enviar-msj gap-1 relative w-full ' onSubmit={handleClickBtn}>
                                <input 
                                    type="text" 
                                    placeholder='Escriba un mensaje' 
                                    className='input-msg'
                                    value={mensaje}
                                    onChange={handleChangeText}
                                    onKeyDown={handleKeyDownText}
                                    ref={mensajeInputRef}
                                />
                                <button
                                    type='button'
                                    onClick={handleClickFile}
                                >
                                    <IoIosAttach size={25} className='text-gray-700 cursor-pointer'/>
                                    {/* Elimina cualquier texto o estilos extra, solo el input oculto */}
                                   
                                   
                                </button>

                                <input
                                    type="file"
                                    accept="application/pdf, image/jpeg, image/png"
                                    id="fileInput"
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    onChange={handleAddFile}
                                />

                                {qrOpen && (
                                    <ul className="absolute bottom-12 left-2 w-96 max-h-60 overflow-y-auto z-10 [&::-webkit-scrollbar]:hidden rounded-xl bg-slate-50/95 backdrop-blur-sm shadow-lg ring-1 ring-slate-200">
                                    {qrFiltered.length ? (
                                        qrFiltered.map((qr, idx) => (
                                        <li
                                            key={qr.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                insertQuickResponse(qr)
                                            }}
                                            className={`px-3 py-2 cursor-pointer text-slate-700 text-left hover:bg-indigo-50 hover:text-slate-900 transition-colors ${idx === qrActiveIndex ? 'bg-indigo-50 text-slate-900' : ''}`}
                                        >
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
                                        <li
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className="px-3 py-2 cursor-pointer text-slate-700 text-left whitespace-nowrap overflow-hidden text-ellipsis hover:bg-indigo-50 hover:text-slate-900 transition-colors"
                                        >
                                            @{(user.nombre || '').toLowerCase().replace(/\s+/g, '')}{" "}
                                            <span className="text-gray-500">— {toTitleCase(user.apellido)} {toTitleCase(user.nombre)}</span>
                                        </li>
                                        ))
                                    ) : (
                                        <li className="px-3 py-2 text-gray-400">No hay coincidencias</li>
                                    )}
                                    </ul>
                                )}
                               {/*  <button
                                    type='button'
                                    onClick={() => alert('no implentado')}
                                >
                                    <FaMicrophone size={25} className='text-gray-700 cursor-pointer'/>
                                </button> */}
                                <button 
                                    type='button' 
                                    className='btn-msg btn-plantilla'
                                    onClick={() => dispatch(switchModalPlantilla())}
                                >
                                    Plantilla
                                </button>
                                <button type='button' className='btn-msg btn-nota-privada' onClick={handleNotaPrivada}>
                                    Nota Privada
                                </button>
                                <button type='submit' className='btn-msg'>
                                    Enviar
                                </button>
                            </form>
                        ) : (
                            <div className='no-chat'>
                               
                                {/* <p className='no-chat-text'>No se pueden enviar mensajes</p> */}
                                <button
                                    onClick={() => dispatch(switchModalPlantilla())}
                                    className="btn flex gap-2 rounded-xl cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
                                >
                                    Enviar plantilla
                                </button>
                               
                            </div>
                        )}
                        
                    </div>
                    <PlantillaModal />
                    <UserSearchModal  />
                    <ArchiveModal 
                        isOpen={isArchiveModalOpen}
                        onClose={handleArchivarCancel}
                        onConfirm={handleArchivarConfirm}
                    />
                    <DeleteModal 
                        isOpen={isDeleteModalOpen}
                        onClose={handleDeleteCancel}
                        onConfirm={handleDeleteConfirm}
                    />
                    <ErrorModal
                        isOpen={isErrorModalOpen}
                        onClose={() => {
                            setIsErrorModalOpen(false)
                            setErrorModalMessage('')
                        }}
                        title="Atención"
                        message={errorModalMessage || 'Debe escribir un mensaje'}
                    />
                    <SuccessModal
                        isOpen={showMentionReadSuccess}
                        onClose={() => setShowMentionReadSuccess(false)}
                        title="Listo"
                        message={mentionReadSuccessMsg}
                    />
                </div>
            )}
           
        </div>
    )
}

export default Chats