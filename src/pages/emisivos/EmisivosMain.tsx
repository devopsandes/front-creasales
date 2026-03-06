//EmisivosMain.tsx

import { useState } from "react";
import CrearNotificaciones from "./CrearNotificaciones";
import VerNotificaciones from "./VerNotificaciones";
import VerMensajes from "./VerMensajes";
import VerNotificacionesMasivas from "./VerNotificacionesMasivas";
import './EmisivosMain.css';

type TabType = 'crear' | 'verNotificacionesMasivas' | 'verNotificaciones' | 'verMensajes';

const EmisivosMain = () => {
  const [activeTab, setActiveTab] = useState<TabType>('crear');

  return (
    <div className="emisivos-main-wrapper">
      <div className="emisivos-tabs-container">
        <div className="emisivos-tabs">
          <button
            className={`emisivos-tab ${activeTab === 'crear' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('crear')}
          >
            Crear Notificaciones
          </button>
          <button
            className={`emisivos-tab ${activeTab === 'verNotificacionesMasivas' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('verNotificacionesMasivas')}
          >
            Notificaciones Masivas
          </button>
          <button
            className={`emisivos-tab ${activeTab === 'verNotificaciones' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('verNotificaciones')}
          >
            Ver Notificaciones
          </button>
          <button
            className={`emisivos-tab ${activeTab === 'verMensajes' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('verMensajes')}
          >
            Ver Mensajes
          </button>
        </div>
        <div
          className="emisivos-tab-indicator"
          style={{
            transform: activeTab === 'crear' ? 'translateX(0%)' :
              activeTab === 'verNotificacionesMasivas' ? 'translateX(100%)' :
                activeTab === 'verNotificaciones' ? 'translateX(200%)' :
                  'translateX(300%)',
            width: '25%'
          }}
        ></div>
      </div>

      <div className="emisivos-tab-content">
        {activeTab === 'crear' && <CrearNotificaciones />}
        {activeTab === 'verNotificacionesMasivas' && <VerNotificacionesMasivas />}
        {activeTab === 'verNotificaciones' && <VerNotificaciones />}
        {activeTab === 'verMensajes' && <VerMensajes />}
      </div>
    </div>
  );
};

export default EmisivosMain;