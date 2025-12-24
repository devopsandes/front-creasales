/* import { useState } from 'react'; */
import { 
  Globe, 
  Mail, 
  Facebook, 
  Instagram, 
  MessageSquare, 
  Send 
} from 'lucide-react';

interface ChannelsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ChannelsTabs = ({ activeTab, onTabChange }: ChannelsTabsProps) => {
  const tabs = [
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'telegram', label: 'Telegram', icon: Send }
  ];

  return (
    <div className="channels-tabs-container">
      <div className="channels-tabs-description">
        <p className="channels-description-text">
          Activa los diferentes canales desde los cuales tus clientes podrán contactar a tu equipo de soporte: 
          Website, eMail, Facebook, Instagram, WhatsApp y MercadoLibre. Si tienes alguna duda o si necesitas 
          ayuda integrando algún canal ¡no dudes en contactarnos!
        </p>
      </div>
      
      <div className="channels-tabs-wrapper">
        <div className="channels-tabs-list">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`channels-tab ${isActive ? 'channels-tab-active' : 'channels-tab-inactive'}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
              >
                <Icon size={20} className={isActive ? 'text-gray-800' : 'text-gray-600'} />
                <span className={`channels-tab-label ${isActive ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
                {isActive && <div className="channels-tab-underline" />}
              </button>
            );
          })}
        </div>
        
        <button className="channels-settings-btn" aria-label="Configuración">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChannelsTabs;
