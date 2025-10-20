import { Link, Outlet, useNavigate } from "react-router-dom"
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
import { setUserData, setViewSide } from "../../app/slices/actionSlice"
import { jwtDecode } from "jwt-decode"
import './chats.css'
import { getSocket } from "../../app/slices/socketSlice"
import { getChats } from "../../services/chats/chats.services"



const ListaChats = () => {
    const [chats1,setChats1] = useState<ChatState[]>([])
    const [archivadas,setArchivadas] = useState<ChatState[]>([])
    const [asignadas,setAsignadas] = useState<ChatState[]>([])
    const [bots,setBots] = useState<ChatState[]>([])
    const [styleBtn, setStyleBtn] = useState<string>('todas')

    const [loading, setLoading] = useState<boolean>(true)
    const [users, setUsers] = useState<Usuario[]>([{
        id: 'BOT',
        nombre: 'OPERADOR',
        apellido: 'BOT',
        nacimiento: new Date(),
        telefono: '',
        tipo_doc: '',
        nro_doc: 0,
        cuil: null,
        email: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        verificado: false,
        token: '',
        role: '',
        activo: false
    }]);
    const [filtrados, setFiltrados] = useState<ChatState[]>([])

    const audioRef = useRef(new Audio("/audio/audio1.mp3"));


    const dataUser = useSelector((state: RootState) => state.action.dataUser);
    const viewSide = useSelector((state: RootState) => state.action.viewSide);


    const socket = getSocket()

    const token  = localStorage.getItem('token') || '';
    const id = jwtDecode<{ id: string }>(token).id;

    

    const navigate = useNavigate()
    const dispatch = useDispatch()

   

    


    useEffect(()=>{
        
        const ejecucion = async () => {
            
            const respUsers = await usuariosXRole('USER', token);
            const chatos = await getChats(token,'1','100')

            

           

            chatos.chats.map(chat => {
                if(chat.archivar){
                    setArchivadas(prev => [...prev,chat])
                }

                if(!chat.operador){
                    const cond = bots.includes(chat)
                    
                    
                    if(!cond)
                        setBots(prev => [...prev,chat])
                }

                if(id === chat.operador?.id){
                    setAsignadas(prev => [...prev,chat])
                }
            })

            setChats1(chatos.chats)
            setFiltrados(chatos.chats)
            setLoading(false)
            
            setUsers([...users,...respUsers.users]);
        
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
                alert('Su sesión ha caducado')
                navigate('/auth/signin')
                return
            }
            alert('Su sesión ha caducado')
            navigate('/auth/signin')
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

        
        if(selectedValue === ""){
            filtrados = [...chats1]
        }else if(selectedValue === 'BOT'){
            filtrados = chats1.filter(chat => chat.operador === null)
        }else{
            filtrados = chats1.filter(chat => chat.operador?.id === selectedValue)
        }
        setFiltrados(filtrados)
    }

  

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
                    {loading && (
                        <div className="spinner-lista">
                            <div className="loader2"></div>
                        </div>
                    )}
                    {!loading && chats1.length === 0 && (
                        <p className="msg-error">No hay chats disponibles</p>
                    )}
                    {!loading && chats1.length > 0 && (
                        <>
                            <div className="w-full flex justify-between px-2 items-center mb-4 py-2">
                                <div className="border border-white rounded-none p-2">
                                    {/* Contenido opcional aquí */}
                                    <LuArrowDownFromLine />
                                </div>
                               
                                <div>
                                    <select
                                        id="operador-select"
                                        className="block w-30 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        onChange={handleChangeSelect}
                                    >
                                        <option value="" className="bg-gray-500">Seleccione</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id} className="bg-gray-500">{user.apellido} {user.nombre}</option>
                                        ))}
                                    
                                    </select>
                                </div>
                            </div>
                            {filtrados != undefined && filtrados.map(chat => (
                                <Link 
                                    to={`/dashboard/chats/${chat.id}?telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} 
                                    className="item-lista text-left" 
                                    key={chat.id}
                                    onClick={handleClickLink}
                                >
                                    <div className="flex justify-between px-2">
                                        <p>
                                            {chat.cliente.nombre} - {chat.cliente.telefono}
                                        </p>
                                        {chat?.mensajes?.filter(m => m.leido === false).length > 0 && (
                                            <p className="ml-auto bg-cyan-900  rounded-full text-red w-6 h-6 text-center">
                                                {chat.mensajes.filter(m => m.leido === false).length}
                                            </p>
                                        )}
                                        
                                    </div>
                                    <div className="flex justify-start gap-2 w-full pt-2">
                                       
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                        />
                                        <p className="p-0.5 bg-gray-600  text-center">AC <span className="font-bold text-gray-400" >X</span></p>
                                        <p className="p-0.5 bg-gray-600 text-center">BLACK <span className="font-bold text-gray-400" >X</span></p>
                                        <p className="p-0.5 bg-gray-600 text-center">DEUDA <span className="font-bold text-gray-400" >X</span></p>

                                        
                                    </div>
                                </Link>
                            ))}
                        </>
                    )}
                
                </div>
                <div className="col-lista">
                    <Outlet />
           
                
                </div>
                <div className="col-lista">
                    {viewSide && (
                        <>
                            <div className="w-full">
                                <p className="text-left text-gray-700 font-bold">&#9658;Etiquetas:</p>
                                <div className="bg-white h-20 w-full p-2 flex flex-col justify-start gap-2">
                                    <div className="flex gap-2">
                                        <p className="p-0.5 bg-gray-600  text-center">AC <span className="font-bold text-gray-400" >X</span></p>
                                        <p className="p-0.5 bg-gray-600 text-center">BLACK <span className="font-bold text-gray-400" >X</span></p>
                                        <p className="p-0.5 bg-gray-600 text-center">DEUDA <span className="font-bold text-gray-400" >X</span></p>
                                    </div>
                                
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