import { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  closeModalUser, openSessionExpired } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { toast } from 'react-toastify';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { ROLES, TIPOS_DOC } from '../../utils/constans';
import Spinner23 from '../spinners/Spinner23';
import { empresaXUser } from '../../services/empresas/empresa.services';
import { authRegister } from '../../services/auth/auth.services';
import './crear-usuario-modal.css';





const CrearTicketModal = () => {
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [nombre, setNombre] = useState<string>('')
    const [apellido, setApellido] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [nacimiento, setNacimiento] = useState<string>('')
    const [telefono, setTelefono] = useState<string>('')
    const [pass, setPass] = useState<string>('')
    // const [hidden, setHidden] = useState<boolean>(false)
    const [tipo, setTipo] = useState({
      id: 0,
      valor: ''
    })
    const [role, setRole] = useState<string>('')
    const [numero, setNumero] = useState<string>('')
    const [showSpinner, setShowSpinner] = useState(false)
    // const [errores, setErrores] = useState<string[]>([])
 
    const dispatch = useDispatch();
    const modalUser = useSelector((state: RootState) => state.action.modalUser);
    const token  = localStorage.getItem('token') || '';

    useEffect(() => {
        const ejecucion = async () => {
            setNombre('');
      
      
        }
        ejecucion();
   
    },[])

  

 
  if (!modalUser) return null;

  const limpiarForm = () => {
    setNombre('')
    setApellido('')
    setEmail('')
    setNacimiento('')
    setTelefono('')
    setPass('')
    setTipo({
      id: 0,
      valor: ''
    })
    setNumero('')
    setRole('')
  }

 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSpinner(true)

    
    const empresa = await empresaXUser(token!)
    
    
    
        
    
     if(nombre.trim() === '' || apellido.trim() === '' || nacimiento.trim() === '' || email.trim() === '' || telefono.trim() === '' || pass.trim() === '' || numero.trim() === '' || role.trim() === '' ) {
        alert('Todos los campos son obligatorios')
        return
    }
    
    if(!token){
        setShowSpinner(false)
        dispatch(openSessionExpired())
        return
    }
    console.log(`role ${role}`);
    
    const resp = await authRegister({
            nombre,
            apellido,
            nacimiento,
            email,
            telefono,
            password: pass,
            tipo_doc: tipo.valor,
            nro_doc: +numero,
            role,
            empresa_id: empresa ? empresa.empresa.id : undefined
    })
    
       
    
        setShowSpinner(false)
    
        if(resp.statusCode === 201){
          setShowSpinner(false)
          limpiarForm()
          toast.success(resp.msg)
          dispatch(closeModalUser())
        }else if(resp.statusCode === 401){
          console.log(resp.message);
          dispatch(openSessionExpired())
        }else if(resp.statusCode === 500){
          setShowSpinner(false)
          toast.error('Error al cargar los datos')
        }else {
          console.log(resp.message);
          setShowSpinner(false)
          toast.error('Error al cargar los datos')
        }
    
}

const handleClose = () => {
    dispatch(closeModalUser());
    limpiarForm()
    // setErrores([])
  }

    const handleChangeTipo = (e: ChangeEvent<HTMLSelectElement>) => {
      // console.log(e.target.selectedOptions[0].text);
      setTipo({
        id: +e.target.value,
        valor: e.target.selectedOptions[0].text
      })
    }

  

 

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div className="create-user-modal-overlay" onClick={handleOverlayClick}>
        {showSpinner ? (
            <Spinner23 />
        ) : (
        <div className="create-user-modal-container">
          <button className="create-user-modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
          
          <div className="create-user-modal-icon">
            <UserPlus size={32} />
          </div>

          <h2 className="create-user-modal-title">Crear Usuario</h2>
          <p className="create-user-modal-subtitle">Complete los datos del nuevo usuario</p>

          <form 
              action="" 
              onSubmit={handleSubmit}
              className='create-user-modal-form'
          >
                <div className='create-user-modal-columns'>
                  <div className='create-user-modal-column'>
                    <div className='create-user-modal-field'>
                        <label htmlFor="nombre">Nombre</label>
                        <input 
                            type="text" 
                            id="nombre" 
                            placeholder='Ingrese un nombre' 
                            className='create-user-modal-input'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="apellido">Apellido</label>
                        <input 
                            type="text" 
                            id="apellido" 
                            placeholder='Ingrese un apellido' 
                            className='create-user-modal-input'
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                        />
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            placeholder='Ingrese un email' 
                            className='create-user-modal-input'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="nacimiento">Nacimiento</label>
                        <input 
                            type="date" 
                            id="nacimiento" 
                            className='create-user-modal-input'
                            value={nacimiento}
                            onChange={(e) => setNacimiento(e.target.value)}
                        />
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="telefono">Teléfono</label>
                        <input 
                            type="text" 
                            id="telefono" 
                            placeholder='Ej: 5492615345678' 
                            className='create-user-modal-input'
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                        />
                    </div>
                  </div>
                  <div className='create-user-modal-column'>
                    <div className="create-user-modal-field create-user-modal-field-password">
                        <label htmlFor="pass">Contraseña</label>
                        <div className="create-user-modal-password-wrapper">
                          <input
                              id='pass'
                              type={showPassword ? "text" : "password"}
                              placeholder="Ingrese su contraseña"
                              value={pass}
                              onChange={(e) => setPass(e.target.value)}
                              className="create-user-modal-input"
                          />
                          <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="create-user-modal-password-toggle"
                          >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="tipo">Tipo Documento</label>
                        <select
                            name="tipo"
                            id="tipo"
                            className="create-user-modal-input"
                            value={tipo.id}
                            onChange={handleChangeTipo}
                        >
                            <option value="">Seleccione</option>
                            {TIPOS_DOC.map((tipo) => (
                                <option value={tipo.id} key={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="numero">Número</label>
                        <input 
                            type="text" 
                            id="numero" 
                            placeholder='33265987' 
                            className='create-user-modal-input'
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                        />
                    </div>
                    <div className='create-user-modal-field'>
                        <label htmlFor="role">Rol Usuario</label>
                        <select
                            name="role"
                            id="role"
                            className="create-user-modal-input"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Seleccione</option>
                            {ROLES.map((role) => (
                                <option value={role.nombre} key={role.id}>
                                    {role.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                  </div>
                </div>
                
                <button 
                    type='submit' 
                    className="create-user-modal-submit"
                >
                    Crear Usuario
                </button>
               
               
               
               
          </form>
        </div>
        )}
    </div>
  );
};

export default CrearTicketModal;
