import  { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {  useDispatch } from 'react-redux'
import { addMessage } from '../../../app/slices/authSlice'
import { TIPOS_DOC } from '../../../utils/constans'
import Spinner from '../../../components/spinners/Spinner'
import EyeSlash from '../../../components/icons/EyeSlash'
import Eye from '../../../components/icons/Eye'
import { authRegister } from '../../../services/auth/auth.services'
import './register.css'

const Register = () => {
  const [msgError, setMsgError] = useState<string []>([])
  const [showSpinner, setShowSpinner] = useState(false)
  const [showError, setShowError] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [nacimiento, setNacimiento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [pass, setPass] = useState('')
  const [tipo, setTipo] = useState({
    id: 0,
    valor: ''
  })
  const [nro, setNro] = useState<number>(0)
  const [hidden, setHidden] = useState(true)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleClose = () => {
    setShowError(!showError)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowSpinner(true)
    // console.log({nombre,apellido,email,nacimiento,telefono,pass,tipo: tipo.valor});

    const respuesta = await authRegister({
      nombre,
      apellido,
      nacimiento,
      email,
      telefono,
      password: pass,
      tipo_doc: tipo.valor,
      nro_doc: nro!,
      role: "ADMIN"
    })
    
    if(respuesta.statusCode === 201){
      dispatch(addMessage(respuesta.msg))
      navigate('/auth/mensaje')
    }else{
      setShowError(true)
      setMsgError(respuesta.message)
    }

    setShowSpinner(false)
  }

  const handleChangeTipo = (e: ChangeEvent<HTMLSelectElement>) => {
    // console.log(e.target.selectedOptions[0].text);
    setTipo({
      id: +e.target.value,
      valor: e.target.selectedOptions[0].text
    })
  }

  return (
    <>
      {showSpinner ? (
        <Spinner />
      ) : (
      <div className="login-container">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2 className='register-heading'>Crea una cuenta</h2>
          <div className="main-register">
            <div className="box-register">
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  placeholder="Ingrese su nombre" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="apellido">Apellido</label>
                <input 
                type="text" 
                id="apellido" 
                name="apellido" 
                placeholder="Ingrese su apellido" 
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="Ingrese su email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="box-register">
              <div className="form-group">
                <label htmlFor="nacimiento">Nacimiento</label>
                <input 
                  type="date" 
                  id="nacimiento" 
                  name="nacimiento" 
                  value={nacimiento}
                  onChange={(e) => setNacimiento(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input 
                type="text" 
                id="telefono" 
                name="telefono" 
                placeholder="Ej: 5492613555999" 
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required />
              </div>
              <div className="form-group">
                <label htmlFor="pass">Contraseña</label>
                
                <div className="input-container">
                  <input 
                    type={hidden ? "password": "text"}
                    id="pass" 
                    name="pass"  
                    placeholder="Ingrese su password" 
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
              </div>
            </div>
            <div className="box-register">
              <div className="form-group">
                <label htmlFor="tipo_documento">Tipo de documento</label>
                <select 
                  id="tipo_documento" 
                  name="tipo_documento" 
                  required
                  value={tipo.id}
                  onChange={handleChangeTipo}
                >
                  <option value="">Seleccione</option>
                  {TIPOS_DOC.map((tipo)=>(
                    <option value={tipo.id} key={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="numero_documento">Número de documento</label>
                <input 
                  type="number" 
                  id="numero_documento" 
                  name="numero_documento" 
                  value={nro}
                  onChange={(e) => setNro(+e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>
          <button type="submit" className="login-button">Registrarse</button>
          <p className="signup-link">
            ¿Ya tienes una cuenta? <Link to={'/auth/signin'}>Iniciar Sesión</Link>
          </p>
          {msgError?.length > 0 && showError && (
            <div className='modal'>
              <button type='button' onClick={handleClose}>
                X
              </button>
              {
                msgError.map((msj,index) => (
                  <p key={index} className="msg-error">
                    {msj}
                  </p>
                )) 
              }
            </div>
          
          )}
        </form>
      </div>
      )}
    </>
  )
}

export default Register
