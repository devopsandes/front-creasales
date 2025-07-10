import { FormEvent, useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { findChatById } from '../../services/chats/chats.services'
import { Mensaje } from '../../interfaces/chats.interface'
import { formatCreatedAt, menos24hs } from '../../utils/functions'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from '../../app/slices/socketSlice'
import { useDispatch } from 'react-redux'
import UserSearchModal from '../../components/modal/UserSearchModal'
import { FaFileArrowDown } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { openModal } from '../../app/slices/actionSlice'
import './chats.css'



const Chats = () => {
    const [mensajes, setMensajes] = useState<Mensaje[]>([])
    const [mensaje, setMensaje] = useState<string>('')
    const [condChat, setCondChat] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)


    const location = useLocation()
    const token = localStorage.getItem('token')
   
    const id = useParams().id 
    const queryParams = new URLSearchParams(location.search);
    const telefono = queryParams.get('telefono');
    const nombre = queryParams.get('nombre');

  

    // Referencia para el contenedor de mensajes
    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    let socket: Socket | null = null

  

    
    
    useEffect(()=>{
        dispatch(connectSocket())
        socket = getSocket()
        setLoading(true)
        socket?.emit('register',telefono)
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

        const handleMsjArchivar = (mensaje: Mensaje) => {
            setMensajes(prevChats => [...prevChats,mensaje])
            
        }

        socket.on(`new-message`,handleNewMessage)
        socket.on('msj-archivar',handleMsjArchivar)
        socket.on('error',handleError)

        return () => {
            socket!.off(`new-message`, handleNewMessage)
            socket!.off('error', handleError)
        }
    },[socket])

    useEffect(() => {
        // Obtener los mensajes del chat
        const inicio = async () => {
            const data = await findChatById(token!, id!)
            if(data.statusCode === 401) {
                alert('Su sesión ha caducado')
                return navigate('/auth/signin')
            }
            
            setMensajes(data.chat.mensajes)
            let ultimo = data.chat.mensajes[data.chat.mensajes.length - 1]
            if(ultimo.msg_salida === '%archivado%'){
                // con este bloque condicional verificamos que el ultimo mensaje no sea el de archivado, si lo es, tomamos el penúltimo
                ultimo = data.chat.mensajes[data.chat.mensajes.length - 2]
            }
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

    const handleArchivar = () => {
        const conf = confirm('¿Quiere archivar el siguiente chat?');
        if(!conf) return
        try {
            socket = getSocket()
            if (socket && socket.connected) {
               const objMsj = {
                mensaje,
                chatId: id,
                telefono,
                token
               }
               
                socket.emit("archivar", objMsj);
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
                        <div className='ml-96 w-full flex justify-end p-14 gap-6'>
                            <button
                                onClick={() => dispatch(openModal())}
                                className="btn flex gap-2 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
                            >
                                <IoPersonAdd />
                                <span>Asignar</span>
                            </button>
                            <button
                                onClick={handleArchivar}
                                className="btn flex gap-2 rounded-xl cursor-pointer bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
                            >
                                <FaFileArrowDown />
                                <span>Archivar</span>
                            </button>
                        </div>
                    </div>
                    <div className='body-chat' ref={mensajesContainerRef}>
                        {mensajes.map((msj, index) => (
                            msj.msg_salida === '%archivado%' ? (
                                <div className='contenedor-archivado' key={index}>
                                    <p className='mensaje-archivado'> Archivado</p>
                                    <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                </div>
                            ) : (
                            <div key={index} className={`${msj.msg_entrada ? 'contenedor-entrada' : 'contenedor-salida'}`}>
                                <p className={`${msj.msg_entrada ? 'mensaje-entrada' : 'mensaje-salida'}`}>
                                    {msj.msg_entrada ? msj.msg_entrada : msj.msg_salida}
                                </p>
                                <span className='timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>

                            </div>
                            )
                          
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

                    <UserSearchModal  />
                </div>
            )}
           
        </div>
    )
}

export default Chats