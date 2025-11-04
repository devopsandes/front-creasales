import { useEffect, useState } from "react";
import { formatCreatedAt } from "../../utils/functions";
import { getClientes } from "../../services/clientes/clientes.services";
import { Cliente } from "../../interfaces/cliente.interface";
import './clientes.css';




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
    <div className="clientes-container">
       {loading ? (
          <div className="clientes-loader">
            <div className="loader2"></div>
          </div>
      ): (
        <div className="clientes-table-wrapper">
            <table className="clientes-table">
              <thead className="clientes-table-header">
                <tr className="grid grid-cols-9">
                  <th className="clientes-table-header-cell col-span-1">#</th>
                  <th className="clientes-table-header-cell col-span-2">Nombre</th>
                  <th className="clientes-table-header-cell col-span-2">Teléfono</th>
                  <th className="clientes-table-header-cell col-span-1">Email</th>
                  <th className="clientes-table-header-cell col-span-1">Tipo</th>
                  <th className="clientes-table-header-cell clientes-table-header-cell-center col-span-1">Número</th>
                  <th className="clientes-table-header-cell clientes-table-header-cell-center col-span-1">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {currentClientes.map((cliente, index) => (
                  <tr key={cliente.id} className="clientes-table-row grid grid-cols-9">
                    <td className="clientes-table-cell clientes-table-cell-id col-span-1">
                      {index + 1}
                    </td>
                    <td className="clientes-table-cell clientes-table-cell-nombre col-span-2">
                      {cliente.nombre}
                    </td>
                    <td className="clientes-table-cell clientes-table-cell-telefono col-span-2">
                      {cliente.telefono}
                    </td>
                    <td className="clientes-table-cell clientes-table-cell-email col-span-1">
                      {cliente.email ? (
                        <span className="clientes-email-badge">
                          {cliente.email}
                        </span>
                      ) : (
                        <span className="clientes-no-email">
                          sin email
                        </span>
                      )}
                    </td>
                    <td className="clientes-table-cell clientes-table-cell-center col-span-1">
                      {cliente.tipo_doc ? (
                        <span className="clientes-tipo-doc">{cliente.tipo_doc}</span>
                      ) : (
                        <span className="clientes-sin-dato">sin tipo</span>
                      )}
                    </td>
                    <td className="clientes-table-cell clientes-table-cell-center col-span-1">
                      {cliente.nro_doc ? (
                        <span className="clientes-nro-doc">{cliente.nro_doc}</span>
                      ) : (
                        <span className="clientes-sin-dato">sin nro</span>
                      )}
                    </td>
                    <td className="clientes-table-cell clientes-table-cell-center col-span-1">
                      <span className="clientes-fecha">
                        {formatCreatedAt(cliente.createdAt.toString())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
      
      {/* Pagination */}
      <div className="clientes-pagination-container">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="clientes-pagination-button"
        >
          Anterior
        </button>
        <span className="clientes-pagination-info">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="clientes-pagination-button"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TableClientes;
