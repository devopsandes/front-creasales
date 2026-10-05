import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../../../components/spinners/Spinner'
import Eye from '../../../components/icons/Eye'
import EyeSlash from '../../../components/icons/EyeSlash'
import Turnstile, { TURNSTILE_SITE_KEY } from '../../../components/turnstile/Turnstile'
import { authLogin, authReenviarMfa, authVerificarMfa } from '../../../services/auth/auth.services'
import { useDispatch } from 'react-redux'
import { accessGranted } from '../../../app/slices/authSlice'
import { decodeToken } from '../../../utils/tokenUtils'
import {
  borrarDispositivoConfiable,
  guardarDispositivoConfiable,
  obtenerDispositivoConfiable,
} from '../../../utils/dispositivoConfiable'
import { ErrorResponse, LoginResponse } from '../../../interfaces/auth.interface'
import './login.css'

const ESPERA_REENVIO_SEG = 60
const MSG_CONEXION = 'No pudimos conectar con el servidor. Probá de nuevo.'

const Login = () => {
  const [hidden, setHidden] = useState(true)
  const [showSpinner, setShowSpinner] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [msgInfo, setMsgInfo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  // MFA
  const [paso, setPaso] = useState<'credenciales' | 'codigo'>('credenciales')
  const [mfaTicket, setMfaTicket] = useState('')
  const [emailEnmascarado, setEmailEnmascarado] = useState('')
  const [codigo, setCodigo] = useState('')
  const [recordar, setRecordar] = useState(false)
  const [esperaReenvio, setEsperaReenvio] = useState(0)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    if (esperaReenvio <= 0) return
    const timer = setTimeout(() => setEsperaReenvio((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [esperaReenvio])

  const completarLogin = (respuesta: LoginResponse & ErrorResponse) => {
    const decoded = decodeToken(respuesta.token)
    const userId = respuesta.id || decoded?.id || null
    const role = respuesta.role

    dispatch(accessGranted())
    localStorage.setItem('token', respuesta.token)
    localStorage.setItem('role', role)

    if (userId) {
      localStorage.setItem('userId', userId)
    }

    if (role === 'ROOT' || role === 'ADMIN') {
      navigate('/dashboard/empresa')
    } else {
      navigate('/dashboard/chats')
    }
  }

  const volverACredenciales = (mensaje = '') => {
    setPaso('credenciales')
    setMfaTicket('')
    setCodigo('')
    setEsperaReenvio(0)
    setMsgInfo('')
    setMsgError(mensaje)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsgError('')
    setMsgInfo('')
    setShowSpinner(true)

    try {
      const respuesta = await authLogin({
        email,
        password,
        turnstileToken: turnstileToken || undefined,
        dispositivoToken: obtenerDispositivoConfiable(),
      })

      if (respuesta.token) {
        completarLogin(respuesta)
        return
      }

      if (respuesta.mfaRequerido && respuesta.mfaTicket) {
        setMfaTicket(respuesta.mfaTicket)
        setEmailEnmascarado(respuesta.emailEnmascarado ?? '')
        setCodigo('')
        setPaso('codigo')
        setEsperaReenvio(ESPERA_REENVIO_SEG)
        return
      }

      setMsgError(respuesta.message?.[0] ?? 'No se pudo iniciar sesión')
    } catch {
      setMsgError(MSG_CONEXION)
    } finally {
      // El comprobante de Turnstile es de un solo uso. El control se vuelve
      // a montar al salir del spinner y genera uno nuevo.
      setTurnstileToken('')
      setShowSpinner(false)
    }
  }

  const handleVerificar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsgError('')
    setMsgInfo('')
    setShowSpinner(true)

    try {
      const respuesta = await authVerificarMfa({ mfaTicket, codigo, recordar })

      if (respuesta.token) {
        if (respuesta.dispositivoToken) guardarDispositivoConfiable(respuesta.dispositivoToken)
        else if (!recordar) borrarDispositivoConfiable()
        completarLogin(respuesta)
        return
      }

      if (respuesta.code === 'MFA_REINICIAR') {
        volverACredenciales(respuesta.message?.[0] ?? '')
        return
      }

      setCodigo('')
      setMsgError(respuesta.message?.[0] ?? 'No se pudo verificar el código')
    } catch {
      setMsgError(MSG_CONEXION)
    } finally {
      setShowSpinner(false)
    }
  }

  const handleReenviar = async () => {
    setMsgError('')
    setMsgInfo('')

    try {
      const respuesta = await authReenviarMfa(mfaTicket)

      if (respuesta.code === 'MFA_REINICIAR') {
        volverACredenciales(respuesta.message?.[0] ?? '')
        return
      }

      if (respuesta.statusCode === 200) {
        setCodigo('')
        setMsgInfo('Te enviamos un código nuevo.')
        setEsperaReenvio(ESPERA_REENVIO_SEG)
        return
      }

      setMsgError(respuesta.message?.[0] ?? 'No se pudo reenviar el código')
    } catch {
      setMsgError(MSG_CONEXION)
    }
  }

  const esperandoTurnstile = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken

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

              {paso === 'credenciales' ? (
                <>
                  <h1 className="signin-title">Iniciar Sesión</h1>
                  <p className="signin-subtitle">Accede a tu cuenta CreaSales</p>

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
                        value={email}
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
                          value={password}
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

                    <Turnstile
                      onToken={setTurnstileToken}
                      onError={() => setMsgError('No pudimos cargar la verificación de seguridad. Recargá la página.')}
                    />

                    {msgError.length > 0 && (
                      <div className="signin-error">
                        {msgError}
                      </div>
                    )}

                    <button type="submit" className="signin-button" disabled={esperandoTurnstile}>
                      Iniciar Sesión
                    </button>

                    <div className="signin-links">
                      <Link to="/auth/recuperar-pass" className="signin-link">Recuperar contraseña</Link>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="signin-title">Verificá tu identidad</h1>
                  <p className="signin-subtitle">
                    Te mandamos un código de 6 dígitos a {emailEnmascarado || 'tu mail'}
                  </p>

                  <form className="signin-form" onSubmit={handleVerificar}>
                    <div className="signin-form-group">
                      <label htmlFor="codigo" className="signin-label">Código</label>
                      <input
                        type="text"
                        id="codigo"
                        name="codigo"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        className="signin-input signin-input-codigo"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                      />
                    </div>

                    <label className="signin-checkbox">
                      <input
                        type="checkbox"
                        checked={recordar}
                        onChange={(e) => setRecordar(e.target.checked)}
                      />
                      Recordar este navegador por 30 días
                    </label>

                    {msgInfo.length > 0 && (
                      <div className="signin-info">
                        {msgInfo}
                      </div>
                    )}

                    {msgError.length > 0 && (
                      <div className="signin-error">
                        {msgError}
                      </div>
                    )}

                    <button type="submit" className="signin-button" disabled={codigo.length !== 6}>
                      Verificar
                    </button>

                    <div className="signin-links">
                      <button
                        type="button"
                        className="signin-link signin-link-button"
                        onClick={handleReenviar}
                        disabled={esperaReenvio > 0}
                      >
                        {esperaReenvio > 0 ? `Reenviar código (${esperaReenvio}s)` : 'Reenviar código'}
                      </button>
                      <span className="signin-separator">|</span>
                      <button
                        type="button"
                        className="signin-link signin-link-button"
                        onClick={() => volverACredenciales()}
                      >
                        Volver
                      </button>
                    </div>
                  </form>
                </>
              )}

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