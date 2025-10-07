import { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  closeModalUser } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ROLES, TIPOS_DOC } from '../../utils/constans';
import Spinner23 from '../spinners/Spinner23';
import { empresaXUser } from '../../services/empresas/empresa.services';
import { authRegister } from '../../services/auth/auth.services';





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
    const navigate = useNavigate();

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
        alert('Debe iniciar sesión')
        navigate('/auth/signin')
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
        //   setErrores([])
          toast.success(resp.msg)
          // limpiar el formulario
        }else if(resp.statusCode === 401){
          console.log(resp.message);
          alert('El token ha expirado debe iniciar sesión nuevamente')
          navigate('/auth/signin')
    
        }else if(resp.statusCode === 500){
          setShowSpinner(false)
        //   setErrores([`${resp.message}`])
          toast.error('Error al cargar los datos')
        }else {
          console.log(resp.message);
          setShowSpinner(false)
        //   setErrores(resp.message)
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

  

 

  return (
    <div className="fixed inset-0 bg-white/65 flex items-center justify-center z-50 w-full">
        {showSpinner ? (
            <Spinner23 />
        ) : (
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
                            id="apellido" 
                            placeholder='Ingrese un apellido' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="email" className='text-gray-600'>Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            placeholder='Ingrese un email' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="nacimiento" className='text-gray-600'>Nacimiento</label>
                        <input 
                            type="date" 
                            id="nacimiento" 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={nacimiento}
                            onChange={(e) => setNacimiento(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="telefono" className='text-gray-600'>Teléfono</label>
                        <input 
                            type="text" 
                            id="telefono" 
                            placeholder='Ej: 5492615345678' 
                            className='w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600'
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
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
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
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
                            value={tipo.id}
                            onChange={handleChangeTipo}
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
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-between w-full'>
                        <label htmlFor="role" className='text-gray-600'>Rol Usuario</label>
                        <select
                            name="role"
                            id="role"
                            className="w-2/3 p-1 bg-amber-50 rounded-lg shadow-2xl text-gray-600"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="" className="text-gray-400 bg-amber-50">Seleccione</option>
                            {ROLES.map((role) => (
                                <option
                                    value={role.nombre}
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
        )}
     
    </div>
  );
};

export default CrearTicketModal;
