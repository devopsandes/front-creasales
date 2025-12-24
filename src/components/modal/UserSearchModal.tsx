import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  useParams } from 'react-router-dom';
import { closeModal, setChats } from '../../app/slices/actionSlice';
import {  UserCircle2, X, UserPlus, Search } from 'lucide-react';
import { asignarOperador, usuariosXRole } from '../../services/auth/auth.services';
import { RootState } from '../../app/store';
import {  Usuario } from '../../interfaces/auth.interface';
import { getChats } from '../../services/chats/chats.services';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';
import './user-search-modal.css';




const UserSearchModal = ( ) => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [assignedUserName, setAssignedUserName] = useState<string>('');
  const [users, setUsers] = useState<Usuario[]>([{
    id: 'BOT',
    nombre: 'OPERADOR',
    apellido: 'BOT',
    nacimiento: new Date(),
    telefono: '',
    tipo_doc: '',
    nro_doc: 0,
    cuil: null,
    email: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    verificado: false,
    token: '',
    role: '',
    activo: false
  }]);
  const chat_id = useParams().id || '';
 
  const dispatch = useDispatch();
  const modalView = useSelector((state: RootState) => state.action.modal);
  
  const token  = localStorage.getItem('token') || '';

  useEffect(() => {
    const ejecucion = async () => {
      const respUsers = await usuariosXRole('USER', token);
      setUsers([...users,...respUsers.users]);
      
    }
    ejecucion();
   
  },[])

  // Resetear selección cuando se cierra el modal
  useEffect(() => {
    if (!modalView) {
      setSelectedUserId(null);
      setSelectedUser(null);
      setSearch('');
      setIsLoading(false);
      // No resetear los modales de éxito/error aquí para que puedan mostrarse después de cerrar el modal principal
    }
  }, [modalView]);

  const filteredUsers = users.filter(user => {
    const completo = user.nombre + ' ' + user.apellido;
    return completo.toLocaleLowerCase().includes(search.toLowerCase())
  });

  const handleSelectUser = (user_id: string) => {
    setSelectedUserId(user_id);
    const user = users.find(u => u.id === user_id);
    setSelectedUser(user || null);
  }

  const handleAsignar = async () => {
    if (!selectedUserId) return;
    
    setIsLoading(true);
    
    try {
      const resp = await asignarOperador(chat_id, selectedUserId, token);

      if(resp.statusCode === 200) {
        // Guardar el nombre del usuario asignado antes de resetear
        const userName = selectedUser ? `${selectedUser.nombre} ${selectedUser.apellido}` : 'el usuario seleccionado';
        setAssignedUserName(userName);
        
        // Actualizar la lista de chats
        try {
          const chatos = await getChats(token, '1', '100');
          dispatch(setChats(chatos.chats));
        } catch (error) {
          // Error silencioso al actualizar chats
        }

        // Cerrar el modal de asignación primero
        dispatch(closeModal());
        setSelectedUserId(null);
        setSelectedUser(null);
        setSearch('');
        
        // Mostrar modal de éxito después de un pequeño delay para asegurar que el modal principal se cierre primero
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 100);
      } else {
        // Mostrar modal de error
        const errorMsg = resp.message || 'Error al asignar el chat. Por favor, intenta nuevamente.';
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Error inesperado. Por favor, intenta nuevamente.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancelar = () => {
    dispatch(closeModal());
    setSelectedUserId(null);
    setSearch('');
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancelar();
    }
  }

  

 

  return (
    <>
      {modalView && (
        <div className="assign-modal-overlay" onClick={handleOverlayClick}>
          <div className="assign-modal-container">
            <button className="assign-modal-close" onClick={handleCancelar}>
              <X size={20} />
            </button>
            
            <div className="assign-modal-icon">
              <UserPlus size={32} />
            </div>

            <h2 className="assign-modal-title">Asignar Chat</h2>
            <p className="assign-modal-subtitle">Selecciona un usuario para asignar este chat</p>

            <div className="assign-modal-search">
              <Search className="assign-modal-search-icon" size={18} />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="assign-modal-search-input"
              />
            </div>

            <ul className="assign-modal-user-list">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <li 
                    key={user.id} 
                    className={`assign-modal-user-item ${selectedUserId === user.id ? 'assign-modal-user-item--selected' : ''}`}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <UserCircle2 className="assign-modal-user-avatar" size={32} />
                    <div className="assign-modal-user-info">
                      <span className="assign-modal-user-name">{user.nombre} {user.apellido}</span>
                      <span className={`assign-modal-user-status ${user.activo ? 'assign-modal-user-status--active' : 'assign-modal-user-status--inactive'}`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="assign-modal-empty">No se encontraron usuarios.</li>
              )}
            </ul>

            <div className="assign-modal-actions">
              <button 
                className="assign-modal-button assign-modal-cancel"
                onClick={handleCancelar}
              >
                Cancelar
              </button>
              <button 
                className="assign-modal-button assign-modal-confirm"
                onClick={handleAsignar}
                disabled={!selectedUserId || isLoading}
              >
                {isLoading ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setAssignedUserName('');
        }}
        title="Asignación exitosa"
        message={`El chat ha sido asignado correctamente a ${assignedUserName || 'el usuario seleccionado'}.`}
      />
      
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setErrorMessage('');
        }}
        title="Error al asignar"
        message={errorMessage}
      />
    </>
  );
};

export default UserSearchModal;
