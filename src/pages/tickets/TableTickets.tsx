// TableTickets.tsx

import { useEffect, useState } from "react";
import { FaRegClock, FaCheck,  FaRegCommentDots } from "react-icons/fa";
import { openModalTicket } from "../../app/slices/actionSlice";
import { useDispatch } from "react-redux";
import CrearTicketModal from "../../components/modal/CrearTicketModal";
import { getTickets } from "../../services/tickets/tickets.services";
import { Ticket } from "../../interfaces/tickets.interface";
import { formatCreatedAt } from "../../utils/functions";


const estadoColor = {
  abierto: "bg-green-500",
  cerrado: "bg-gray-500",
  pendiente: "bg-yellow-500",
};

const ITEMS_PER_PAGE = 5;

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
      console.log(resp.tickets);
      setTickets(resp.tickets);
      setLoading(false)
    }
    ejecucion()
  },[])

  return (
    <div className="p-4 w-full h-full">
       {loading ? (
          <div className="spinner-lista">
            <div className="loader2"></div>
          </div>
      ): (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-600 text-left text-sm font-bold text-white grid grid-cols-9">
                  <th className="p-2 col-span-1 flex">#</th>
                  <th className="p-2 col-span-2">Asunto</th>
                  <th className="p-2 col-span-2">Prioridad</th>
                  <th className="p-2 col-span-1">Hora</th>
                  <th className="p-2 col-span-1">Estado</th>
                  <th className="p-2 col-span-1 text-center">Respuestas</th>
                  <th className="p-2 col-span-1 text-center">Comentarios</th>
                </tr>
              </thead>
              <tbody>
                {currentTickets.map((ticket, index) => (
                  <tr key={ticket.id} className="border-b hover:bg-slate-400 grid grid-cols-9 h-full">
                    <td className="p-2 h-full text-sm font-semibold text-gray-800 text-left col-span-1">{index + 1}</td>
                    <td className="p-2 h-full text-sm text-left col-span-2">{ticket.nombre}</td>
                    <td className="p-2 text-sm text-left col-span-2">{ticket.prioridad}</td>
                    <td className="p-2 text-sm flex flex-col items-start gap-2">
                      <FaRegClock /> {formatCreatedAt(ticket.createdAt.toString())}
                    </td>
                    <td className="p-2 text-sm flex items-start">
                      <span
                        className={`text-white text-xs px-2 py-1 rounded ${estadoColor[ticket.estado.nombre.toLowerCase() as keyof typeof estadoColor] || 'bg-gray-500'}`}
                      >
                        {ticket.estado.nombre}
                      </span> 
                    </td>
                    <td className="p-2 text-center">
                      <FaCheck className="inline mr-1 text-green-600" />
                      {ticket.comentarios}
                    </td>
                    <td className="p-2 text-center">
                      <FaRegCommentDots className="inline mr-1 text-blue-600" />
                      {ticket.comentarios}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
      

      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
        <button 
          onClick={() => dispatch(openModalTicket())}
          className="btn flex ml-5 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
        >
          Crear Ticket
        </button>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 border bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-3 py-1 border rounded bg-gray-700 text-white">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 border bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      <CrearTicketModal />
    </div>
  );
};

export default TableTickets;
