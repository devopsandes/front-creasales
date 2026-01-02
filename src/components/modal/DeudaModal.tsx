import './ticket-modal.css';

interface DeudaModalProps {
    isOpen: boolean;
    cuilTitular: string;
    totalAdeudado: number;
    periodo: string;
    tipoCobranza: string;
    linkPago: string;
    onClose: () => void;
}

const DeudaModal = ({ 
    isOpen, 
    cuilTitular,
    totalAdeudado,
    periodo,
    tipoCobranza,
    linkPago,
    onClose 
}: DeudaModalProps) => {

    if (!isOpen) return null;

    const handleVerLink = () => {
        if (linkPago) {
            window.open(linkPago, '_blank');
        }
    };

    return (
        <div className="ticket-modal-overlay" style={{ zIndex: 1001 }}>
            <div className="ticket-modal-container" style={{ maxWidth: '600px' }}>
                <div className="ticket-modal-header">
                    <h2 className="ticket-modal-title">Deuda Registrada</h2>
                    <button onClick={onClose} className="ticket-modal-close-button">
                        ✕
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Titular:</strong> {cuilTitular}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Periodo:</strong> {periodo}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Valor:</strong> ${totalAdeudado}
                        </div>
                        <div>
                            <strong>Tipo Cobranza:</strong> {tipoCobranza}
                        </div>
                    </div>

                    <button
                        onClick={handleVerLink}
                        style={{
                            backgroundColor: '#6366f1',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500',
                            width: '100%'
                        }}
                    >
                        🔗 Ver Link
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeudaModal;