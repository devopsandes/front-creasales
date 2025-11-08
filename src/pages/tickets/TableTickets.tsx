// TableTickets.tsx

import { useEffect, useState } from "react";
import { FaRegClock, FaCheck,  FaRegCommentDots } from "react-icons/fa";
import { openModalTeca, openModalTicket } from "../../app/slices/actionSlice";
import { useDispatch } from "react-redux";
import CrearTicketModal from "../../components/modal/CrearTicketModal";
import { getTickets } from "../../services/tickets/tickets.services";
import { Ticket } from "../../interfaces/tickets.interface";
import { formatCreatedAt } from "../../utils/functions";
import TicketModal from "../../components/modal/TicketModal";
import './tickets.css';

const estadoClase = {
  abierto: "tickets-estado-abierto",
  cerrado: "tickets-estado-cerrado",
  pendiente: "tickets-estado-pendiente",
};

const ITEMS_PER_PAGE = 7;

const TableTickets = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const totalPages = Math.ceil(tickets.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentTickets = tickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const token  = localStorage.getItem('token') || '';

  const dispatch = useDispatch();

  useEffect(()=>{
    const ejecucion = async () => {
      const resp = await getTickets(token, {limit: '10', page: '1'})
      setTickets(resp.tickets);
      setLoading(false)
    }
    ejecucion()
  },[])

  const handleOpenTicket = (id: string) => {
    dispatch(openModalTeca(id))
  }

  return (
    <div className="tickets-wrapper">
      {/* Header */}
      <div className="tickets-header">
        <h2 className="tickets-header-title">Gestión de Tickets</h2>
        <p className="tickets-header-description">
          Visualice y administre todos los tickets creados en su sistema. Cada ticket está vinculado a una conversación 
          de chat específica, puede estar asignado a un usuario responsable y tiene un estado que refleja su progreso 
          (Abierto, Pendiente, Cerrado). Los tickets se generan automáticamente durante el flujo de procesos dentro de las conversaciones.
        </p>
      </div>

      <div className="tickets-container">
       {loading ? (
          <div className="tickets-loader">
            <div className="loader2"></div>
          </div>
      ): (
        <div className="tickets-table-wrapper">
            <table className="tickets-table">
              <thead className="tickets-table-header">
                <tr className="grid grid-cols-9">
                  <th className="tickets-table-header-cell col-span-1">#</th>
                  <th className="tickets-table-header-cell col-span-2">Asunto</th>
                  <th className="tickets-table-header-cell col-span-2">Prioridad</th>
                  <th className="tickets-table-header-cell col-span-1">Hora</th>
                  <th className="tickets-table-header-cell col-span-1">Estado</th>
                  <th className="tickets-table-header-cell tickets-table-header-cell-center col-span-1">Respuestas</th>
                  <th className="tickets-table-header-cell tickets-table-header-cell-center col-span-1">Comentarios</th>
                </tr>
              </thead>
              <tbody>
                {currentTickets.map((ticket, index) => (
                  <tr key={ticket.id} className="tickets-table-row grid grid-cols-9" onClick={() => handleOpenTicket(ticket.id)}>
                    <td className="tickets-table-cell tickets-table-cell-numero col-span-1">
                      {index + 1} / #{ticket.nro}
                    </td>
                    <td className="tickets-table-cell tickets-table-cell-asunto col-span-2">
                      {ticket.nombre}
                    </td>
                    <td className="tickets-table-cell tickets-table-cell-prioridad col-span-2">
                      {ticket.prioridad}
                    </td>
                    <td className="tickets-table-cell tickets-table-cell-hora col-span-1">
                      <FaRegClock className="tickets-icon-clock" />
                      {formatCreatedAt(ticket.createdAt.toString())}
                    </td>
                    <td className="tickets-table-cell col-span-1">
                      <span className={`tickets-estado-badge ${estadoClase[ticket.estado.nombre.toLowerCase() as keyof typeof estadoClase] || 'tickets-estado-cerrado'}`}>
                        {ticket.estado.nombre}
                      </span> 
                    </td>
                    <td className="tickets-table-cell tickets-table-cell-center col-span-1">
                      <FaCheck className="tickets-icon-check" />
                      <span className="tickets-count">{ticket.comentarios}</span>
                    </td>
                    <td className="tickets-table-cell tickets-table-cell-center col-span-1">
                      <FaRegCommentDots className="tickets-icon-comment" />
                      <span className="tickets-count">{ticket.comentarios}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
      
      {/* Pagination */}
      <div className="tickets-pagination-container">
        <button 
          onClick={() => dispatch(openModalTicket())}
          className="tickets-button-create"
        >
          Crear Ticket
        </button>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="tickets-pagination-button"
        >
          Anterior
        </button>
        <span className="tickets-pagination-info">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="tickets-pagination-button"
        >
          Siguiente
        </button>
      </div>
      <CrearTicketModal />
      <TicketModal />
      </div>
    </div>
  );
};

export default TableTickets;
