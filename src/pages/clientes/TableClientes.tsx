import { useEffect, useState } from "react";
import { formatCreatedAt } from "../../utils/functions";
import { getClientes } from "../../services/clientes/clientes.services";
import { Cliente } from "../../interfaces/cliente.interface";




const ITEMS_PER_PAGE = 15;

const TableClientes = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const totalPages = Math.ceil(clientes.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentClientes = clientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const token  = localStorage.getItem('token') || '';


  useEffect(()=>{
    const ejecucion = async () => {
      const resp = await getClientes(token, {limit: '10', page: '1'})
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
