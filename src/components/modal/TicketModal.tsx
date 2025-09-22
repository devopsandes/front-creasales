import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { closeModalTeca } from "../../app/slices/actionSlice";
import { useEffect, useRef, useState } from "react";
import { getTicketById } from "../../services/tickets/tickets.services";
import { Ticket } from "../../interfaces/tickets.interface";
import { formatCreatedAt } from "../../utils/functions";
import { Mensaje } from "../../interfaces/chats.interface";
import { findChatById } from "../../services/chats/chats.services";
import { useNavigate } from "react-router-dom";



const TicketModal = () => {
    const [ticket, setTicket] = useState<Ticket>()
    const [mensajes, setMensajes] = useState<Mensaje[]>([])

    const modalTeca = useSelector((state: RootState) => state.action.modalTeca);
    const ticketId = useSelector((state: RootState) => state.action.ticketId);
    
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const mensajesContainerRef = useRef<HTMLDivElement>(null)
    
    
    
    const token = localStorage.getItem("token") || ""

    useEffect(()=>{
        const ejecucion = async () => {
            const resp = await getTicketById(token,ticketId)
            const data = await findChatById(token!, resp.ticket.chat.id)
            if(data.statusCode === 401) {
                alert('Su sesión ha caducado')
                return navigate('/auth/signin')
            }
                        
            setMensajes(data.chat.mensajes)
            setTicket(resp.ticket)
        }
        ejecucion()
    },[])

     useEffect(() => {
            if (mensajesContainerRef.current) {
                mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight
            }
    }, [mensajes]) // Este efecto se ejecuta cada vez que `mensajes` cambia
           
           
    if (!modalTeca) return null;

    const onClose = () => {
        dispatch(closeModalTeca())
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/65 ">
            <div className="bg-white w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 h-[90vh] rounded-xl shadow-lg flex overflow-hidden">
                
                {/* Sidebar izquierdo */}
                <aside className="w-1/4 border-r-black border-r-1 p-4 overflow-y-auto bg-gray-400">
                    <h2 className="text-lg font-semibold mb-4">Propiedades de Ticket</h2>
                    <h3 className="text-lg font-semibold mb-4">Número {ticket?.nro}</h3>

                    <div className="mb-4">
                        <h3 className="font-semibold text-sm text-gray-600">
                        Información de Contacto
                        </h3>
                        <p className="text-gray-800">{ticket?.chat.cliente?.nombre} {ticket?.chat.cliente?.apellido ?? "SIN APELLIDO"}</p>
                        <p className="text-sm text-gray-600">{ticket?.chat.cliente?.email}</p>
                        <p className="text-sm text-gray-600">{ticket?.chat.cliente?.telefono}</p>
                        <p className="text-sm text-gray-600">{ticket?.chat.cliente?.tipo_doc} {ticket?.chat.cliente?.nro_doc}</p>
                        <p className="text-sm text-gray-600">CUIL: {ticket?.chat.cliente?.cuil}</p>


                    </div>

                    <div className="mb-4">
                        <h3 className="font-semibold text-sm text-gray-600">
                        Información clave
                        </h3>
                        <p className="text-gray-800">Propietario: Stella Ledesma</p>
                        <p className="text-sm text-gray-600">Estado: {ticket?.estado.nombre}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm text-gray-600">
                        Información del ticket
                        </h3>
                        <p className="text-gray-800">Canal: WhatsApp</p>
                        <p className="text-sm text-gray-600">ID conv: 26JLIU</p>
                    </div>
                </aside>

                {/* Área principal */}
                <main className="flex-1 flex flex-col bg-gray-500">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b h-1/12">
                        <h2 className="text-lg font-semibold">Gestión: {ticket?.nombre} | Estado: {ticket?.estado.nombre} | Prioridad: {ticket?.prioridad} </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-900 hover:border-gray-100 hover:text-gray-100 font-bold text-xl cursor-pointer rounded-xl border-gray-900 border-1 py-1 px-2"
                        >
                        ×
                        </button>
                    </div>

                {/* Conversación */}
                {/*   <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <div className="mb-4 flex">
                        <p className="text-sm text-gray-700 bg-green-100 p-2 rounded-md w-fit">
                            Ok, muchas gracias
                        </p>
                        <span className="text-xs text-gray-500">{ticket?.chat.cliente?.nombre}</span>
                    </div>
                    <div className="mb-4">
                        <p className="text-sm text-gray-700 bg-gray-200 p-2 rounded-md w-fit">
                            Gracias a vos por comunicarte. Seguiremos en contacto :)
                        </p>
                        <span className="text-xs text-gray-500">Stella Ledesma</span>
                    </div>
                </div>
                */}
                <div className="h-5/6">
                     <div className='overflow-x-hidden overflow-y-scroll w-full h-3/4 relative [&::-webkit-scrollbar]:hidden  bg-[#c0ebfc65]' ref={mensajesContainerRef}>
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
                    <div className="bg-gray-300  border-t-white border-t-1 w-full h-1/4">

                    </div>
                    
                   
                </div>

               
                {/* Footer con input */}
                <div className="p-4 border-t flex gap-4 bg-gray-200 h-1/12">
                    <input
                        type="text"
                        placeholder="Escribir un comentario..."
                        className="flex-1 border-gray-900 border-1 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    />
                    <button className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Enviar
                    </button>
                </div>
                </main>
            </div>
        </div>
    );
}

export default TicketModal