// VerMensajes.tsx

import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaEnvelope, FaBell, FaWhatsapp, FaCheckCircle, FaTimesCircle, FaEye, FaExclamationTriangle, FaSync } from "react-icons/fa";
import './VerMensajes.css';

type TipoMensaje = 'Email' | 'Push' | 'WhatsApp';

interface MensajeUnificado {
  id:             number;
  tipo:           TipoMensaje;
  cuil:           string | null;
  destinatario:   string | null;
  titulo:         string;
  plantillaNombre: string | null;
  cuerpo:         string | null;
  estado:         string;
  leido:          boolean;
  fechaLectura:   string | null;
  errorMensaje:   string | null;
  notificacionId: number;
  createdAt:      string;
}

interface Counts {
  Todos:    number;
  Email:    number;
  Push:     number;
  WhatsApp: number;
}

interface ApiResponse {
  status: string;
  data:   MensajeUnificado[];
  meta?: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
    counts:     Counts;
    message?:   string;
  };
}

const TIPO_ICONS: Record<TipoMensaje, JSX.Element> = {
  Email:    <FaEnvelope />,
  Push:     <FaBell />,
  WhatsApp: <FaWhatsapp />,
};

const TIPO_COLORS: Record<TipoMensaje, string> = {
  Email:    'tipo-email',
  Push:     'tipo-push',
  WhatsApp: 'tipo-whatsapp',
};

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  'ENVIADO':           { label: 'Enviado',     cls: 'estado-enviado'   },
  'ERROR':             { label: 'Error',        cls: 'estado-error'     },
  'PENDIENTE':         { label: 'Pendiente',    cls: 'estado-pendiente' },
  'PENDIENTE_DE_ENVIO':{ label: 'Pendiente',    cls: 'estado-pendiente' },
  'EN_PROCESO':        { label: 'En Proceso',   cls: 'estado-proceso'   },
};

