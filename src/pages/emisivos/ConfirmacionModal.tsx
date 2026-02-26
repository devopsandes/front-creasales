// ConfirmacionModal.tsx

import { FaPaperPlane, FaTimes, FaEnvelope, FaBell, FaWhatsapp, FaUser, FaFilter, FaFileAlt, FaCalendarAlt } from "react-icons/fa";
import './ConfirmacionModal.css';

interface ConfirmacionModalProps {
  payload: Record<string, unknown>;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const plantillasNombres: Record<string, string> = {
  "0": "Sin plantilla",
  "1": "Bienvenida-ADH",
  "2": "Bienvenida-MON",
  "3": "Bienvenida-REL",
  "4": "Deuda-Utilidad",
  "5": "Deuda",
  "6": "Pre-Alta-ADH",
  "7": "Pre-Alta-REL",
  "8": "Prevencion-Estafas",
  "9": "Referidos",
};

const ConfirmacionModal = ({ payload, onConfirmar, onCancelar }: ConfirmacionModalProps) => {

  const canales = [
    payload.correo === 1 && { icon: <FaEnvelope />, label: 'Email', cls: 'canal-email' },
    payload.push === 1 && { icon: <FaBell />, label: 'Push', cls: 'canal-push' },
    payload.mensaje === 1 && { icon: <FaWhatsapp />, label: 'WhatsApp', cls: 'canal-whatsapp' },
  ].filter(Boolean) as { icon: JSX.Element; label: string; cls: string }[];

  const provincias = Array.isArray(payload.filtroProvincia) && (payload.filtroProvincia as string[]).length > 0
    ? (payload.filtroProvincia as string[]).join(', ')
    : 'Todas';

  const planes = Array.isArray(payload.filtroPlan) && (payload.filtroPlan as string[]).length > 0
    ? (payload.filtroPlan as string[]).join(', ')
    : null;

  const plantillaNombre = plantillasNombres[String(payload.plantillaId)] || `ID ${payload.plantillaId}`;
  const tieneContenidoManual = !payload.plantillaId || payload.plantillaId === "0" || payload.plantillaId === 0;
  const esCuil = typeof payload.cuil === 'string' && (payload.cuil as string).trim().length > 0;

  const diasDeEnvio = Array.isArray(payload.diasDeEnvio) ? payload.diasDeEnvio as number[] : [];
  const envioLabel = diasDeEnvio.length === 0
    ? 'Inmediato (una sola vez)'
    : `Días del mes: ${diasDeEnvio.join(', ')}`;

  const filtrosActivos = [
    planes && { label: 'Plan', val: planes },
    !esCuil && payload.filtroEstadoDelCliente && { label: 'Estado cliente', val: payload.filtroEstadoDelCliente as string },
    payload.filtroCategoriaCliente !== 'todas' && { label: 'Categoría cliente', val: payload.filtroCategoriaCliente as string },
    payload.filtroCategoriaAndes !== 'todas' && { label: 'Categoría Andes', val: payload.filtroCategoriaAndes as string },
    payload.filtroTipoConsumidor !== 'todos' && { label: 'Tipo consumidor', val: payload.filtroTipoConsumidor as string },
    payload.filtroObraSocial !== 'todas' && { label: 'Obra social', val: payload.filtroObraSocial as string },
    payload.filtroTipoDePago !== 'todos los medios de pago' && { label: 'Tipo de pago', val: payload.filtroTipoDePago as string },
    payload.filtroMontoInferior && { label: 'Monto inferior', val: `$${payload.filtroMontoInferior}` },
    payload.filtroMontoSuperior && { label: 'Monto superior', val: `$${payload.filtroMontoSuperior}` },
    payload.filtroPeriodoAdeudado && { label: 'Período adeudado', val: payload.filtroPeriodoAdeudado as string },
  ].filter(Boolean) as { label: string; val: string }[];

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <FaPaperPlane />
            </div>
            <div>
              <h2 className="modal-title">Confirmación de envío</h2>
              <p className="modal-subtitle">Revisá los datos antes de enviar</p>
            </div>
          </div>
          <button className="modal-close" onClick={onCancelar}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">

          {/* Canales */}
          <div className="modal-section">
            <div className="modal-section-title">
              <FaBell className="modal-section-icon" />
              Canales de envío
            </div>
            <div className="modal-canales">
              {canales.length > 0
                ? canales.map(c => (
                  <span key={c.label} className={`modal-canal-badge ${c.cls}`}>
                    {c.icon} {c.label}
                  </span>
                ))
                : <span className="modal-empty">Ninguno seleccionado</span>}
            </div>
          </div>

          {/* Destinatario */}
          <div className="modal-section">
            <div className="modal-section-title">
              <FaUser className="modal-section-icon" />
              Destinatario
            </div>
            {esCuil ? (
              <div className="modal-row">
                <span className="modal-row-label">CUIL específico</span>
                <span className="modal-row-val modal-cuil">{payload.cuil as string}</span>
              </div>
            ) : (
              <div className="modal-row">
                <span className="modal-row-label">Provincias</span>
                <span className="modal-row-val">{provincias}</span>
              </div>
            )}
          </div>

          {/* Filtros — solo si no es CUIL y hay filtros activos */}
          {!esCuil && filtrosActivos.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">
                <FaFilter className="modal-section-icon" />
                Filtros aplicados
              </div>
              <div className="modal-filtros-grid">
                {filtrosActivos.map(f => (
                  <div key={f.label} className="modal-row">
                    <span className="modal-row-label">{f.label}</span>
                    <span className="modal-row-val">{f.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido */}
          <div className="modal-section">
            <div className="modal-section-title">
              <FaFileAlt className="modal-section-icon" />
              Contenido
            </div>
            {tieneContenidoManual ? (
              <>
                {payload.titulo && (
                  <div className="modal-row">
                    <span className="modal-row-label">Título</span>
                    <span className="modal-row-val">{payload.titulo as string}</span>
                  </div>
                )}
                {payload.cuerpo && (
                  <div className="modal-row modal-row-cuerpo">
                    <span className="modal-row-label">Cuerpo</span>
                    <span className="modal-row-val modal-cuerpo-text">{payload.cuerpo as string}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="modal-row">
                <span className="modal-row-label">Plantilla</span>
                <span className="modal-row-val">
                  <span className="modal-plantilla-badge">{plantillaNombre}</span>
                </span>
              </div>
            )}
          </div>

          {/* Programación */}
          <div className="modal-section">
            <div className="modal-section-title">
              <FaCalendarAlt className="modal-section-icon" />
              Programación
            </div>
            <div className="modal-row">
              <span className="modal-row-label">Envío</span>
              <span className={`modal-row-val ${diasDeEnvio.length === 0 ? 'modal-envio-inmediato' : ''}`}>
                {envioLabel}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn-cancelar" onClick={onCancelar}>
            <FaTimes /> Cancelar
          </button>
          <button className="modal-btn-confirmar" onClick={onConfirmar}>
            <FaPaperPlane /> Confirmar envío
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmacionModal;