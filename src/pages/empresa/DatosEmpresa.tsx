import './empresa.css';

const DatosEmpresa = () => {
  
  return (
    <div className="empresa-wrapper">
      {/* Header */}
      <div className="empresa-header">
        <h2 className="empresa-header-title">Datos de la Empresa</h2>
        <p className="empresa-header-description">
          Visualice y gestione la información completa de su empresa registrada en el sistema.
        </p>
      </div>

      {/* Contenido */}
      <div className="empresa-datos-container">
        <div className="empresa-datos-card">
          <h3 className="empresa-datos-title">Información</h3>
          <p className="empresa-datos-text">
            Esta sección mostrará los datos completos de su empresa una vez que sean cargados en el sistema.
            Podrá visualizar nombre, dirección, contacto y demás información relevante.
          </p>
          
          <div className="empresa-datos-placeholder">
            <svg className="empresa-datos-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="empresa-datos-placeholder-text">
              Complete el formulario en la pestaña "Form" para ver los datos aquí.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatosEmpresa