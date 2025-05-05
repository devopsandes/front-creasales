import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChatState } from "../../interfaces/chats.interface"
import { dividirArrayEnTres } from "../../utils/functions"
import {  connectSocket, disconnectSocket, getSocket } from "../../app/slices/socketSlice"
import { useDispatch } from "react-redux"
import { Socket } from "socket.io-client"
import './chats.css'


const ListaChats = () => {
    const [chats1,setChats1] = useState<ChatState[]>([])
    const [chats2,setChats2] = useState<ChatState[]>([])
    const [chats3,setChats3] = useState<ChatState[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const navigate = useNavigate()
    const dispatch = useDispatch()
    let socket: Socket | null = null


    /* useEffect(()=>{
        
        socket = io(`${import.meta.env.VITE_URL_BACK}`,{
            transports: ['websocket'],
            withCredentials: true,
            auth: {
                token: localStorage.getItem('token')
            }
        });

        return () => {
          socket.disconnect(); 
        };
    },[]) */

    useEffect(() => {
        
        dispatch(connectSocket())
        socket = getSocket()
        setLoading(true)
        return () => {
            dispatch(disconnectSocket())
        }
    },[dispatch])

   

    useEffect(()=>{

        
        if(!socket) return
        
        const handleChats = (data: ChatState[]) => {
            //TENGO QUE PONER UNA CONDICION PARA UN SPINNER
            const arreglo = dividirArrayEnTres(data)
            setChats1(arreglo[0])
            setChats2(arreglo[1])
            setChats3(arreglo[2])
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

  return (
    <div className='main-chat'>
        <div className="header-lista">
            <div className="header-item">
                <p>Estado</p>
                <select name="" id="" className="select-empresa">
                    <option value="">Opcion 1</option>
                </select>
            </div>
            <div className="header-item">
                <p>Categoria</p>
                <select name="" id="" className="select-empresa">
                    <option value="">Opcion 1</option>
                </select>
            </div>
            <div className="header-item">
                <p>Operador</p>
                <select name="" id="" className="select-empresa">
                    <option value="">Opcion 1</option>
                </select>
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
                    chats1.map(chat => (
                        <Link to={`/dashboard/chats/id=${chat.id}&telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} className="item-lista" key={chat.id}>
                            {chat.cliente.nombre} - {chat.cliente.telefono}
                        </Link>
                    ))
                }
               
            </div>
            <div className="col-lista">
            {loading && (
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
               
               
            </div>
            <div className="col-lista">
            {loading && (
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
                }
               
            </div>
        </div>
    </div>
  )
}

export default ListaChats