import { useState } from 'react';
import ChannelsTabs from './components/ChannelsTabs';
import WhatsappHeader from './components/WhatsappHeader';
import WhatsappSubtabs from './components/WhatsappSubtabs';
import ChannelsToolbar from './components/ChannelsToolbar';
import ChannelsTable from './components/ChannelsTable';
import './components/channels.css';

const TableIntegraciones = () => {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [activeSubtab, setActiveSubtab] = useState('canales');
  const [searchValue, setSearchValue] = useState('');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset subtab when changing main tab
    if (tab === 'whatsapp') {
      setActiveSubtab('canales');
    }
  };

  const handleSubtabChange = (subtab: string) => {
    setActiveSubtab(subtab);
  };

  const handleAddNumber = () => {
    console.log('Agregar número de WhatsApp');
    // TODO: Implementar modal o navegación para agregar número
  };

  const handleCreateChannel = () => {
    console.log('Crear nuevo canal');
    // TODO: Implementar modal o navegación para crear canal
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSignupComplete = () => {
    // Aquí podrías refrescar la lista de canales si fuera necesario
    console.log('WhatsApp signup completed, refreshing channels...');
    // TODO: Implementar refresh de la lista de canales
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'whatsapp':
        return (
          <div className="integraciones-content">
            <ChannelsToolbar
              searchValue={searchValue}
              onSearchChange={handleSearchChange}
              onCreateChannel={handleCreateChannel}
            />
            <WhatsappHeader 
              onAddNumber={handleAddNumber} 
              onSignupComplete={handleSignupComplete}
            />
            <WhatsappSubtabs 
              activeSubtab={activeSubtab} 
              onSubtabChange={handleSubtabChange} 
            />
            <ChannelsTable 
              type={activeSubtab as 'canales' | 'plantillas'} 
              searchValue={searchValue}
            />
          </div>
        );
      case 'website':
        return (
          <div className="integraciones-content">
            <div className="integraciones-placeholder">
              <h3 className="integraciones-placeholder-title">Website</h3>
              <p className="integraciones-placeholder-text">
                Configuración de canal Website en desarrollo.
              </p>
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="integraciones-content">
            <div className="integraciones-placeholder">
              <h3 className="integraciones-placeholder-title">Email</h3>
              <p className="integraciones-placeholder-text">
                Configuración de canal Email en desarrollo.
              </p>
            </div>
          </div>
        );
      case 'facebook':
        return (
          <div className="integraciones-content">
            <div className="integraciones-placeholder">
              <h3 className="integraciones-placeholder-title">Facebook</h3>
              <p className="integraciones-placeholder-text">
                Configuración de canal Facebook en desarrollo.
              </p>
            </div>
          </div>
        );
      case 'instagram':
        return (
          <div className="integraciones-content">
            <div className="integraciones-placeholder">
              <h3 className="integraciones-placeholder-title">Instagram</h3>
              <p className="integraciones-placeholder-text">
                Configuración de canal Instagram en desarrollo.
              </p>
            </div>
          </div>
        );
      case 'telegram':
        return (
          <div className="integraciones-content">
            <div className="integraciones-placeholder">
              <h3 className="integraciones-placeholder-title">Telegram</h3>
              <p className="integraciones-placeholder-text">
                Configuración de canal Telegram en desarrollo.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="integraciones-content">
            <div className="integraciones-placeholder">
              <h3 className="integraciones-placeholder-title">Selecciona un canal</h3>
              <p className="integraciones-placeholder-text">
                Elige un canal de comunicación para configurar.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="integraciones-container">
      <ChannelsTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      {renderTabContent()}
    </div>
  );
};

export default TableIntegraciones;

