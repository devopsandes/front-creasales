interface WhatsappSubtabsProps {
  activeSubtab: string;
  onSubtabChange: (subtab: string) => void;
}

const WhatsappSubtabs = ({ activeSubtab, onSubtabChange }: WhatsappSubtabsProps) => {
  const subtabs = [
    { id: 'canales', label: 'CANALES' },
    { id: 'plantillas', label: 'PLANTILLAS' }
  ];

  return (
    <div className="whatsapp-subtabs-container">
      <div className="whatsapp-subtabs-list">
        {subtabs.map((subtab) => {
          const isActive = activeSubtab === subtab.id;
          
          return (
            <button
              key={subtab.id}
              onClick={() => onSubtabChange(subtab.id)}
              className={`whatsapp-subtab ${isActive ? 'whatsapp-subtab-active' : 'whatsapp-subtab-inactive'}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${subtab.id}`}
            >
              {subtab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WhatsappSubtabs;
