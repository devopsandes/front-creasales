import { FaRegCommentDots, FaUser } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import Switch from "../../components/switch/Switch";
import { usuariosXRole, deleteUser, resyncAdminUser } from "../../services/auth/auth.services";
import { Usuario } from "../../interfaces/auth.interface";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import CrearUsuarioModal from "../../components/modal/CrearUsuarioModal";
import { getChatCountsByOperator } from "../../services/chats/chats.services";
import { openModalUser, openModalEditUser, openSessionExpired } from "../../app/slices/actionSlice";
import EditarUsuarioModal from "../../components/modal/EditarUsuarioModal";
import { toast } from 'react-toastify';
import './usuarios.css';
import { isLightFeatureDisabled } from "../../config/runtimeConfig";
import { getAuthSessionReason } from "../../utils/authSession";


const ITEMS_PER_PAGE = 15;

const TableUsers = () => {
  const countsByOperatorDisabled = isLightFeatureDisabled('countsByOperator')
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [chatsCounts, setChatsCounts] = useState<{ [userId: string]: number }>({});
  const [resyncingEmail, setResyncingEmail] = useState<string | null>(null);
  const [userToResync, setUserToResync] = useState<Usuario | null>(null);
  const tooltipRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const initializedRef = useRef(false);

  const token = localStorage.getItem('token') || '';
  const role = localStorage.getItem('role') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const canResyncUsers = role === 'ROOT' || role === 'ADMIN';

  const handleAuthSession = (payload: any): boolean => {
    const authReason = getAuthSessionReason(payload);
    if (!authReason) return false;
    dispatch(openSessionExpired(authReason));
    return true;
  }



  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setLoading(true);
  }, [])

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const ejecucion = async () => {

      const respUsers = await usuariosXRole(role, token);

      if (handleAuthSession(respUsers)) {
        return;
      }

      setUsers(respUsers.users);

      // Obtener contadores de chats asignados por operador (query agregada, liviana)
      if (!countsByOperatorDisabled) {
        try {
          const respCounts = await getChatCountsByOperator(token);
          const rawCounts = Array.isArray((respCounts as any)?.counts) ? (respCounts as any).counts : [];
          const countsMap = new Map<string, number>(
            rawCounts
              .filter((it: any) => it?.operatorId)
              .map((it: any) => [String(it.operatorId), Number(it.assignedCount) || 0])
          );
          const counts: { [userId: string]: number } = {};
          respUsers.users.forEach(user => { counts[user.id] = countsMap.get(user.id) ?? 0; });

          setChatsCounts(counts);
        } catch (error) {
          console.error('Error al obtener chats:', error);
          const counts: { [userId: string]: number } = {};
          respUsers.users.forEach(user => {
            counts[user.id] = 0;
          });
          setChatsCounts(counts);
        }
      } else {
        const counts: { [userId: string]: number } = {};
        respUsers.users.forEach(user => {
          counts[user.id] = 0;
        });
        setChatsCounts(counts);
      }

      setLoading(false);

    }
    ejecucion();

  }, [])

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

  const handleDeleteUser = async (user: Usuario) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que querés eliminar a ${user.nombre} ${user.apellido}?`
    );

    if (!confirmacion) return;

    try {
      const resp = await deleteUser(user.id, token);

      if (handleAuthSession(resp)) {
        return;
      }

      if (resp.statusCode === 200 || resp.statusCode === 201) {
        toast.success('Usuario eliminado correctamente');
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      } else {
        toast.error(resp.message?.toString() || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar el usuario');
    }
  }

  const handleEditUser = (user: Usuario) => {
    dispatch(openModalEditUser(user));
  }

  // Callback para refrescar la tabla después de editar
  const handleUserUpdated = async () => {
    setLoading(true);
    const respUsers = await usuariosXRole(role, token);
    if (handleAuthSession(respUsers)) {
      return;
    }
    setUsers(respUsers.users);
    if (!countsByOperatorDisabled) {
      try {
        const respCounts = await getChatCountsByOperator(token);
        const rawCounts = Array.isArray((respCounts as any)?.counts) ? (respCounts as any).counts : [];
        const countsMap = new Map<string, number>(
          rawCounts
            .filter((it: any) => it?.operatorId)
            .map((it: any) => [String(it.operatorId), Number(it.assignedCount) || 0])
        );
        const counts: { [userId: string]: number } = {};
        respUsers.users.forEach(user => { counts[user.id] = countsMap.get(user.id) ?? 0; });
        setChatsCounts(counts);
      } catch {
        // noop
      }
    } else {
      const counts: { [userId: string]: number } = {};
      respUsers.users.forEach(user => {
        counts[user.id] = 0;
      });
      setChatsCounts(counts);
    }
    setLoading(false);
  }

  const handleResyncUser = async () => {
    if (!userToResync) return;
    setResyncingEmail(userToResync.email);

    try {
      const resp = await resyncAdminUser(userToResync.email, token);
      if (handleAuthSession(resp)) return;

      if (resp.statusCode === 200 || resp.statusCode === 201) {
        toast.success('Usuario resincronizado correctamente');
        setUserToResync(null);
        await handleUserUpdated();
      } else {
        toast.error(resp.message?.toString() || resp.msg || 'No se pudo resincronizar el usuario');
      }
    } catch (error) {
      console.error('Error al resincronizar usuario:', error);
      toast.error('No se pudo resincronizar el usuario');
    } finally {
      setResyncingEmail(null);
    }
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
                {currentUsers.map((user, index) => (
                  <tr key={user.id} className="usuarios-table-row">
                    <td className="usuarios-table-cell usuarios-table-cell-id">
                      {index + 1}
                    </td>
                    <td className="usuarios-table-cell">
                      <FaUser className="usuarios-icon-user" size={35} />
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
                      <button
                        className="usuarios-button-edit"
                        onClick={() => handleEditUser(user)}
                      >
                        Editar
                      </button>
                      <button
                        className="usuarios-button-delete"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Eliminar
                      </button>
                      {canResyncUsers && (
                        <button
                          className="usuarios-button-resync"
                          onClick={() => setUserToResync(user)}
                          disabled={resyncingEmail === user.email}
                          title="Actualiza la copia administrativa de este usuario desde el sistema conversacional."
                        >
                          {resyncingEmail === user.email ? 'Sincronizando' : 'Sincronizar'}
                        </button>
                      )}
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
        <EditarUsuarioModal onUserUpdated={handleUserUpdated} />
        {userToResync && (
          <div className="usuarios-resync-overlay" role="presentation" onClick={() => !resyncingEmail && setUserToResync(null)}>
            <div className="usuarios-resync-modal" role="dialog" aria-modal="true" aria-labelledby="resync-title" onClick={(event) => event.stopPropagation()}>
              <h3 id="resync-title">Resincronizar usuario</h3>
              <p>
                Se actualizarán los datos administrativos de {userToResync.email} usando la información actual del sistema conversacional.
                Esto no cambia su contraseña ni cierra su sesión.
              </p>
              <div className="usuarios-resync-actions">
                <button
                  className="usuarios-resync-cancel"
                  onClick={() => setUserToResync(null)}
                  disabled={Boolean(resyncingEmail)}
                >
                  Cancelar
                </button>
                <button
                  className="usuarios-resync-confirm"
                  onClick={handleResyncUser}
                  disabled={Boolean(resyncingEmail)}
                >
                  {resyncingEmail ? 'Sincronizando' : 'Sincronizar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableUsers;
