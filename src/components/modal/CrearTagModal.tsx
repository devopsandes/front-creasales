import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalTag, openSessionExpired, setNewTag, throwAlert } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTag } from '../../services/tags/tags.services';
import { toast } from 'react-toastify';
import XMark from '../icons/XMark';
import './tag-modal.css';
import { getAuthSessionReason } from '../../utils/authSession';







const CrearTagModal = () => {
  const [nombre, setNombre] = useState('');
 
  const dispatch = useDispatch();
  const modalView = useSelector((state: RootState) => state.action.modalTag);
  const token  = localStorage.getItem('token') || '';

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

    const authReason = getAuthSessionReason(resp);
    if(authReason){
        dispatch(throwAlert({msg: resp.message, alerta: true}));
        dispatch(openSessionExpired(authReason));
    }
    
    
}

const handleClose = () => {
    dispatch(closeModalTag());
    setNombre('');
  }

  

 

  return (
    <div className="tag-modal-overlay">
      <div className="tag-modal-container">
        <div className="tag-modal-header">
          <h2 className="tag-modal-title">Crear Etiqueta</h2>
          <button onClick={handleClose} className="tag-modal-close-button">
            <XMark />
          </button>
        </div>

        <div className="tag-modal-content">
            <h3 className='tag-modal-inner-title'>Nueva Etiqueta</h3>
            <form 
                action="" 
                onSubmit={handleSubmit}
                className='tag-modal-form'
            >
                <div className='tag-modal-form-group'>
                    <label htmlFor="nombre" className='tag-modal-label'>Nombre de la etiqueta</label>
                    <input 
                        type="text" 
                        id="nombre" 
                        placeholder='Ingrese el nombre de la etiqueta' 
                        className='tag-modal-input'
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>
                <button 
                    type='submit' 
                    className="tag-modal-submit-button"
                >
                    Crear Etiqueta
                </button>
            </form>
        </div>

        
      </div>
    </div>
  );
};

export default CrearTagModal;
