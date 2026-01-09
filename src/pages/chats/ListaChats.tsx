import { Link, Outlet, useParams, useSearchParams } from "react-router-dom"
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
import { setUserData, setViewSide, openSessionExpired, setChats, setMentionUnreadCount, setMentionsMode, toggleMentionChatSelection, clearMentionChatSelection } from "../../app/slices/actionSlice"
import { jwtDecode } from "jwt-decode"
import './chats.css'
import { getSocket } from "../../app/slices/socketSlice"
import { getChats } from "../../services/chats/chats.services"
import { getMentionChats, getMentionsUnreadCount } from "../../services/mentions/mentions.services"

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

const ListaChats = () => {
    const { id: activeChatId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectRef = useRef<HTMLSelectElement>(null);
    
    const [chats1,setChats1] = useState<ChatState[]>([])
    const [archivadas,setArchivadas] = useState<ChatState[]>([])
    const [asignadas,setAsignadas] = useState<ChatState[]>([])
    const [bots,setBots] = useState<ChatState[]>([])
    const [sinAsignar,setSinAsignar] = useState<ChatState[]>([])
    const [menciones,setMenciones] = useState<ChatState[]>([])
    const [styleBtn, setStyleBtn] = useState<string>('todas')

    const [loading, setLoading] = useState<boolean>(true)
    const [users, setUsers] = useState<Usuario[]>([]);
    const [filtrados, setFiltrados] = useState<ChatState[]>([])
    const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc') // 'desc' = más reciente primero, 'asc' = más viejo primero
    const [showFilterSelect, setShowFilterSelect] = useState<boolean>(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [allTags, setAllTags] = useState<{ id: string; nombre: string }[]>([])
    const [searchChat, setSearchChat] = useState<string>('')
    const [selectedOperator, setSelectedOperator] = useState<string>('')
    // selección de menciones vive en Redux (para compartir con la vista del chat)

    const audioRef = useRef(new Audio("/audio/audio1.mp3"));


    const dataUser = useSelector((state: RootState) => state.action.dataUser);
    const viewSide = useSelector((state: RootState) => state.action.viewSide);
    const chatsFromRedux = useSelector((state: RootState) => state.action.chats);
    const mentionUnreadCount = useSelector((state: RootState) => state.action.mentionUnreadCount);
    const mentionsRefreshNonce = useSelector((state: RootState) => state.action.mentionsRefreshNonce);
    const selectedMentionChatIds = useSelector((state: RootState) => state.action.selectedMentionChatIds);


    const socket = getSocket()

    const token  = localStorage.getItem('token') || '';
    const role = localStorage.getItem('role') || '';
    const id = jwtDecode<{ id: string }>(token).id;

    const [mentionChatIds, setMentionChatIds] = useState<string[]>([])

    const extractMentionChatId = (it: any): string | null => {
        return it?.chatId || it?.chat_id || it?.chat?.id || it?.id || null
    }

    

    const dispatch = useDispatch()

   

    


    useEffect(()=>{
        
        const ejecucion = async () => {
            
            const chatos = await getChats(token,'1','100')
            let mentionTotal: number | null = null

            // Intentamos obtener menciones (si backend aún no lo soporta, no rompemos nada)
            try {
                const [countResp, chatsResp] = await Promise.all([
                    getMentionsUnreadCount(token),
                    getMentionChats(token, { unreadOnly: true, page: 1, limit: 200 }),
                ])
                if (typeof (countResp as any)?.count === 'number') {
                    mentionTotal = (countResp as any).count
                }
                const items = Array.isArray((chatsResp as any)?.items) ? (chatsResp as any).items : []
                const ids: string[] = []
                items.forEach((it: any) => {
                    const chatId = extractMentionChatId(it)
                    if (chatId) ids.push(chatId)
                    // Si el backend no envía el count global, podemos sumar desde los items como fallback
                    if (typeof it?.unreadCount === 'number' && mentionTotal === null) {
                        mentionTotal = (mentionTotal ?? 0) + it.unreadCount
                    }
                })
                setMentionChatIds(Array.from(new Set(ids)))

                // Reconciliación: si no hay ítems unread, el contador debe ser 0
                if (items.length === 0) {
                    mentionTotal = 0
                }
            } catch {
                // noop
            }

            const archivadasTemp: ChatState[] = []
            const botsTemp: ChatState[] = []
            const asignadasTemp: ChatState[] = []
            const sinAsignarTemp: ChatState[] = []
            const mencionesTemp: ChatState[] = []
            const botsIds = new Set<string>()
            const mentionIds = new Set<string>(mentionChatIds)

            chatos.chats.forEach(chat => {
                if(chat.archivar){
                    archivadasTemp.push(chat)
                }

                if(!chat.operador){
                    if(!botsIds.has(chat.id)){
                        botsTemp.push(chat)
                        botsIds.add(chat.id)
                    }
                    sinAsignarTemp.push(chat)
                }

                if(id === chat.operador?.id){
                    asignadasTemp.push(chat)
                }

                if (mentionIds.has(chat.id)) {
                    mencionesTemp.push(chat)
                }
            })

            setArchivadas(archivadasTemp)
            setBots(botsTemp)
            setAsignadas(asignadasTemp)
            setSinAsignar(sinAsignarTemp)
            setMenciones(mencionesTemp)
            const effectiveMentionTotal = (mentionTotal ?? mencionesTemp.length)
            dispatch(setMentionUnreadCount(effectiveMentionTotal))
            setChats1(chatos.chats)
            setFiltrados(chatos.chats)
            dispatch(setChats(chatos.chats))
            setLoading(false)
            
            // Los usuarios con rol USER no tienen permiso para listar operadores (backend devuelve 403).
            // Para evitar errores, solo pedimos la lista si el rol actual NO es USER y además validamos el shape.
            if (role !== 'USER') {
                const respUsers = await usuariosXRole('USER', token);
                const list = Array.isArray((respUsers as any)?.users) ? (respUsers as any).users : []

                const usersIds = new Set<string>()
                const uniqueUsers: Usuario[] = []
                
                list.forEach((user: Usuario) => {
                    if(!usersIds.has(user.id)){
                        uniqueUsers.push(user)
                        usersIds.add(user.id)
                    }
                })
                
                setUsers(uniqueUsers)
            } else {
                setUsers([])
            }

            // Extraer tags únicos de todos los chats
            const tagsMap = new Map<string, { id: string; nombre: string }>()
            chatos.chats.forEach(chat => {
                if(chat.tags && chat.tags.length > 0) {
                    chat.tags.forEach(tag => {
                        if(!tagsMap.has(tag.id)) {
                            tagsMap.set(tag.id, { id: tag.id, nombre: tag.nombre })
                        }
                    })
                }
            })
            setAllTags(Array.from(tagsMap.values()))
        
        }
        
        dispatch(setUserData(null))
        dispatch(setViewSide(false))

        ejecucion();
     
        
        
    },[])

    // Estado inicial: no estamos en "Menciones" hasta que el usuario toque esa pestaña
    useEffect(() => {
        dispatch(setMentionsMode(false))
        dispatch(clearMentionChatSelection())
    }, [dispatch])

    // Realtime: cuando cambia el contador global (por socket), refrescamos la lista de chatIds mencionados
    useEffect(() => {
        if (!token) return
        getMentionChats(token, { unreadOnly: true, page: 1, limit: 200 })
            .then((resp: any) => {
                const items = Array.isArray(resp?.items) ? resp.items : []
                const ids: string[] = []
                items.forEach((it: any) => {
                    const chatId = extractMentionChatId(it)
                    if (chatId) ids.push(chatId)
                })
                setMentionChatIds(Array.from(new Set(ids)))
            })
            .catch(() => {})
    }, [mentionUnreadCount, token, mentionsRefreshNonce])
    
    
    
    useEffect(()=>{
        
        
        if(!socket) return
        
        
        
        const handleNuevoChat = (chat: ChatState) => {
            setFiltrados(prevChats => [chat, ...prevChats])
            audioRef.current.play()
        }

        const handleError = (error: any) => {
            if (error.name === 'TokenExpiredError') {
                dispatch(openSessionExpired())
                return
            }
            dispatch(openSessionExpired())
            return
        }

      

        socket?.on('nuevo-chat',handleNuevoChat)

        socket?.on('error',handleError)


        return () => {
            socket!.off('nuevo-chat', handleNuevoChat)
            socket!.off('error', handleError)
        }
    },[socket]) 

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

    const normalizeSearch = (value: string) => {
        return (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\s()+\-]/g, '')
    }

    const onlyDigits = (value: string) => (value || '').replace(/\D/g, '')

    const aplicarFiltros = (operadorValue: string, tagValue: string, chatsBase?: ChatState[], searchValue?: string) => {
        const baseChats = chatsBase || chats1
        let filtrados: ChatState[] = []

        // Filtro por operador
        if(operadorValue === "" || operadorValue === "TODOS"){
            filtrados = [...baseChats]
        }else if(operadorValue === 'BOT'){
            filtrados = baseChats.filter(chat => chat.operador === null)
        }else{
            filtrados = baseChats.filter(chat => chat.operador?.id === operadorValue)
        }

        // Filtro por tag
        if(tagValue && tagValue !== ""){
            filtrados = filtrados.filter(chat => 
                chat.tags && chat.tags.some(tag => tag.id === tagValue)
            )
        }

        const q = (searchValue ?? '').trim()
        if (q.length > 0) {
            const qNorm = normalizeSearch(q)
            const qDigits = onlyDigits(q)

            filtrados = filtrados.filter(chat => {
                const nombre = chat?.cliente?.nombre || ''
                const apellido = chat?.cliente?.apellido || ''
                const telefono = chat?.cliente?.telefono || ''

                const haystack = normalizeSearch(`${nombre} ${apellido} ${telefono}`)
                if (qNorm && haystack.includes(qNorm)) return true

                if (qDigits.length > 0) {
                    const telDigits = onlyDigits(telefono)
                    if (telDigits.includes(qDigits)) return true
                }

                return false
            })
        }

        setFiltrados(filtrados)
    }

    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId && selectRef.current && users.length > 1 && chats1.length > 0) {
            selectRef.current.value = userId;
            setSelectedOperator(userId);
            aplicarFiltros(userId, selectedTag, undefined, searchChat);
        }
    }, [users, chats1, searchParams, loading, selectedTag, searchChat])

    useEffect(() => {
        if (chatsFromRedux.length > 0) {
            const archivadasTemp: ChatState[] = []
            const botsTemp: ChatState[] = []
            const asignadasTemp: ChatState[] = []
            const sinAsignarTemp: ChatState[] = []
            const mencionesTemp: ChatState[] = []
            const botsIds = new Set<string>()
            const mentionIds = new Set<string>(mentionChatIds)

            chatsFromRedux.forEach(chat => {
                if(chat.archivar){
                    archivadasTemp.push(chat)
                }

                if(!chat.operador){
                    if(!botsIds.has(chat.id)){
                        botsTemp.push(chat)
                        botsIds.add(chat.id)
                    }
                    sinAsignarTemp.push(chat)
                }

                if(id === chat.operador?.id){
                    asignadasTemp.push(chat)
                }

                if (mentionIds.has(chat.id)) {
                    mencionesTemp.push(chat)
                }
            })

            setArchivadas(archivadasTemp)
            setBots(botsTemp)
            setAsignadas(asignadasTemp)
            setSinAsignar(sinAsignarTemp)
            setMenciones(mencionesTemp)
            setChats1(chatsFromRedux)

            // Extraer tags únicos de todos los chats
            const tagsMap = new Map<string, { id: string; nombre: string }>()
            chatsFromRedux.forEach(chat => {
                if(chat.tags && chat.tags.length > 0) {
                    chat.tags.forEach(tag => {
                        if(!tagsMap.has(tag.id)) {
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

    // Marcado como leído se dispara desde la vista del chat (botón al lado de "Archivar")

    

  return (
     <div className="chats-container">
        <div className='main-chat'>
            <div className="header-lista">
                <div className={`header-item ${styleBtn === "asig" ? "header-item--active" : ""}`}>
                    <button 
                        onClick={() => {
                            dispatch(setMentionsMode(false))
                            dispatch(clearMentionChatSelection())
                            setStyleBtn("asig")
                            const operadorValue = selectRef.current?.value || ''
                            aplicarFiltros(operadorValue, selectedTag, asignadas)
                        }} 
                        className="btn-item"
                    >
                        Asignadas a mí
                        <span>{asignadas.length}</span>
                    </button>
                    
                </div>
              
                <div className={`header-item ${styleBtn === "archi" ? "header-item--active" : ""}`}>
                    <button 
                        onClick={() => {
                            dispatch(setMentionsMode(false))
                            dispatch(clearMentionChatSelection())
                            setStyleBtn("archi")
                            const operadorValue = selectRef.current?.value || ''
                            aplicarFiltros(operadorValue, selectedTag, archivadas)
                        }} 
                        className="btn-item"
                    >
                        Archivadas
                        <span>{archivadas.length}</span>
                    </button>
                   
                </div>
                 <div className={`header-item ${styleBtn === "todas" ? "header-item--active" : ""}`}>
                     <button 
                        onClick={() => {
                            dispatch(setMentionsMode(false))
                            dispatch(clearMentionChatSelection())
                            setStyleBtn("todas")
                            const operadorValue = selectRef.current?.value || ''
                            aplicarFiltros(operadorValue, selectedTag, chats1)
                        }} 
                        className="btn-item"
                    >
                        Todas
                        <span>{chats1.length}</span>
                    </button>
                   
                </div>
                 <div className={`header-item ${styleBtn === "bots" ? "header-item--active" : ""}`}>
                     <button 
                        onClick={() => {
                            dispatch(setMentionsMode(false))
                            dispatch(clearMentionChatSelection())
                            setStyleBtn('bots')
                            const operadorValue = selectRef.current?.value || ''
                            aplicarFiltros(operadorValue, selectedTag, bots)
                        }} 
                        className="btn-item"
                    >
                        Bots
                        <span>{bots.length}</span>
                    </button>
                   
                </div>
                 <div className={`header-item ${styleBtn === "sinAsignar" ? "header-item--active" : ""}`}>
                     <button 
                        onClick={() => {
                            dispatch(setMentionsMode(false))
                            dispatch(clearMentionChatSelection())
                            setStyleBtn('sinAsignar')
                            const operadorValue = selectRef.current?.value || ''
                            aplicarFiltros(operadorValue, selectedTag, sinAsignar)
                        }} 
                        className="btn-item"
                    >
                        Sin asignar
                        <span>{sinAsignar.length}</span>
                    </button>
                   
                </div>
                 <div className={`header-item ${styleBtn === "menciones" ? "header-item--active" : ""}`}>
                     <button 
                        onClick={() => {
                            setStyleBtn('menciones')
                            dispatch(setMentionsMode(true))
                            const operadorValue = selectRef.current?.value || ''
                            aplicarFiltros(operadorValue, selectedTag, menciones)
                        }} 
                        className="btn-item"
                    >
                        Menciones
                        <span>{mentionUnreadCount}</span>
                    </button>
                   
                </div>
            </div>
            <div className="lista-main">
                <div className="col-lista">
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
                                <Link 
                                    to={`/dashboard/chats/${chat.id}?telefono=${chat.cliente?.telefono || ''}&nombre=${chat.cliente?.nombre || ''}`} 
                                    className={`item-lista text-left ${chat.id === activeChatId ? 'active' : ''}`}
                                    key={chat.id}
                                    onClick={handleClickLink}
                                >
                                    <div className="flex justify-between px-2">
                                        <p className="chat-client-info">
                                            {capitalizeText(chat.cliente?.nombre)} - {chat.cliente?.telefono || ''}
                                        </p>
                                        {chat?.mensajes?.filter(m => m.leido === false).length > 0 && (
                                            <p className="chat-badge-count">
                                                {chat.mensajes.filter(m => m.leido === false).length}
                                            </p>
                                        )}
                                        
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
                                        {chat.tags && chat.tags.length > 0 ? (
                                            chat.tags.map(tag => (
                                                <p key={tag.id} className="chat-tag">{tag.nombre}</p>
                                            ))
                                        ) : null}
                                    </div>
                                </Link>
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
                        </div>
                    ) : activeChatId ? (
                        <Outlet />
                    ) : (
                        <div className="chat-empty-prompt">
                            <p className="chat-empty-text">Presiona en un chat para comenzar</p>
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