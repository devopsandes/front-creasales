// VerNotificaciones.tsx

import { useState, useEffect, useCallback } from "react";
import { FaEye, FaTrash, FaCheckCircle, FaTimesCircle, FaSearch, FaBell, FaEnvelope, FaWhatsapp, FaSync } from "react-icons/fa";
import './VerNotificaciones.css';

interface Destino {
  email?: string;
  push?: string;
  whatsapp?: string;
}

interface Notificacion {
  id: number;
  cuil: string | null;
  destino: Destino;
  tipo: string;
  estado: string;
  flagMensaje: boolean;
  flagCorreo: boolean;
  flagPush: boolean;
  diasDeEnvio: number[] | null;
  plantillaId: number | null;
  datosPlantilla: Record<string, unknown> | null;
  filtrosUtilizados: Record<string, unknown> | null;
  motivoError: string | null;
  origenError: string | null;
  detalleError: string | null;
  clienteId: number;
  notificacionMasivaId: number | null;
  notificacionMasivaNombre: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  status: string;
  data: Notificacion[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    message?: string;
  };
}

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  'EN_PROCESO': { label: 'En Proceso', cls: 'ver-notif-badge-info' },
  'ERROR': { label: 'Error', cls: 'ver-notif-badge-error' },
  'ENVIADA': { label: 'Enviada', cls: 'ver-notif-badge-success' },
  'FRECUENTE': { label: 'Frecuente', cls: 'ver-notif-badge-purple' },
  'FREC_ENCOLADA': { label: 'Frec. Encolada', cls: 'ver-notif-badge-warning' },
  'ANULADA': { label: 'Anulada', cls: 'ver-notif-badge-anulada' },
};

const VerNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filtroCuil, setFiltroCuil] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const [filtroId, setFiltroId] = useState("");

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const fetchNotificaciones = useCallback(async (currentPage = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
        ...(filtroId.trim() && { id: filtroId.trim() }),
        ...(filtroEstado !== 'Todos' && { estado: filtroEstado }),
        ...(filtroCuil.trim() && { cuil: filtroCuil.trim() }),
      });

      const response = await fetch(
        `https://emisivos.createch.com.ar/notificaciones/listar?${params}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const data: ApiResponse = await response.json();
      if (data.status === 'success') {
        setNotificaciones(data.data || []);
        setTotalPages(data.meta?.totalPages ?? 1);
        setTotalItems(data.meta?.total ?? 0);
        setPage(currentPage);
        setExpandedRow(null);
      } else {
        throw new Error(data.meta?.message || 'Error al obtener las notificaciones');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setError(msg);
      showToastMessage('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [filtroEstado, filtroCuil, filtroId]);

  // Re-fetch desde página 1 cuando cambian los filtros
  useEffect(() => {
    fetchNotificaciones(1);
  }, [filtroEstado, filtroCuil, filtroId]);

  const handleAnular = async (id: number, tipo: string) => {
    if (!window.confirm(`¿Estás seguro de anular la notificación "${tipo}"?`)) return;
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`https://emisivos.createch.com.ar/notificaciones/${id}/anular`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al anular');
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, estado: 'ANULADA' } : n)
      );
      showToastMessage('success', `Notificación #${id} anulada`);
    } catch {
      showToastMessage('error', 'No se pudo anular la notificación');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getEstado = (estado: string) =>
    ESTADO_CONFIG[estado] ?? { label: estado, cls: 'ver-notif-badge-default' };

  return (
    <div className="ver-notif-wrapper">
      <div className="ver-notif-header">
        <h2 className="ver-notif-header-title">Notificaciones Creadas</h2>
        <p className="ver-notif-header-description">
          Visualice y gestione todas las notificaciones del sistema. Revise el estado,
          los canales configurados, plantillas asociadas y días de envío programados.
        </p>
      </div>

      <div className="ver-notif-container">

        {/* Filtros */}
        <div className="ver-notif-filters">
          <div className="ver-notif-filter-group">
            <label className="ver-notif-filter-label">
              <FaSearch className="ver-notif-filter-icon" />
              Buscar por CUIL
            </label>
            <input
              type="text"
              value={filtroCuil}
              onChange={(e) => setFiltroCuil(e.target.value)}
              placeholder="Ingrese CUIL..."
              className="ver-notif-filter-input"
            />
          </div>
          <div className="ver-notif-filter-group">
            <label className="ver-notif-filter-label">
              <FaSearch className="ver-notif-filter-icon" />
              Buscar por ID
            </label>
            <input
              type="number"
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
              placeholder="Ingrese ID..."
              className="ver-notif-filter-input"
            />
          </div>
          <div className="ver-notif-filter-group">
            <label className="ver-notif-filter-label">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="ver-notif-filter-select"
            >
              <option value="Todos">Todos</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="ENVIADA">Enviada</option>
              <option value="ERROR">Error</option>
              <option value="FRECUENTE">Frecuente</option>
              <option value="FREC_ENCOLADA">Frec. Encolada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div className="ver-notif-filter-group ver-notif-filter-actions">
            <button onClick={() => fetchNotificaciones(page)} className="ver-notif-btn-refresh" disabled={isLoading}>
              <FaSync className={isLoading ? 'spinning' : ''} />
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="ver-notif-loading">
            <div className="ver-notif-spinner" />
            <span>Cargando notificaciones...</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="ver-notif-error-banner">
            <FaTimesCircle />
            <span>{error}</span>
            <button onClick={() => fetchNotificaciones(page)} className="ver-notif-retry-btn">Reintentar</button>
          </div>
        )}

        {/* Tabla */}
        {!isLoading && !error && (
          <div className="ver-notif-table-wrapper">
            <table className="ver-notif-table">
              <thead className="ver-notif-table-header">
                <tr>
                  <th className="ver-notif-table-header-cell">ID</th>
                  <th className="ver-notif-table-header-cell">CUIL</th>
                  <th className="ver-notif-table-header-cell">Destino</th>
                  <th className="ver-notif-table-header-cell">Tipo</th>
                  <th className="ver-notif-table-header-cell">Estado</th>
                  <th className="ver-notif-table-header-cell ver-notif-table-header-cell-center">Canales</th>
                  <th className="ver-notif-table-header-cell">Plantilla</th>
                  <th className="ver-notif-table-header-cell">Días de Envío</th>
                  <th className="ver-notif-table-header-cell">Notif. Masiva</th>
                  <th className="ver-notif-table-header-cell">Creada</th>
                  <th className="ver-notif-table-header-cell ver-notif-table-header-cell-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notificaciones.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="ver-notif-empty">
                      No se encontraron notificaciones
                    </td>
                  </tr>
                ) : notificaciones.map((notif) => {
                  const estadoCfg = getEstado(notif.estado);
                  const isExpanded = expandedRow === notif.id;
                  return (
                    <>
                      <tr key={notif.id} className={`ver-notif-table-row ${isExpanded ? 'ver-notif-row-expanded' : ''}`}>

                        <td className="ver-notif-table-cell ver-notif-table-cell-id">#{notif.id}</td>

                        <td className="ver-notif-table-cell ver-notif-table-cell-cuil">
                          {notif.cuil ?? <span className="ver-notif-sin-dias">—</span>}
                        </td>

                        <td className="ver-notif-table-cell">
                          <div className="ver-notif-destino">
                            {notif.destino.email && (
                              <span className="ver-notif-destino-item" title="Email">
                                <FaEnvelope className="ver-notif-destino-icon destino-email" />
                                <span>{notif.destino.email}</span>
                              </span>
                            )}
                            {notif.destino.push && (
                              <span className="ver-notif-destino-item" title="Push">
                                <FaBell className="ver-notif-destino-icon destino-push" />
                                <span>{notif.destino.push}</span>
                              </span>
                            )}
                            {notif.destino.whatsapp && (
                              <span className="ver-notif-destino-item" title="WhatsApp">
                                <FaWhatsapp className="ver-notif-destino-icon destino-whatsapp" />
                                <span>{notif.destino.whatsapp}</span>
                              </span>
                            )}
                            {!notif.destino.email && !notif.destino.push && !notif.destino.whatsapp && (
                              <span className="ver-notif-sin-dias">—</span>
                            )}
                          </div>
                        </td>

                        <td className="ver-notif-table-cell ver-notif-table-cell-tipo">{notif.tipo}</td>

                        <td className="ver-notif-table-cell">
                          <span className={`ver-notif-badge ${estadoCfg.cls}`}>
                            {estadoCfg.label}
                          </span>
                        </td>

                        <td className="ver-notif-table-cell ver-notif-table-cell-center">
                          <div className="ver-notif-canales-row">
                            <span className={`ver-notif-canal-icon ${notif.flagCorreo ? 'canal-active' : 'canal-inactive'}`} title="Email"><FaEnvelope /></span>
                            <span className={`ver-notif-canal-icon ${notif.flagPush ? 'canal-active' : 'canal-inactive'}`} title="Push"><FaBell /></span>
                            <span className={`ver-notif-canal-icon ${notif.flagMensaje ? 'canal-active' : 'canal-inactive'}`} title="WhatsApp"><FaWhatsapp /></span>
                          </div>
                        </td>

                        <td className="ver-notif-table-cell">
                          {notif.plantillaId
                            ? <span className="ver-notif-plantilla-badge">ID {notif.plantillaId}</span>
                            : <span className="ver-notif-manual-badge">Manual</span>}
                        </td>

                        <td className="ver-notif-table-cell">
                          {notif.diasDeEnvio && notif.diasDeEnvio.length > 0 ? (
                            <div className="ver-notif-dias-container">
                              {notif.diasDeEnvio.map((dia) => (
                                <span key={dia} className="ver-notif-dia-badge">{dia}</span>
                              ))}
                            </div>
                          ) : <span className="ver-notif-sin-dias">—</span>}
                        </td>

                        <td className="ver-notif-table-cell">
                          {notif.notificacionMasivaId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>
                                {notif.notificacionMasivaNombre || '—'}
                              </span>
                              <span className="ver-notif-plantilla-id" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                ID {notif.notificacionMasivaId}
                              </span>
                            </div>
                          ) : (
                            <span className="ver-notif-sin-dias">—</span>
                          )}
                        </td>

                        <td className="ver-notif-table-cell ver-notif-table-cell-fecha">{formatDate(notif.createdAt)}</td>

                        <td className="ver-notif-table-cell ver-notif-table-cell-center">
                          <div className="ver-notif-actions">
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : notif.id)}
                              className={`ver-notif-action-button ver-notif-action-view ${isExpanded ? 'active' : ''}`}
                              title="Ver detalles"
                            ><FaEye /></button>
                            <button
                              onClick={() => handleAnular(notif.id, notif.tipo)}
                              className="ver-notif-action-button ver-notif-action-delete"
                              title="Anular notificación"
                              disabled={notif.estado === 'ANULADA'}
                            ><FaTrash /></button>
                          </div>
                        </td>
                      </tr>

                      {/* Panel expandido */}
                      {isExpanded && (
                        <tr key={`detail-${notif.id}`} className="ver-notif-detail-row">
                          <td colSpan={11}>
                            <div className="ver-notif-detail-panel">
                              <div className="ver-notif-detail-grid">

                                <div className="ver-notif-detail-item">
                                  <span className="ver-notif-detail-label">Cliente ID</span>
                                  <span className="ver-notif-detail-value">#{notif.clienteId}</span>
                                </div>
                                <div className="ver-notif-detail-item">
                                  <span className="ver-notif-detail-label">Última actualización</span>
                                  <span className="ver-notif-detail-value">{formatDate(notif.updatedAt)}</span>
                                </div>
                                <div className="ver-notif-detail-item">
                                  <span className="ver-notif-detail-label">Canales activos</span>
                                  <span className="ver-notif-detail-value">
                                    {[notif.flagCorreo && 'Email', notif.flagPush && 'Push', notif.flagMensaje && 'WhatsApp']
                                      .filter(Boolean).join(', ') || 'Ninguno'}
                                  </span>
                                </div>

                                {/* Error */}
                                {(notif.motivoError || notif.detalleError) && (
                                  <div className="ver-notif-detail-item ver-notif-detail-full ver-notif-detail-error-box">
                                    <span className="ver-notif-detail-label">⚠ Error</span>
                                    {notif.motivoError && (
                                      <div className="ver-notif-dato-row">
                                        <span className="ver-notif-dato-key">Motivo</span>
                                        <span className="ver-notif-dato-val">{notif.motivoError}</span>
                                      </div>
                                    )}
                                    {notif.detalleError && (
                                      <div className="ver-notif-dato-row">
                                        <span className="ver-notif-dato-key">Detalle</span>
                                        <span className="ver-notif-dato-val">{notif.detalleError}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Filtros utilizados */}
                                {notif.filtrosUtilizados && Object.keys(notif.filtrosUtilizados).length > 0 && (
                                  <div className="ver-notif-detail-item ver-notif-detail-full">
                                    <span className="ver-notif-detail-label">Filtros utilizados</span>
                                    <div className="ver-notif-datos-plantilla">
                                      {Object.entries(notif.filtrosUtilizados).map(([key, val]) => (
                                        <div key={key} className="ver-notif-dato-row">
                                          <span className="ver-notif-dato-key">{key}</span>
                                          <span className="ver-notif-dato-val">
                                            {Array.isArray(val)
                                              ? (val as unknown[]).join(', ') || '—'
                                              : String(val ?? '—')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Datos de plantilla */}
                                {notif.datosPlantilla && (
                                  <div className="ver-notif-detail-item ver-notif-detail-full">
                                    <span className="ver-notif-detail-label">Datos de plantilla</span>
                                    <div className="ver-notif-datos-plantilla">
                                      {Object.entries(notif.datosPlantilla).map(([key, val]) => (
                                        <div key={key} className="ver-notif-dato-row">
                                          <span className="ver-notif-dato-key">{key}</span>
                                          <span className="ver-notif-dato-val">
                                            {val !== null && typeof val === 'object'
                                              ? Object.entries(val as Record<string, unknown>).map(([k, v]) => (
                                                <span key={k} className="ver-notif-dato-nested">
                                                  <span className="ver-notif-dato-nested-key">{k}:</span> {String(v)}
                                                </span>
                                              ))
                                              : String(val ?? '—')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!isLoading && !error && (
          <div className="ver-notif-pagination-container">
            <div className="ver-notif-total-indicator">
              <span className="ver-notif-total-label">Total:</span>
              <span className="ver-notif-total-number">{totalItems.toLocaleString('es-AR')}</span>
            </div>
            <div className="ver-notif-pagination-right">
              <button
                onClick={() => fetchNotificaciones(page - 1)}
                disabled={page === 1 || isLoading}
                className="ver-notif-pagination-button"
              >Anterior</button>

              <div className="ver-notif-page-jump">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) fetchNotificaciones(val);
                  }}
                  className="ver-notif-page-input"
                />
                <span className="ver-notif-page-total">/ {totalPages}</span>
              </div>

              <button
                onClick={() => fetchNotificaciones(page + 1)}
                disabled={page === totalPages || isLoading}
                className="ver-notif-pagination-button"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div className={`ver-notif-toast ${toastType === 'success' ? 'ver-notif-toast-success' : 'ver-notif-toast-error'}`}>
          <div className="ver-notif-toast-content">
            {toastType === 'success'
              ? <FaCheckCircle className="ver-notif-toast-icon" />
              : <FaTimesCircle className="ver-notif-toast-icon" />}
            <span className="ver-notif-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerNotificaciones;
