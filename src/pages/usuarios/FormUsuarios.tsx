import { ChangeEvent, FormEvent,  useState } from "react"
import { useNavigate } from "react-router-dom"
import { ROLES, TIPOS_DOC } from "../../utils/constans"
import { ToastContainer, toast } from 'react-toastify';
import Spinner23 from "../../components/spinners/Spinner23"
import Eye from "../../components/icons/Eye"
import EyeSlash from "../../components/icons/EyeSlash"
import { authRegister } from "../../services/auth/auth.services";
import { empresaXUser } from "../../services/empresas/empresa.services";

const FormUsuarios = () => {
  const [nombre, setNombre] = useState<string>('')
  const [apellido, setApellido] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [nacimiento, setNacimiento] = useState<string>('')
  const [telefono, setTelefono] = useState<string>('')
  const [pass, setPass] = useState<string>('')
  const [hidden, setHidden] = useState<boolean>(false)
  const [tipo, setTipo] = useState({
    id: 0,
    valor: ''
  })
  const [role, setRole] = useState<string>('')
  const [numero, setNumero] = useState<string>('')
  const [showSpinner, setShowSpinner] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const navigate = useNavigate()


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

  
  

 
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowSpinner(true)

    const token = localStorage.getItem('token')

    const empresa = await empresaXUser(token!)

    if(empresa){
      console.error(empresa);
      
    }

    

   /*  if(nombre.trim() === '' || direccion.trim() === '' || sitioWeb.trim() === '' || email.trim() === '' || telefono.trim() === '' || cuit.trim() === '' || pais.trim() === '' || provincia.trim() === '' || municipio.trim() === '' || sector.trim() === '' || tamano.trim() === '') {
      alert('Todos los campos son obligatorios')
      return
    } */

    if(!token){
      setShowSpinner(false)
      alert('Debe iniciar sesión')
      navigate('/auth/signin')
      return
    }

   

  

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
      setErrores([])
      toast.success(resp.msg)
      // limpiar el formulario
    }else if(resp.statusCode === 401){
      console.log(resp.message);
      alert('El token ha expirado debe iniciar sesión nuevamente')
      navigate('/auth/signin')

    }else if(resp.statusCode === 500){
      setShowSpinner(false)
      setErrores([`${resp.message}`])
      toast.error('Error al cargar los datos')
    }else {
      console.log(resp.message);
      setShowSpinner(false)
      setErrores(resp.message)
      toast.error('Error al cargar los datos')
    }

  }

  const handleChangeTipo = (e: ChangeEvent<HTMLSelectElement>) => {
    // console.log(e.target.selectedOptions[0].text);
    setTipo({
      id: +e.target.value,
      valor: e.target.selectedOptions[0].text
    })
  }


  const handleClose = () => {
    setErrores([])
  }

  return (
      <>
        {showSpinner ? (
          <Spinner23 />
        ) : (
          <form action="" className="form-empresa" onSubmit={handleSubmit}>
              {errores.length > 0 && (
                <div className="form-errores">
                {
                  errores.map((err,index) => (
                    <>
                      <p className="msg-cruz" onClick={handleClose}>X</p>
                      <p key={index} className="msg-error">
                        {err}
                      </p>
                    </>
                   
                  ))
                }
                </div>
              )}
            <div className="form-col">
              <div>
                <label htmlFor="nombre">Nombre:</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  className="input-empresa"
                  placeholder="Ej: Victor"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="apellido">Apellido:</label>
                <input 
                  type="text" 
                  id="apellido" 
                  name="apellido" 
                  className="input-empresa"
                  placeholder="Ej: Ruiz"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email">Email:</label>
                <input 
                  type="email" 
                  id="sitioWeb" 
                  name="email" 
                  className="input-empresa"
                  placeholder="Ej: correo@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="nacimiento">Nacimiento</label>
                <input 
                  type="date" 
                  id="nacimiento" 
                  name="nacimiento" 
                  className="input-empresa"
                  value={nacimiento}
                  onChange={(e) => setNacimiento(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label htmlFor="telefono">Teléfono:</label>
                <input 
                  type="text" 
                  id="telefono" 
                  name="telefono" 
                  className="input-empresa"
                  placeholder="Ej: 5492615345678"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                />
              </div>
            
            </div>

            <div className="form-col">
            <div className="empresa-pass">
                <label htmlFor="pass">Contraseña:</label>
                <input 
                  type={hidden ? "password": "text"}
                  id="pass" 
                  name="pass"  
                  placeholder="Ingrese su password" 
                  className="input-empresa"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button 
                  className='btn-eye' 
                  type='button' 
                  onClick={() => setHidden(!hidden)}
                >
                  {hidden ? (
                      <Eye />
                  ):(
                    <EyeSlash />
                  )}
                </button>
               
              </div>
              <div>
                <label htmlFor="tipo">Tipo de documento:</label>
                <select 
                  name="tipo" 
                  id="tipo" 
                  className="select-empresa"
                  value={tipo.id}
                  onChange={handleChangeTipo}
                >
                 <option value="">Seleccione</option>
                  {TIPOS_DOC.map((tipo)=>(
                    <option value={tipo.id} key={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="numero">Número:</label>
                <input 
                  type="text" 
                  id="numero" 
                  name="numero" 
                  className="input-empresa"
                  placeholder="Ej: 33265987"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="role">Rol Usuario:</label>
                <select 
                  name="role" 
                  id="role" 
                  className="select-empresa"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="">-- Seleccione --</option>
                  {
                    ROLES.map( role => (
                      <option value={role.nombre} key={role.id}>{role.nombre}</option>
                    ))
                  }
                
                </select>
              </div>
             
              
            </div>
          
           

            <button type="submit" className="btn-empresa">
              Cargar datos
            </button>
          </form>
         
        )}
        <ToastContainer
          autoClose={3000} 
          closeButton 
          pauseOnHover
          draggable
          limit={1}
        />     
      </>
  )
}

export default FormUsuarios