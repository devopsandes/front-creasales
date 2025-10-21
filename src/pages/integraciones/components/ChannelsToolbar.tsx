
import { Search, Plus } from 'lucide-react';

interface ChannelsToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateChannel: () => void;
}

const ChannelsToolbar = ({ searchValue, onSearchChange, onCreateChannel }: ChannelsToolbarProps) => {
  return (
    <div className="channels-toolbar-container">
      <div className="channels-toolbar-left">
        <span className="channels-credits-text">Créditos disponibles: 0</span>
        <div className="channels-toolbar-links">
          <button className="channels-link">Comprar créditos</button>
          <button className="channels-link">Recarga automática</button>
          <button className="channels-link">Calculadora de WhatsApp</button>
        </div>
      </div>
      
      <div className="channels-toolbar-right">
        <div className="channels-search-container">
          <Search size={16} className="channels-search-icon" />
          <input
            type="text"
            placeholder="Buscar canal..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="channels-search-input"
          />
        </div>
        
        <button 
          onClick={onCreateChannel}
          className="channels-create-button"
        >
          <Plus size={16} />
          Crear Canal
        </button>
      </div>
    </div>
  );
};

export default ChannelsToolbar;
