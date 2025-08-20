import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalTag, setNewTag, throwAlert } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTag } from '../../services/tags/tags.services';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';







const CrearTagModal = () => {
  const [nombre, setNombre] = useState('');
 
  const dispatch = useDispatch();
  const modalView = useSelector((state: RootState) => state.action.modalTag);
  const token  = localStorage.getItem('token') || '';
  const navigate = useNavigate();

  useEffect(() => {
    const ejecucion = async () => {
        setNombre('');
      
      
    }
    ejecucion();
   
  },[])

  

 
  if (!modalView) return null;

 
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
    dispatch(closeModalTag());
    setNombre('');
  }

  

 

  return (
    <div className="fixed inset-0 bg-white/65 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Buscar Usuario</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">x</button>
        </div>

        <div className="relative p-2 flex flex-col justify-center items-center bg-gray-300 rounded-lg">
            <h3 className='w-full text-center text-gray-600 text-lg'>Crear Etiqueta</h3>
            <form 
                action="" 
                onSubmit={handleSubmit}
                className='flex flex-col gap-4 w-full p-4'
            >
                <div className='flex justify-between w-full'>
                    <label htmlFor="nombre" className='text-gray-600'>Nombre</label>
                    <input 
                        type="text" 
                        id="nombre" 
                        placeholder='Nombre de la etiqueta' 
                        className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>
                <button 
                    type='submit' 
                    className="btn text-center items-center flex gap-2 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition duration-200"
                >
                    <span className='w-full text-center'>Crear Etiqueta</span>
                </button>
            </form>
        </div>

        
      </div>
    </div>
  );
};

export default CrearTagModal;
