import {  FormEvent,  useState } from 'react'
import { Link,  useNavigate } from 'react-router-dom'
// import { useLoginMutation } from '../../../api/apiSalice'
import Spinner from '../../../components/spinners/Spinner'
import Eye from '../../../components/icons/Eye'
import EyeSlash from '../../../components/icons/EyeSlash'
import { authLogin } from '../../../services/auth/auth.services'
import { useDispatch } from 'react-redux'
import { accessGranted } from '../../../app/slices/authSlice'
import { decodeToken } from '../../../utils/tokenUtils'
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
    const respuesta = await authLogin({email, password})
    
    if(respuesta.token){
      const decoded = decodeToken(respuesta.token)
      const userId = respuesta.id || decoded?.id || null
      const role = respuesta.role
      
      dispatch(accessGranted())
      localStorage.setItem('token', respuesta.token)
      localStorage.setItem('role', role)
      
      if(userId){
        localStorage.setItem('userId', userId)
      }
      
      if(role === 'ROOT' || role === 'ADMIN'){
        navigate('/dashboard/empresa')
      }else{
        navigate('/dashboard/chats')
      }
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
      <div className="signin-wrapper">
        <div className="signin-container">
          <div className="signin-content">
            {/* Logo con cohete */}
            <div className="signin-logo-container">
              <img 
                src="/images/CreaTechRocket.png" 
                alt="CreaSales - Despega tus ventas" 
                className="signin-logo"
              />
            </div>

            {/* Título */}
            <h1 className="signin-title">Iniciar Sesión</h1>
            <p className="signin-subtitle">Accede a tu cuenta CreaSales</p>

            {/* Formulario */}
            <form className="signin-form" onSubmit={handleSubmit}>
              <div className="signin-form-group">
                <label htmlFor="email" className="signin-label">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"  
                  autoComplete="email"
                  placeholder="tu@email.com" 
                  className="signin-input"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="signin-form-group">
                <label htmlFor="password" className="signin-label">Contraseña</label>
                <div className="signin-input-wrapper">
                  <input 
                    type={hidden ? "password" : "text"}
                    id="password" 
                    name="password"  
                    autoComplete={hidden ? "current-password" : "off"}
                    placeholder="••••••••" 
                    className="signin-input signin-input-password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    className="signin-btn-eye" 
                    type="button" 
                    onClick={() => setHidden(!hidden)}
                    aria-label={hidden ? "Mostrar contraseña" : "Ocultar contraseña"}
                  >
                    {hidden ? <Eye /> : <EyeSlash />}
                  </button>
                </div>
              </div>

              {msgError.length > 0 && (
                <div className="signin-error">
                  {msgError}
                </div>
              )}

              <button type="submit" className="signin-button">
                Iniciar Sesión
              </button>

              <div className="signin-links">
                <Link to="/auth/signup" className="signin-link">Crear cuenta</Link>
                <span className="signin-separator">•</span>
                <Link to="/auth/recuperar-pass" className="signin-link">Recuperar contraseña</Link>
              </div>
            </form>

            {/* Footer */}
            <footer className="signin-footer">
              <p className="signin-brand">Una creación de CreaTech</p>
            </footer>
          </div>
        </div>
      </div>
      )}
    </>
  )
}

export default Login