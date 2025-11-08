import '../empresa/empresa.css';

const DatosMeta = () => {
  
  return (
    <div className="empresa-wrapper">
      {/* Header */}
      <div className="empresa-header">
        <h2 className="empresa-header-title">Guía de Configuración Meta</h2>
        <p className="empresa-header-description">
          Información detallada sobre cómo obtener y configurar cada campo requerido para la integración con Meta.
        </p>
      </div>

      {/* Contenido */}
      <div className="meta-datos-wrapper">
        <div className="meta-datos-grid">
          {/* Columna izquierda */}
          <div className="meta-datos-column">
            {/* Access Token */}
            <div className="meta-guide-card">
              <h4 className="meta-guide-title">1. Access Token (Obligatorio)</h4>
              <p className="meta-guide-text">
                El <strong>Access Token</strong> es la credencial principal que permite a su aplicación comunicarse con la API de Meta.
              </p>
              <div className="meta-guide-steps">
                <p className="meta-guide-step-title">📋 Pasos para obtenerlo:</p>
                <ol className="meta-guide-list">
                  <li>Acceda a <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="meta-link">Meta for Developers</a></li>
                  <li>Seleccione su aplicación o cree una nueva</li>
                  <li>Vaya a <strong>Configuración → Básica</strong></li>
                  <li>En "Tokens de acceso", genere o copie su token</li>
                  <li>Verifique que tenga permisos para WhatsApp Business API</li>
                </ol>
              </div>
            </div>

            {/* ID Phone Number */}
            <div className="meta-guide-card">
              <h4 className="meta-guide-title">3. ID Phone Number (Obligatorio)</h4>
              <p className="meta-guide-text">
                El <strong>ID Phone Number</strong> es el identificador único de su número de WhatsApp Business (diferente al número visible).
              </p>
              <div className="meta-guide-steps">
                <p className="meta-guide-step-title">📋 Pasos para encontrarlo:</p>
                <ol className="meta-guide-list">
                  <li>Acceda a <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="meta-link">Meta Business Suite</a></li>
                  <li>Vaya a <strong>Configuración → Cuentas de WhatsApp</strong></li>
                  <li>Seleccione su cuenta de WhatsApp Business</li>
                  <li>Encontrará el <strong>Phone Number ID</strong> (15 dígitos aprox)</li>
                </ol>
              </div>
            </div>

            {/* Enlaces útiles */}
            <div className="meta-guide-card meta-guide-card-links">
              <h4 className="meta-guide-title">📚 Enlaces útiles</h4>
              <ul className="meta-guide-links">
                <li>
                  <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="meta-link">
                    Meta for Developers
                  </a>
                  <span className="meta-link-desc">Portal principal de desarrolladores</span>
                </li>
                <li>
                  <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="meta-link">
                    Meta Business Suite
                  </a>
                  <span className="meta-link-desc">Administración de cuentas empresariales</span>
                </li>
                <li>
                  <a href="https://developers.facebook.com/docs/whatsapp/" target="_blank" rel="noopener noreferrer" className="meta-link">
                    Documentación WhatsApp Business API
                  </a>
                  <span className="meta-link-desc">Guía completa de la API</span>
                </li>
                <li>
                  <a href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens/" target="_blank" rel="noopener noreferrer" className="meta-link">
                    Guía de tokens de acceso
                  </a>
                  <span className="meta-link-desc">Información detallada sobre tokens</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="meta-datos-column">
            {/* User Token */}
            <div className="meta-guide-card">
              <h4 className="meta-guide-title">2. User Token (Requerido para Marketing)</h4>
              <p className="meta-guide-text">
                El <strong>User Token</strong> es necesario solo si planea utilizar servicios de marketing. Opcional para WhatsApp únicamente.
              </p>
              <div className="meta-guide-steps">
                <p className="meta-guide-step-title">📋 Pasos para obtenerlo:</p>
                <ol className="meta-guide-list">
                  <li>Inicie sesión en <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="meta-link">Meta Business Suite</a></li>
                  <li>Vaya a <strong>Configuración de la cuenta</strong></li>
                  <li>Seleccione <strong>Usuarios del sistema</strong></li>
                  <li>Genere un token con permisos de marketing</li>
                  <li>Copie y guarde el token de forma segura</li>
                </ol>
              </div>
            </div>

            {/* Servicios */}
            <div className="meta-guide-card">
              <h4 className="meta-guide-title">4. Servicios</h4>
              <p className="meta-guide-text">
                Seleccione el tipo de servicio según sus necesidades.
              </p>
              <div className="meta-guide-steps">
                <p className="meta-guide-step-title">📋 Opciones disponibles:</p>
                <ul className="meta-guide-services">
                  <li>
                    <strong>WHATSAPP:</strong> Solo mensajería de WhatsApp Business API
                  </li>
                  <li>
                    <strong>MARKETING:</strong> Solo servicios de marketing (requiere User Token)
                  </li>
                  <li>
                    <strong>AMBAS:</strong> Integración completa (requiere User Token)
                  </li>
                </ul>
              </div>
            </div>

            {/* Nota de seguridad */}
            <div className="meta-guide-card meta-guide-card-security">
              <p className="meta-guide-security">
                🔒 <strong>Importante:</strong> Mantenga sus tokens seguros y nunca los comparta públicamente. 
                Los tokens proporcionan acceso a su cuenta de Meta y deben tratarse como contraseñas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatosMeta

