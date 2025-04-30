import { FormEvent, useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { findChatById } from '../../services/chats/chats.services'
import { Mensaje } from '../../interfaces/chats.interface'
import { formatCreatedAt, menos24hs } from '../../utils/functions'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from '../../app/slices/socketSlice'
import { useDispatch } from 'react-redux'
import './chats.css'



const Chats = () => {
    const [mensajes, setMensajes] = useState<Mensaje[]>([])
    const [mensaje, setMensaje] = useState<string>('')
    const [condChat, setCondChat] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)

    const location = useLocation()
    const token = localStorage.getItem('token')
    const ahre = location.pathname.split('/')
    const query = ahre[ahre.length - 1]
    const ops = query.split('&')
    const id = ops[0].split('=')[1]
    const telefono = ops[1].split('=')[1]
    const nombre = ops[2].split('=')[1]

    // Referencia para el contenedor de mensajes
    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    let socket: Socket | null = null

   
    useEffect(()=>{
        dispatch(connectSocket())
        socket = getSocket()
        setLoading(true)
        return () => {
            dispatch(disconnectSocket())
        }
    },[dispatch])

    useEffect(()=>{
        
        if(!socket) return

        const handleNewMessage = (mensaje: Mensaje) => {
            setCondChat(menos24hs(mensaje.createdAt))
            setMensajes(prevChats => [...prevChats,mensaje])
        }

        const handleError = (error: any) => {
            console.log(error);
            if (error.name === 'TokenExpiredError') {
                alert('Su sesión ha caducado')
                navigate('/auth/signin')
                return
            }
        }

       
        socket.on('new-message',handleNewMessage)
        socket.on('error',handleError)

        return () => {
            socket!.off('new-message', handleNewMessage)
            socket!.off('error', handleError)
        }
    },[socket])

    useEffect(() => {
        // Obtener los mensajes del chat
        const inicio = async () => {
            const data = await findChatById(token!, id)
            setMensajes(data.chat.mensajes)
            const ultimo = data.chat.mensajes[data.chat.mensajes.length - 1]
            console.log(ultimo.createdAt);
            setCondChat(menos24hs(ultimo.createdAt))
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

    const handleClickBtn = (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()
            setMensaje('')
            socket = getSocket()
            if (socket && socket.connected) {
               const objMsj = {
                mensaje,
                chatId: id,
                telefono,
                token
               }
                socket.emit("enviar-mensaje", objMsj);
            } else {
                console.warn("Socket desconectado, enviando por HTTP...");
                //await axios.post("/api/mensajes", { contenido: mensaje, usuarioId: "12345", chatId: "67890" });
            }
        } catch (error) {
            console.log(error);
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
                    <div className='header-chat'>
                        <div className='header-icon'>
                            <FaCircleUser size={25} />
                        </div>
                        <p className='nombre-chat'>
                            <span className=''>+{telefono}</span>
                            <span className=''>{nombre}</span>
                        </p>
                    </div>
                    <div className='body-chat' ref={mensajesContainerRef}>
                        {mensajes.map((msj, index) => (
                            <div key={index} className={`${msj.msg_entrada ? 'contenedor-entrada' : 'contenedor-salida'}`}>
                                <p className={`${msj.msg_entrada ? 'mensaje-entrada' : 'mensaje-salida'}`}>
                                    {msj.msg_entrada ? msj.msg_entrada : msj.msg_salida}
                                </p>
                                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                            </div>
                        ))}
                    </div>
                    <div className='footer-chat'>
                        {condChat ? (
                            <form action="" className='enviar-msj' onSubmit={handleClickBtn}>
                                <input 
                                    type="text" 
                                    placeholder='Escriba un mensaje' 
                                    className='input-msg'
                                    value={mensaje}
                                    onChange={(e) => setMensaje(e.target.value)}
                                />
                                <button type='submit' className='btn-msg'>Enviar</button>
                            </form>
                        ) : (
                            <div className='no-chat'>
                                <p className='no-chat-text'>No se pueden enviar mensajes</p>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}
           
        </div>
    )
}

export default Chats