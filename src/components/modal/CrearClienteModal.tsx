import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { closeModalCrearCliente } from '../../app/slices/actionSlice';
import { UserPlus, X, Search } from 'lucide-react';
import { RootState } from '../../app/store';
import { buscarClientePorDni, crearClienteManual, AfiliadoBusquedaDto } from '../../services/clientes/clientes.services';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';
import './user-search-modal.css';

const CrearClienteModal = () => {
    const [dni, setDni] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [afiliado, setAfiliado] = useState<AfiliadoBusquedaDto | null>(null);
    const [telefonoYaExiste, setTelefonoYaExiste] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const modalView = useSelector((state: RootState) => state.action.modalCrearCliente);
    const token = localStorage.getItem('token') || '';

    useEffect(() => {
        if (!modalView) {
            setDni('');
            setAfiliado(null);
            setTelefonoYaExiste(false);
            setIsSearching(false);
            setIsCreating(false);
        }
    }, [modalView]);

    const handleBuscar = async () => {
        const dniLimpio = dni.replace(/\D/g, '');
        if (dniLimpio.length < 7) {
            setErrorMessage('Ingresá un DNI válido');
            setShowErrorModal(true);
            return;
        }
        setIsSearching(true);
        setAfiliado(null);
        try {
            const resp = await buscarClientePorDni(token, dniLimpio);
            if (resp?.statusCode === 200 && resp?.afiliado) {
                setAfiliado(resp.afiliado);
                setTelefonoYaExiste(Boolean(resp.telefonoYaExiste));
            } else {
                const msg = Array.isArray((resp as any)?.message) ? (resp as any).message.join(', ') : ((resp as any)?.message || 'No se encontró ningún afiliado con ese DNI');
                setErrorMessage(msg);
                setShowErrorModal(true);
            }
        } catch {
            setErrorMessage('Error inesperado al buscar el DNI');
            setShowErrorModal(true);
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirmar = async () => {
        if (!afiliado || telefonoYaExiste) return;
        setIsCreating(true);
        try {
            const resp = await crearClienteManual(token, {
                dni: afiliado.dni,
                telefono: afiliado.telefono,
                nombre: afiliado.nombre,
                apellido: afiliado.apellido,
            });
            if (resp?.statusCode === 201 && resp?.chat?.id) {
                const chatId = resp.chat.id;
                const nombreCompleto = `${afiliado.nombre ?? ''} ${afiliado.apellido ?? ''}`.trim();
                dispatch(closeModalCrearCliente());
                setShowSuccessModal(true);
                setTimeout(() => {
                    navigate(`/dashboard/chats/${chatId}?telefono=${afiliado.telefono}&nombre=${encodeURIComponent(nombreCompleto)}`);
                }, 300);
            } else {
                const msg = Array.isArray((resp as any)?.message) ? (resp as any).message.join(', ') : ((resp as any)?.message || 'No se pudo crear el cliente');
                setErrorMessage(msg);
                setShowErrorModal(true);
            }
        } catch {
            setErrorMessage('Error inesperado al crear el cliente');
            setShowErrorModal(true);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancelar = () => {
        dispatch(closeModalCrearCliente());
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleCancelar();
    };

    return (
        <>
            {modalView && (
                <div className="assign-modal-overlay" onClick={handleOverlayClick}>
                    <div className="assign-modal-container">
                        <button className="assign-modal-close" onClick={handleCancelar}>
                            <X size={20} />
                        </button>

                        <div className="assign-modal-icon">
                            <UserPlus size={32} />
                        </div>

                        <h2 className="assign-modal-title">Nuevo contacto</h2>
                        <p className="assign-modal-subtitle">Ingresá el DNI del afiliado para iniciar una conversación</p>

                        <div className="assign-modal-search">
                            <Search className="assign-modal-search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="DNI del afiliado..."
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleBuscar(); }}
                                className="assign-modal-search-input"
                            />
                        </div>

                        <div className="assign-modal-actions" style={{ marginBottom: '1rem' }}>
                            <button
                                className="assign-modal-button assign-modal-confirm"
                                onClick={handleBuscar}
                                disabled={isSearching || dni.trim().length === 0}
                            >
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>

                        {afiliado && (
                            <div className="assign-modal-user-list" style={{ padding: '0.75rem' }}>
                                <p><strong>Nombre:</strong> {afiliado.nombre} {afiliado.apellido}</p>
                                <p><strong>Teléfono:</strong> {afiliado.telefono}</p>
                                {afiliado.plan && <p><strong>Plan:</strong> {afiliado.plan}</p>}
                                {afiliado.provincia && <p><strong>Provincia:</strong> {afiliado.provincia}</p>}
                                {telefonoYaExiste && (
                                    <p style={{ color: '#dc2626', fontWeight: 600, marginTop: '0.5rem' }}>
                                        Ya existe un cliente con este celular.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="assign-modal-actions">
                            <button className="assign-modal-button assign-modal-cancel" onClick={handleCancelar}>
                                Cancelar
                            </button>
                            <button
                                className="assign-modal-button assign-modal-confirm"
                                onClick={handleConfirmar}
                                disabled={!afiliado || telefonoYaExiste || isCreating}
                            >
                                {isCreating ? 'Creando...' : 'Confirmar y crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Contacto creado"
                message="El chat fue creado correctamente y quedó archivado. Abrilo para enviarle una plantilla."
            />

            <ErrorModal
                isOpen={showErrorModal}
                onClose={() => { setShowErrorModal(false); setErrorMessage(''); }}
                title="Atención"
                message={errorMessage}
            />
        </>
    );
};

export default CrearClienteModal;