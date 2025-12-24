import { FaRegCommentDots, FaUser } from "react-icons/fa";
import  { useEffect, useState, useRef } from "react";
import Switch from "../../components/switch/Switch";
import { usuariosXRole } from "../../services/auth/auth.services";
import {   Usuario } from "../../interfaces/auth.interface";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {  openModalUser } from "../../app/slices/actionSlice";
import CrearUsuarioModal from "../../components/modal/CrearUsuarioModal";
import { getChats } from "../../services/chats/chats.services";
import { ChatState } from "../../interfaces/chats.interface";
import './usuarios.css';



const ITEMS_PER_PAGE = 15;

const TableUsers = () => {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [chatsCounts, setChatsCounts] = useState<{ [userId: string]: number }>({});
  const tooltipRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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
          return;
        }
        
        setUsers(respUsers.users);
        
        // Obtener todos los chats para contar los asignados a cada usuario
        try {
          const respChats = await getChats(token, '1', '1000'); // Obtener muchos chats para contar todos
          
          // Contar chats asignados a cada usuario
          const counts: { [userId: string]: number } = {};
          
          respUsers.users.forEach(user => {
            counts[user.id] = respChats.chats.filter((chat: ChatState) => 
              chat.operador?.id === user.id
            ).length;
          });
          
          setChatsCounts(counts);
        } catch (error) {
          console.error('Error al obtener chats:', error);
          // Si falla, inicializar todos en 0
          const counts: { [userId: string]: number } = {};
          respUsers.users.forEach(user => {
            counts[user.id] = 0;
          });
          setChatsCounts(counts);
        }
        
        setLoading(false);
        
      }
      ejecucion();
     
    },[])

    const handleClickChats = (user: Usuario) => {
      navigate(`/dashboard/chats?userId=${user.id}`);
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, userId: string) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 10
      })
      setShowTooltip(userId)
    }

    const handleMouseLeave = () => {
      setShowTooltip(null)
    }

    const handleSwitchChange = (userId: string, newActiveState: boolean) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, activo: newActiveState }
            : user
        )
      );
    }

  return (
    <div className="usuarios-wrapper">
      {/* Header */}
      <div className="usuarios-header">
        <h2 className="usuarios-header-title">Usuarios del Sistema</h2>
        <p className="usuarios-header-description">
          Administre los usuarios de su sistema. Cada usuario puede tener diferentes roles y permisos, 
          estar asociado a departamentos específicos y gestionar chats con clientes. 
          Active o desactive usuarios según sea necesario.
        </p>
      </div>

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
                      <div className="usuarios-estado-container">
                        <Switch 
                          checked={user.activo} 
                          label={''} 
                          id={user.id}
                          onChange={(checked) => handleSwitchChange(user.id, checked)}
                        />
                        <span className={`usuarios-estado-text ${user.activo ? 'usuarios-estado-text--active' : 'usuarios-estado-text--inactive'}`}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="usuarios-table-cell">
                        <div className="usuarios-chats-container">
                          <button
                            ref={(el) => tooltipRefs.current[user.id] = el}
                            className="usuarios-button-chats" 
                            onClick={() => handleClickChats(user)}
                            onMouseEnter={(e) => handleMouseEnter(e, user.id)}
                            onMouseLeave={handleMouseLeave}
                          >
                            {chatsCounts[user.id] !== undefined ? chatsCounts[user.id] : 0} {'\t'} 
                            <FaRegCommentDots className="usuarios-chat-icon" size={18} />
                          </button>
                          {showTooltip === user.id && (
                            <div 
                              className="usuarios-tooltip"
                              style={{
                                top: `${tooltipPosition.top}px`,
                                left: `${tooltipPosition.left}px`
                              }}
                            >
                              Ver chats
                            </div>
                          )}
                        </div>
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
    </div>
  );
};

export default TableUsers;
