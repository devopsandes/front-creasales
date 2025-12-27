import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalTicket } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { createTicket } from '../../services/tickets/tickets.services';
import { toast } from 'react-toastify';
import XMark from '../icons/XMark';
import './ticket-modal.css';
import { buscarAfiliado } from '../../services/tickets/tickets.services';

type DepartamentoId = '564264000000175045' | '564264000000179032' | '564264000000181969' | '564264000000184906' | '564264000042384029' | '564264000000188843';

interface DepartamentoData {
    nombre: string;
    tipificaciones: string[];
}

// Departamentos y tipificaciones hardcodeadas
const DEPARTAMENTOS_TIPIFICACIONES: Record<DepartamentoId, DepartamentoData> = {
    '564264000000175045': {
        nombre: 'Prestaciones Médicas',
        tipificaciones: [
            'Cronicidad',
            'Reintegro',
            'Carga Certificado Discapacidad',
            'Problemas al utilizar servicio',
            'Medicamentos',
            'Estudio o Práctica Médica',
            'Anticonceptivos',
            'Fertilización'
        ]
    },
    '564264000000179032': {
        nombre: 'Fiscalización',
        tipificaciones: [
            'Ya Pague',
            'Plan de Pago',
            'Diferencias Cobranza',
            'Adherir Debito Automático',
            'Quiero mi Factura',
            'Quiero Pagar',
            'Link de pago incorrecto',
            'Estado de cuenta',
            'Solicitud de descuento',
            'Baja de debito automático',
            'Reintegro'
        ]
    },
    '564264000000181969': {
        nombre: 'Afiliaciones',
        tipificaciones: [
            'Unificación de aportes',
            'Afiliado duplicado',
            'Incorporación de familiar',
            'Datos afiliatorios incorrectos',
            'Baja definitiva de cobertura',
            'Cambio de categoría laboral',
            'Cambio de Plan',
            'Solicitud de alta',
            'Adherir al débito automático',
            'Baja al débito automático',
            'Código de Obra Social'
        ]
    },
    '564264000000184906': {
        nombre: 'Atención al Cliente',
        tipificaciones: [
            'Estudio o Práctica Médica',
            'Orden de Consulta',
            'Estado de Trámite',
            'Problemas al utilizar servicio',
            'Información de coseguros',
            'Credencial descargada',
            'Cartilla consultada',
            'Plan Materno',
            'Solicitud de Plan Materno Infantil',
            'Información de ópticas consultada',
            'Preexistencia',
            'Anticonceptivos'
        ]
    },
    '564264000042384029': { nombre: 'Internaciones', tipificaciones: [] },
    '564264000000188843': {
        nombre: 'Preexistencia',
        tipificaciones: [
            'Preexistencia'
        ]
    }
};

