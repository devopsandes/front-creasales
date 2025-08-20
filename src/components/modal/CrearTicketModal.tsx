import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalTag, closeModalTicket, setNewTag, throwAlert } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTag } from '../../services/tags/tags.services';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';



const Departamentos = [
    { id: 1, nombre: 'ATENCIÓN AL CLIENTE' },
    { id: 2, nombre: 'FISCALIZACION' },
    { id: 3, nombre: 'AFILIACIONES' },
    { id: 4, nombre: 'INTERNACIONES' },
    { id: 5, nombre: 'PREEXISTENCIA' },

]

const Tipificaciones = [
    { id: 1, nombre: 'Consulta General' },
    { id: 2, nombre: 'Reclamo' },
    { id: 3, nombre: 'Solicitud de Información' },
    { id: 4, nombre: 'Problema Técnico' },
    { id: 5, nombre: 'Sugerencia' },
];



const CrearTicketModal = () => {
  const [nombre, setNombre] = useState('');
 
  const dispatch = useDispatch();
  const modalTicket = useSelector((state: RootState) => state.action.modalTicket);
  const token  = localStorage.getItem('token') || '';
  const navigate = useNavigate();

  useEffect(() => {
    const ejecucion = async () => {
        setNombre('');
      
      
    }
    ejecucion();
   
  },[])

  

 
  if (!modalTicket) return null;

 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí puedes manejar la creación de la etiqueta
    const resp = await createTag(token, nombre)

    if(resp.statusCode === 201){
        dispatch(closeModalTag());
        dispatch(setNewTag(nombre));
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
    dispatch(closeModalTicket());
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
            <h3 className='w-full text-center text-gray-600 text-lg'>Crear Ticket</h3>
            <form 
                action="" 
                onSubmit={handleSubmit}
                className='flex flex-col gap-4 w-full p-4'
            >
                <div className='flex justify-between w-full'>
                    <label htmlFor="nombre" className='text-gray-600'>Título</label>
                    <input 
                        type="text" 
                        id="nombre" 
                        placeholder='Título del ticket' 
                        className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>
                <div className='flex justify-between w-full'>
                    <label htmlFor="nombre" className='text-gray-600'>Descripcion</label>
                    <textarea
                        id="nombre" 
                        placeholder='Descripción del ticket' 
                        cols={45}
                        className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>
                <div className='flex justify-between w-full'>
                    <label htmlFor="nombre" className='text-gray-600'>Departamentos</label>
                    <select
                        id="nombre" 
                        className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                    >
                        <option value="">-- Seleccione un Departamento --</option>
                        {Departamentos.map((dep) => (
                            <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className='flex justify-between w-full'>
                    <label htmlFor="nombre" className='text-gray-600'>Tipificación</label>
                    <select
                        id="nombre" 
                        className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                    >
                        <option value="">-- Seleccione un Tipificación --</option>
                        {Tipificaciones.map((dep) => (
                            <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                        ))}
                    </select>
                </div>
                 <div className='flex justify-between w-full'>
                    <label htmlFor="nombre" className='text-gray-600'>Adjuntos</label>
                    <input
                        type="file"
                        id="adjuntos"
                        className="block w-2/3 p-2 bg-amber-50 rounded-lg shadow-2xl text-gray-600 border border-gray-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                </div>

                <button 
                    type='submit' 
                    className="btn text-center items-center flex gap-2 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
                >
                    <span className='w-full text-center'>Crear Ticket</span>
                </button>
            </form>
        </div>

        
      </div>
    </div>
  );
};

export default CrearTicketModal;
