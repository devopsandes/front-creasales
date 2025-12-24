import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './main.css'

const MainView = () => {
  const location = useLocation()

  // Asegurarse de que solo se renderice en la ruta raíz exacta
  useEffect(() => {
    // Si no estamos en la ruta raíz, no hacer nada
    if (location.pathname !== '/') {
      return
    }
  }, [location])

  // Solo renderizar si estamos en la ruta raíz exacta
  if (location.pathname !== '/') {
    return null
  }

  return (
    <div className="mainview-wrapper">
      <div className="mainview-container">
        <div className="mainview-content">
          {/* Logo con planeta */}
          <div className="mainview-logo-container">
            <img 
              src="/images/CreaTechLog.jpeg" 
              alt="Logo CreaSales - Sistema de gestión comercial" 
              className="mainview-logo"
            />
          </div>

          {/* Título principal */}
          <h1 className="mainview-title">Bienvenido a CreaSales</h1>

          {/* Subtítulo descriptivo */}
          <p className="mainview-subtitle">
            Potencia tu proceso comercial con una experiencia ágil y confiable.
          </p>

          {/* CTA Principal */}
          <div className="mainview-cta-container">
            <Link to="/auth/signin" className="mainview-cta">
              Iniciar sesión
            </Link>
            
            {/* Texto guía */}
            <p className="mainview-help-text">
              Accede con tus credenciales para administrar clientes, oportunidades y ventas.
            </p>
          </div>

          {/* Leyenda de marca */}
          <footer className="mainview-footer">
            <p className="mainview-brand">Una creación de CreaTech</p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default MainView

