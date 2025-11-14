import { Link, Outlet, useParams, useSearchParams } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { ChatState } from "../../interfaces/chats.interface"
// import { dividirArrayEnTres } from "../../utils/functions"
// import {  getSocket, connectSocket } from "../../app/slices/socketSlice"
import { useDispatch, useSelector } from "react-redux"
// import { Socket } from "socket.io-client"
import { usuariosXRole } from "../../services/auth/auth.services"
import { Usuario } from "../../interfaces/auth.interface"
import { LuArrowDownFromLine } from "react-icons/lu";
import { RootState } from "../../app/store"
import { setUserData, setViewSide, openSessionExpired } from "../../app/slices/actionSlice"
import { jwtDecode } from "jwt-decode"
import './chats.css'
import { getSocket } from "../../app/slices/socketSlice"
import { getChats } from "../../services/chats/chats.services"

// Función auxiliar para capitalizar correctamente el texto
const capitalizeText = (text: string): string => {
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
    const [styleBtn, setStyleBtn] = useState<string>('todas')

    const [loading, setLoading] = useState<boolean>(true)
    const [users, setUsers] = useState<Usuario[]>([]);
    const [filtrados, setFiltrados] = useState<ChatState[]>([])

    const audioRef = useRef(new Audio("/audio/audio1.mp3"));


    const dataUser = useSelector((state: RootState) => state.action.dataUser);
    const viewSide = useSelector((state: RootState) => state.action.viewSide);


    const socket = getSocket()

    const token  = localStorage.getItem('token') || '';
    const id = jwtDecode<{ id: string }>(token).id;

    

    const dispatch = useDispatch()

   

    


    useEffect(()=>{
        
        const ejecucion = async () => {
            
            const respUsers = await usuariosXRole('USER', token);
            const chatos = await getChats(token,'1','100')

            const archivadasTemp: ChatState[] = []
            const botsTemp: ChatState[] = []
            const asignadasTemp: ChatState[] = []
            const botsIds = new Set<string>()

            chatos.chats.forEach(chat => {
                if(chat.archivar){
                    archivadasTemp.push(chat)
                }

                if(!chat.operador){
                    if(!botsIds.has(chat.id)){
                        botsTemp.push(chat)
                        botsIds.add(chat.id)
                    }
                }

                if(id === chat.operador?.id){
                    asignadasTemp.push(chat)
                }
            })

            setArchivadas(archivadasTemp)
            setBots(botsTemp)
            setAsignadas(asignadasTemp)
            setChats1(chatos.chats)
            setFiltrados(chatos.chats)
            setLoading(false)
            
            const usersIds = new Set<string>()
            const uniqueUsers: Usuario[] = []
            
            respUsers.users.forEach(user => {
                if(!usersIds.has(user.id)){
                    uniqueUsers.push(user)
                    usersIds.add(user.id)
                }
            })
            
            setUsers(uniqueUsers)
        
        }
        
        dispatch(setUserData(null))
        dispatch(setViewSide(false))

        ejecucion();
     
        
        
    },[])
    
    
    
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
        let filtrados: ChatState[] = []

        
        if(selectedValue === "" || selectedValue === "TODOS"){
            filtrados = [...chats1]
        }else if(selectedValue === 'BOT'){
            filtrados = chats1.filter(chat => chat.operador === null)
        }else{
            filtrados = chats1.filter(chat => chat.operador?.id === selectedValue)
        }
        setFiltrados(filtrados)
        
        const newSearchParams = new URLSearchParams(searchParams);
        if (selectedValue && selectedValue !== "TODOS" && selectedValue !== "BOT") {
            newSearchParams.set('userId', selectedValue);
        } else {
            newSearchParams.delete('userId');
        }
        setSearchParams(newSearchParams);
    }

    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId && selectRef.current && users.length > 1 && chats1.length > 0) {
            selectRef.current.value = userId;
            const filtrados: ChatState[] = chats1.filter(chat => chat.operador?.id === userId);
            setFiltrados(filtrados);
        }
    }, [users, chats1, searchParams, loading])

  

    const handleClickLink = () => {
        dispatch(setViewSide(true))
    }

    

  return (
     <div className="chats-container">
        <div className='main-chat'>
            <div className="header-lista">
                <div className="header-item">
                    <button 
                        onClick={() => {setFiltrados(asignadas),setStyleBtn("asig")}} 
                        className={`btn-item ${styleBtn === "asig" && "border-1 p-1 border-red-600"}`}
                    >
                        Asignadas a mí
                        <span>{asignadas.length}</span>
                    </button>
                    
                </div>
              
                <div className="header-item">
                    <button 
                        onClick={() => {setFiltrados(archivadas),setStyleBtn("archi")}} 
                        className={`btn-item ${styleBtn === "archi" && "border-1 p-1 border-red-600"}`}
                    >
                        Archivadas
                        <span>{archivadas.length}</span>
                    </button>
                   
                </div>
                 <div className="header-item">
                     <button 
                        onClick={() => {setFiltrados(chats1),setStyleBtn("todas")}} 
                        className={`btn-item ${styleBtn === "todas" && "border-1 p-1 border-red-600"}`}
                    >
                        Todas
                        <span>{chats1.length}</span>
                    </button>
                   
                </div>
                 <div className="header-item">
                     <button 
                        onClick={() => {setFiltrados(bots), setStyleBtn('bots')}} 
                        className={`btn-item ${styleBtn === "bots" && "border-1 p-1 border-red-600"}`}
                    >
                        Bots
                        <span>{bots.length}</span>
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
                            <div className="w-full flex justify-between px-2 items-center mb-4 py-2">
                                <div className="border border-white rounded-none p-2">
                                    {/* Contenido opcional aquí */}
                                    <LuArrowDownFromLine />
                                </div>
                               
                                <div>
                                    <select
                                        ref={selectRef}
                                        id="operador-select"
                                        className="block w-30 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        onChange={handleChangeSelect}
                                    >
                                        <option value="" className="bg-gray-500">Seleccione</option>
                                        <option value="TODOS" className="bg-gray-500">TODOS</option>
                                        <option value="BOT" className="bg-gray-500">BOT OPERADOR</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id} className="bg-gray-500">{user.apellido} {user.nombre}</option>
                                        ))}
                                    
                                    </select>
                                </div>
                            </div>
                            {filtrados != undefined && filtrados.map(chat => (
                                <Link 
                                    to={`/dashboard/chats/${chat.id}?telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} 
                                    className={`item-lista text-left ${chat.id === activeChatId ? 'active' : ''}`}
                                    key={chat.id}
                                    onClick={handleClickLink}
                                >
                                    <div className="flex justify-between px-2">
                                        <p className="chat-client-info">
                                            {capitalizeText(chat.cliente.nombre)} - {chat.cliente.telefono}
                                        </p>
                                        {chat?.mensajes?.filter(m => m.leido === false).length > 0 && (
                                            <p className="chat-badge-count">
                                                {chat.mensajes.filter(m => m.leido === false).length}
                                            </p>
                                        )}
                                        
                                    </div>
                                    <div className="chat-tags-container">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                        />
                                        <p className="chat-tag">ac</p>
                                        <p className="chat-tag">black</p>
                                        <p className="chat-tag">deuda</p>
                                    </div>
                                </Link>
                            ))}
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