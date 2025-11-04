import { FaRegCommentDots, FaUser } from "react-icons/fa";
import  { useEffect, useState } from "react";
import Switch from "../../components/switch/Switch";
import { usuariosXRole } from "../../services/auth/auth.services";
import {   Usuario } from "../../interfaces/auth.interface";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {  openModalUser } from "../../app/slices/actionSlice";
import CrearUsuarioModal from "../../components/modal/CrearUsuarioModal";
import './usuarios.css';



const ITEMS_PER_PAGE = 15;

const TableUsers = () => {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>();

  const token  = localStorage.getItem('token') || '';
  let role = localStorage.getItem('role') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch()



  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setLoading(true);
  }, [])

  useEffect(() => {
      const ejecucion = async () => {
       
        const respUsers = await usuariosXRole(role, token);

        if (respUsers.statusCode === 401) {
          alert('Su sesión ha expirado, por favor inicie sesión nuevamente');
          navigate('/auth/signin');
        }
        
        setUsers(respUsers.users);
        setLoading(false);
        
      }
      ejecucion();
     
    },[])

    const handleClickChats = (user: Usuario) => {
      navigate(`/dashboard/chats?id=${user.id}&nombre=${user.nombre} ${user.apellido}`);
    }

  return (
    <div className="usuarios-container">
       {loading ? (
          <div className="usuarios-loader">
            <div className="loader2"></div>
          </div>
        ) : (
          <div className="usuarios-table-wrapper">
            <table className="usuarios-table">
              <thead className="usuarios-table-header">
                <tr>
                  <th className="usuarios-table-header-cell">ID</th>
                  <th className="usuarios-table-header-cell">Usuario</th>
                  <th className="usuarios-table-header-cell">Nombre</th>
                  <th className="usuarios-table-header-cell">Acceso</th>
                  <th className="usuarios-table-header-cell">Departamentos</th>
                  <th className="usuarios-table-header-cell">Estado</th>
                  <th className="usuarios-table-header-cell">Chats</th>
                  <th className="usuarios-table-header-cell"></th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user,index) => (
                  <tr key={user.id} className="usuarios-table-row">
                    <td className="usuarios-table-cell usuarios-table-cell-id">
                      {index + 1}
                    </td>
                    <td className="usuarios-table-cell">
                      <FaUser className="usuarios-icon-user" size={35}/>
                    </td>
                    <td className="usuarios-table-cell usuarios-table-cell-nombre">
                      <p className="usuarios-nombre">{user.nombre} {user.apellido}</p>
                      <p className="usuarios-email">{user.email}</p>
                    </td>
                    <td className="usuarios-table-cell">{user.role}</td>
                    <td className="usuarios-table-cell">{user.telefono}</td>
                    <td className="usuarios-table-cell">
                      <Switch checked={user.activo} label={''} id={user.id} />
                    </td>
                    
                    <td className="usuarios-table-cell">
                        <button
                          className="usuarios-button-chats" 
                          onClick={() => handleClickChats(user)}
                        >
                          2 {'\t'} 
                          <FaRegCommentDots className="usuarios-chat-icon" />
                        </button>
                    </td>
                    <td className="usuarios-actions-cell">
                      <button className="usuarios-button-edit">Editar</button>
                      <button className="usuarios-button-delete">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      
      {/* Pagination */}
      <div className="usuarios-pagination-container">
        <button 
          onClick={() => dispatch(openModalUser())}
          className="usuarios-button-create"
        >
          Crear Usuario
        </button>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="usuarios-pagination-button"
        >
          Anterior
        </button>
        <span className="usuarios-pagination-info">{page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="usuarios-pagination-button"
        >
          Siguiente
        </button>
      </div>
      <CrearUsuarioModal />
    </div>
  );
};

export default TableUsers;
