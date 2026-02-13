// EmisivosMain.tsx

import { useState } from "react";
import Notificaciones from "./CrearNotificaciones";
import VerNotificaciones from "./VerNotificaciones";
import Plantillas from "./Plantillas";
import './EmisivosMain.css';

type TabType = 'crear' | 'ver' | 'plantillas';

const EmisivosMain = () => {
  const [activeTab, setActiveTab] = useState<TabType>('crear');

  return (
    <div className="emisivos-main-wrapper">
      {/* Tabs Header */}
      <div className="emisivos-tabs-container">
        <div className="emisivos-tabs">
          <button
            className={`emisivos-tab ${activeTab === 'crear' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('crear')}
          >
            Crear Notificaciones
          </button>
          <button
            className={`emisivos-tab ${activeTab === 'ver' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('ver')}
          >
            Ver Notificaciones
          </button>
          <button
            className={`emisivos-tab ${activeTab === 'plantillas' ? 'emisivos-tab-active' : ''}`}
            onClick={() => setActiveTab('plantillas')}
          >
            Plantillas
          </button>
        </div>
        <div 
          className="emisivos-tab-indicator" 
          style={{ 
            transform: activeTab === 'crear' ? 'translateX(0%)' : 
                      activeTab === 'ver' ? 'translateX(100%)' : 'translateX(200%)',
            width: '33.333%'
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="emisivos-tab-content">
        {activeTab === 'crear' && <Notificaciones />}
        {activeTab === 'ver' && <VerNotificaciones />}
        {activeTab === 'plantillas' && <Plantillas />}
      </div>
    </div>
  );
};

export default EmisivosMain;
