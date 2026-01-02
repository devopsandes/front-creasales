import './ticket-modal.css';
import logoAndes from '../../assets/logoAndesSaludRedondo4.png';

interface TicketSuccessModalProps {
    isOpen: boolean;
    nombreAfiliado: string;
    numeroTicketLocal: string;
    idZoho: string;
    onIrAZoho: () => void;
    onClose: () => void;
}

const TicketSuccessModal = ({
    isOpen,
    nombreAfiliado,
    numeroTicketLocal,
    idZoho,
    onIrAZoho,
    onClose
}: TicketSuccessModalProps) => {

    if (!isOpen) return null;

    return (
        <div className="ticket-modal-overlay">
            <div className="ticket-modal-container" style={{ maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    {/* Logo Andes Salud */}
                    <div style={{ marginBottom: '2rem' }}>
                        <img
                            src={logoAndes}
                            alt="Andes Salud"
                            style={{
                                width: '150px',
                                height: 'auto',
                                margin: '0 auto',
                                display: 'block'
                            }}
                        />
                    </div>

                    {/* Mensaje de éxito */}
                    <div style={{
                        backgroundColor: '#d4e3fc',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{
                            color: '#1a237e',
                            marginBottom: '1rem',
                            fontSize: '1.1rem'
                        }}>
                            TICKET CREADO CORRECTAMENTE
                        </h3>

                        <div style={{
                            textAlign: 'left',
                            color: '#333',
                            fontSize: '0.95rem'
                        }}>
                            <p style={{ marginBottom: '0.5rem' }}>
                                <strong>Nombre Afiliado:</strong> {nombreAfiliado}
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                <strong>Número de ticket local:</strong> {numeroTicketLocal}
                            </p>
                            <p style={{ marginBottom: '0' }}>
                                <strong>ID Zoho:</strong> {idZoho}
                            </p>
                        </div>
                    </div>

                    {/* Botones */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={onIrAZoho}
                            style={{
                                backgroundColor: '#6366f1',
                                color: 'white',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500'
                            }}
                        >
                            Ir a Zoho
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                backgroundColor: '#6366f1',
                                color: 'white',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500'
                            }}
                        >
                            Inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketSuccessModal;