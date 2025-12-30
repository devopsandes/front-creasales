import { useState } from 'react';

interface DepartamentosTipificacionesProps {
    onDataChange: (data: any) => void;
}

const DepartamentosTipificaciones = ({ onDataChange }: DepartamentosTipificacionesProps) => {
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
        </div>
    );
};

export default DepartamentosTipificaciones;