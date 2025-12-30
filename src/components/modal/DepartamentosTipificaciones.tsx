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
            tipificaciones: []
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
        setDiagnostico('');
        setTipoReintegro('');
        setObservaciones('');
        setPrestador('');
        setTipoProblema('');
        setTipoGestion('');
        setMedicamento('');
        setTipoAnticonceptivo('');

        setPeriodo('');
        setDescripcionCampo('');
        setMedioDePago('');
        setTipoReintegroFiscalizacion('');
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
        </div>
    );
};

export default DepartamentosTipificaciones;