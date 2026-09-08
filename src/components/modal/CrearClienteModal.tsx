import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { closeModalCrearCliente } from '../../app/slices/actionSlice';
import { UserPlus, X, Search } from 'lucide-react';
import { RootState } from '../../app/store';
import {
    buscarClientePorDni,
    crearClienteManual,
    verificarTelefono,
    AfiliadoBusquedaDto,
    ClienteExistenteInfo,
} from '../../services/clientes/clientes.services';
import ErrorModal from './ErrorModal';
import './user-search-modal.css';

const CrearClienteModal = () => {
    const [dni, setDni] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [afiliado, setAfiliado] = useState<AfiliadoBusquedaDto | null>(null);
    const [dniConflict, setDniConflict] = useState<ClienteExistenteInfo | null>(null);

    const [telefono, setTelefono] = useState('');
    const [isCheckingTelefono, setIsCheckingTelefono] = useState(false);
    const [telefonoConflictChatId, setTelefonoConflictChatId] = useState<string | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const telefonoCheckTimer = useRef<number | null>(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const modalView = useSelector((state: RootState) => state.action.modalCrearCliente);
    const token = localStorage.getItem('token') || '';

    const resetState = () => {
        setDni('');
        setIsSearching(false);
        setAfiliado(null);
        setDniConflict(null);
        setTelefono('');
        setIsCheckingTelefono(false);
        setTelefonoConflictChatId(null);
        setIsCreating(false);
        if (telefonoCheckTimer.current) {
            window.clearTimeout(telefonoCheckTimer.current);
            telefonoCheckTimer.current = null;
        }
    };

    useEffect(() => {
        if (!modalView) resetState();
    }, [modalView]);

    const checkTelefono = async (valor: string) => {
        const limpio = valor.replace(/\D/g, '');
        if (limpio.length < 10) {
            setTelefonoConflictChatId(null);
            return;
        }
        setIsCheckingTelefono(true);
        try {
            const resp = await verificarTelefono(token, limpio);
            if (resp?.statusCode === 200) {
                setTelefonoConflictChatId(resp.existe ? (resp.chatId ?? null) : null);
            }
        } catch {
            // si falla el chequeo, no bloqueamos pero tampoco confirmamos que esté libre
        } finally {
            setIsCheckingTelefono(false);
        }
    };

    const handleTelefonoChange = (value: string) => {
        setTelefono(value);
        setTelefonoConflictChatId(null);
        if (telefonoCheckTimer.current) window.clearTimeout(telefonoCheckTimer.current);
        telefonoCheckTimer.current = window.setTimeout(() => {
            checkTelefono(value);
        }, 500);
    };

    const handleBuscar = async () => {
        const dniLimpio = dni.replace(/\D/g, '');
        if (dniLimpio.length < 7) {
            setErrorMessage('Ingresá un DNI válido');
            setShowErrorModal(true);
            return;
        }
        setIsSearching(true);
        setAfiliado(null);
        setDniConflict(null);
        setTelefonoConflictChatId(null);
        try {
            const resp = await buscarClientePorDni(token, dniLimpio);
            if (resp?.statusCode === 200 && resp?.afiliado) {
                setAfiliado(resp.afiliado);
                setDniConflict(resp.clienteExistente ?? null);
                setTelefono(resp.afiliado.telefono);
                checkTelefono(resp.afiliado.telefono);
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

    const irAChat = (chatId: string, telefonoChat: string, nombreChat?: string) => {
        dispatch(closeModalCrearCliente());
        const nombreParam = nombreChat ? encodeURIComponent(nombreChat) : '';
        navigate(`/dashboard/chats/${chatId}?telefono=${telefonoChat}&nombre=${nombreParam}`);
    };

    // Bloquea completamente: mismo DNI y mismo teléfono → es el mismo chat, no tiene sentido crear
    const bloqueadoPorDniIdentico = Boolean(dniConflict?.mismoTelefono);
    // Bloquea la confirmación: el teléfono final (editado o no) ya pertenece a otro cliente
    const bloqueadoPorTelefono = Boolean(telefonoConflictChatId);

    const puedeConfirmar = Boolean(afiliado) && !bloqueadoPorDniIdentico && !bloqueadoPorTelefono && !isCheckingTelefono && telefono.replace(/\D/g, '').length >= 10;

    const handleConfirmar = async () => {
        if (!afiliado || !puedeConfirmar) return;
        setIsCreating(true);
        try {
            const resp = await crearClienteManual(token, {
                dni: afiliado.dni,
                telefono: telefono.replace(/\D/g, ''),
                nombre: afiliado.nombre,
                apellido: afiliado.apellido,
            });
            if (resp?.statusCode === 201 && resp?.chat?.id) {
                const chatId = resp.chat.id;
                const nombreCompleto = `${afiliado.nombre ?? ''} ${afiliado.apellido ?? ''}`.trim();
                dispatch(closeModalCrearCliente());
                // El chat ya se crea ASIGNADO al operador actual del lado del backend
                // (ver ClientesService.crearManual). Acá solo redirigimos a esa vista;
                // no hace falta llamar a asignarOperador por separado.
                navigate(`/dashboard/chats/${chatId}?telefono=${telefono.replace(/\D/g, '')}&nombre=${encodeURIComponent(nombreCompleto)}`);
            } else {
                // Conflicto detectado recién al confirmar (carrera entre operadoras)
                const chatIdConflicto = (resp as any)?.chatId as string | undefined;
                if (chatIdConflicto) {
                    setTelefonoConflictChatId(chatIdConflicto);
                }
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

    const nombreCompleto = afiliado ? `${afiliado.nombre ?? ''} ${afiliado.apellido ?? ''}`.trim() : '';

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

                        <h2 className="assign-modal-title">Nuevo Chat</h2>
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
                                <p><strong>Nombre:</strong> {nombreCompleto}</p>
                                {afiliado.plan && <p><strong>Plan:</strong> {afiliado.plan}</p>}
                                {afiliado.provincia && <p><strong>Provincia:</strong> {afiliado.provincia}</p>}

                                {/* Aviso: DNI ya existe con el MISMO teléfono → es el mismo chat, bloqueado */}
                                {dniConflict && dniConflict.mismoTelefono && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '0.375rem' }}>
                                        <p style={{ color: '#991b1b', fontWeight: 600, margin: 0 }}>
                                            Ya existe un chat para este DNI, con el celular {dniConflict.telefono}.
                                        </p>
                                        {dniConflict.chatId && (
                                            <button
                                                type="button"
                                                className="assign-modal-button assign-modal-confirm"
                                                style={{ marginTop: '0.5rem' }}
                                                onClick={() => irAChat(dniConflict.chatId as string, dniConflict.telefono, nombreCompleto)}
                                            >
                                                Ir a Chat asociado a celular {dniConflict.telefono}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Aviso: DNI ya existe pero con OTRO teléfono → informativo, no bloquea crear uno nuevo */}
                                {dniConflict && !dniConflict.mismoTelefono && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '0.375rem' }}>
                                        <p style={{ color: '#92400e', fontWeight: 600, margin: 0 }}>
                                            Ya existe un chat para este DNI, con el celular {dniConflict.telefono} (distinto al actual).
                                        </p>
                                        <p style={{ color: '#92400e', margin: '0.25rem 0 0' }}>
                                            Podés ir a ese chat, o crear un chat nuevo con el celular actual.
                                        </p>
                                        {dniConflict.chatId && (
                                            <button
                                                type="button"
                                                className="assign-modal-button assign-modal-confirm"
                                                style={{ marginTop: '0.5rem' }}
                                                onClick={() => irAChat(dniConflict.chatId as string, dniConflict.telefono, nombreCompleto)}
                                            >
                                                Ir a Chat asociado a celular {dniConflict.telefono}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Input de celular editable, solo si no está bloqueado por DNI idéntico */}
                                {!bloqueadoPorDniIdentico && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                            Celular (formato: 549261...)
                                        </label>
                                        <input
                                            type="text"
                                            value={telefono}
                                            onChange={(e) => handleTelefonoChange(e.target.value)}
                                            className="assign-modal-search-input"
                                            style={{ width: '100%' }}
                                        />
                                        {isCheckingTelefono && (
                                            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                                Verificando celular...
                                            </p>
                                        )}
                                        {telefonoConflictChatId && !isCheckingTelefono && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '0.375rem' }}>
                                                <p style={{ color: '#991b1b', fontWeight: 600, margin: 0 }}>
                                                    Ya existe un chat asociado a este celular.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="assign-modal-button assign-modal-confirm"
                                                    style={{ marginTop: '0.5rem' }}
                                                    onClick={() => irAChat(telefonoConflictChatId as string, telefono.replace(/\D/g, ''))}
                                                >
                                                    Ir a Chat asociado a celular {telefono.replace(/\D/g, '')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="assign-modal-actions">
                            <button className="assign-modal-button assign-modal-cancel" onClick={handleCancelar}>
                                Cancelar
                            </button>
                            {!bloqueadoPorDniIdentico && (
                                <button
                                    className="assign-modal-button assign-modal-confirm"
                                    onClick={handleConfirmar}
                                    disabled={!puedeConfirmar || isCreating}
                                >
                                    {isCreating ? 'Creando...' : 'Confirmar y crear'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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