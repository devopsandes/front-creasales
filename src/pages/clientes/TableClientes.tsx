// TableTickets.tsx

import { useEffect, useState } from "react";
import { FaCheck,  FaRegCommentDots } from "react-icons/fa";
import { openModalTicket } from "../../app/slices/actionSlice";
import { useDispatch } from "react-redux";
import CrearTicketModal from "../../components/modal/CrearTicketModal";
import { getTickets } from "../../services/tickets/tickets.services";
import { Ticket } from "../../interfaces/tickets.interface";
import { formatCreatedAt } from "../../utils/functions";
import { getClientes } from "../../services/clientes/clientes.services";
import { Cliente } from "../../interfaces/cliente.interface";

/* interface Ticket {
  id: number;
  asunto: string;
  solicitante: string;
  hora: string;
  estado: "Open" | "Closed" | "En Proceso" | "On Hold";
  respuestas: number;
  comentarios: number;
} */

/* const mockTickets: Ticket[] = [
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
 */
const estadoColor = {
  abierto: "bg-green-500",
  cerrado: "bg-gray-500",
  // "En Proceso": "bg-orange-500",
  pendiente: "bg-yellow-500",
};

const ITEMS_PER_PAGE = 5;

const TableClientes = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const totalPages = Math.ceil(clientes.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentClientes = clientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const token  = localStorage.getItem('token') || '';

  const dispatch = useDispatch();

  useEffect(()=>{
    const ejecucion = async () => {
      const resp = await getClientes(token, {limit: '10', page: '1'})
      console.log(resp.clientes);
      setClientes(resp.clientes);
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
                  <th className="p-2 col-span-2">Nombre</th>
                  <th className="p-2 col-span-2">Teléfono</th>
                  <th className="p-2 col-span-1">Email</th>
                  <th className="p-2 col-span-1">Tipo</th>
                  <th className="p-2 col-span-1 text-center">Número</th>
                  <th className="p-2 col-span-1 text-center">CreatedAt</th>
                </tr>
              </thead>
              <tbody>
                {currentClientes.map((cliente, index) => (
                  <tr key={cliente.id} className="border-b hover:bg-slate-400 grid grid-cols-9 h-full">
                    <td className="p-2 h-full text-sm font-semibold text-gray-800 text-left col-span-1">{index + 1}</td>
                    <td className="p-2 h-full text-sm text-left col-span-2">{cliente.nombre}</td>
                    <td className="p-2 text-sm text-left col-span-2">{cliente.telefono}</td>
                   
                    <td className="p-2 text-sm flex items-start">
                      <span
                        className={`text-white text-xs px-2 py-1 rounded bg-gray-500`}
                      >
                        {cliente.email ?? "no email"}
                      </span> 
                    </td>
                    <td className="p-2 text-center">
                      {cliente.tipo_doc ?? "sin tipo"}
                    </td>
                    <td className="p-2 text-center">
                      {cliente.nro_doc ?? "sin nro"}
                    </td>
                    <td className="p-2 text-sm flex  items-start gap-2">
                      {formatCreatedAt(cliente.createdAt.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
      

      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
       {/*  <button 
          onClick={() => dispatch(openModalTicket())}
          className="btn flex ml-5 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
        >
          Crear Ticket
        </button> */}
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
      {/* <CrearTicketModal /> */}
    </div>
  );
};

export default TableClientes;
