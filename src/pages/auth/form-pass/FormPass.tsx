import { FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Eye from '../../../components/icons/Eye'
import EyeSlash from '../../../components/icons/EyeSlash'
import PanelMarca from '../../../components/auth/PanelMarca'
import { cambiarPassword } from '../../../services/auth/auth.services'
import '../login/login.css'

const MSG_CONEXION = 'No pudimos conectar con el servidor. Probá de nuevo.'
// Misma regla que el back: mayúscula, minúscula y número, 6 a 50 caracteres.
const REGLA_PASSWORD = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/

/**
 * Paso 2 de la recuperación: llega desde el enlace del mail con ?token=...
 * y la operadora escribe la contraseña nueva dos veces.
 */
const FormPass = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [hidden, setHidden] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)
  const [msgError, setMsgError] = useState('')

  const enlaceInvalido = !/^[a-f0-9]{64}$/.test(token)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsgError('')

    if (password.length < 6 || password.length > 50 || !REGLA_PASSWORD.test(password)) {
      setMsgError('La contraseña debe tener entre 6 y 50 caracteres, con una mayúscula, una minúscula y un número.')
      return
    }
    if (password !== confirmacion) {
      setMsgError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      const respuesta = await cambiarPassword(token, password)

      if (respuesta.statusCode === 200) {
        setListo(true)
        return
      }

      setMsgError(respuesta.message?.[0] ?? 'No pudimos cambiar la contraseña')
    } catch {
      setMsgError(MSG_CONEXION)
    } finally {
      setCargando(false)
    }
  }

  const puedeEnviar = password.length > 0 && confirmacion.length > 0 && !cargando

  return (
    <div className="cs-login">
      <div className="cs-login-layout">
        <PanelMarca titulo="Nueva contraseña." subtitulo="Un paso más y volvés a tu panel." />

        <main className="cs-login-main">
          {enlaceInvalido ? (
            <div className="cs-login-form">
              <div className="cs-login-head">
                <h1>Enlace no válido</h1>
                <p>El enlace está incompleto o ya no sirve. Pedí uno nuevo desde "Recuperar contraseña".</p>
              </div>
              <Link to="/auth/recuperar-pass" className="cs-login-button cs-login-center">
                Pedir un enlace nuevo
              </Link>
            </div>
          ) : listo ? (
            <div className="cs-login-form">
              <div className="cs-login-head">
                <h1>Contraseña actualizada</h1>
                <p>Ya podés iniciar sesión con tu contraseña nueva.</p>
              </div>
              <Link to="/auth/signin" className="cs-login-button cs-login-center">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form className="cs-login-form" onSubmit={handleSubmit}>
              <div className="cs-login-head">
                <h1>Elegí tu contraseña nueva</h1>
                <p>Tiene que tener al menos 6 caracteres, con una mayúscula, una minúscula y un número.</p>
              </div>

              <div className="cs-login-fields">
                <div className="cs-login-field">
                  <label htmlFor="password">Contraseña nueva</label>
                  <div className="cs-login-password">
                    <input
                      className="cs-login-input"
                      type={hidden ? 'password' : 'text'}
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="Tu contraseña nueva"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
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

                <div className="cs-login-field">
                  <label htmlFor="confirmacion">Repetí la contraseña</label>
                  <input
                    className="cs-login-input"
                    type={hidden ? 'password' : 'text'}
                    id="confirmacion"
                    name="confirmacion"
                    autoComplete="new-password"
                    placeholder="Escribila otra vez"
                    value={confirmacion}
                    onChange={(e) => setConfirmacion(e.target.value)}
                  />
                </div>
              </div>

              {msgError.length > 0 && (
                <div className="cs-login-alert cs-login-alert--error" role="alert">{msgError}</div>
              )}

              <button type="submit" className="cs-login-button" disabled={!puedeEnviar}>
                {cargando ? 'Guardando…' : 'Guardar contraseña'}
              </button>

              <Link to="/auth/signin" className="cs-login-link cs-login-center">
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}

export default FormPass