import { Link, Outlet, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChatState } from "../../interfaces/chats.interface"
// import { dividirArrayEnTres } from "../../utils/functions"
import {  connectSocket, disconnectSocket, getSocket } from "../../app/slices/socketSlice"
import { useDispatch } from "react-redux"
import { Socket } from "socket.io-client"
import './chats.css'
import { usuariosXRole } from "../../services/auth/auth.services"
import { Usuario } from "../../interfaces/auth.interface"


const ListaChats = () => {
    const [chats1,setChats1] = useState<ChatState[]>([])
    // const [chats2,setChats2] = useState<ChatState[]>([])
    // const [chats3,setChats3] = useState<ChatState[]>([])
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

    // const conectado = useSelector((state: RootState) => state.socket.isConnected);

    const token  = localStorage.getItem('token') || '';

    

    const navigate = useNavigate()
    const dispatch = useDispatch()
    let socket: Socket | null = null


    useEffect(()=>{
        const ejecucion = async () => {
            const respUsers = await usuariosXRole('USER', token);
            
            setUsers([...users,...respUsers.users]);
        
        }
        ejecucion();
      
    },[])

    useEffect(() => {

        try {
            dispatch(connectSocket())
            socket = getSocket()
            setLoading(true)
            
            
            return () => {
                if(!socket?.connected){
                    /* alert('Su sesión ha caducado, por favor inicie sesión nuevamente');
                    navigate('/auth/signin')
                    return */
                }
                dispatch(disconnectSocket())
            }
        } catch (error) {
            console.log(error);
        }
        
       
    },[dispatch])

   

    useEffect(()=>{

        
        if(!socket) return
        
        const handleChats = (data: ChatState[]) => {
            //TENGO QUE PONER UNA CONDICION PARA UN SPINNER
            // const arreglo = dividirArrayEnTres(data)
            setChats1(data)
            setFiltrados(data)
            // setChats2(arreglo[1])
            // setChats3(arreglo[2])
            
            setLoading(false)
        }

        const handleNuevoChat = (chat: ChatState) => {
            setChats1(prevChats => [chat, ...prevChats])
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

       /*  const handleDisconnect = () => {
            console.log('Se ha desconectado del socket');
            
            alert('Su sesión ha caducado')
            navigate('/auth/signin')
            return
        } */
        
        // socket.on('disconnect', handleDisconnect)

        socket.on('nuevo-chat',handleNuevoChat)

        socket.on('error',handleError)

        socket.on('chats',handleChats)

        return () => {
            socket!.off('nuevo-chat', handleNuevoChat)
            socket!.off('error', handleError)
            socket!.off('chats', handleChats)
        }
    },[socket]) 

    const handleChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value
        let filtrados: ChatState[] = []

        
        if(selectedValue === ""){
            filtrados = [...chats1]
        }else if(selectedValue === 'BOT'){
            filtrados = chats1.filter(chat => chat.operador.id === null)
        }else{
            filtrados = chats1.filter(chat => chat.operador.id === selectedValue)
        }
        setFiltrados(filtrados)
    }

  return (
     <div className="chats-container">
        <div className='main-chat'>
            <div className="header-lista">
                <div className="header-item">
                    <button 
                        onClick={() => alert('No implementado')} 
                        className="btn-item"
                    >
                        Asignadas a mí
                        <span>99</span>
                    </button>
                    
                </div>
                <div className="header-item">
                    <div>
                        <select
                            id="operador-select"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            onChange={handleChangeSelect}
                        >
                            <option value="" className="bg-gray-500">Selecciona un operador</option>
                            {users.map(user => (
                                <option value={user.id} className="bg-gray-500">{user.apellido} {user.nombre}</option>
                            ))}
                           
                        </select>
                    </div>
                
                   
                </div>
                <div className="header-item">
                    <button 
                        onClick={() => alert('No implementado')} 
                        className="btn-item"
                    >
                        Archivadas
                        <span>99</span>
                    </button>
                   
                </div>
                 <div className="header-item">
                     <button 
                        onClick={() => alert('No implementado')} 
                        className="btn-item"
                    >
                        Menciones
                        <span>99</span>
                    </button>
                   
                </div>
                 <div className="header-item">
                     <button 
                        onClick={() => alert('No implementado')} 
                        className="btn-item"
                    >
                        Bots
                        <span>99</span>
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
                    {!loading && chats1.length > 0 && 
                        filtrados.map(chat => (
                            <Link to={`/dashboard/chats/${chat.id}?telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} className="item-lista" key={chat.id}>
                                {chat.cliente.nombre} - {chat.cliente.telefono}
                            </Link>
                        ))
                    }
                
                </div>
                <div className="col-lista">
                    <Outlet />
            {/*  {loading && (
                        <div className="spinner-lista">
                            <div className="loader2"></div>
                        </div>
                    )}
                    {!loading && chats1.length === 0 && (
                        <p className="msg-error">No hay chats disponibles</p>
                    )}
                    {!loading && chats2.length > 0 && 
                        chats2.map(chat => (
                            <Link to={`/dashboard/chats/id=${chat.id}&telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} className="item-lista" key={chat.id}>
                                {chat.cliente.nombre} - {chat.cliente.telefono}
                            </Link>
                        ))
                    }
                    */}
                
                </div>
                <div className="col-lista">
                {/* {loading && (
                        <div className="spinner-lista">
                            <div className="loader2"></div>
                        </div>
                    )}
                    {!loading && chats1.length === 0 && (
                        <p className="msg-error">No hay chats disponibles</p>
                    )}
                    {!loading && chats3.length > 0 && 
                        chats3.map(chat => (
                            <Link to={`/dashboard/chats/id=${chat.id}&telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} className="item-lista" key={chat.id}>
                                {chat.cliente.nombre} - {chat.cliente.telefono}
                            </Link>
                        ))
                    } */}
                
                </div>
            </div>
        </div>
    </div>

  )
}

export default ListaChats