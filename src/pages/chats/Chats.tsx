import React, { FormEvent, useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { FaCircleUser } from "react-icons/fa6"
import { findChatById, getUserData } from '../../services/chats/chats.services'
import { Mensaje } from '../../interfaces/chats.interface'
import { formatCreatedAt, menos24hs } from '../../utils/functions'
import { Socket } from 'socket.io-client'
import { getSocket, connectSocket } from '../../app/slices/socketSlice'
import { useDispatch } from 'react-redux'
import UserSearchModal from '../../components/modal/UserSearchModal'
import { FaFileArrowDown } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { openModal, setUserData, setViewSide, switchModalPlantilla } from '../../app/slices/actionSlice'
import { IoIosAttach } from "react-icons/io";
import { FaMicrophone } from "react-icons/fa";
import ModalPlantilla from '../../components/modal/ModalPlantilla'
import './chats.css'
import { toast } from 'react-toastify'
import { usuariosXRole } from '../../services/auth/auth.services'
import { Usuario } from '../../interfaces/auth.interface'






const Chats = () => {
    const [usuarios,setUsuarios] = useState<Usuario[]>([])
    const [mensajes, setMensajes] = useState<Mensaje[]>([])
    const [mensaje, setMensaje] = useState<string>('')
    const [condChat, setCondChat] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [archivo, setArchivo] = useState<File | null>(null);
    const [showList, setShowList] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<Usuario[]>([]);

    const fileInputRef = useRef<HTMLInputElement | null>(null);



    const token = localStorage.getItem('token') || ''

    const location = useLocation()
    
   
    const id = useParams().id 
    const queryParams = new URLSearchParams(location.search);
    const telefono = queryParams.get('telefono');
    const nombre = queryParams.get('nombre');

  

    // Referencia para el contenedor de mensajes
    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    let socket: Socket | null = null

    useEffect(() => {
        const ejecucion = async () => {
            const respUsers = await usuariosXRole('USER', token);
            setUsuarios(respUsers.users);
        }
        ejecucion();
    }, [])


    useEffect(() => {
        const ejecucion = async () => {
            const resp = await getUserData(telefono!);
            dispatch(setUserData(resp));
            dispatch(setViewSide(true))
            
            if (resp.statusCode === 401) {
                alert('Su sesión ha caducado')
                return navigate('/auth/signin')
            }
        }
        ejecucion();
    },[, location])

  

    
    
    useEffect(()=>{
        dispatch(connectSocket())
        socket = getSocket()
        setLoading(true)
        socket?.emit('register',telefono)
        return () => {
            // dispatch(disconnectSocket())
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
            console.log(archivo == null);
            
            if(mensaje.length === 0 && archivo == null)
                return alert('Debe escribir un mensaje')
            socket = getSocket()
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

    const handleArchivar = () => {
        const conf = confirm('¿Quiere archivar el siguiente chat?');
        if(!conf) return
        try {
            const msj: Mensaje = {
                msg_salida: mensaje,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            setMensajes(prevChats => [...prevChats,msj])            
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


    const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMensaje(value);

        const match = mensaje.match(/@(\w*)$/);
        if (match) {
        const query = match[1].toLowerCase();
        const results = usuarios.filter((u) =>
            u.nombre.toLowerCase().startsWith(query)
        );
        setFilteredUsers(results);
        setShowList(true);
        } else {
        setShowList(false);
        }
    }

    const handleSelectUser = (user: any) => {
        const newText = mensaje.replace(/@\w*$/, `@${user.name} `);
        setMensaje(newText);
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

                                {showList && (
                                    <ul className="absolute bottom-12 left-2 bg-white border rounded-md shadow-md w-48 max-h-40 overflow-y-auto z-10 [&::-webkit-scrollbar]:hidden ">
                                    {filteredUsers.length ? (
                                        filteredUsers.map((user) => (
                                        <li
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-gray-700 text-left"
                                        >
                                            @{user.nombre}
                                        </li>
                                        ))
                                    ) : (
                                        <li className="px-3 py-2 text-gray-400">No hay coincidencias</li>
                                    )}
                                    </ul>
                                )}
                                <button
                                    type='button'
                                    onClick={() => alert('no implentado')}
                                >
                                    <FaMicrophone size={25} className='text-gray-700 cursor-pointer'/>
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
                    <ModalPlantilla />
                    <UserSearchModal  />
                </div>
            )}
           
        </div>
    )
}

export default Chats