const CrearTicketModal = () => {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [tipificacion, setTipificacion] = useState('');
    const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
    const [afiliadoData, setAfiliadoData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();
    const modalTicket = useSelector((state: RootState) => state.action.modalTicket);
    const token = localStorage.getItem('token') || '';

    const [prestador, setPrestador] = useState('');
    const [tipoIntervencion, setTipoIntervencion] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [fechaAproximada, setFechaAproximada] = useState('');
    const [profesional, setProfesional] = useState('');
    const [observacion, setObservacion] = useState('');

    if (!modalTicket) return null;

    const handleBuscarAfiliado = async () => {
        if (!busquedaAfiliado.trim()) {
            toast.error('Ingrese un documento, CUIL o ID');
            return;
        }

        setLoading(true);
        try {
            const response = await buscarAfiliado(token, busquedaAfiliado);

            if (response && response.idAfiliado) {
                setAfiliadoData(response);
                toast.success('Afiliado encontrado');
            } else {
                toast.error('No se encontró el afiliado');
            }
        } catch (error) {
            toast.error('Error al buscar afiliado');
        } finally {
            setLoading(false);
        }
    };

    const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDepartamento(e.target.value);
        setTipificacion(''); // Reset tipificación
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Para internaciones, no validar tipificación
        if (departamento === '564264000042384029') {
            if (!titulo || !descripcion || !departamento) {
                toast.error('Por favor complete todos los campos');
                return;
            }
        } else {
            if (!titulo || !descripcion || !departamento || !tipificacion) {
                toast.error('Por favor complete todos los campos');
                return;
            }
        }

        if (!afiliadoData) {
            toast.error('Debe buscar un afiliado primero');
            return;
        }

        setLoading(true);

        try {
            const ticketData: any = {
                nombre: titulo,
                descripcion: descripcion,
                departamento: departamento,
                tipificacion: tipificacion || 'Internaciones', // Para Internaciones
                afiliadoData: afiliadoData
            };

            // Si es Internaciones, agregar datos adicionales
            if (departamento === '564264000042384029') {
                ticketData.internacionesData = {
                    prestador,
                    tipoIntervencion,
                    diagnostico,
                    fechaAproximada,
                    profesional,
                    observacion
                };
            }

            const resp = await createTicket(token, ticketData);

            if (resp.statusCode === 201) {
                toast.success('Ticket creado correctamente');
                handleClose();
            } else {
                toast.error('Error al crear ticket');
            }
        } catch (error) {
            toast.error('Error al crear ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        dispatch(closeModalTicket());
        setTitulo('');
        setDescripcion('');
        setDepartamento('');
        setTipificacion('');
        setBusquedaAfiliado('');
        setAfiliadoData(null);
        setPrestador('');
        setTipoIntervencion('');
        setDiagnostico('');
        setFechaAproximada('');
        setProfesional('');
        setObservacion('');
    };

    return (
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
                                disabled={loading}
                            >
                                Buscar
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

                                {/* <div className="ticket-modal-buttons">
                                    <button className="ticket-modal-btn-secondary">Ver Credencial</button>
                                    <button className="ticket-modal-btn-secondary">No registra Deuda</button>
                                </div> */}
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA - Formulario */}
                    <div className="ticket-modal-right-column">
                        <h3 className="ticket-modal-inner-title">Nuevo Ticket de Soporte</h3>

                        <form onSubmit={handleSubmit} className="ticket-modal-form">
                            <div className="ticket-modal-form-group">
                                <label htmlFor="titulo" className="ticket-modal-label">Título</label>
                                <input
                                    type="text"
                                    id="titulo"
                                    placeholder="Título del ticket"
                                    className="ticket-modal-input"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                />
                            </div>

                            <div className="ticket-modal-form-group">
                                <label htmlFor="descripcion" className="ticket-modal-label">Descripción</label>
                                <textarea
                                    id="descripcion"
                                    placeholder="Descripción del ticket"
                                    className="ticket-modal-textarea"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                />
                            </div>

                            <div className="ticket-modal-form-group">
                                <label htmlFor="departamento" className="ticket-modal-label">Departamento</label>
                                <select
                                    id="departamento"
                                    className="ticket-modal-select"
                                    value={departamento}
                                    onChange={handleDepartamentoChange}
                                >
                                    <option value="">-- Seleccione --</option>
                                    {Object.entries(DEPARTAMENTOS_TIPIFICACIONES).map(([id, data]) => (
                                        <option key={id} value={id}>{data.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {departamento && departamento !== '564264000042384029' && ( // Ocultar si es Internaciones
                                <div className="ticket-modal-form-group">
                                    <label htmlFor="tipificacion" className="ticket-modal-label">Tipificación</label>
                                    <select
                                        id="tipificacion"
                                        className="ticket-modal-select"
                                        value={tipificacion}
                                        onChange={(e) => setTipificacion(e.target.value)}
                                        disabled={!departamento}
                                    >
                                        <option value="">-- Seleccione --</option>
                                        {DEPARTAMENTOS_TIPIFICACIONES[departamento as DepartamentoId]?.tipificaciones.map((tip: string) => (
                                            <option key={tip} value={tip}>{tip}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {departamento === '564264000042384029' && ( // ID de Internaciones
                                <>
                                    <div className="ticket-modal-form-group">
                                        <label htmlFor="prestador" className="ticket-modal-label">Prestador Solicitado:</label>
                                        <input
                                            type="text"
                                            id="prestador"
                                            placeholder="Ej: Clínica de Manos"
                                            className="ticket-modal-input"
                                            value={prestador}
                                            onChange={(e) => setPrestador(e.target.value)}
                                        />
                                    </div>

                                    <div className="ticket-modal-form-group">
                                        <label htmlFor="tipoIntervencion" className="ticket-modal-label">Tipo de intervención:</label>
                                        <select
                                            id="tipoIntervencion"
                                            className="ticket-modal-select"
                                            value={tipoIntervencion}
                                            onChange={(e) => setTipoIntervencion(e.target.value)}
                                        >
                                            <option value="">-- Seleccione Intervención --</option>
                                            <option value="Ambulatoria">Ambulatoria</option>
                                            <option value="Quirúrgica">Quirúrgica</option>
                                            <option value="Urgencia">Urgencia</option>
                                            <option value="Clínica">Clínica</option>
                                        </select>
                                    </div>

                                    <div className="ticket-modal-form-group">
                                        <label htmlFor="diagnostico" className="ticket-modal-label">Detalle de diagnóstico:</label>
                                        <input
                                            type="text"
                                            id="diagnostico"
                                            placeholder="Ej: Fractura 5° metacarpiano"
                                            className="ticket-modal-input"
                                            value={diagnostico}
                                            onChange={(e) => setDiagnostico(e.target.value)}
                                        />
                                    </div>

                                    <div className="ticket-modal-form-group">
                                        <label htmlFor="fechaAproximada" className="ticket-modal-label">Fecha Aproximada:</label>
                                        <input
                                            type="date"
                                            id="fechaAproximada"
                                            className="ticket-modal-input"
                                            value={fechaAproximada}
                                            onChange={(e) => setFechaAproximada(e.target.value)}
                                        />
                                    </div>

                                    <div className="ticket-modal-form-group">
                                        <label htmlFor="profesional" className="ticket-modal-label">Profesional Solicitante:</label>
                                        <input
                                            type="text"
                                            id="profesional"
                                            placeholder="Ej: Dr Carlos Bilardo"
                                            className="ticket-modal-input"
                                            value={profesional}
                                            onChange={(e) => setProfesional(e.target.value)}
                                        />
                                    </div>

                                    <div className="ticket-modal-form-group">
                                        <label htmlFor="observacion" className="ticket-modal-label">Observación:</label>
                                        <input
                                            type="text"
                                            id="observacion"
                                            placeholder="Ingrese un comentario"
                                            className="ticket-modal-input"
                                            value={observacion}
                                            onChange={(e) => setObservacion(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

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
    );
};

export default CrearTicketModal;
