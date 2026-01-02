import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalTicket } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTicket } from '../../services/tickets/tickets.services';
import { toast } from 'react-toastify';
import XMark from '../icons/XMark';
import './ticket-modal.css';
import { buscarAfiliado } from '../../services/tickets/tickets.services';
import DepartamentosTipificaciones from './DepartamentosTipificaciones';
import TicketSuccessModal from './TicketSuccessModal.tsx';
import DeudaModal from './DeudaModal';
import { consultarDeuda } from '../../services/tickets/tickets.services';


const CrearTicketModal = () => {

    const [departamento, setDepartamento] = useState('');
    const [tipificacion, setTipificacion] = useState('');
    const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
    const [afiliadoData, setAfiliadoData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [tipificacionData, setTipificacionData] = useState<any>({});

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [ticketCreado, setTicketCreado] = useState<any>(null);

    const [deudaData, setDeudaData] = useState<any>(null);
    const [showDeudaModal, setShowDeudaModal] = useState(false);
    const [tieneDeuda, setTieneDeuda] = useState(false);

    const dispatch = useDispatch();
    const modalTicket = useSelector((state: RootState) => state.action.modalTicket);
    const token = localStorage.getItem('token') || '';

    if (!modalTicket) return null;

    const handleBuscarAfiliado = async () => {
        if (!busquedaAfiliado.trim()) {
            toast.error('Ingrese un documento, CUIL o ID');
            return;
        }

        setSearching(true);
        try {
            const response = await buscarAfiliado(token, busquedaAfiliado);

            if (response && response.idAfiliado) {
                setAfiliadoData(response);
                toast.success('Afiliado encontrado');

                // Consultar deuda
                try {
                    const deuda = await consultarDeuda(token, response.cuil);
                    setDeudaData(deuda);

                    // Verificar si tiene deuda
                    if (deuda?.meta?.total > 0 && deuda?.meta?.totalAdeudado > 0) {
                        setTieneDeuda(true);
                    } else {
                        setTieneDeuda(false);
                    }
                } catch (error) {
                    console.error('Error consultando deuda:', error);
                    setTieneDeuda(false);
                }
            } else {
                toast.error('No se encontró el afiliado');
            }
        } catch (error) {
            toast.error('Error al buscar afiliado');
        } finally {
            setSearching(false);
        }
    };

    const handleTipificacionDataChange = (data: any) => {
        setTipificacionData(data);
        setDepartamento(data.departamento || '');
        setTipificacion(data.tipificacion || '');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validación básica
        if (!departamento || !tipificacion) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        if (!afiliadoData) {
            toast.error('Debe buscar un afiliado primero');
            return;
        }

        setLoading(true);

        try {
            const ticketData: any = {
                nombre: tipificacion,
                descripcion: tipificacion,
                departamento: departamento,
                tipificacion: tipificacion,
                afiliadoData: afiliadoData,
                ...tipificacionData
            };

            const resp = await createTicket(token, ticketData);

            if (resp.statusCode === 201) {
                // GUARDAR DATOS DEL TICKET Y MOSTRAR MODAL DE ÉXITO
                setTicketCreado(resp.ticket);
                setShowSuccessModal(true);
            } else {
                toast.error('Error al crear ticket');
            }
        } catch (error) {
            toast.error('Error al crear ticket');
        } finally {
            setLoading(false);
        }
    };

    // FUNCIÓN PARA IR A ZOHO
    const handleIrAZoho = () => {
        if (ticketCreado?.idZoho && departamento) {
            // Mapeo de departamentos a URLs de Zoho
            const departamentoUrlMap: { [key: string]: string } = {
                '564264000000175045': 'prestaciones-medicas',
                '564264000000179032': 'fiscalizacion',
                '564264000000181969': 'afiliaciones',
                '564264000000184906': 'atencion-al-afiliado',
                '564264000042384029': 'internaciones',
                '564264000000188843': 'preexistencias',
                '564264000065821073': 'gapri'
            };

            const seccionZoho = departamentoUrlMap[departamento] || 'atencion-al-afiliado';
            const urlZoho = `https://desk.zoho.com/agent/andessalud21/${seccionZoho}/tickets/details/${ticketCreado.idZoho}`;

            window.open(urlZoho, '_blank');
        }
        handleCloseSuccess();
    };

    // FUNCIÓN PARA CERRAR MODAL DE ÉXITO
    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        setTicketCreado(null);
        handleClose();
    };

    const handleClose = () => {
        dispatch(closeModalTicket());
        setDepartamento('');
        setTipificacion('');
        setBusquedaAfiliado('');
        setAfiliadoData(null);
        setTipificacionData({});
    };

    const handleVerCredencial = () => {
        if (afiliadoData?.idAfiliado) {
            const urlCredencial = `https://andessalud.createch.com.ar/api/credencial?idAfiliado=${afiliadoData.idAfiliado}`;
            window.open(urlCredencial, '_blank');
        } else {
            toast.error('No se encontró el ID del afiliado');
        }
    };

    const handleVerDeuda = () => {
        setShowDeudaModal(true);
    };

    return (
        <>
            <div className="ticket-modal-overlay">
                <div className="ticket-modal-container-wide">
                    <div className="ticket-modal-header">
                        <h2 className="ticket-modal-title">Crear Ticket</h2>
                        <button onClick={handleClose} className="ticket-modal-close-button">
                            <XMark />
                        </button>
                    </div>

                    <div className="ticket-modal-content-two-columns">
                        {/* COLUMNA IZQUIERDA - Datos del Afiliado */}
                        <div className="ticket-modal-left-column">
                            <h3 className="ticket-modal-inner-title">Buscar Afiliado</h3>

                            <div className="ticket-modal-search-group">
                                <input
                                    type="text"
                                    placeholder="DNI, CUIL o ID Afiliado"
                                    className="ticket-modal-input"
                                    value={busquedaAfiliado}
                                    onChange={(e) => setBusquedaAfiliado(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleBuscarAfiliado}
                                    className="ticket-modal-search-button"
                                    disabled={searching}
                                >
                                    {searching ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>

                            {afiliadoData && (
                                <div className="ticket-modal-afiliado-info">
                                    <div className="info-row">
                                        <span>Nro Afiliado:</span>
                                        <span>{afiliadoData.nroAfiliado}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Nombre:</span>
                                        <span>{afiliadoData.apellNomb}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Edad:</span>
                                        <span>{afiliadoData.edad}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Género:</span>
                                        <span>{afiliadoData.sexo}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Obra Social:</span>
                                        <span>{afiliadoData.obraSocial}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>DNI:</span>
                                        <span>{afiliadoData.nroDocumento}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Plan:</span>
                                        <span>{afiliadoData.planPrestacional}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Parentesco:</span>
                                        <span>{afiliadoData.parentesco}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Estado:</span>
                                        <span>{afiliadoData.estadoAfiliacion}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Email:</span>
                                        <span>{afiliadoData.mail}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Celular:</span>
                                        <span>{afiliadoData.numCelular}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>CUIL:</span>
                                        <span>{afiliadoData.cuil}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Provincia:</span>
                                        <span>{afiliadoData.provincia}</span>
                                    </div>

                                    <div className="ticket-modal-buttons">
                                        <button
                                            type="button"
                                            onClick={handleVerCredencial}
                                            className="ticket-modal-btn-secondary"
                                        >
                                            Ver Credencial
                                        </button>
                                        <button
                                            type="button"
                                            onClick={tieneDeuda ? handleVerDeuda : undefined}
                                            className="ticket-modal-btn-secondary"
                                            style={{
                                                backgroundColor: tieneDeuda ? '#dc2626' : '#16a34a',
                                                color: 'white',
                                                cursor: tieneDeuda ? 'pointer' : 'default'
                                            }}
                                        >
                                            {tieneDeuda ? 'VER DEUDA' : 'NO REGISTRA DEUDA'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* COLUMNA DERECHA - Formulario */}
                        <div className="ticket-modal-right-column">
                            <h3 className="ticket-modal-inner-title">Nuevo Ticket de Soporte</h3>

                            <form onSubmit={handleSubmit} className="ticket-modal-form">

                                <DepartamentosTipificaciones
                                    onDataChange={handleTipificacionDataChange}
                                    afiliadoData={afiliadoData}
                                />

                                <button
                                    type="submit"
                                    className="ticket-modal-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Creando...' : 'Crear Ticket'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE ÉXITO */}
            <TicketSuccessModal
                isOpen={showSuccessModal}
                nombreAfiliado={afiliadoData?.apellNomb || ''}
                numeroTicketLocal={ticketCreado?.nro || ''}
                idZoho={ticketCreado?.idZoho || ''}
                onIrAZoho={handleIrAZoho}
                onClose={handleCloseSuccess}
            />

            {/* MODAL DE DEUDA */}
            <DeudaModal
                isOpen={showDeudaModal}
                cuilTitular={deudaData?.data?.CuilTitular || ''}
                totalAdeudado={deudaData?.meta?.totalAdeudado || 0}
                periodo={deudaData?.data?.Saldos?.[0]?.periodo || ''}
                tipoCobranza={deudaData?.meta?.tipoPago || ''}
                linkPago={deudaData?.data?.Saldos?.[0]?.linkMp || ''}
                onClose={() => setShowDeudaModal(false)}
            />
        </>
    );
};

export default CrearTicketModal;