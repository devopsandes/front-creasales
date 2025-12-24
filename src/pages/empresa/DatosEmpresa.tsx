import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import './empresa.css';

const DatosEmpresa = () => {
  const empresa = useSelector((state: RootState) => state.auth.empresa);

  const estadoEmpresa = useMemo(() => {
    if (!empresa) return '—';
    return empresa.activo ? 'Activa' : 'Inactiva';
  }, [empresa]);

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
        {empresa ? (
          <div className="empresa-datos-card">
            <div className="empresa-datos-header">
              <h3 className="empresa-datos-title">Información general</h3>
              <span className={`empresa-datos-status ${empresa.activo ? 'empresa-datos-status--active' : 'empresa-datos-status--inactive'}`}>
                {estadoEmpresa}
              </span>
            </div>
            <p className="empresa-datos-text">
              Estos son los datos registrados para la empresa asociada a tu cuenta. Puedes actualizarlos desde la pestaña “Form”.
            </p>

            <div className="empresa-datos-grid">
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Nombre comercial</span>
                <span className="empresa-datos-value">{empresa.nombre || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">CUIT</span>
                <span className="empresa-datos-value">{empresa.cuit || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Rubro</span>
                <span className="empresa-datos-value">{empresa.rubro || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Teléfono</span>
                <span className="empresa-datos-value">{empresa.telefono || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Correo electrónico</span>
                <span className="empresa-datos-value">{empresa.email || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Dirección</span>
                <span className="empresa-datos-value">{empresa.direccion || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Provincia</span>
                <span className="empresa-datos-value">{empresa.provincia || '—'}</span>
              </div>
              <div className="empresa-datos-item">
                <span className="empresa-datos-label">Municipio</span>
                <span className="empresa-datos-value">{empresa.municipio || '—'}</span>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}

export default DatosEmpresa