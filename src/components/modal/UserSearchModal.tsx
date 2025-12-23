import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  useParams } from 'react-router-dom';
import { closeModal } from '../../app/slices/actionSlice';
import {  UserCircle2, X, UserPlus, Search } from 'lucide-react';
import { asignarOperador, usuariosXRole } from '../../services/auth/auth.services';
import { RootState } from '../../app/store';
import {  Usuario } from '../../interfaces/auth.interface';
import './user-search-modal.css';




const UserSearchModal = ( ) => {
  const [search, setSearch] = useState('');
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

  

  const filteredUsers = users.filter(user => {
    const completo = user.nombre + ' ' + user.apellido;
    return completo.toLocaleLowerCase().includes(search.toLowerCase())
  });

  if (!modalView) return null;

  const handleAsignar = async (user_id: string) => {
    const resp = await asignarOperador(chat_id,user_id ,token); 

    if(resp.statusCode === 200) {
      dispatch(closeModal());
      // Podrías mostrar un toast aquí en lugar de alert
    }
    
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      dispatch(closeModal());
    }
  }

  

 

  return (
    <div className="assign-modal-overlay" onClick={handleOverlayClick}>
      <div className="assign-modal-container">
        <button className="assign-modal-close" onClick={() => dispatch(closeModal())}>
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
                className="assign-modal-user-item"
                onClick={() => handleAsignar(user.id)}
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
      </div>
    </div>
  );
};

export default UserSearchModal;
