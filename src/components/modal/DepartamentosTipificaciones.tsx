import { useState } from 'react';

interface DepartamentosTipificacionesProps {
    onDataChange: (data: any) => void;
    afiliadoData: any;
}

const DepartamentosTipificaciones = ({ onDataChange, afiliadoData }: DepartamentosTipificacionesProps) => {
    const [departamento, setDepartamento] = useState('');
    const [tipificacion, setTipificacion] = useState('');

    // Estados para campos específicos de Prestaciones Médicas
    const [diagnostico, setDiagnostico] = useState('');
    const [tipoReintegro, setTipoReintegro] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [prestador, setPrestador] = useState('');
    const [tipoProblema, setTipoProblema] = useState('');
    const [tipoGestion, setTipoGestion] = useState('');
    const [medicamento, setMedicamento] = useState('');
    const [tipoAnticonceptivo, setTipoAnticonceptivo] = useState('');

    // ESTADOS PARA FISCALIZACIÓN
    const [periodo, setPeriodo] = useState('');
    const [descripcionCampo, setDescripcionCampo] = useState('');
    const [medioDePago, setMedioDePago] = useState('');
    const [tipoReintegroFiscalizacion, setTipoReintegroFiscalizacion] = useState('');

    // ESTADOS PARA AFILIACIONES
    const [cuilAUnificar, setCuilAUnificar] = useState('');
    const [cuilDuplicado, setCuilDuplicado] = useState('');
    const [cuilNuevo, setCuilNuevo] = useState('');
    const [parentesco, setParentesco] = useState('');
    const [datoIncorrecto, setDatoIncorrecto] = useState('');
    const [motivoBaja, setMotivoBaja] = useState('');
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [planSeleccionado, setPlanSeleccionado] = useState('');
    const [fechaAlta, setFechaAlta] = useState('');
    const [numeroTarjetaCBU, setNumeroTarjetaCBU] = useState('');
    const [motivoCodigo, setMotivoCodigo] = useState('');

    // ESTADOS PARA ATENCIÓN AL CLIENTE
    const [prestadorAtencion, setPrestadorAtencion] = useState('');
    const [observacionesAtencion, setObservacionesAtencion] = useState('');
    const [numeroTramite, setNumeroTramite] = useState('');
    const [servicioSeleccionado, setServicioSeleccionado] = useState('');
    const [tipoGestionAtencion, setTipoGestionAtencion] = useState('');
    const [especialidad, setEspecialidad] = useState('');

    // ESTADOS PARA INTERNACIONES
    const [prestadorSolicitado, setPrestadorSolicitado] = useState('');
    const [tipoIntervencion, setTipoIntervencion] = useState('');
    const [detalleDiagnostico, setDetalleDiagnostico] = useState('');
    const [fechaAproximada, setFechaAproximada] = useState('');
    const [profesionalSolicitante, setProfesionalSolicitante] = useState('');
    const [observacionInternacion, setObservacionInternacion] = useState('');

    // ESTADOS PARA PREEXISTENCIA
    const [observacionesPreexistencia, setObservacionesPreexistencia] = useState('');
    const [canal, setCanal] = useState('');
    const [diagnosticoPreexistencia, setDiagnosticoPreexistencia] = useState('');
    const [ingreso, setIngreso] = useState('');
    const [practicasSolicitadas, setPracticasSolicitadas] = useState('');
    const [horarioLlamada, setHorarioLlamada] = useState('');

    // Configuración de departamentos
    const DEPARTAMENTOS = {
        '564264000000175045': {
            nombre: 'Prestaciones Médicas',
            tipificaciones: [
                'Cronicidad',
                'Reintegro',
                'Carga Certificado Discapacidad',
                'Problemas al utilizar servicio',
                'Medicamentos',
                'Estudio o Práctica Médica',
                'Anticonceptivos'
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
        '564264000042384029': {
            nombre: 'Internaciones',
            tipificaciones: ['Internación']
        },
        '564264000000188843': {
            nombre: 'Preexistencia',
            tipificaciones: ['Preexistencia']
        }
    };

    // Opciones específicas por tipificación
    const DIAGNOSTICOS = [
        'Diabetes',
        'Celiaquia',
        'Asma',
        'Epoc',
        'Otro'
    ];

    const TIPOS_REINTEGRO = [
        'Farmacia o Prestación',
        'Nuevos coseguros'
    ];

    const TIPOS_PROBLEMA = [
        'Prestador o Clínica',
        'Coseguro',
        'Farmacia',
        'Contacto de Prestador'
    ];

    const TIPOS_GESTION = [
        'Interna',
        'Enviar al Afiliado'
    ];

    const TIPOS_ANTICONCEPTIVO = [
        'DIU',
        'Parches',
        'Otro'
    ];

    // CONSTANTES PARA FISCALIZACIÓN
    const PERIODOS = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE', 'OTRO'
    ];

    const MEDIOS_DE_PAGO = [
        'Mercado Pago',
        'Transferencia'
    ];

    const TIPOS_REINTEGRO_FISCALIZACION = [
        'Cobranza erronea'
    ];

    // CONSTANTES PARA ATENCIÓN AL CLIENTE
    const SERVICIOS = [
        'Web',
        'App',
        'Pixi'
    ];

    const TIPOS_GESTION_ATENCION = [
        'Interna',
        'Enviar al Afiliado'
    ];

    // CONSTANTES PARA INTERNACIONES
    const TIPOS_INTERVENCION = [
        'Ambulatoria',
        'Quirúrgica',
        'Urgencia',
        'Clínica'
    ];

    // CONSTANTES PARA PREEXISTENCIA
    const CANALES = [
        'Sede',
        'Pixi',
        'Rocio',
        'Auditoria'
    ];

    const HORARIOS_LLAMADA = [
        '9 - 17 hs',
        '17 - 22 hs',
        'Indistinto'
    ];

    // Handler para cambio de departamento
    const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDepartamento = e.target.value;
        setDepartamento(newDepartamento);
        setTipificacion(''); // Reset tipificación
        resetCamposEspecificos();

        onDataChange({
            departamento: newDepartamento,
            tipificacion: '',
        });
    };

    // Handler para cambio de tipificación
    const handleTipificacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTipificacion = e.target.value;
        setTipificacion(newTipificacion);
        resetCamposEspecificos();

        onDataChange({
            departamento,
            tipificacion: newTipificacion,
        });
    };

    // Reset de campos específicos
    const resetCamposEspecificos = () => {
        // Reset de campos de Prestaciones Médicas
        setDiagnostico('');
        setTipoReintegro('');
        setObservaciones('');
        setPrestador('');
        setTipoProblema('');
        setTipoGestion('');
        setMedicamento('');
        setTipoAnticonceptivo('');

        // Reset de campos de Fiscalización
        setPeriodo('');
        setDescripcionCampo('');
        setMedioDePago('');
        setTipoReintegroFiscalizacion('');

        // Reset de campos de Afiliaciones
        setCuilAUnificar('');
        setCuilDuplicado('');
        setCuilNuevo('');
        setParentesco('');
        setDatoIncorrecto('');
        setMotivoBaja('');
        setNuevaCategoria('');
        setPlanSeleccionado('');
        setFechaAlta('');
        setNumeroTarjetaCBU('');
        setMotivoCodigo('');

        // Reset de campos de Atención al Cliente
        setPrestadorAtencion('');
        setObservacionesAtencion('');
        setNumeroTramite('');
        setServicioSeleccionado('');
        setTipoGestionAtencion('');
        setEspecialidad('');

        // Reset de campos de Internaciones
        setPrestadorSolicitado('');
        setTipoIntervencion('');
        setDetalleDiagnostico('');
        setFechaAproximada('');
        setProfesionalSolicitante('');
        setObservacionInternacion('');

        // Reset de campos de Preexistencia
        setObservacionesPreexistencia('');
        setCanal('');
        setDiagnosticoPreexistencia('');
        setIngreso('');
        setPracticasSolicitadas('');
        setHorarioLlamada('');
    };

    // Actualizar datos cuando cambian los campos específicos
    const updateData = (extraData: any) => {
        onDataChange({
            departamento,
            tipificacion,
            ...extraData
        });
    };

    return (
        <div>
            {/* Departamento - Siempre visible */}
            <div className="ticket-modal-form-group">
                <label htmlFor="departamento" className="ticket-modal-label">Departamento</label>
                <select
                    id="departamento"
                    className="ticket-modal-select"
                    value={departamento}
                    onChange={handleDepartamentoChange}
                >
                    <option value="">-- Seleccione --</option>
                    {Object.entries(DEPARTAMENTOS).map(([id, data]) => (
                        <option key={id} value={id}>{data.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Tipificación - Visible solo si hay departamento seleccionado */}
            {departamento && DEPARTAMENTOS[departamento as keyof typeof DEPARTAMENTOS]?.tipificaciones.length > 0 && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="tipificacion" className="ticket-modal-label">Tipificación</label>
                    <select
                        id="tipificacion"
                        className="ticket-modal-select"
                        value={tipificacion}
                        onChange={handleTipificacionChange}
                    >
                        <option value="">-- Seleccione Tipificación --</option>
                        {DEPARTAMENTOS[departamento as keyof typeof DEPARTAMENTOS]?.tipificaciones.map((tip: string) => (
                            <option key={tip} value={tip}>{tip}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* CAMPOS ESPECÍFICOS POR TIPIFICACIÓN - PRESTACIONES MÉDICAS */}
            {departamento === '564264000000175045' && tipificacion === 'Cronicidad' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="diagnostico" className="ticket-modal-label">Diagnóstico</label>
                    <select
                        id="diagnostico"
                        className="ticket-modal-select"
                        value={diagnostico}
                        onChange={(e) => {
                            setDiagnostico(e.target.value);
                            updateData({ diagnostico: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione Diagnóstico --</option>
                        {DIAGNOSTICOS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            )}

            {departamento === '564264000000175045' && tipificacion === 'Reintegro' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="tipoReintegro" className="ticket-modal-label">Tipo de reintegro</label>
                        <select
                            id="tipoReintegro"
                            className="ticket-modal-select"
                            value={tipoReintegro}
                            onChange={(e) => {
                                setTipoReintegro(e.target.value);
                                updateData({ tipoReintegro: e.target.value, observaciones });
                            }}
                        >
                            <option value="">-- Seleccione Reintegro --</option>
                            {TIPOS_REINTEGRO.map(tr => (
                                <option key={tr} value={tr}>{tr}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observaciones" className="ticket-modal-label">Observaciones</label>
                        <textarea
                            id="observaciones"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-textarea"
                            value={observaciones}
                            onChange={(e) => {
                                setObservaciones(e.target.value);
                                updateData({ tipoReintegro, observaciones: e.target.value });
                            }}
                        />
                    </div>
                </>
            )}

            {departamento === '564264000000175045' && tipificacion === 'Carga Certificado Discapacidad' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2' }}>
                        AFILIADO {/* AQUÍ IRÍA EL CUIL */} ENTREGA CERTIFICADO ÚNICO DE DISCAPACIDAD
                    </p>
                </div>
            )}

            {departamento === '564264000000175045' && tipificacion === 'Problemas al utilizar servicio' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="prestador" className="ticket-modal-label">Prestador</label>
                        <input
                            type="text"
                            id="prestador"
                            placeholder="Ingrese nombre Prestador"
                            className="ticket-modal-input"
                            value={prestador}
                            onChange={(e) => {
                                setPrestador(e.target.value);
                                updateData({ prestador: e.target.value, tipoProblema, tipoGestion });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="tipoProblema" className="ticket-modal-label">Tipo de Problema</label>
                        <select
                            id="tipoProblema"
                            className="ticket-modal-select"
                            value={tipoProblema}
                            onChange={(e) => {
                                setTipoProblema(e.target.value);
                                updateData({ prestador, tipoProblema: e.target.value, tipoGestion });
                            }}
                        >
                            <option value="">-- Seleccione Problema --</option>
                            {TIPOS_PROBLEMA.map(tp => (
                                <option key={tp} value={tp}>{tp}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="tipoGestion" className="ticket-modal-label">Tipo de Gestión</label>
                        <select
                            id="tipoGestion"
                            className="ticket-modal-select"
                            value={tipoGestion}
                            onChange={(e) => {
                                setTipoGestion(e.target.value);
                                updateData({ prestador, tipoProblema, tipoGestion: e.target.value });
                            }}
                        >
                            <option value="">-- Seleccione Gestión --</option>
                            {TIPOS_GESTION.map(tg => (
                                <option key={tg} value={tg}>{tg}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {departamento === '564264000000175045' && tipificacion === 'Medicamentos' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="medicamento" className="ticket-modal-label">Medicamento</label>
                    <input
                        type="text"
                        id="medicamento"
                        placeholder="Ingrese nombre Medicamento"
                        className="ticket-modal-input"
                        value={medicamento}
                        onChange={(e) => {
                            setMedicamento(e.target.value);
                            updateData({ medicamento: e.target.value });
                        }}
                    />
                </div>
            )}

            {departamento === '564264000000175045' && tipificacion === 'Estudio o Práctica Médica' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="prestador" className="ticket-modal-label">Prestador</label>
                        <input
                            type="text"
                            id="prestador"
                            placeholder="Ingrese nombre Prestador"
                            className="ticket-modal-input"
                            value={prestador}
                            onChange={(e) => {
                                setPrestador(e.target.value);
                                updateData({ prestador: e.target.value, observaciones });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observaciones" className="ticket-modal-label">Observaciones</label>
                        <textarea
                            id="observaciones"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-textarea"
                            value={observaciones}
                            onChange={(e) => {
                                setObservaciones(e.target.value);
                                updateData({ prestador, observaciones: e.target.value });
                            }}
                        />
                    </div>
                </>
            )}

            {departamento === '564264000000175045' && tipificacion === 'Anticonceptivos' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="tipoAnticonceptivo" className="ticket-modal-label">Tipo de anticonceptivos</label>
                    <select
                        id="tipoAnticonceptivo"
                        className="ticket-modal-select"
                        value={tipoAnticonceptivo}
                        onChange={(e) => {
                            setTipoAnticonceptivo(e.target.value);
                            updateData({ tipoAnticonceptivo: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione tipo --</option>
                        {TIPOS_ANTICONCEPTIVO.map(ta => (
                            <option key={ta} value={ta}>{ta}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* FISCALIZACIÓN */}
            {departamento === '564264000000179032' && tipificacion === 'Ya Pague' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="periodo" className="ticket-modal-label">Periodo</label>
                        <select
                            id="periodo"
                            className="ticket-modal-select"
                            value={periodo}
                            onChange={(e) => {
                                setPeriodo(e.target.value);
                                updateData({ periodo: e.target.value });
                            }}
                        >
                            <option value="">-- Seleccione Periodo --</option>
                            {PERIODOS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Plan de Pago' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        DESCRIPCIÓN
                    </p>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Diferencias Cobranza' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="descripcionCampo" className="ticket-modal-label">Descripción</label>
                    <input
                        type="text"
                        id="descripcionCampo"
                        placeholder="Ingrese descripción"
                        className="ticket-modal-input"
                        value={descripcionCampo}
                        onChange={(e) => {
                            setDescripcionCampo(e.target.value);
                            updateData({ descripcionCampo: e.target.value });
                        }}
                    />
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Adherir Debito Automático' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} SOLICITA ADHESIÓN AL DÉBITO AUTOMÁTICO
                    </p>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Quiero mi Factura' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="periodo" className="ticket-modal-label">Periodo</label>
                    <select
                        id="periodo"
                        className="ticket-modal-select"
                        value={periodo}
                        onChange={(e) => {
                            setPeriodo(e.target.value);
                            updateData({ periodo: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione Periodo --</option>
                        {PERIODOS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Quiero Pagar' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="periodo" className="ticket-modal-label">Periodo</label>
                    <select
                        id="periodo"
                        className="ticket-modal-select"
                        value={periodo}
                        onChange={(e) => {
                            setPeriodo(e.target.value);
                            updateData({ periodo: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione Periodo --</option>
                        {PERIODOS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Link de pago incorrecto' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="descripcionCampo" className="ticket-modal-label">Descripción</label>
                        <input
                            type="text"
                            id="descripcionCampo"
                            placeholder="Ingrese descripción"
                            className="ticket-modal-input"
                            value={descripcionCampo}
                            onChange={(e) => {
                                setDescripcionCampo(e.target.value);
                                updateData({ descripcionCampo: e.target.value, periodo });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="periodo" className="ticket-modal-label">Periodo</label>
                        <select
                            id="periodo"
                            className="ticket-modal-select"
                            value={periodo}
                            onChange={(e) => {
                                setPeriodo(e.target.value);
                                updateData({ descripcionCampo, periodo: e.target.value });
                            }}
                        >
                            <option value="">-- Seleccione Periodo --</option>
                            {PERIODOS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                            DESCRIPCIÓN
                        </p>
                    </div>
                </>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Estado de cuenta' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} SOLICITA ESTADO DE CUENTA CORRIENTE SE LO CAPACITO PARA SACARLO POR PIXI
                    </p>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Solicitud de descuento' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} SOLICITA DESCUENTO EN SU PLAN {afiliadoData?.planPrestacional || 'NO ESPECIFICADO'}
                    </p>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Baja de debito automático' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="medioDePago" className="ticket-modal-label">Medio de Pago</label>
                    <select
                        id="medioDePago"
                        className="ticket-modal-select"
                        value={medioDePago}
                        onChange={(e) => {
                            setMedioDePago(e.target.value);
                            updateData({ medioDePago: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione Medio de Pago --</option>
                        {MEDIOS_DE_PAGO.map(mp => (
                            <option key={mp} value={mp}>{mp}</option>
                        ))}
                    </select>
                </div>
            )}

            {departamento === '564264000000179032' && tipificacion === 'Reintegro' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="tipoReintegroFiscalizacion" className="ticket-modal-label">Tipo de reintegro</label>
                        <select
                            id="tipoReintegroFiscalizacion"
                            className="ticket-modal-select"
                            value={tipoReintegroFiscalizacion}
                            onChange={(e) => {
                                setTipoReintegroFiscalizacion(e.target.value);
                                updateData({ tipoReintegroFiscalizacion: e.target.value, descripcionCampo });
                            }}
                        >
                            <option value="">-- Seleccione Reintegro --</option>
                            {TIPOS_REINTEGRO_FISCALIZACION.map(tr => (
                                <option key={tr} value={tr}>{tr}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="descripcionCampo" className="ticket-modal-label">Descripción</label>
                        <input
                            type="text"
                            id="descripcionCampo"
                            placeholder="Ingrese descripción"
                            className="ticket-modal-input"
                            value={descripcionCampo}
                            onChange={(e) => {
                                setDescripcionCampo(e.target.value);
                                updateData({ tipoReintegroFiscalizacion, descripcionCampo: e.target.value });
                            }}
                        />
                    </div>
                </>
            )}

            {/* AFILIACIONES */}

            {/* 1. Unificación de aportes */}
            {departamento === '564264000000181969' && tipificacion === 'Unificación de aportes' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="cuilAUnificar" className="ticket-modal-label">Cuil a Unificar</label>
                        <input
                            type="text"
                            id="cuilAUnificar"
                            placeholder="Ej: 20345679870"
                            className="ticket-modal-input"
                            value={cuilAUnificar}
                            onChange={(e) => {
                                setCuilAUnificar(e.target.value);
                                updateData({ cuilAUnificar: e.target.value });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notas informativas:</p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                            <li>Unificación de aportes: Bono de sueldo</li>
                            <li>Incorporar familiar (cónyuge): DNI (frente y dorso), acta de matrimonio o certificado de convivencia</li>
                            <li>Incorporar familiar (hijo/a): DNI (frente y dorso), partida de nacimiento</li>
                            <li>Cambio categoría: MON (Formulario AFIP) - REL (último Bono) - ADHERENTE (nada)</li>
                        </ul>
                    </div>
                </>
            )}

            {/* 2. Afiliado duplicado */}
            {departamento === '564264000000181969' && tipificacion === 'Afiliado duplicado' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="cuilDuplicado" className="ticket-modal-label">Cuil Duplicado</label>
                    <input
                        type="text"
                        id="cuilDuplicado"
                        placeholder="Ej: 20345679870"
                        className="ticket-modal-input"
                        value={cuilDuplicado}
                        onChange={(e) => {
                            setCuilDuplicado(e.target.value);
                            updateData({ cuilDuplicado: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 3. Incorporación de familiar */}
            {departamento === '564264000000181969' && tipificacion === 'Incorporación de familiar' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="cuilNuevo" className="ticket-modal-label">Cuil Nuevo</label>
                        <input
                            type="text"
                            id="cuilNuevo"
                            placeholder="Ej: 20345679870"
                            className="ticket-modal-input"
                            value={cuilNuevo}
                            onChange={(e) => {
                                setCuilNuevo(e.target.value);
                                updateData({ cuilNuevo: e.target.value, parentesco });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="parentesco" className="ticket-modal-label">Parentesco</label>
                        <select
                            id="parentesco"
                            className="ticket-modal-select"
                            value={parentesco}
                            onChange={(e) => {
                                setParentesco(e.target.value);
                                updateData({ cuilNuevo, parentesco: e.target.value });
                            }}
                        >
                            <option value="">-- Seleccione Parentesco --</option>
                            <option value="Cónyuge o Concubino">Cónyuge o Concubino</option>
                            <option value="Hijo/a">Hijo/a</option>
                        </select>
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notas informativas:</p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                            <li>Unificación de aportes: Bono de sueldo</li>
                            <li>Incorporar familiar (cónyuge): DNI (frente y dorso), acta de matrimonio o certificado de convivencia</li>
                            <li>Incorporar familiar (hijo/a): DNI (frente y dorso), partida de nacimiento</li>
                            <li>Cambio categoría: MON (Formulario AFIP) - REL (último Bono) - ADHERENTE (nada)</li>
                        </ul>
                    </div>
                </>
            )}

            {/* 4. Datos afiliatorios incorrectos */}
            {departamento === '564264000000181969' && tipificacion === 'Datos afiliatorios incorrectos' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="datoIncorrecto" className="ticket-modal-label">Dato Incorrecto</label>
                    <select
                        id="datoIncorrecto"
                        className="ticket-modal-select"
                        value={datoIncorrecto}
                        onChange={(e) => {
                            setDatoIncorrecto(e.target.value);
                            updateData({ datoIncorrecto: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione Dato --</option>
                        <option value="Nombre">Nombre</option>
                        <option value="Apellido">Apellido</option>
                        <option value="Email">Email</option>
                        <option value="Plan">Plan</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
            )}

            {/* 5. Baja definitiva de cobertura */}
            {departamento === '564264000000181969' && tipificacion === 'Baja definitiva de cobertura' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="motivoBaja" className="ticket-modal-label">Motivo</label>
                    <input
                        type="text"
                        id="motivoBaja"
                        placeholder="Indique el motivo"
                        className="ticket-modal-input"
                        value={motivoBaja}
                        onChange={(e) => {
                            setMotivoBaja(e.target.value);
                            updateData({ motivo: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 6. Cambio de categoría laboral */}
            {departamento === '564264000000181969' && tipificacion === 'Cambio de categoría laboral' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="nuevaCategoria" className="ticket-modal-label">Nueva Categoría</label>
                        <select
                            id="nuevaCategoria"
                            className="ticket-modal-select"
                            value={nuevaCategoria}
                            onChange={(e) => {
                                setNuevaCategoria(e.target.value);
                                updateData({ nuevaCategoria: e.target.value });
                            }}
                        >
                            <option value="">-- Seleccione Categoría --</option>
                            <option value="Relación de Dependencia">Relación de Dependencia</option>
                            <option value="Monotributista">Monotributista</option>
                            <option value="Adherente">Adherente</option>
                        </select>
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notas informativas:</p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                            <li>Unificación de aportes: Bono de sueldo</li>
                            <li>Incorporar familiar (cónyuge): DNI (frente y dorso), acta de matrimonio o certificado de convivencia</li>
                            <li>Incorporar familiar (hijo/a): DNI (frente y dorso), partida de nacimiento</li>
                            <li>Cambio categoría: MON (Formulario AFIP) - REL (último Bono) - ADHERENTE (nada)</li>
                        </ul>
                    </div>
                </>
            )}

            {/* 7. Cambio de Plan */}
            {departamento === '564264000000181969' && tipificacion === 'Cambio de Plan' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="planSeleccionado" className="ticket-modal-label">Seleccione Plan</label>
                    <select
                        id="planSeleccionado"
                        className="ticket-modal-select"
                        value={planSeleccionado}
                        onChange={(e) => {
                            setPlanSeleccionado(e.target.value);
                            updateData({ planSeleccionado: e.target.value });
                        }}
                    >
                        <option value="">-- Seleccione Plan --</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Black">Black</option>
                        <option value="Titanium">Titanium</option>
                        <option value="PMO">PMO</option>
                    </select>
                </div>
            )}

            {/* 8. Solicitud de alta */}
            {departamento === '564264000000181969' && tipificacion === 'Solicitud de alta' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="fechaAlta" className="ticket-modal-label">Fecha de Alta</label>
                    <input
                        type="date"
                        id="fechaAlta"
                        className="ticket-modal-input"
                        value={fechaAlta}
                        onChange={(e) => {
                            setFechaAlta(e.target.value);
                            updateData({ fechaAlta: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 9. Adherir al débito automático */}
            {departamento === '564264000000181969' && tipificacion === 'Adherir al débito automático' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="numeroTarjetaCBU" className="ticket-modal-label">Número de la tarjeta / CBU</label>
                        <input
                            type="text"
                            id="numeroTarjetaCBU"
                            placeholder="Ej: 20345679870"
                            className="ticket-modal-input"
                            value={numeroTarjetaCBU}
                            onChange={(e) => {
                                setNumeroTarjetaCBU(e.target.value);
                                updateData({ numeroTarjetaCBU: e.target.value });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#d1ecf1', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notas informativas:</p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                            <li>ALTA: Nota de adhesión, Imagen del frente de la tarjeta</li>
                            <li>BAJA: Nota de baja (opcional)</li>
                        </ul>
                    </div>
                </>
            )}

            {/* 10. Baja al débito automático */}
            {departamento === '564264000000181969' && tipificacion === 'Baja al débito automático' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#d1ecf1', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notas informativas:</p>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <li>ALTA: Nota de adhesión, Imagen del frente de la tarjeta</li>
                        <li>BAJA: Nota de baja (opcional)</li>
                    </ul>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontStyle: 'italic' }}>
                        Solo adjunte la documentación correspondiente.
                    </p>
                </div>
            )}

            {/* 11. Código de Obra Social */}
            {departamento === '564264000000181969' && tipificacion === 'Código de Obra Social' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="motivoCodigo" className="ticket-modal-label">Motivo</label>
                    <input
                        type="text"
                        id="motivoCodigo"
                        placeholder="Indique el motivo"
                        className="ticket-modal-input"
                        value={motivoCodigo}
                        onChange={(e) => {
                            setMotivoCodigo(e.target.value);
                            updateData({ motivo: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* ATENCIÓN AL CLIENTE */}

            {/* 1. Estudio o Práctica Médica */}
            {departamento === '564264000000184906' && tipificacion === 'Estudio o Práctica Médica' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="prestadorAtencion" className="ticket-modal-label">Prestador</label>
                        <input
                            type="text"
                            id="prestadorAtencion"
                            placeholder="Prestador preferido en la cartilla"
                            className="ticket-modal-input"
                            value={prestadorAtencion}
                            onChange={(e) => {
                                setPrestadorAtencion(e.target.value);
                                updateData({ prestador: e.target.value, observaciones: observacionesAtencion });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observacionesAtencion" className="ticket-modal-label">Observaciones</label>
                        <textarea
                            id="observacionesAtencion"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-textarea"
                            value={observacionesAtencion}
                            onChange={(e) => {
                                setObservacionesAtencion(e.target.value);
                                updateData({ prestador: prestadorAtencion, observaciones: e.target.value });
                            }}
                        />
                    </div>
                </>
            )}

            {/* 2. Orden de Consulta */}
            {departamento === '564264000000184906' && tipificacion === 'Orden de Consulta' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="prestadorAtencion" className="ticket-modal-label">Prestador</label>
                    <input
                        type="text"
                        id="prestadorAtencion"
                        placeholder="Prestador preferido en la cartilla"
                        className="ticket-modal-input"
                        value={prestadorAtencion}
                        onChange={(e) => {
                            setPrestadorAtencion(e.target.value);
                            updateData({ prestador: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 3. Estado de Trámite */}
            {departamento === '564264000000184906' && tipificacion === 'Estado de Trámite' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="numeroTramite" className="ticket-modal-label">Número de trámite</label>
                    <input
                        type="text"
                        id="numeroTramite"
                        placeholder="Indique el nro del trámite"
                        className="ticket-modal-input"
                        value={numeroTramite}
                        onChange={(e) => {
                            setNumeroTramite(e.target.value);
                            updateData({ numeroTramite: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 4. Problemas al utilizar servicio */}
            {departamento === '564264000000184906' && tipificacion === 'Problemas al utilizar servicio' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="servicioSeleccionado" className="ticket-modal-label">Seleccione Servicio</label>
                        <select
                            id="servicioSeleccionado"
                            className="ticket-modal-select"
                            value={servicioSeleccionado}
                            onChange={(e) => {
                                setServicioSeleccionado(e.target.value);
                                updateData({ servicioSeleccionado: e.target.value, tipoGestion: tipoGestionAtencion });
                            }}
                        >
                            <option value="">-- Seleccione Servicio --</option>
                            {SERVICIOS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="tipoGestionAtencion" className="ticket-modal-label">Tipo de Gestión</label>
                        <select
                            id="tipoGestionAtencion"
                            className="ticket-modal-select"
                            value={tipoGestionAtencion}
                            onChange={(e) => {
                                setTipoGestionAtencion(e.target.value);
                                updateData({ servicioSeleccionado, tipoGestion: e.target.value });
                            }}
                        >
                            <option value="">-- Seleccione Gestión --</option>
                            {TIPOS_GESTION_ATENCION.map(tg => (
                                <option key={tg} value={tg}>{tg}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* 5. Información de coseguros */}
            {departamento === '564264000000184906' && tipificacion === 'Información de coseguros' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observacionesAtencion" className="ticket-modal-label">Observaciones</label>
                        <input
                            type="text"
                            id="observacionesAtencion"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-input"
                            value={observacionesAtencion}
                            onChange={(e) => {
                                setObservacionesAtencion(e.target.value);
                                updateData({ observaciones: e.target.value });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                            SE LE INFORMO AL AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} LA SITUACIÓN ACTUAL DE COSEGUROS
                        </p>
                    </div>
                </>
            )}

            {/* 6. Credencial descargada */}
            {departamento === '564264000000184906' && tipificacion === 'Credencial descargada' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="observacionesAtencion" className="ticket-modal-label">Observaciones</label>
                    <input
                        type="text"
                        id="observacionesAtencion"
                        placeholder="Ingrese una observación"
                        className="ticket-modal-input"
                        value={observacionesAtencion}
                        onChange={(e) => {
                            setObservacionesAtencion(e.target.value);
                            updateData({ observaciones: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 7. Cartilla consultada */}
            {departamento === '564264000000184906' && tipificacion === 'Cartilla consultada' && (
                <div className="ticket-modal-form-group">
                    <label htmlFor="especialidad" className="ticket-modal-label">Especialidad</label>
                    <input
                        type="text"
                        id="especialidad"
                        placeholder="Especialidad en la cartilla"
                        className="ticket-modal-input"
                        value={especialidad}
                        onChange={(e) => {
                            setEspecialidad(e.target.value);
                            updateData({ especialidad: e.target.value });
                        }}
                    />
                </div>
            )}

            {/* 8. Plan Materno */}
            {departamento === '564264000000184906' && tipificacion === 'Plan Materno' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} SOLICITA INGRESAR A PLAN MATERNO
                    </p>
                </div>
            )}

            {/* 9. Solicitud de Plan Materno Infantil */}
            {departamento === '564264000000184906' && tipificacion === 'Solicitud de Plan Materno Infantil' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} SOLICITA INGRESAR A PLAN MATERNO INFANTIL
                    </p>
                </div>
            )}

            {/* 10. Información de ópticas consultada */}
            {departamento === '564264000000184906' && tipificacion === 'Información de ópticas consultada' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observacionesAtencion" className="ticket-modal-label">Observaciones</label>
                        <input
                            type="text"
                            id="observacionesAtencion"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-input"
                            value={observacionesAtencion}
                            onChange={(e) => {
                                setObservacionesAtencion(e.target.value);
                                updateData({ observaciones: e.target.value });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                            SE LE INFORMO AL AFILIADO {afiliadoData?.cuil || 'SIN_DNI'} LA COBERTURA ACTUAL DE ÓPTICAS
                        </p>
                    </div>
                </>
            )}

            {/* 11. Preexistencia */}
            {departamento === '564264000000184906' && tipificacion === 'Preexistencia' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observacionesAtencion" className="ticket-modal-label">Observaciones</label>
                        <input
                            type="text"
                            id="observacionesAtencion"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-input"
                            value={observacionesAtencion}
                            onChange={(e) => {
                                setObservacionesAtencion(e.target.value);
                                updateData({ observaciones: e.target.value });
                            }}
                        />
                    </div>
                    <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                            ADJUNTO (IMÁGEN) COMPROBANTE DE PREEXISTENCIA
                        </p>
                    </div>
                </>
            )}

            {/* 12. Anticonceptivos */}
            {departamento === '564264000000184906' && tipificacion === 'Anticonceptivos' && (
                <div className="ticket-modal-form-group" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
                        AFILIADO/A SOLICITA ANTICONCEPTIVOS COMUNES
                    </p>
                </div>
            )}

            {/* INTERNACIONES (sin tipificaciones)*/}

            {departamento === '564264000042384029' && tipificacion === 'Internación' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="prestadorSolicitado" className="ticket-modal-label">Prestador Solicitado</label>
                        <input
                            type="text"
                            id="prestadorSolicitado"
                            placeholder="Ej: Clínica de Manos"
                            className="ticket-modal-input"
                            value={prestadorSolicitado}
                            onChange={(e) => {
                                setPrestadorSolicitado(e.target.value);
                                updateData({
                                    prestadorSolicitado: e.target.value,
                                    tipoIntervencion,
                                    detalleDiagnostico,
                                    fechaAproximada,
                                    profesionalSolicitante,
                                    observaciones: observacionInternacion
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="tipoIntervencion" className="ticket-modal-label">Tipo de intervención</label>
                        <select
                            id="tipoIntervencion"
                            className="ticket-modal-select"
                            value={tipoIntervencion}
                            onChange={(e) => {
                                setTipoIntervencion(e.target.value);
                                updateData({
                                    prestadorSolicitado,
                                    tipoIntervencion: e.target.value,
                                    detalleDiagnostico,
                                    fechaAproximada,
                                    profesionalSolicitante,
                                    observaciones: observacionInternacion
                                });
                            }}
                        >
                            <option value="">-- Seleccione Intervención --</option>
                            {TIPOS_INTERVENCION.map(ti => (
                                <option key={ti} value={ti}>{ti}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="detalleDiagnostico" className="ticket-modal-label">Detalle de diagnóstico</label>
                        <input
                            type="text"
                            id="detalleDiagnostico"
                            placeholder="Ej: Fractura 5° metacarpiano"
                            className="ticket-modal-input"
                            value={detalleDiagnostico}
                            onChange={(e) => {
                                setDetalleDiagnostico(e.target.value);
                                updateData({
                                    prestadorSolicitado,
                                    tipoIntervencion,
                                    detalleDiagnostico: e.target.value,
                                    fechaAproximada,
                                    profesionalSolicitante,
                                    observaciones: observacionInternacion
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="fechaAproximada" className="ticket-modal-label">Fecha Aproximada</label>
                        <input
                            type="date"
                            id="fechaAproximada"
                            className="ticket-modal-input"
                            value={fechaAproximada}
                            onChange={(e) => {
                                setFechaAproximada(e.target.value);
                                updateData({
                                    prestadorSolicitado,
                                    tipoIntervencion,
                                    detalleDiagnostico,
                                    fechaAproximada: e.target.value,
                                    profesionalSolicitante,
                                    observaciones: observacionInternacion
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="profesionalSolicitante" className="ticket-modal-label">Profesional Solicitante</label>
                        <input
                            type="text"
                            id="profesionalSolicitante"
                            placeholder="Ej: Dr Carlos Bilardo"
                            className="ticket-modal-input"
                            value={profesionalSolicitante}
                            onChange={(e) => {
                                setProfesionalSolicitante(e.target.value);
                                updateData({
                                    prestadorSolicitado,
                                    tipoIntervencion,
                                    detalleDiagnostico,
                                    fechaAproximada,
                                    profesionalSolicitante: e.target.value,
                                    observaciones: observacionInternacion
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="observacionInternacion" className="ticket-modal-label">Observación</label>
                        <textarea
                            id="observacionInternacion"
                            placeholder="Ingrese un comentario"
                            className="ticket-modal-textarea"
                            value={observacionInternacion}
                            onChange={(e) => {
                                setObservacionInternacion(e.target.value);
                                updateData({
                                    prestadorSolicitado,
                                    tipoIntervencion,
                                    detalleDiagnostico,
                                    fechaAproximada,
                                    profesionalSolicitante,
                                    observaciones: e.target.value
                                });
                            }}
                        />
                    </div>
                </>
            )}

            {/* PREEXISTENCIA */}

            {departamento === '564264000000188843' && tipificacion === 'Preexistencia' && (
                <>
                    <div className="ticket-modal-form-group">
                        <label htmlFor="observacionesPreexistencia" className="ticket-modal-label">Observaciones</label>
                        <input
                            type="text"
                            id="observacionesPreexistencia"
                            placeholder="Ingrese una observación"
                            className="ticket-modal-input"
                            value={observacionesPreexistencia}
                            onChange={(e) => {
                                setObservacionesPreexistencia(e.target.value);
                                updateData({
                                    observaciones: e.target.value,
                                    canal,
                                    diagnostico: diagnosticoPreexistencia,
                                    ingreso,
                                    practicasSolicitadas,
                                    horarioLlamada
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="canal" className="ticket-modal-label">Canal</label>
                        <select
                            id="canal"
                            className="ticket-modal-select"
                            value={canal}
                            onChange={(e) => {
                                setCanal(e.target.value);
                                updateData({
                                    observaciones: observacionesPreexistencia,
                                    canal: e.target.value,
                                    diagnostico: diagnosticoPreexistencia,
                                    ingreso,
                                    practicasSolicitadas,
                                    horarioLlamada
                                });
                            }}
                        >
                            <option value="">-- Seleccione Canal --</option>
                            {CANALES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="diagnosticoPreexistencia" className="ticket-modal-label">Diagnóstico</label>
                        <input
                            type="text"
                            id="diagnosticoPreexistencia"
                            placeholder="Ingrese el diagnóstico"
                            className="ticket-modal-input"
                            value={diagnosticoPreexistencia}
                            onChange={(e) => {
                                setDiagnosticoPreexistencia(e.target.value);
                                updateData({
                                    observaciones: observacionesPreexistencia,
                                    canal,
                                    diagnostico: e.target.value,
                                    ingreso,
                                    practicasSolicitadas,
                                    horarioLlamada
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="ingreso" className="ticket-modal-label">Ingreso</label>
                        <input
                            type="date"
                            id="ingreso"
                            className="ticket-modal-input"
                            value={ingreso}
                            onChange={(e) => {
                                setIngreso(e.target.value);
                                updateData({
                                    observaciones: observacionesPreexistencia,
                                    canal,
                                    diagnostico: diagnosticoPreexistencia,
                                    ingreso: e.target.value,
                                    practicasSolicitadas,
                                    horarioLlamada
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="practicasSolicitadas" className="ticket-modal-label">Prácticas Solicitadas</label>
                        <input
                            type="text"
                            id="practicasSolicitadas"
                            placeholder="Ingrese las prácticas"
                            className="ticket-modal-input"
                            value={practicasSolicitadas}
                            onChange={(e) => {
                                setPracticasSolicitadas(e.target.value);
                                updateData({
                                    observaciones: observacionesPreexistencia,
                                    canal,
                                    diagnostico: diagnosticoPreexistencia,
                                    ingreso,
                                    practicasSolicitadas: e.target.value,
                                    horarioLlamada
                                });
                            }}
                        />
                    </div>

                    <div className="ticket-modal-form-group">
                        <label htmlFor="horarioLlamada" className="ticket-modal-label">Horario Llamada</label>
                        <select
                            id="horarioLlamada"
                            className="ticket-modal-select"
                            value={horarioLlamada}
                            onChange={(e) => {
                                setHorarioLlamada(e.target.value);
                                updateData({
                                    observaciones: observacionesPreexistencia,
                                    canal,
                                    diagnostico: diagnosticoPreexistencia,
                                    ingreso,
                                    practicasSolicitadas,
                                    horarioLlamada: e.target.value
                                });
                            }}
                        >
                            <option value="">-- Seleccione un intervalo --</option>
                            {HORARIOS_LLAMADA.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>
    );
};

export default DepartamentosTipificaciones;