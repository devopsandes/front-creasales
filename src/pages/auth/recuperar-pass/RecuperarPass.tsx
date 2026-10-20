import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import PanelMarca from '../../../components/auth/PanelMarca'
import Turnstile, { TURNSTILE_SITE_KEY } from '../../../components/turnstile/Turnstile'
import { sendEmailRecuperarPass } from '../../../services/auth/auth.services'
import '../login/login.css'

const MSG_CONEXION = 'No pudimos conectar con el servidor. Probá de nuevo.'

/**
 * Paso 1 de la recuperación: la operadora pone su mail y recibe un enlace.
 * El back responde siempre lo mismo, exista o no la cuenta.
 */
const RecuperarPass = () => {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileKey, setTurnstileKey] = useState(0)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsgError('')
    setCargando(true)

    try {
      const respuesta = await sendEmailRecuperarPass(email.trim(), turnstileToken || undefined)

      if (respuesta.statusCode === 200) {
        setEnviado(true)
        return
      }

      setMsgError(respuesta.message?.[0] ?? 'No pudimos procesar el pedido')
    } catch {
      setMsgError(MSG_CONEXION)
    } finally {
      setTurnstileToken('')
      setTurnstileKey((k) => k + 1)
      setCargando(false)
    }
  }

  const esperandoTurnstile = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken

  return (
    <div className="cs-login">
      <div className="cs-login-layout">
        <PanelMarca titulo="¿Olvidaste tu contraseña?" subtitulo="Pasa. Te ayudamos a recuperar el acceso." />

        <main className="cs-login-main">
          {enviado ? (
            <div className="cs-login-form">
              <div className="cs-login-head">
                <h1>Revisá tu mail</h1>
                <p>
                  Si <strong>{email.trim()}</strong> está registrado en CreaSales, te enviamos un enlace
                  para cambiar la contraseña. Vence en 30 minutos. Revisá también la carpeta de spam.
                </p>
              </div>

              <Link to="/auth/signin" className="cs-login-button cs-login-center">
                Volver al inicio de sesión
              </Link>

              <p className="cs-login-resend cs-login-center">
                ¿No te llegó?{' '}
                <button type="button" className="cs-login-link" onClick={() => setEnviado(false)}>
                  Pedir otro enlace
                </button>
              </p>
            </div>
          ) : (
            <form className="cs-login-form" onSubmit={handleSubmit}>
              <Link to="/auth/signin" className="cs-login-back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Volver
              </Link>

              <div className="cs-login-head">
                <h1>Recuperar contraseña</h1>
                <p>Ingresá el mail con el que estás registrada en CreaSales y te enviamos un enlace para cambiarla.</p>
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
                    required
                    autoFocus
                  />
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

              <button type="submit" className="cs-login-button" disabled={esperandoTurnstile || cargando || !email.trim()}>
                {cargando ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}

export default RecuperarPass