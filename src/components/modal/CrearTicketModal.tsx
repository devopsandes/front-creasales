import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalTag, closeModalTicket, setNewTag, throwAlert } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTag } from '../../services/tags/tags.services';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import XMark from '../icons/XMark';
import './ticket-modal.css';



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
    <div className="ticket-modal-overlay">
      <div className="ticket-modal-container">
        <div className="ticket-modal-header">
          <h2 className="ticket-modal-title">Crear Ticket</h2>
          <button onClick={handleClose} className="ticket-modal-close-button">
            <XMark />
          </button>
        </div>

        <div className="ticket-modal-content">
            <h3 className='ticket-modal-inner-title'>Nuevo Ticket de Soporte</h3>
            <form 
                action="" 
                onSubmit={handleSubmit}
                className='ticket-modal-form'
            >
                <div className='ticket-modal-form-group'>
                    <label htmlFor="titulo" className='ticket-modal-label'>Título</label>
                    <input 
                        type="text" 
                        id="titulo" 
                        placeholder='Título del ticket' 
                        className='ticket-modal-input'
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>
                <div className='ticket-modal-form-group'>
                    <label htmlFor="descripcion" className='ticket-modal-label'>Descripción</label>
                    <textarea
                        id="descripcion" 
                        placeholder='Descripción del ticket' 
                        className='ticket-modal-textarea'
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>
                <div className='ticket-modal-form-group'>
                    <label htmlFor="departamento" className='ticket-modal-label'>Departamento</label>
                    <select
                        id="departamento" 
                        className='ticket-modal-select'
                    >
                        <option value="">-- Seleccione --</option>
                        {Departamentos.map((dep) => (
                            <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className='ticket-modal-form-group'>
                    <label htmlFor="tipificacion" className='ticket-modal-label'>Tipificación</label>
                    <select
                        id="tipificacion" 
                        className='ticket-modal-select'
                    >
                        <option value="">-- Seleccione --</option>
                        {Tipificaciones.map((tip) => (
                            <option key={tip.id} value={tip.nombre}>{tip.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className='ticket-modal-form-group'>
                    <label htmlFor="adjuntos" className='ticket-modal-label'>Adjuntos</label>
                    <input
                        type="file"
                        id="adjuntos"
                        className="ticket-modal-file-input"
                    />
                </div>

                <button 
                    type='submit' 
                    className="ticket-modal-submit-button"
                >
                    Crear Ticket
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CrearTicketModal;
