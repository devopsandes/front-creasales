import {  FormEvent,  useState } from 'react'
import { Link,  useNavigate } from 'react-router-dom'
// import { useLoginMutation } from '../../../api/apiSalice'
import Spinner from '../../../components/spinners/Spinner'
import Eye from '../../../components/icons/Eye'
import EyeSlash from '../../../components/icons/EyeSlash'
import { authLogin } from '../../../services/auth/auth.services'
import { useDispatch } from 'react-redux'
import { accessGranted } from '../../../app/slices/authSlice'
import './login.css'

const Login = () => {
  const [hidden, setHidden] = useState(true)
  const [showSpinner, setShowSpinner] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()
  const dispatch = useDispatch()
  // const [ login ] = useLoginMutation()

  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowSpinner(true)
    
    // let respuesta = await login({email, password})
    let respuesta = await authLogin({email, password})

    
    
    if(respuesta.token){
      dispatch(accessGranted())
      localStorage.setItem('token', respuesta.token)
      localStorage.setItem('role', respuesta.role)
      navigate('/dashboard')
    }else {
      setMsgError(respuesta.message[0])
    }

    setShowSpinner(false)
  }


  return (
    <>
    {showSpinner ? (
      <Spinner />
    ) : (
      <div className="login-container">
          {/* <h1 className='text-3xl font-bold text-blue-500'>esto es una prueba</h1> */}
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Login</h2>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"  
                placeholder="Ingrese su email" 
                onChange={(e) => setEmail(e.target.value)}
                // required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <input 
                  type={hidden ? "password": "text"}
                  id="password" 
                  name="password"  
                  placeholder="Ingrese su password" 
                  onChange={(e) => setPassword(e.target.value)}
                  // required
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
            <button type="submit" className="login-button">Iniciar Sesión</button>
            
            <p className="signup-link">
              <Link to={'/auth/signup'}>Registrarse</Link> / <Link to={'/auth/recuperar-pass'}>Recuperar Contraseña</Link>
            </p>
          
            {msgError.length > 0 && (
              <p className="msg-error">
                {msgError}
              </p>
            )}
           
          </form>
        </div>
      )}
    </>

     
  )
}

export default Login