import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { closeModalTeca, openSessionExpired } from "../../app/slices/actionSlice";
import { useEffect, useRef, useState } from "react";
import { getTicketById } from "../../services/tickets/tickets.services";
import { Ticket } from "../../interfaces/tickets.interface";
import { formatCreatedAt } from "../../utils/functions";
import { Mensaje } from "../../interfaces/chats.interface";
import { findChatById } from "../../services/chats/chats.services";
import { X, MessageSquare } from 'lucide-react';
import './ticket-detail-modal.css';

const TicketModal = () => {
    const [ticket, setTicket] = useState<Ticket>()
    const [mensajes, setMensajes] = useState<Mensaje[]>([])
    const [chatData, setChatData] = useState<any>(null)

    const modalTeca = useSelector((state: RootState) => state.action.modalTeca);
    const ticketId = useSelector((state: RootState) => state.action.ticketId);

    const dispatch = useDispatch();
    const mensajesContainerRef = useRef<HTMLDivElement>(null)

    const token = localStorage.getItem("token") || ""

    useEffect(() => {
        if (modalTeca && ticketId) {
            const ejecucion = async () => {
                const resp = await getTicketById(token, ticketId)
                setTicket(resp.ticket)

                //Solo buscar chat si existe chat_id
                if (resp.ticket.chat?.id) {
                    const data = await findChatById(token, resp.ticket.chat.id)
                    if (data.statusCode === 401) {
                        dispatch(openSessionExpired())
                        dispatch(closeModalTeca())
                        return
                    }
                    setMensajes(data.chat.mensajes)
                    setChatData(data.chat)
                }
            }
            ejecucion()
        }
    }, [modalTeca, ticketId])

    useEffect(() => {
        if (mensajesContainerRef.current) {
            mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight
        }
    }, [mensajes])

    if (!modalTeca) return null;

    const onClose = () => {
        dispatch(closeModalTeca())
    }

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const clienteData = ticket?.chat?.cliente || ticket?.afiliadoData;

    return (
        <div className="ticket-detail-modal-overlay" onClick={handleOverlayClick}>
            <div className="ticket-detail-modal-container">
                <button className="ticket-detail-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="ticket-detail-modal-header">
                    <div className="ticket-detail-modal-icon">
                        <MessageSquare size={24} />
                    </div>
                    <div className="ticket-detail-modal-title-section">
                        <h2 className="ticket-detail-modal-title">Propiedades del Ticket #{ticket?.nro}</h2>
                        <p className="ticket-detail-modal-subtitle">{ticket?.nombre}</p>
                    </div>
                </div>

                <div className="ticket-detail-modal-info-section">
                    <div className="ticket-detail-modal-info-row">
                        <div className="ticket-detail-modal-info-group">
                            <h3 className="ticket-detail-info-group-title">Información de Contacto</h3>
                            <div className="ticket-detail-modal-info">
                                <div className="ticket-detail-info-item">
                                    <span className="ticket-detail-info-label">Cliente:</span>
                                    <span className="ticket-detail-info-value">
                                        {clienteData?.apellNomb || `${clienteData?.nombre || ''} ${clienteData?.apellido || ''}`.trim() || 'Sin información'}
                                    </span>
                                </div>
                                {clienteData?.cuil && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">CUIL:</span>
                                        <span className="ticket-detail-info-value">{clienteData.cuil}</span>
                                    </div>
                                )}
                                {clienteData?.nroDocumento && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">DNI:</span>
                                        <span className="ticket-detail-info-value">{clienteData.nroDocumento}</span>
                                    </div>
                                )}
                                {(clienteData?.email || clienteData?.mail) && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Email:</span>
                                        <span className="ticket-detail-info-value">{clienteData.email || clienteData.mail}</span>
                                    </div>
                                )}
                                {(clienteData?.telefono || clienteData?.numCelular) && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Teléfono:</span>
                                        <span className="ticket-detail-info-value">{clienteData.telefono || clienteData.numCelular}</span>
                                    </div>
                                )}
                                {clienteData?.nroAfiliado && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Nro Afiliado:</span>
                                        <span className="ticket-detail-info-value">{clienteData.nroAfiliado}</span>
                                    </div>
                                )}
                                {clienteData?.planPrestacional && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Plan:</span>
                                        <span className="ticket-detail-info-value">{clienteData.planPrestacional}</span>
                                    </div>
                                )}
                                {clienteData?.obraSocial && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Obra Social:</span>
                                        <span className="ticket-detail-info-value">{clienteData.obraSocial}</span>
                                    </div>
                                )}
                                {clienteData?.provincia && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Provincia:</span>
                                        <span className="ticket-detail-info-value">{clienteData.provincia}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="ticket-detail-modal-info-group">
                            <h3 className="ticket-detail-info-group-title">Información del Ticket</h3>
                            <div className="ticket-detail-modal-info">
                                {chatData?.operador && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Propietario:</span>
                                        <span className="ticket-detail-info-value">{chatData.operador.nombre} {chatData.operador.apellido}</span>
                                    </div>
                                )}
                                <div className="ticket-detail-info-item">
                                    <span className="ticket-detail-info-label">Estado:</span>
                                    <span className={`ticket-detail-info-value ticket-detail-status-${ticket?.estado.nombre.toLowerCase()}`}>
                                        {ticket?.estado.nombre}
                                    </span>
                                </div>
                                <div className="ticket-detail-info-item">
                                    <span className="ticket-detail-info-label">Prioridad:</span>
                                    <span className="ticket-detail-info-value">{ticket?.prioridad}</span>
                                </div>
                                {ticket?.canal && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">Canal:</span>
                                        <span className="ticket-detail-info-value">{ticket.canal}</span>
                                    </div>
                                )}
                                {(chatData?.thread_id || ticket?.chat?.thread_id) && (
                                    <div className="ticket-detail-info-item">
                                        <span className="ticket-detail-info-label">ID Conversación:</span>
                                        <span className="ticket-detail-info-value">{chatData?.thread_id || ticket?.chat?.thread_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {ticket?.canal !== 'SEDE' && (
                    <>

                        <div className="ticket-detail-modal-chat-section">
                            <h3 className="ticket-detail-info-group-title">Chat del Ticket</h3>
                        </div>

                        <div className="ticket-detail-modal-messages" ref={mensajesContainerRef}>
                            {mensajes.length === 0 ? (
                                <div className="ticket-detail-empty">
                                    <p className="ticket-detail-empty-text">No hay comentarios disponibles</p>
                                </div>
                            ) : (
                                mensajes.map((msj, index) => (
                                    msj.msg_salida === '%archivado%' ? (
                                        <div className='ticket-detail-message-archived' key={index}>
                                            <p className='ticket-detail-message-archived-text'>Archivado</p>
                                            <span className='ticket-detail-timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                        </div>
                                    ) : (
                                        <div key={index} className={`ticket-detail-message ${msj.msg_entrada ? 'ticket-detail-message-incoming' : 'ticket-detail-message-outgoing'}`}>
                                            <p className={`ticket-detail-message-text ${msj.msg_entrada ? 'ticket-detail-message-text-incoming' : 'ticket-detail-message-text-outgoing'}`}>
                                                {msj.msg_entrada ? msj.msg_entrada : msj.msg_salida}
                                            </p>
                                            <span className='ticket-detail-timestamp'>{formatCreatedAt(`${msj.createdAt}`)}</span>
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default TicketModal
