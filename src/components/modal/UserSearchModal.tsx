import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  useParams } from 'react-router-dom';
import { closeModal } from '../../app/slices/actionSlice';
import {  UserCircle2 } from 'lucide-react';
import { asignarOperador, usuariosXRole } from '../../services/auth/auth.services';
import { RootState } from '../../app/store';
import {  Usuario } from '../../interfaces/auth.interface';




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
  
    console.log(`chat_id ${chat_id} user_id ${user_id} token ${token}`);
    
    const resp = await asignarOperador(chat_id,user_id ,token); 
    console.log(resp);

    if(resp.statusCode === 200) {
      // Aquí puedes manejar la lógica después de asignar el usuario, como actualizar el estado global o redirigir
      dispatch(closeModal());
      alert('Usuario asignado correctamente');
    }
    
  }

  

 

  return (
    <div className="fixed inset-0 bg-white/65 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Buscar Usuario</h2>
          <button onClick={() => dispatch(closeModal())} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="relative p-2 flex justify-center items-center">
         {/*  <div>
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div> */}
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded  py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-950"
          />
        </div>

        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto mt-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <li 
                key={user.id} 
                className="flex items-center gap-3 py-2 cursor-pointer"
                onClick={() => handleAsignar(user.id)}
              >
               {/*  {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                )} */}
                <UserCircle2 className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-800">{user.nombre} {user.apellido}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500 py-2">No se encontraron usuarios.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserSearchModal;
