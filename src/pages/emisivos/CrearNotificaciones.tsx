// CrearNotificaciones.tsx

import { useState } from "react";
import { FaPaperPlane, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import ConfirmacionModal from './ConfirmacionModal';
import './CrearNotificaciones.css';

interface EmisivoForm {
  titulo: string;
  plantilla: string;
  cuerpo: string;
  canales: { email: boolean; push: boolean; whatsapp: boolean; };
  diasDeEnvio: number[];
  nombreNotificacion: string;
}

interface Filtros {
  planes: {
    todos: boolean; titanium: boolean; titaniumPlusCC: boolean;
    titaniumPlusSC: boolean; black: boolean; platinum: boolean;
    gold: boolean; pmo: boolean;
  };
  provincias: {
    todas: boolean; mendoza: boolean; sanJuan: boolean;
    cordoba: boolean; sanLuis: boolean; laRioja: boolean;
  };
  estadoCliente: string;
  categoriaCliente: string;
  categoriaAndes: string;
  tipoConsumidor: string;
  obraSocial: string;
  tipoDePago: string;
  montoInferior: string;
  montoSuperior: string;
  periodoAdeudado: string;
  cuil: string;
}

const CrearNotificaciones = () => {
  const [form, setForm] = useState<EmisivoForm>({
    titulo: "", plantilla: "", cuerpo: "",
    canales: { email: false, push: false, whatsapp: false },
    diasDeEnvio: [],
    nombreNotificacion: "",
  });

  const [filtros, setFiltros] = useState<Filtros>({
    planes: { todos: true, titanium: false, titaniumPlusCC: false, titaniumPlusSC: false, black: false, platinum: false, gold: false, pmo: false },
    provincias: { todas: true, mendoza: false, sanJuan: false, cordoba: false, sanLuis: false, laRioja: false },
    estadoCliente: "ALTA", cuil: "",
    categoriaCliente: "todas", categoriaAndes: "todas",
    tipoConsumidor: "todos", tipoDePago: "todos los medios de pago",
    obraSocial: "todas", montoInferior: "", montoSuperior: "", periodoAdeudado: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  const plantillas = [
    { id: 0, nombre: "Sin plantilla" },
    { id: 1, nombre: "Bienvenida-ADH" },
    { id: 2, nombre: "Bienvenida-MON" },
    { id: 3, nombre: "Bienvenida-REL" },
    { id: 4, nombre: "Deuda-Utilidad" },
    { id: 5, nombre: "Deuda" },
    { id: 6, nombre: "Pre-Alta-ADH" },
    { id: 7, nombre: "Pre-Alta-REL" },
    { id: 8, nombre: "Prevencion-Estafas" },
    { id: 9, nombre: "Referidos" },
  ];

  // const planesOptions = [
  //   { value: "todos", label: "Todos" },
  //   { value: "TITANIUM", label: "Titanium" },
  //   { value: "TITANIUM PLUS C/C", label: "Titanium Plus C/C" },
  //   { value: "TITANIUM PLUS S/C", label: "Titanium Plus S/C" },
  //   { value: "BLACK", label: "Black" },
  //   { value: "PLATINUM", label: "Platinum" },
  //   { value: "GOLD", label: "Gold" },
  //   { value: "PMO", label: "Pmo" },
  // ];

  const estadosOptions = [{ value: "ALTA", label: "Alta" }, { value: "BAJA", label: "Baja" }];
  const categoriaClienteOptions = [
    { value: "todas", label: "Todas las categorias" },
    { value: "MONOTRIBUTISTA", label: "Monotributo" },
    { value: "RELACION DE DEPENDENCIA", label: "Relación de Dependencia" },
    { value: "ADHERENTE", label: "Adherente" },
    { value: "OTROS", label: "Otros" },
    { value: "NINGUNA", label: "Ninguna" },
  ];
  const categoriaAndesOptions = [
    { value: "todas", label: "Todas las categorias" },
    { value: "CATEGORIA A", label: "CATEGORIA A" },
    { value: "CATEGORIA C", label: "CATEGORIA C" },
    { value: "CATEGORIA D", label: "CATEGORIA D" },
  ];
  const tipoConsumidorOptions = [
    { value: "todos", label: "Todos los tipos" },
    { value: "SC", label: "SC" },
    { value: "AC", label: "AC" },
  ];
  const obraSocialOptions = [
    { value: "todas", label: "Todas" }, { value: "S/D", label: "S/D" },
    { value: "OSPOCE", label: "OSPOCE" }, { value: "OSCEARA", label: "OSCEARA" },
    { value: "OSCICA", label: "OSCICA" }, { value: "OSMEDICA", label: "OSMEDICA" },
    { value: "OSPAVIAL", label: "OSPAVIAL" }, { value: "ANDES SALUD", label: "ANDES SALUD" },
  ];
  const tipoDePagoOptions = [
    { value: "todos los medios de pago", label: "Todos los medios de pago" },
    { value: "TRANSFERENCIA BANCARIA", label: "TRANSFERENCIA BANCARIA" },
    { value: "TARJETA DE DEBITO VISA", label: "TARJETA DE DEBITO VISA" },
    { value: "TARJETA DE CREDITO VISA", label: "TARJETA DE CREDITO VISA" },
    { value: "TARJETA DE CREDITO NARANJA", label: "TARJETA DE CREDITO NARANJA" },
    { value: "TARJETA DE CREDITO MASTERCARD", label: "TARJETA DE CREDITO MASTERCARD" },
    { value: "PAGO FACIL", label: "PAGO FACIL" },
    { value: "EFECTIVO", label: "EFECTIVO" },
  ];

  const handleMontoInferiorChange = (value: string) => {
    const sanitized = value.replace(/[^\d.,]/g, '');
    const parts = sanitized.split(/[.,]/);
    if (parts[0].length <= 8) {
      setFiltros({ ...filtros, montoInferior: parts.length > 1 ? `${parts[0]},${parts[1].substring(0, 2)}` : sanitized });
    }
  };

  const handleMontoSuperiorChange = (value: string) => {
    const sanitized = value.replace(/[^\d.,]/g, '');
    const parts = sanitized.split(/[.,]/);
    if (parts[0].length <= 8) {
      setFiltros({ ...filtros, montoSuperior: parts.length > 1 ? `${parts[0]},${parts[1].substring(0, 2)}` : sanitized });
    }
  };

  const handlePeriodoChange = (value: string) => {
    setFiltros({ ...filtros, periodoAdeudado: value.replace('-', '') });
  };

  const handleCanalToggle = (canal: 'email' | 'push' | 'whatsapp') => {
    setForm({ ...form, canales: { ...form.canales, [canal]: !form.canales[canal] } });
  };

  const handlePlanChange = (plan: keyof typeof filtros.planes) => {
    if (plan === 'todos') {
      setFiltros({ ...filtros, planes: { todos: true, titanium: false, titaniumPlusCC: false, titaniumPlusSC: false, black: false, platinum: false, gold: false, pmo: false } });
    } else {
      setFiltros({ ...filtros, planes: { ...filtros.planes, todos: false, [plan]: !filtros.planes[plan] } });
    }
  };

  const handleProvinciaChange = (provincia: keyof typeof filtros.provincias) => {
    if (provincia === 'todas') {
      setFiltros({ ...filtros, provincias: { todas: true, mendoza: false, sanJuan: false, cordoba: false, sanLuis: false, laRioja: false } });
    } else {
      setFiltros({ ...filtros, provincias: { ...filtros.provincias, todas: false, [provincia]: !filtros.provincias[provincia] } });
    }
  };

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type); setToastMessage(message); setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const buildPayload = () => {
    const base = {
      filtroPlan: filtros.planes.todos
        ? []
        : (Object.keys(filtros.planes) as Array<keyof typeof filtros.planes>)
          .filter(key => key !== 'todos' && filtros.planes[key])
          .map(key => ({ todos: 'todos', titanium: 'TITANIUM', titaniumPlusCC: 'TITANIUM PLUS C/C', titaniumPlusSC: 'TITANIUM PLUS S/C', black: 'BLACK', platinum: 'PLATINUM', gold: 'GOLD', pmo: 'PMO' }[key])),
      filtroProvincia: filtros.provincias.todas
        ? []
        : (Object.keys(filtros.provincias) as Array<keyof typeof filtros.provincias>)
          .filter(key => key !== 'todas' && filtros.provincias[key])
          .map(key => ({ todas: 'todas', mendoza: 'mendoza', sanJuan: 'san juan', cordoba: 'cordoba', sanLuis: 'san luis', laRioja: 'la rioja' }[key])),
      filtroEstadoDelCliente: filtros.estadoCliente,
      filtroCategoriaCliente: filtros.categoriaCliente,
      filtroCategoriaAndes: filtros.categoriaAndes,
      filtroTipoConsumidor: filtros.tipoConsumidor,
      filtroObraSocial: filtros.obraSocial,
      filtroTipoDePago: filtros.tipoDePago,
      filtroMontoInferior: filtros.montoInferior,
      filtroMontoSuperior: filtros.montoSuperior,
      filtroPeriodoAdeudado: filtros.periodoAdeudado,
      cuil: filtros.cuil.trim(),
      titulo: (form.plantilla && form.plantilla !== "0") ? null : form.titulo,
      cuerpo: (form.plantilla && form.plantilla !== "0") ? null : form.cuerpo,
      plantillaId: form.plantilla,
      mensaje: form.canales.whatsapp ? 1 : 0,
      correo: form.canales.email ? 1 : 0,
      push: form.canales.push ? 1 : 0,
    };

    // Si hay CUIL activo no se envían diasDeEnvio ni nombreNotificacion
    if (isCuilActive) {
      return base;
    }

    return {
      ...base,
      diasDeEnvio: form.diasDeEnvio,
      nombreNotificacion: form.nombreNotificacion,
    };
  };

  const handleEnviar = () => {
    if (isCuilActive && !filtros.cuil.trim()) {
      showToastMessage('error', 'Por favor, ingrese un CUIL'); return;
    }
    if (!form.canales.email && !form.canales.push && !form.canales.whatsapp) {
      showToastMessage('error', 'Debe seleccionar al menos un canal de envío'); return;
    }
    if ((!form.plantilla || form.plantilla === "0") && (!form.titulo?.trim()) && (!form.cuerpo?.trim())) {
      showToastMessage('error', 'Debe seleccionar una plantilla'); return;
    }
    // Validar nombreNotificacion solo si no hay CUIL
    if (!isCuilActive && !form.nombreNotificacion.trim()) {
      showToastMessage('error', 'Debe ingresar un nombre para la notificación masiva'); return;
    }
    setPendingPayload(buildPayload() as Record<string, unknown>);
    setShowModal(true);
  };

  const handleConfirmar = async () => {
    if (!pendingPayload) return;
    setShowModal(false);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('https://emisivos.createch.com.ar/notificaciones/enviarNotificacionesMasivas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(pendingPayload),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        showToastMessage('success', data.meta?.message || '¡Notificación enviada exitosamente!');
        setForm({ titulo: "", plantilla: "", cuerpo: "", canales: { email: false, push: false, whatsapp: false }, diasDeEnvio: [], nombreNotificacion: "" });
        setFiltros(prev => ({ ...prev, cuil: "", montoInferior: "", montoSuperior: "" }));
      } else {
        showToastMessage('error', data.meta?.message || 'Error al enviar la notificación');
      }
    } catch {
      showToastMessage('error', 'Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setPendingPayload(null);
    }
  };

  const handleDiaToggle = (dia: number) => {
    setForm(prev => ({
      ...prev,
      diasDeEnvio: prev.diasDeEnvio.includes(dia)
        ? prev.diasDeEnvio.filter(d => d !== dia)
        : [...prev.diasDeEnvio, dia].sort((a, b) => a - b)
    }));
  };

  const isCuilActive = filtros.cuil.trim().length > 0;
  const isPlantillaSelected = form.plantilla !== "" && form.plantilla !== "0";

  return (
    <div className="emisivos-wrapper">
      <div className="emisivos-header">
        <h2 className="emisivos-header-title">Crear Notificaciones</h2>
        <p className="emisivos-header-description">
          Envíe emails, notificaciones Push y mensajes de WhatsApp a sus clientes de forma masiva o segmentada.
          Seleccione los filtros de destinatarios, plantillas o cree nuevos mensajes.
          Elija los canales de comunicación deseados.
        </p>
      </div>

      <div className="emisivos-container">
        <div className="emisivos-content">
          {/* Sidebar de Filtros */}
          <aside className="emisivos-sidebar">
            <div className="emisivos-sidebar-header">
              <h3 className="emisivos-sidebar-title">Filtros de Destinatarios</h3>
              <p className="emisivos-sidebar-subtitle">Segmente su audiencia</p>
            </div>

            <div className="emisivos-filters">

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Plan</label>
                <div className="emisivos-checkbox-group">
                  {(['todos', 'titanium', 'titaniumPlusCC', 'titaniumPlusSC', 'black', 'platinum', 'gold', 'pmo'] as const).map(pla => (
                    <label key={pla} className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                      <input type="checkbox" checked={filtros.planes[pla]} onChange={() => handlePlanChange(pla)} disabled={isCuilActive} className="emisivos-checkbox" />
                      <span>{{ todos: 'Todos', titanium: 'Titanium', titaniumPlusCC: 'Titanium Plus C/C', titaniumPlusSC: 'Titanium Plus S/C', black: 'Black', platinum: 'Platinum', gold: 'Gold', pmo: 'Pmo' }[pla]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Provincia</label>
                <div className="emisivos-checkbox-group">
                  {(['todas', 'mendoza', 'sanJuan', 'cordoba', 'sanLuis', 'laRioja'] as const).map(prov => (
                    <label key={prov} className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                      <input type="checkbox" checked={filtros.provincias[prov]} onChange={() => handleProvinciaChange(prov)} disabled={isCuilActive} className="emisivos-checkbox" />
                      <span>{{ todas: 'Todas', mendoza: 'Mendoza', sanJuan: 'San Juan', cordoba: 'Cordoba', sanLuis: 'San Luis', laRioja: 'La Rioja' }[prov]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Estado del Cliente</label>
                <select value={filtros.estadoCliente} onChange={(e) => setFiltros({ ...filtros, estadoCliente: e.target.value })} className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive}>
                  {estadosOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Categoria del Cliente</label>
                <select value={filtros.categoriaCliente} onChange={(e) => setFiltros({ ...filtros, categoriaCliente: e.target.value })} className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive}>
                  {categoriaClienteOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Categoria Andes Salud</label>
                <select value={filtros.categoriaAndes} onChange={(e) => setFiltros({ ...filtros, categoriaAndes: e.target.value })} className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive}>
                  {categoriaAndesOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Tipo de Consumidor</label>
                <select value={filtros.tipoConsumidor} onChange={(e) => setFiltros({ ...filtros, tipoConsumidor: e.target.value })} className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive}>
                  {tipoConsumidorOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Obra Social del Cliente</label>
                <select value={filtros.obraSocial} onChange={(e) => setFiltros({ ...filtros, obraSocial: e.target.value })} className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive}>
                  {obraSocialOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Tipo de pago del Cliente</label>
                <select value={filtros.tipoDePago} onChange={(e) => setFiltros({ ...filtros, tipoDePago: e.target.value })} className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive}>
                  {tipoDePagoOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Monto Adeudado Total</label>
                <div className="emisivos-monto-grid">
                  <div className="emisivos-monto-item">
                    <label className="emisivos-monto-sublabel">Monto Inferior</label>
                    <div className="emisivos-input-currency-wrapper">
                      <span className="emisivos-currency-symbol">$</span>
                      <input type="text" value={filtros.montoInferior} onChange={(e) => handleMontoInferiorChange(e.target.value)} placeholder="0,00" className={`emisivos-input-currency ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive} />
                    </div>
                  </div>
                  <div className="emisivos-monto-item">
                    <label className="emisivos-monto-sublabel">Monto Superior</label>
                    <div className="emisivos-input-currency-wrapper">
                      <span className="emisivos-currency-symbol">$</span>
                      <input type="text" value={filtros.montoSuperior} onChange={(e) => handleMontoSuperiorChange(e.target.value)} placeholder="0,00" className={`emisivos-input-currency ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Periodo Adeudado</label>
                <input type="month" value={filtros.periodoAdeudado ? `${filtros.periodoAdeudado.substring(0, 4)}-${filtros.periodoAdeudado.substring(4, 6)}` : ''} onChange={(e) => handlePeriodoChange(e.target.value)} className={`emisivos-input ${isCuilActive ? 'emisivos-disabled' : ''}`} disabled={isCuilActive} />
              </div>

              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">CUIL</label>
                <input type="text" value={filtros.cuil} onChange={(e) => setFiltros({ ...filtros, cuil: e.target.value })} placeholder="Buscar por CUIL específico" className="emisivos-input" />
                {isCuilActive && <p className="emisivos-filter-hint">Los demás filtros están desactivados</p>}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="emisivos-main">
            <div className="emisivos-form-container">
              {/* Canales */}
              <div className="emisivos-channels">
                <h3 className="emisivos-channels-title">Canales de Envío</h3>
                <div className="emisivos-channels-grid">
                  {(['email', 'push', 'whatsapp'] as const).map(canal => (
                    <div key={canal} className="emisivos-channel-item">
                      <label className="emisivos-switch-label">
                        <span className="emisivos-channel-name">{{ email: 'Email', push: 'Notificación Push', whatsapp: 'WhatsApp' }[canal]}</span>
                        <div className="emisivos-switch-container">
                          <input type="checkbox" checked={form.canales[canal]} onChange={() => handleCanalToggle(canal)} className="emisivos-switch-input" />
                          <span className="emisivos-switch-slider"></span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nombre de la Notificación — siempre visible cuando no hay CUIL */}
              {!isCuilActive && (
                <div className="emisivos-days-section">
                  <div className="emisivos-form-group">
                    <label className="emisivos-label">
                      Nombre de la Notificación <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="emisivos-input"
                      placeholder="Ej: Campaña deuda Enero 2026"
                      value={form.nombreNotificacion}
                      onChange={(e) => setForm(prev => ({ ...prev, nombreNotificacion: e.target.value }))}
                    />
                    <p className="emisivos-form-hint">Este nombre identificará el envío en el historial de notificaciones masivas.</p>
                  </div>
                </div>
              )}

              {/* Días de Envío */}
              <div className={`emisivos-days-section ${isCuilActive ? 'emisivos-days-disabled' : ''}`}>
                <div className="emisivos-days-header">
                  <h3 className="emisivos-days-title">Días de Envío</h3>
                  {form.diasDeEnvio.length > 0 && !isCuilActive && (
                    <button className="emisivos-days-clear-btn" onClick={() => setForm(prev => ({ ...prev, diasDeEnvio: [] }))}>
                      Limpiar selección
                    </button>
                  )}
                </div>

                {isCuilActive && (
                  <p className="emisivos-filter-hint" style={{ marginBottom: '0.75rem' }}>
                    Los días de envío no están disponibles para búsqueda por CUIL
                  </p>
                )}

                <div className="emisivos-days-grid">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                    <button
                      key={dia}
                      className={`emisivos-day-btn ${form.diasDeEnvio.includes(dia) ? 'active' : ''}`}
                      onClick={() => !isCuilActive && handleDiaToggle(dia)}
                    >
                      {dia}
                    </button>
                  ))}
                </div>

                <div className={`emisivos-days-status ${form.diasDeEnvio.length === 0 ? 'inmediato' : 'programado'}`}>
                  <span className="emisivos-days-status-dot" />
                  {form.diasDeEnvio.length === 0
                    ? 'Sin días seleccionados → envío inmediato'
                    : `Días seleccionados: ${form.diasDeEnvio.join(', ')}`}
                </div>
              </div>

              {/* Formulario */}
              <div className="emisivos-form">
                <h3 className="emisivos-form-title">Contenido del Mensaje</h3>

                <div className="emisivos-form-group">
                  <label className="emisivos-label">Plantilla</label>
                  <select value={form.plantilla} onChange={(e) => setForm({ ...form, plantilla: e.target.value })} className="emisivos-select">
                    {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {isPlantillaSelected && <p className="emisivos-form-hint">Plantilla seleccionada. El campo Cuerpo y Título están desactivados.</p>}
                </div>

                <div className="emisivos-form-group">
                  <label className="emisivos-label">Título</label>
                  <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ingrese el título del mensaje" className={`emisivos-input ${isPlantillaSelected ? 'emisivos-disabled' : ''}`} disabled={isPlantillaSelected} />
                </div>

                <div className="emisivos-form-group">
                  <label className="emisivos-label">Cuerpo del Mensaje</label>
                  <textarea value={form.cuerpo} onChange={(e) => setForm({ ...form, cuerpo: e.target.value })} placeholder={isPlantillaSelected ? "Contenido de la plantilla" : "Escriba el contenido del mensaje..."} className={`emisivos-textarea ${isPlantillaSelected ? 'emisivos-disabled' : ''}`} disabled={isPlantillaSelected} rows={8} />
                </div>

                <div className="emisivos-form-actions">
                  <button onClick={handleEnviar} className="emisivos-button-send" disabled={isLoading}>
                    <FaPaperPlane className="emisivos-button-icon" />
                    {isLoading ? 'Enviando...' : 'Enviar Notificación'}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && pendingPayload && (
        <ConfirmacionModal
          payload={pendingPayload}
          onConfirmar={handleConfirmar}
          onCancelar={() => { setShowModal(false); setPendingPayload(null); }}
        />
      )}

      {/* Toast */}
      {showToast && (
        <div className={`emisivos-toast ${toastType === 'success' ? 'emisivos-toast-success' : 'emisivos-toast-error'}`}>
          <div className="emisivos-toast-content">
            {toastType === 'success' ? <FaCheckCircle className="emisivos-toast-icon" /> : <FaTimesCircle className="emisivos-toast-icon" />}
            <span className="emisivos-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearNotificaciones;
