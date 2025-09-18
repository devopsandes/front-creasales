import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  closeModalUser, throwAlert } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTag } from '../../services/tags/tags.services';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ROLES, TIPOS_DOC } from '../../utils/constans';







const CrearTicketModal = () => {
  const [nombre, setNombre] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false)
 
  const dispatch = useDispatch();
  const modalUser = useSelector((state: RootState) => state.action.modalUser);
  const token  = localStorage.getItem('token') || '';
  const navigate = useNavigate();

  useEffect(() => {
    const ejecucion = async () => {
        setNombre('');
      
      
    }
    ejecucion();
   
  },[])

  

 
  if (!modalUser) return null;

 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    alert('Hubo un error')
    return
    // Aquí puedes manejar la creación de la etiqueta
    const resp = await createTag(token, nombre)

    if(resp.statusCode === 201){
        dispatch(closeModalUser());
        // dispatch(setNewTag(nombre));
        toast.success(`Etiqueta creada correctamente`);
    }

    if(resp.statusCode === 401){
        dispatch(throwAlert({msg: resp.message, alerta: true}));
        alert('Su sesión ha caducado, por favor inicie sesión nuevamente');
        localStorage.removeItem('token');
        navigate('/auth/signin');
    }
    
    
}

const handleClose = () => {
    dispatch(closeModalUser());
    setNombre('');
  }

  

 

  return (
    <div className="fixed inset-0 bg-white/65 flex items-center justify-center z-50 w-full">
      <div className="bg-white rounded-lg   p-6 shadow-lg w-full max-w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Buscar Usuario</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">x</button>
        </div>

        <div className="relative p-2 flex flex-col justify-center items-center bg-gray-300 rounded-lg">
            <h3 className='w-full text-center text-gray-600 text-lg'>Crear Usuario</h3>
            <form 
                action="" 
                onSubmit={handleSubmit}
                className='flex flex-col w-full'
            >
                <div className='flex w-full'>
                <div className='flex flex-col gap-4 w-full p-4'>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="nombre" className='text-gray-600'>Nombre</label>
                        <input 
                            type="text" 
                            id="nombre" 
                            placeholder='Ingrese un nombre' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                   <div className='flex justify-between w-full'>
                        <label htmlFor="apellido" className='text-gray-600'>Apellido</label>
                        <input 
                            type="text" 
                            id="nombre" 
                            placeholder='Ingrese un apellido' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="email" className='text-gray-600'>Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            placeholder='Ingrese un email' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="nacimiento" className='text-gray-600'>Nacimiento</label>
                        <input 
                            type="date" 
                            id="nacimiento" 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="telefono" className='text-gray-600'>Teléfono</label>
                        <input 
                            type="text" 
                            id="telefono" 
                            placeholder='Ej: 5492615345678' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                </div>
                <div className='flex flex-col gap-4 w-full p-4'>
                    <div className="flex justify-between w-full relative">
                        <label htmlFor="pass" className='text-gray-600'>Contraseña</label>
                        <input
                            id='pass'
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingrese su contraseña"
                            // className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            className="w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? (
                            <FaEyeSlash className="h-5 w-5" />
                            ) : (
                            <FaEye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="tipo" className='text-gray-600'>Tipo Documento</label>
                        <select
                            name="tipo"
                            id="tipo"
                            className="w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600"
                            value={nombre}
                            onChange={() => {}}
                        >
                            <option value="" className="text-gray-400 bg-amber-50">Seleccione</option>
                            {TIPOS_DOC.map((tipo) => (
                                <option
                                    value={tipo.id}
                                    key={tipo.id}
                                    className="text-gray-600 bg-amber-50"
                                >
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                       
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="numero" className='text-gray-600'>Número</label>
                        <input 
                            type="text" 
                            id="numero" 
                            placeholder='33265987' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="role" className='text-gray-600'>Rol Usuario</label>
                        <select
                            name="role"
                            id="role"
                            className="w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600"
                            value={nombre}
                            onChange={() => {}}
                        >
                            <option value="" className="text-gray-400 bg-amber-50">Seleccione</option>
                            {ROLES.map((role) => (
                                <option
                                    value={role.id}
                                    key={role.id}
                                    className="text-gray-600 bg-amber-50"
                                >
                                    {role.nombre}
                                </option>
                            ))}
                        </select>
                       
                    </div>
                    
                </div>
                
                </div>
                <div className='flex w-full justify-center'>
                    <button 
                        type='submit' 
                        className="btn text-center w-1/2 items-center flex gap-2 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
                    >
                        <span className='w-full text-center'>Crear Usuario</span>
                    </button>
                </div>
               
               
               
               
            </form>
        </div>

        
      </div>
    </div>
  );
};

export default CrearTicketModal;
