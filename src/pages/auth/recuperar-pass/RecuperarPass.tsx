import { Link } from 'react-router-dom'
import './recuperar-pass.css'

const RecuperarPass = () => {
  return (
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
          <h1 className="signin-title">Recuperar Contraseña</h1>
          <p className="signin-subtitle">Recupera el acceso a tu cuenta</p>

          {/* Mensaje de contacto */}
          <div className="signin-contact-message">
            <p className="signin-contact-text">
              Contáctanos para potenciar tu proceso comercial con una experiencia ágil y confiable.
            </p>
            <a 
              href="mailto:gino.cornejo@andessalud.ar" 
              className="signin-contact-email"
            >
              gino.cornejo@andessalud.ar
            </a>
          </div>

          {/* Links */}
          <div className="signin-links">
            <Link to="/auth/signin" className="signin-link">Iniciar Sesión</Link>
            <span className="signin-separator">•</span>
            <Link to="/auth/signup" className="signin-link">Crear cuenta</Link>
          </div>

          {/* Footer */}
          <footer className="signin-footer">
            <p className="signin-brand">Una creación de CreaTech</p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default RecuperarPass
