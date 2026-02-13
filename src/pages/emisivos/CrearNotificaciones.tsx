import { useState } from "react";
import { FaPaperPlane, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import './CrearNotificaciones.css';

interface EmisivoForm {
  titulo: string;
  plantilla: string;
  cuerpo: string;
  canales: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  periodicidad: number;
  reiterancia: number;
}

interface Filtros {
  plan: string;
  provincias: {
    todas: boolean;
    mendoza: boolean;
    sanJuan: boolean;
    cordoba: boolean;
    sanLuis: boolean;
    laRioja: boolean;
  };
  estadoCliente: string;
  categoriaCliente: string;
  categoriaAndes: string,
  tipoConsumidor: string,
  obraSocial: string;
  tipoDePago: string;
  montoInferior: string;
  montoSuperior: string;
  periodoAdeudado: string;
  cuil: string;
}

const Notificaciones = () => {
  const [form, setForm] = useState<EmisivoForm>({
    titulo: "",
    plantilla: "",
    cuerpo: "",
    canales: {
      email: false,
      push: false,
      whatsapp: false,
    },
    periodicidad: 0,
    reiterancia: 1,
  });

  const [filtros, setFiltros] = useState<Filtros>({
    plan: "todos",
    provincias: {
      todas: true,
      mendoza: false,
      sanJuan: false,
      cordoba: false,
      sanLuis: false,
      laRioja: false,
    },
    estadoCliente: "alta",
    cuil: "",
    categoriaCliente: "todas",
    categoriaAndes: "todas",
    tipoConsumidor: "todos",
    tipoDePago: "todos los medios de pago",
    obraSocial: "todas",
    montoInferior: "",
    montoSuperior: "",
    periodoAdeudado: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Plantillas
  const plantillas = [
    { id: 0, nombre: "Sin plantilla" },
    { id: 1, nombre: "Bienvenida-ADH" },
    { id: 2, nombre: "Bienvenida-MON" },
    { id: 3, nombre: "Bienvenida-REL" }, // que la persona tenga saldo y que este de alta 
    { id: 4, nombre: "Deuda-Utilidad" },
    { id: 5, nombre: "Deuda" },
    { id: 6, nombre: "Pre-Alta-ADH" }, // que la persona este de baja, tipo estado: esperando alta a la os (obra social)
    { id: 7, nombre: "Pre-Alta-REL" },
    { id: 8, nombre: "Prevencion-Estafas" },
    { id: 9, nombre: "Referidos" },
    // { id: 10, nombre: "Pago-Recibido" },
  ];

  const planesOptions = [
    { value: "todos", label: "Todos" },
    { value: "TITANIUM", label: "Titanium" },
    { value: "TITANIUM PLUS C/C", label: "Titanium Plus C/C" },
    { value: "TITANIUM PLUS S/C", label: "Titanium Plus S/C" },
    { value: "BLACK", label: "Black" },
    { value: "PLATINUM", label: "Platinum" },
    { value: "GOLD", label: "Gold" },
    { value: "PMO", label: "Pmo" },
  ];

  const estadosOptions = [
    { value: "ambos", label: "Ambos" },
    { value: "ALTA", label: "Alta" },
    { value: "BAJA", label: "Baja" },
  ];

  const categoriaClienteOptions = [
    { value: "todas", label: "Todas las categorias" },
    { value: "MONOTRIBUTO", label: "Monotributo" },
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
    { value: "todas", label: "Todas" },
    { value: "S/D", label: "S/D" },
    { value: "OSPOCE", label: "OSPOCE" },
    { value: "OSCEARA", label: "OSCEARA" },
    { value: "OSCICA", label: "OSCICA" },
    { value: "OSMEDICA", label: "OSMEDICA" },
    { value: "OSPAVIAL", label: "OSPAVIAL" },
    { value: "ANDES SALUD", label: "ANDES SALUD" },
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
      if (parts.length > 1) {
        setFiltros({
          ...filtros,
          montoInferior: `${parts[0]},${parts[1].substring(0, 2)}`,
        });
      } else {
        setFiltros({
          ...filtros,
          montoInferior: sanitized,
        });
      }
    }
  };

  const handleMontoSuperiorChange = (value: string) => {
    const sanitized = value.replace(/[^\d.,]/g, '');
    const parts = sanitized.split(/[.,]/);
    if (parts[0].length <= 8) {
      if (parts.length > 1) {
        setFiltros({
          ...filtros,
          montoSuperior: `${parts[0]},${parts[1].substring(0, 2)}`,
        });
      } else {
        setFiltros({
          ...filtros,
          montoSuperior: sanitized,
        });
      }
    }
  };

  const handlePeriodoChange = (value: string) => {
    // Convierte 2026-02 a 202602
    const periodoFormateado = value.replace('-', '');
    setFiltros({
      ...filtros,
      periodoAdeudado: periodoFormateado,
    });
  };

  const handleCanalToggle = (canal: 'email' | 'push' | 'whatsapp') => {
    setForm({
      ...form,
      canales: {
        ...form.canales,
        [canal]: !form.canales[canal],
      },
    });
  };

  const handlePlantillaChange = (plantillaId: string) => {
    setForm({
      ...form,
      plantilla: plantillaId,
    });
  };

  const handleProvinciaChange = (provincia: keyof typeof filtros.provincias) => {
    if (provincia === 'todas') {
      setFiltros({
        ...filtros,
        provincias: {
          todas: true,
          mendoza: false,
          sanJuan: false,
          cordoba: false,
          sanLuis: false,
          laRioja: false,
        },
      });
    } else {
      setFiltros({
        ...filtros,
        provincias: {
          ...filtros.provincias,
          todas: false,
          [provincia]: !filtros.provincias[provincia],
        },
      });
    }
  };

  const handleCuilChange = (value: string) => {
    setFiltros({
      ...filtros,
      cuil: value,
    });
  };

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleEnviar = async () => {
    // Validaciones
    if (isCuilActive && !filtros.cuil.trim()) {
      showToastMessage('error', 'Por favor, ingrese un CUIL');
      return;
    }

    if (!form.canales.email && !form.canales.push && !form.canales.whatsapp) {
      showToastMessage('error', 'Debe seleccionar al menos un canal de envío');
      return;
    }

    if ((!form.plantilla || form.plantilla === "0") &&
      (!form.titulo || form.titulo.trim() === "") &&
      (!form.cuerpo || form.cuerpo.trim() === "")) {
      showToastMessage('error', 'Debe seleccionar una plantilla');
      return;
    }

    // Construcción del payload
    const payload = {
      // Filtros (siempre se envían, aunque haya CUIL)
      filtroPlan: filtros.plan,
      // Convertir objeto de provincias a array
      filtroProvincia: filtros.provincias.todas
        ? [] // Si "todas" está marcado, enviar array vacío (asi el backend no filtra por provincia)
        : (Object.keys(filtros.provincias) as Array<keyof typeof filtros.provincias>)
          .filter(key => key !== 'todas' && filtros.provincias[key])
          .map(key => {
            // Convertir camelCase a formato con espacios y minúsculas
            const nombres = {
              todas: 'todas',
              mendoza: 'mendoza',
              sanJuan: 'san juan',
              cordoba: 'cordoba',
              sanLuis: 'san luis',
              laRioja: 'la rioja'
            };
            return nombres[key];
          }),
      filtroEstadoDelCliente: filtros.estadoCliente,
      filtroCategoriaCliente: filtros.categoriaCliente,
      filtroCategoriaAndes: filtros.categoriaAndes,
      filtroTipoConsumidor: filtros.tipoConsumidor,
      filtroObraSocial: filtros.obraSocial,
      filtroTipoDePago: filtros.tipoDePago,
      filtroMontoInferior: filtros.montoInferior,
      filtroMontoSuperior: filtros.montoSuperior,
      filtroPeriodoAdeudado: filtros.periodoAdeudado,

      // CUIL (si existe, el backend lo prioriza)
      cuil: filtros.cuil.trim(),

      // Contenido
      titulo: (form.plantilla && form.plantilla !== "0") ? null : form.titulo,
      cuerpo: (form.plantilla && form.plantilla !== "0") ? null : form.cuerpo,
      plantillaId: form.plantilla,

      // Canales
      mensaje: form.canales.whatsapp ? 1 : 0,
      correo: form.canales.email ? 1 : 0,
      push: form.canales.push ? 1 : 0,

      // Nuevos campos: Periodicidad y Reiterancia
      periodicidad: form.periodicidad,
      reiterancia: form.reiterancia,
    };

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || '';

      const response = await fetch('https://emisivos.createch.com.ar/notificaciones/enviarNotificacionesMasivas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        showToastMessage('success', data.meta?.message || '¡Notificación enviada exitosamente!');

        // Reset del formulario
        setForm({
          titulo: "",
          plantilla: "",
          cuerpo: "",
          canales: {
            email: false,
            push: false,
            whatsapp: false,
          },
          periodicidad: 0,
          reiterancia: 1,
        });

        // Reset del CUIL
        setFiltros({
          ...filtros,
          cuil: "",
          montoInferior: "",
          montoSuperior: "",
        });
      } else {
        showToastMessage('error', data.meta?.message || 'Error al enviar la notificación');
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      showToastMessage('error', 'Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isCuilActive = filtros.cuil.trim().length > 0;
  const isPlantillaSelected = form.plantilla !== "" && form.plantilla !== "0";

  return (
    <div className="emisivos-wrapper">
      {/* Header */}
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
              {/* Plan */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Plan</label>
                <select
                  value={filtros.plan}
                  onChange={(e) => setFiltros({ ...filtros, plan: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {planesOptions.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provincia */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Provincia</label>
                <div className="emisivos-checkbox-group">
                  <label className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filtros.provincias.todas}
                      onChange={() => handleProvinciaChange('todas')}
                      disabled={isCuilActive}
                      className="emisivos-checkbox"
                    />
                    <span>Todas</span>
                  </label>
                  <label className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filtros.provincias.mendoza}
                      onChange={() => handleProvinciaChange('mendoza')}
                      disabled={isCuilActive}
                      className="emisivos-checkbox"
                    />
                    <span>Mendoza</span>
                  </label>
                  <label className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filtros.provincias.sanJuan}
                      onChange={() => handleProvinciaChange('sanJuan')}
                      disabled={isCuilActive}
                      className="emisivos-checkbox"
                    />
                    <span>San Juan</span>
                  </label>
                  <label className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filtros.provincias.cordoba}
                      onChange={() => handleProvinciaChange('cordoba')}
                      disabled={isCuilActive}
                      className="emisivos-checkbox"
                    />
                    <span>Cordoba</span>
                  </label>
                  <label className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filtros.provincias.sanLuis}
                      onChange={() => handleProvinciaChange('sanLuis')}
                      disabled={isCuilActive}
                      className="emisivos-checkbox"
                    />
                    <span>San Luis</span>
                  </label>
                  <label className={`emisivos-checkbox-label ${isCuilActive ? 'emisivos-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filtros.provincias.laRioja}
                      onChange={() => handleProvinciaChange('laRioja')}
                      disabled={isCuilActive}
                      className="emisivos-checkbox"
                    />
                    <span>La Rioja</span>
                  </label>
                </div>
              </div>

              {/* Estado del Cliente */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Estado del Cliente</label>
                <select
                  value={filtros.estadoCliente}
                  onChange={(e) => setFiltros({ ...filtros, estadoCliente: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {estadosOptions.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria del cliente */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Categoria del Cliente</label>
                <select
                  value={filtros.categoriaCliente}
                  onChange={(e) => setFiltros({ ...filtros, categoriaCliente: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {categoriaClienteOptions.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* CategoriaAndes */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Categoria Andes Salud</label>
                <select
                  value={filtros.categoriaAndes}
                  onChange={(e) => setFiltros({ ...filtros, categoriaAndes: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {categoriaAndesOptions.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipoconsumidor */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Tipo de Consumidor</label>
                <select
                  value={filtros.tipoConsumidor}
                  onChange={(e) => setFiltros({ ...filtros, tipoConsumidor: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {tipoConsumidorOptions.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Obra Social */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Obra Social del Cliente</label>
                <select
                  value={filtros.obraSocial}
                  onChange={(e) => setFiltros({ ...filtros, obraSocial: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {obraSocialOptions.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de pago */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Tipo de pago del Cliente</label>
                <select
                  value={filtros.tipoDePago}
                  onChange={(e) => setFiltros({ ...filtros, tipoDePago: e.target.value })}
                  className={`emisivos-select ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                >
                  {tipoDePagoOptions.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto Adeudado Total - con dos inputs internos */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Monto Adeudado Total</label>

                {/* Grid de dos columnas para los montos */}
                <div className="emisivos-monto-grid">
                  {/* Monto Inferior */}
                  <div className="emisivos-monto-item">
                    <label className="emisivos-monto-sublabel">Monto Inferior</label>
                    <div className="emisivos-input-currency-wrapper">
                      <span className="emisivos-currency-symbol">$</span>
                      <input
                        type="text"
                        value={filtros.montoInferior}
                        onChange={(e) => handleMontoInferiorChange(e.target.value)}
                        placeholder="0,00"
                        className={`emisivos-input-currency ${isCuilActive ? 'emisivos-disabled' : ''}`}
                        disabled={isCuilActive}
                      />
                    </div>
                  </div>

                  {/* Monto Superior */}
                  <div className="emisivos-monto-item">
                    <label className="emisivos-monto-sublabel">Monto Superior</label>
                    <div className="emisivos-input-currency-wrapper">
                      <span className="emisivos-currency-symbol">$</span>
                      <input
                        type="text"
                        value={filtros.montoSuperior}
                        onChange={(e) => handleMontoSuperiorChange(e.target.value)}
                        placeholder="0,00"
                        className={`emisivos-input-currency ${isCuilActive ? 'emisivos-disabled' : ''}`}
                        disabled={isCuilActive}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Periodo Adeudado */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">Periodo Adeudado</label>
                <input
                  type="month"
                  value={filtros.periodoAdeudado ? `${filtros.periodoAdeudado.substring(0, 4)}-${filtros.periodoAdeudado.substring(4, 6)}` : ''}
                  onChange={(e) => handlePeriodoChange(e.target.value)}
                  className={`emisivos-input ${isCuilActive ? 'emisivos-disabled' : ''}`}
                  disabled={isCuilActive}
                />
              </div>

              {/* CUIL */}
              <div className="emisivos-filter-group">
                <label className="emisivos-filter-label">CUIL</label>
                <input
                  type="text"
                  value={filtros.cuil}
                  onChange={(e) => handleCuilChange(e.target.value)}
                  placeholder="Buscar por CUIL específico"
                  className="emisivos-input"
                />
                {isCuilActive && (
                  <p className="emisivos-filter-hint">
                    Los demás filtros están desactivados
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - Formulario */}
          <main className="emisivos-main">
            <div className="emisivos-form-container">
              {/* Switches de Canales */}
              <div className="emisivos-channels">
                <h3 className="emisivos-channels-title">Canales de Envío</h3>
                <div className="emisivos-channels-grid">
                  <div className="emisivos-channel-item">
                    <label className="emisivos-switch-label">
                      <span className="emisivos-channel-name">Email</span>
                      <div className="emisivos-switch-container">
                        <input
                          type="checkbox"
                          checked={form.canales.email}
                          onChange={() => handleCanalToggle('email')}
                          className="emisivos-switch-input"
                        />
                        <span className="emisivos-switch-slider"></span>
                      </div>
                    </label>
                  </div>

                  <div className="emisivos-channel-item">
                    <label className="emisivos-switch-label">
                      <span className="emisivos-channel-name">Notificación Push</span>
                      <div className="emisivos-switch-container">
                        <input
                          type="checkbox"
                          checked={form.canales.push}
                          onChange={() => handleCanalToggle('push')}
                          className="emisivos-switch-input"
                        />
                        <span className="emisivos-switch-slider"></span>
                      </div>
                    </label>
                  </div>

                  <div className="emisivos-channel-item">
                    <label className="emisivos-switch-label">
                      <span className="emisivos-channel-name">WhatsApp</span>
                      <div className="emisivos-switch-container">
                        <input
                          type="checkbox"
                          checked={form.canales.whatsapp}
                          onChange={() => handleCanalToggle('whatsapp')}
                          className="emisivos-switch-input"
                        />
                        <span className="emisivos-switch-slider"></span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sliders de Periodicidad y Reiterancia */}
              <div className="emisivos-sliders-section">
                <h3 className="emisivos-sliders-title">Configuración de Envío</h3>
                <div className="emisivos-sliders-grid">

                  {/* Periodicidad */}
                  <div className="emisivos-slider-group">
                    <label className="emisivos-slider-label">Periodicidad</label>
                    <div className="emisivos-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="28"
                        value={form.periodicidad}
                        onChange={(e) => setForm({ ...form, periodicidad: parseInt(e.target.value) })}
                        className="emisivos-slider"
                      />
                      <div className="emisivos-slider-value">{form.periodicidad}</div>
                    </div>
                    <div className="emisivos-slider-limits">
                      <span>0</span>
                      <span>28</span>
                    </div>
                    <p className="emisivos-slider-hint">
                      {form.periodicidad === 0
                        ? 'En el cero, Periodicidad y Reiterancia no tienen efecto'
                        : `En este caso se enviaría desde el ${form.periodicidad} al 28 todos los meses`}
                    </p>
                  </div>

                  {/* Reiterancia */}
                  <div className={`emisivos-slider-group ${form.periodicidad === 0 ? 'emisivos-slider-disabled' : ''}`}>
                    <label className="emisivos-slider-label">Reiterancia</label>
                    <div className="emisivos-slider-container">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={form.reiterancia}
                        disabled={form.periodicidad === 0}
                        onChange={(e) => setForm({ ...form, reiterancia: parseInt(e.target.value) })}
                        className="emisivos-slider"
                      />
                      <div className="emisivos-slider-value">{form.reiterancia}</div>
                    </div>
                    <div className="emisivos-slider-limits">
                      <span>1</span>
                      <span>10</span>
                    </div>
                    <p className="emisivos-slider-hint">
                      Se enviará {form.reiterancia} {form.reiterancia === 1 ? 'vez' : 'veces'} al mes
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de Notificación */}
              <div className="emisivos-form">
                <h3 className="emisivos-form-title">Contenido del Mensaje</h3>

                {/* Plantilla */}
                <div className="emisivos-form-group">
                  <label className="emisivos-label">Plantilla</label>
                  <select
                    value={form.plantilla}
                    onChange={(e) => handlePlantillaChange(e.target.value)}
                    className="emisivos-select"
                  >
                    {plantillas.map((plantilla) => (
                      <option key={plantilla.id} value={plantilla.id}>
                        {plantilla.nombre}
                      </option>
                    ))}
                  </select>
                  {isPlantillaSelected && (
                    <p className="emisivos-form-hint">
                      Plantilla seleccionada. El campo Cuerpo y Título están desactivados.
                    </p>
                  )}
                </div>

                {/* Título */}
                <div className="emisivos-form-group">
                  <label className="emisivos-label">Título</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ingrese el título del mensaje"
                    className={`emisivos-input ${isPlantillaSelected ? 'emisivos-disabled' : ''}`}
                    disabled={isPlantillaSelected}
                  />
                </div>

                {/* Cuerpo */}
                <div className="emisivos-form-group">
                  <label className="emisivos-label">Cuerpo del Mensaje</label>
                  <textarea
                    value={form.cuerpo}
                    onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
                    placeholder={isPlantillaSelected ? "Contenido de la plantilla" : "Escriba el contenido del mensaje..."}
                    className={`emisivos-textarea ${isPlantillaSelected ? 'emisivos-disabled' : ''}`}
                    disabled={isPlantillaSelected}
                    rows={8}
                  />
                </div>

                {/* Botón de Envío */}
                <div className="emisivos-form-actions">
                  <button
                    onClick={handleEnviar}
                    className="emisivos-button-send"
                    disabled={isLoading}
                  >
                    <FaPaperPlane className="emisivos-button-icon" />
                    {isLoading ? 'Enviando...' : 'Enviar Notificación'}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`emisivos-toast ${toastType === 'success' ? 'emisivos-toast-success' : 'emisivos-toast-error'}`}>
          <div className="emisivos-toast-content">
            {toastType === 'success' ? (
              <FaCheckCircle className="emisivos-toast-icon" />
            ) : (
              <FaTimesCircle className="emisivos-toast-icon" />
            )}
            <span className="emisivos-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