const VerMensajes = () => {
  const [mensajes, setMensajes]         = useState<MensajeUnificado[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalItems, setTotalItems]     = useState(0);
  const [counts, setCounts]             = useState<Counts>({ Todos: 0, Email: 0, Push: 0, WhatsApp: 0 });

  const [filtroTipo, setFiltroTipo]     = useState<'Todos' | TipoMensaje>('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroCuil, setFiltroCuil]     = useState('');
  const [expandedId, setExpandedId]     = useState<number | null>(null);

  const fetchMensajes = useCallback(async (currentPage = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({
        page:  String(currentPage),
        limit: '15',
        ...(filtroTipo    !== 'Todos' && { tipo:   filtroTipo }),
        ...(filtroEstado  !== 'Todos' && { estado: filtroEstado }),
        ...(filtroCuil.trim()         && { cuil:   filtroCuil.trim() }),
      });

      const response = await fetch(
        `https://emisivos.createch.com.ar/notificaciones/mensajes/listar?${params}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const data: ApiResponse = await response.json();
      if (data.status === 'success') {
        setMensajes(data.data || []);
        setTotalPages(data.meta?.totalPages ?? 1);
        setTotalItems(data.meta?.total      ?? 0);
        setCounts(data.meta?.counts ?? { Todos: 0, Email: 0, Push: 0, WhatsApp: 0 });
        setPage(currentPage);
        setExpandedId(null);
      } else {
        throw new Error(data.meta?.message || 'Error al obtener los mensajes');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filtroTipo, filtroEstado, filtroCuil]);

  useEffect(() => { fetchMensajes(1); }, [filtroTipo, filtroEstado, filtroCuil]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getEstado = (estado: string) =>
    ESTADO_CONFIG[estado] ?? { label: estado, cls: 'estado-pendiente' };

  return (
    <div className="ver-msj-wrapper">
      <div className="ver-msj-header">
        <h2 className="ver-msj-header-title">Mensajes Enviados</h2>
        <p className="ver-msj-header-description">
          Seguimiento de todos los mensajes generados por las notificaciones: Emails, Push y WhatsApp.
          Verifique el estado de entrega, lectura y la plantilla utilizada.
        </p>
      </div>

      <div className="ver-msj-container">

        {/* Pills de tipo */}
        <div className="ver-msj-tipo-pills">
          {(['Todos', 'Email', 'Push', 'WhatsApp'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`ver-msj-pill ${filtroTipo === t ? 'ver-msj-pill-active' : ''} ${t !== 'Todos' ? `pill-${t.toLowerCase()}` : ''}`}
            >
              {t !== 'Todos' && <span className="ver-msj-pill-icon">{TIPO_ICONS[t as TipoMensaje]}</span>}
              {t}
              <span className="ver-msj-pill-count">{counts[t]}</span>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="ver-msj-filters">
          <div className="ver-msj-filter-group">
            <label className="ver-msj-filter-label">
              <FaSearch className="ver-msj-filter-icon" />
              Buscar por CUIL
            </label>
            <input
              type="text"
              value={filtroCuil}
              onChange={(e) => setFiltroCuil(e.target.value)}
              placeholder="Ingrese CUIL..."
              className="ver-msj-filter-input"
            />
          </div>
          <div className="ver-msj-filter-group">
            <label className="ver-msj-filter-label">Estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="ver-msj-filter-select">
              <option value="Todos">Todos los estados</option>
              <option value="ENVIADO">Enviado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
          <div className="ver-msj-filter-group ver-msj-filter-actions">
            <button onClick={() => fetchMensajes(page)} className="ver-msj-btn-refresh" disabled={isLoading}>
              <FaSync className={isLoading ? 'spinning' : ''} />
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="ver-msj-loading">
            <div className="ver-msj-spinner" />
            <span>Cargando mensajes...</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="ver-msj-error-banner">
            <FaTimesCircle />
            <span>{error}</span>
            <button onClick={() => fetchMensajes(page)} className="ver-msj-retry-btn">Reintentar</button>
          </div>
        )}

        {/* Tabla */}
        {!isLoading && !error && (
          <div className="ver-msj-table-wrapper">
            <table className="ver-msj-table">
              <thead className="ver-msj-table-header">
                <tr>
                  <th className="ver-msj-th">ID</th>
                  <th className="ver-msj-th">Tipo</th>
                  <th className="ver-msj-th">CUIL</th>
                  <th className="ver-msj-th">Destinatario</th>
                  <th className="ver-msj-th">Título / Plantilla</th>
                  <th className="ver-msj-th ver-msj-th-center">Estado</th>
                  <th className="ver-msj-th ver-msj-th-center">Leído</th>
                  <th className="ver-msj-th">Notif. #</th>
                  <th className="ver-msj-th">Fecha</th>
                  <th className="ver-msj-th ver-msj-th-center">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="ver-msj-empty">No se encontraron mensajes</td>
                  </tr>
                ) : mensajes.map((m) => {
                  const estadoCfg  = getEstado(m.estado);
                  const isExpanded = expandedId === m.id;
                  return (
                    <>
                      <tr key={`${m.tipo}-${m.id}`} className={`ver-msj-row ${isExpanded ? 'ver-msj-row-open' : ''}`}>
                        <td className="ver-msj-td ver-msj-td-id">#{m.id}</td>
                        <td className="ver-msj-td">
                          <span className={`ver-msj-tipo-badge ${TIPO_COLORS[m.tipo]}`}>
                            <span className="ver-msj-tipo-badge-icon">{TIPO_ICONS[m.tipo]}</span>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="ver-msj-td ver-msj-td-cuil">
                          {m.cuil ?? <span className="ver-msj-sin-dato">—</span>}
                        </td>
                        <td className="ver-msj-td ver-msj-td-dest">
                          {m.destinatario ?? <span className="ver-msj-sin-dato">—</span>}
                        </td>
                        <td className="ver-msj-td ver-msj-td-titulo">
                          <div className="ver-msj-titulo-cell">
                            <span className="ver-msj-titulo-text">{m.titulo}</span>
                            {m.plantillaNombre && (
                              <span className="ver-msj-plantilla-tag">{m.plantillaNombre}</span>
                            )}
                          </div>
                        </td>
                        <td className="ver-msj-td ver-msj-td-center">
                          <span className={`ver-msj-estado-badge ${estadoCfg.cls}`}>{estadoCfg.label}</span>
                        </td>
                        <td className="ver-msj-td ver-msj-td-center">
                          {m.leido
                            ? <span className="ver-msj-leido-si" title={`Leído: ${formatDate(m.fechaLectura)}`}><FaCheckCircle /></span>
                            : <span className="ver-msj-leido-no"><FaTimesCircle /></span>}
                        </td>
                        <td className="ver-msj-td">
                          <span className="ver-msj-notif-link">#{m.notificacionId}</span>
                        </td>
                        <td className="ver-msj-td ver-msj-td-fecha">{formatDate(m.createdAt)}</td>
                        <td className="ver-msj-td ver-msj-td-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : m.id)}
                            className={`ver-msj-btn-detail ${isExpanded ? 'active' : ''}`}
                            title="Ver detalle"
                          ><FaEye /></button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`exp-${m.tipo}-${m.id}`} className="ver-msj-expanded-row">
                          <td colSpan={10}>
                            <div className="ver-msj-expanded-panel">
                              <div className="ver-msj-expanded-grid">
                                {m.cuerpo && (
                                  <div className="ver-msj-expanded-item ver-msj-expanded-full">
                                    <span className="ver-msj-exp-label">Cuerpo del mensaje</span>
                                    <p className="ver-msj-exp-cuerpo">{m.cuerpo}</p>
                                  </div>
                                )}
                                <div className="ver-msj-expanded-item">
                                  <span className="ver-msj-exp-label">Fecha de lectura</span>
                                  <span className="ver-msj-exp-value">{formatDate(m.fechaLectura)}</span>
                                </div>
                                <div className="ver-msj-expanded-item">
                                  <span className="ver-msj-exp-label">Notificación origen</span>
                                  <span className="ver-msj-exp-value">#{m.notificacionId}</span>
                                </div>
                                {m.errorMensaje && (
                                  <div className="ver-msj-expanded-item ver-msj-expanded-full">
                                    <span className="ver-msj-exp-label">Error</span>
                                    <div className="ver-msj-error-box">
                                      <FaExclamationTriangle className="ver-msj-error-icon" />
                                      <span>{m.errorMensaje}</span>
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
          <div className="ver-msj-pagination">
            <div className="ver-msj-total">
              <span className="ver-msj-total-label">Total:</span>
              <span className="ver-msj-total-num">{totalItems.toLocaleString('es-AR')}</span>
            </div>
            <div className="ver-msj-page-controls">
              <button
                onClick={() => fetchMensajes(page - 1)}
                disabled={page === 1 || isLoading}
                className="ver-msj-page-btn"
              >Anterior</button>

              <div className="ver-msj-page-jump">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) fetchMensajes(val);
                  }}
                  className="ver-msj-page-input"
                />
                <span className="ver-msj-page-total">/ {totalPages}</span>
              </div>

              <button
                onClick={() => fetchMensajes(page + 1)}
                disabled={page === totalPages || isLoading}
                className="ver-msj-page-btn"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerMensajes;
