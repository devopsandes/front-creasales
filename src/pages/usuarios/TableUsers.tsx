import { FaUser } from "react-icons/fa";
import  { useEffect, useState } from "react";
import Switch from "../../components/switch/Switch";
import { usuariosXRole } from "../../services/auth/auth.services";
import {  Usuario } from "../../interfaces/auth.interface";
import { useNavigate } from "react-router-dom";



const ITEMS_PER_PAGE = 7;

const TableUsers = () => {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>();

  const token  = localStorage.getItem('token') || '';
  const navigate = useNavigate();



  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setLoading(true);
  }, [])

  useEffect(() => {
      const ejecucion = async () => {
        const respUsers = await usuariosXRole('', token);

        if (respUsers.statusCode === 401) {
          alert('Su sesión ha expirado, por favor inicie sesión nuevamente');
          navigate('/auth/signin');
        }
        
        setUsers(respUsers.users);
        setLoading(false);
        
      }
      ejecucion();
     
    },[])

  return (

    <div className="p-4 w-full h-full">
       {loading ? (
          <div className="spinner-lista">
            <div className="loader2"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-600 text-left text-sm font-bold">
                  <th className="p-2">ID</th>
                  <th className="p-2">Usuario</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Acceso</th>
                  <th className="p-2">Departamentos</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2"></th>

                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user,index) => (
                  <tr key={user.id} className="border-b hover:bg-slate-400 h-full">
                    <td className="p-2 flex flex-col items-start">
                      {/* {user.id} */}
                      {index + 1}
                    </td>
                    <td className="p-2">
                      <FaUser className="pl-4" size={35}/>
                      
                      {/* <img src={user.avatar} alt={user.name} className="rounded-full w-10 h-10" /> */}
                    </td>
                    <td className="p-2 flex flex-col items-start justify-center h-full">
                      <p className="font-medium">{user.nombre} {user.apellido}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </td>
                    <td className="p-2 text-left capitalize">{user.role}</td>
                    <td className="p-2 text-left capitalize">{user.telefono}</td>
                    <td className="p-2 text-left capitalize">
                      <Switch checked={user.activo} label={''} id={user.id} />
                    </td>

                    <td className="p-2 flex  justify-center items-center gap-8 ">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 cursor-pointer">Editar</button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 cursor-pointer">Eliminar</button>
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
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 border bg-gray-700 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-3 py-1 border rounded bg-gray-700">{page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 border bg-gray-700 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TableUsers;
