import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [cargando, setCargando] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [msgInfo, setMsgInfo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  // Cambiar la key vuelve a montar Turnstile y genera un comprobante nuevo
  // (cada comprobante sirve para un solo intento).
  const [turnstileKey, setTurnstileKey] = useState(0)

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
    setCargando(true)

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
      setTurnstileToken('')
      setTurnstileKey((k) => k + 1)
      setCargando(false)
    }
  }

  const handleVerificar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsgError('')
    setMsgInfo('')
    setCargando(true)

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
      setCargando(false)
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
  const celdaActiva = Math.min(codigo.length, 5)

  return (
    <div className="cs-login">
      <div className="cs-login-layout">

        {/* Panel de marca */}
        <section className="cs-login-brand">
          <svg className="cs-login-orbits" aria-hidden="true" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#FFFFFF" strokeOpacity="0.10" strokeWidth="1.5">
              <ellipse cx="560" cy="520" rx="420" ry="170" transform="rotate(-24 560 520)" />
              <ellipse cx="560" cy="520" rx="300" ry="118" transform="rotate(-24 560 520)" />
              <ellipse cx="560" cy="520" rx="190" ry="72" transform="rotate(-24 560 520)" />
            </g>
            <path d="M 180 770 Q 400 640 640 330" fill="none" stroke="#F2445E" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
            <circle cx="640" cy="330" r="7" fill="#F2445E" />
            <circle cx="268" cy="640" r="5" fill="#5AA2FF" />
            <g fill="#FFFFFF">
              <circle cx="90" cy="160" r="1.6" fillOpacity="0.7" />
              <circle cx="330" cy="110" r="1.2" fillOpacity="0.5" />
              <circle cx="520" cy="190" r="1.8" fillOpacity="0.6" />
              <circle cx="720" cy="120" r="1.2" fillOpacity="0.5" />
              <circle cx="140" cy="430" r="1.2" fillOpacity="0.4" />
              <circle cx="760" cy="640" r="1.6" fillOpacity="0.5" />
              <circle cx="420" cy="820" r="1.2" fillOpacity="0.4" />
              <circle cx="60" cy="700" r="1.8" fillOpacity="0.5" />
            </g>
          </svg>

          <div className="cs-login-logo">
            <img src="/images/CreaTechRocket.png" alt="" />
            <span>CreaSales</span>
          </div>

          <div className="cs-login-brand-copy">
            <h2>Hola de nuevo.</h2>
            <p>Tu panel de atención te está esperando.</p>
          </div>

          <p className="cs-login-brand-footer">Una creación de CreaTech</p>
        </section>

        {/* Formulario */}
        <main className="cs-login-main">
          {paso === 'credenciales' ? (
            <form className="cs-login-form" onSubmit={handleSubmit}>
              <div className="cs-login-head">
                <h1>Iniciar sesión</h1>
                <p>Ingresá con tu cuenta de CreaSales.</p>
              </div>

              <div className="cs-login-fields">
                <div className="cs-login-field">
                  <label htmlFor="email">Email</label>
                  <input
                    className="cs-login-input"
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="cs-login-field">
                  <label htmlFor="password">Contraseña</label>
                  <div className="cs-login-password">
                    <input
                      className="cs-login-input"
                      type={hidden ? 'password' : 'text'}
                      id="password"
                      name="password"
                      autoComplete={hidden ? 'current-password' : 'off'}
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="cs-login-eye"
                      type="button"
                      onClick={() => setHidden(!hidden)}
                      aria-label={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
                    >
                      {hidden ? <Eye /> : <EyeSlash />}
                    </button>
                  </div>
                </div>
              </div>

              <Turnstile
                key={turnstileKey}
                onToken={setTurnstileToken}
                onError={() => setMsgError('No pudimos cargar la verificación de seguridad. Recargá la página.')}
              />

              {msgError.length > 0 && (
                <div className="cs-login-alert cs-login-alert--error" role="alert">{msgError}</div>
              )}

              <button type="submit" className="cs-login-button" disabled={esperandoTurnstile || cargando}>
                {cargando ? 'Ingresando…' : 'Iniciar sesión'}
              </button>

              <Link to="/auth/recuperar-pass" className="cs-login-link cs-login-center">
                Recuperar contraseña
              </Link>
            </form>
          ) : (
            <form className="cs-login-form" onSubmit={handleVerificar}>
              <button type="button" className="cs-login-back" onClick={() => volverACredenciales()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Volver
              </button>

              <div className="cs-login-head">
                <h1>Revisá tu mail</h1>
                <p>
                  Te mandamos un código de 6 dígitos a{' '}
                  <strong>{emailEnmascarado || 'tu mail'}</strong>. Vence en 10 minutos.
                </p>
              </div>

              <div className="cs-login-field">
                <label htmlFor="codigo">Código</label>
                <div className="cs-login-code-wrap">
                  <input
                    className="cs-login-code"
                    type="text"
                    id="codigo"
                    name="codigo"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                  <div className="cs-login-cells" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`cs-login-cell${codigo[i] ? ' is-filled' : ''}${i === celdaActiva ? ' is-active' : ''}`}
                      >
                        {codigo[i] ?? ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <label className="cs-login-check">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                />
                Recordar este navegador por 30 días
              </label>

              {msgInfo.length > 0 && (
                <div className="cs-login-alert cs-login-alert--info" role="status">{msgInfo}</div>
              )}

              {msgError.length > 0 && (
                <div className="cs-login-alert cs-login-alert--error" role="alert">{msgError}</div>
              )}

              <button type="submit" className="cs-login-button" disabled={codigo.length !== 6 || cargando}>
                {cargando ? 'Verificando…' : 'Verificar'}
              </button>

              <p className="cs-login-resend cs-login-center">
                ¿No te llegó?{' '}
                <button
                  type="button"
                  className="cs-login-link"
                  onClick={handleReenviar}
                  disabled={esperaReenvio > 0}
                >
                  {esperaReenvio > 0 ? `Reenviar código en ${esperaReenvio} s` : 'Reenviar código'}
                </button>
              </p>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}

export default Login