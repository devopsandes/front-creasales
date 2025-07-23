// TableTickets.tsx

import { useState } from "react";
import { FaRegClock, FaCheck,  FaRegCommentDots } from "react-icons/fa";

interface Ticket {
  id: number;
  asunto: string;
  solicitante: string;
  hora: string;
  estado: "Open" | "Closed" | "En Proceso" | "On Hold";
  respuestas: number;
  comentarios: number;
}

const mockTickets: Ticket[] = [
  {
    id: 248031,
    asunto: "MEDICACION",
    solicitante: "MERELLES CASTRO ORIANA ARAMI",
    hora: "08:42 AM",
    estado: "Open",
    respuestas: 1,
    comentarios: 1,
  },
  {
    id: 248026,
    asunto: "PROBLEMAS AL UTILIZAR EL SERVICIO: PRESTADOR",
    solicitante: "TAVERA MARCELO ANTONIO",
    hora: "hace 27 minutos",
    estado: "Open",
    respuestas: 1,
    comentarios: 2,
  },
  {
    id: 248010,
    asunto: "ANTICONCEPTIVOS",
    solicitante: "CUELLO GABRIELA JUDITH",
    hora: "05:48 AM",
    estado: "Closed",
    respuestas: 1,
    comentarios: 1,
  },
  {
    id: 247950,
    asunto: "PROBLEMAS AL UTILIZAR SERVICIO: PRESTADOR",
    solicitante: "PARDO MARIANA IVON",
    hora: "hace 17 horas",
    estado: "Open",
    respuestas: 2,
    comentarios: 3,
  },
  {
    id: 247940,
    asunto: "CRONICIDAD",
    solicitante: "LEIVA OLIVIA FRANCISCA",
    hora: "08:46 AM",
    estado: "Closed",
    respuestas: 0,
    comentarios: 1,
  },
];

const estadoColor = {
  Open: "bg-green-500",
  Closed: "bg-gray-500",
  "En Proceso": "bg-orange-500",
  "On Hold": "bg-yellow-500",
};

const ITEMS_PER_PAGE = 5;

const TableTickets = () => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(mockTickets.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentTickets = mockTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-4 w-full h-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-600 text-left text-sm font-bold text-white grid grid-cols-9">
              <th className="p-2 col-span-1">#</th>
              <th className="p-2 col-span-2">Asunto</th>
              <th className="p-2 col-span-2">Solicitante</th>
              <th className="p-2 col-span-1">Hora</th>
              <th className="p-2 col-span-1">Estado</th>
              <th className="p-2 col-span-1 text-center">Respuestas</th>
              <th className="p-2 col-span-1 text-center">Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {currentTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b hover:bg-slate-400 grid grid-cols-9 h-full">
                <td className="p-2 h-full text-sm font-semibold text-gray-800 text-left col-span-1">{ticket.id}</td>
                <td className="p-2 h-full text-sm text-left col-span-2">{ticket.asunto}</td>
                <td className="p-2 text-sm text-left col-span-2">{ticket.solicitante}</td>
                <td className="p-2 text-sm flex flex-col items-start gap-2">
                  <FaRegClock /> {ticket.hora}
                </td>
                <td className="p-2 text-sm flex items-start">
                  <span
                    className={`text-white text-xs px-2 py-1 rounded ${estadoColor[ticket.estado]}`}
                  >
                    {ticket.estado}
                  </span> 
                </td>
                <td className="p-2 text-center">
                  <FaCheck className="inline mr-1 text-green-600" />
                  {ticket.respuestas}
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

      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
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
    </div>
  );
};

export default TableTickets;
