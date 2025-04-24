import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChatState } from "../../interfaces/chats.interface"
import { dividirArrayEnTres } from "../../utils/functions"
import {  connectSocket, disconnectSocket, getSocket } from "../../app/slices/socketSlice"
import { useDispatch } from "react-redux"
import { Socket } from "socket.io-client"


const ListaChats = () => {
    const [chats1,setChats1] = useState<ChatState[]>([])
    const [chats2,setChats2] = useState<ChatState[]>([])
    const [chats3,setChats3] = useState<ChatState[]>([])

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
        
        return () => {
            dispatch(disconnectSocket())
        }
    },[dispatch])

   

    useEffect(()=>{

        
        if(!socket) return
        
        const handleChats = (data: ChatState[]) => {
            const arreglo = dividirArrayEnTres(data)
            setChats1(arreglo[0])
            setChats2(arreglo[1])
            setChats3(arreglo[2])
        }

        const handleNuevoChat = (chat: ChatState) => {
            setChats1(prevChats => [chat, ...prevChats])
        }

        const handleError = (error: any) => {
            console.log(error);
            if (error.name === 'TokenExpiredError') {
                alert('Su sesión ha caducado')
                navigate('/auth/signin')
                return
            }
            alert('Su sesión ha caducado')
            navigate('/auth/signin')
            return
        }
        
     

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
                {chats1.map(chat => (
                    <Link to={`/dashboard/chats/id=${chat.id}&telefono=${chat.cliente.telefono}&nombre=${chat.cliente.nombre}`} className="item-lista" key={chat.id}>
                        {chat.cliente.nombre} - {chat.cliente.telefono}
                    </Link>
                ))}
            </div>
            <div className="col-lista">
                {chats2.map(chat => (
                    <Link to={`/dashboard/chats/${chat.cliente.telefono}`} className="item-lista" key={chat.id}>
                        {chat.cliente.nombre} - {chat.cliente.telefono}
                    </Link>
                ))}
               
            </div>
            <div className="col-lista">
                {chats3.map(chat => (
                    <Link to={`/dashboard/chats/${chat.cliente.telefono}`} className="item-lista" key={chat.id}>
                        {chat.cliente.nombre} - {chat.cliente.telefono}
                    </Link>
                ))}
            </div>
        </div>
    </div>
  )
}

export default ListaChats