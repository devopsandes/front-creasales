import  { useState } from "react";

const users = [
  { id: 1, avatar: "https://i.pravatar.cc/40?img=1", name: "María González", email: "maria@example.com", access: "admin", department: "Atención al cliente" },
  { id: 2, avatar: "https://i.pravatar.cc/40?img=2", name: "Carlos Pérez", email: "carlos@example.com", access: "user", department: "Comercial" },
  { id: 3, avatar: "https://i.pravatar.cc/40?img=3", name: "Lucía Ramírez", email: "lucia@example.com", access: "super", department: "Afiliaciones" },
  { id: 4, avatar: "https://i.pravatar.cc/40?img=4", name: "Pedro Torres", email: "pedro@example.com", access: "user", department: "Fiscalización" },
  { id: 5, avatar: "https://i.pravatar.cc/40?img=5", name: "Ana Mendoza", email: "ana@example.com", access: "admin", department: "Comercial" },
  { id: 6, avatar: "https://i.pravatar.cc/40?img=6", name: "Javier Soto", email: "javier@example.com", access: "user", department: "Afiliaciones" },
  { id: 7, avatar: "https://i.pravatar.cc/40?img=7", name: "Sofía Navarro", email: "sofia@example.com", access: "super", department: "Atención al cliente" },
];

const ITEMS_PER_PAGE = 7;

const TableUsers = () => {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (

    <div className="p-4 w-full h-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-600 text-left text-sm font-bold">
              <th className="p-2">ID</th>
              <th className="p-2">Usuario</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Acceso</th>
              <th className="p-2">Departamentos</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-400">
                <td className="p-2">{user.id}</td>
                <td className="p-2">
                  <img src={user.avatar} alt={user.name} className="rounded-full w-10 h-10" />
                </td>
                <td className="p-2">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="p-2 capitalize">{user.access}</td>
                <td className="p-2">{user.department}</td>
                <td className="p-2 flex space-x-2  justify-center items-center gap-24 ">
                  <button className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600 cursor-pointer">Editar</button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Eliminar</button>
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
