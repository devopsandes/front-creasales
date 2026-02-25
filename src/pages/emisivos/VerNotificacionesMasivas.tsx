// VerNotificacionesMasivas.tsx

import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaEye, FaTrash, FaCheckCircle, FaTimesCircle, FaSync, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import './VerNotificacionesMasivas.css';

interface NotificacionMasiva {
    id: number;
    nombreNotificacion: string;
    plantillaId: number | null;
    diasDeEnvio: number[];
    filtrosUtilizados: Record<string, unknown> | null;
    estado: string;
    totalClientes: number;
    flagMensaje: boolean;
    flagCorreo: boolean;
    flagPush: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ResumenHija {
    estado: string;
    total: number;
}

interface ApiResponse {
    status: string;
    data: NotificacionMasiva[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        message?: string;
    };
}

interface DetalleResponse {
    status: string;
    data: NotificacionMasiva & { resumenHijas: ResumenHija[] };
}

const plantillasNombres: Record<number, string> = {
    1: 'Bienvenida-ADH',
    2: 'Bienvenida-MON',
    3: 'Bienvenida-REL',
    4: 'Deuda-Utilidad',
    5: 'Deuda',
    6: 'Pre-Alta-ADH',
    7: 'Pre-Alta-REL',
    8: 'Prevencion-Estafas',
    9: 'Referidos',
};

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
    'EN_PROCESO': { label: 'En Proceso', cls: 'vnm-badge-warning' },
    'COMPLETADA': { label: 'Completada', cls: 'vnm-badge-success' },
    'ANULADA': { label: 'Anulada', cls: 'vnm-badge-anulada' },
    'ERROR': { label: 'Error', cls: 'vnm-badge-error' },
};

const VerNotificacionesMasivas = () => {
    const [masivas, setMasivas] = useState<NotificacionMasiva[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [filtroId, setFiltroId] = useState('');

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [detalle, setDetalle] = useState<(NotificacionMasiva & { resumenHijas: ResumenHija[] }) | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [diasEditando, setDiasEditando] = useState<number[]>([]);
    const [savingEdit, setSavingEdit] = useState(false);

    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [toastMessage, setToastMessage] = useState('');

    const showToastMessage = (type: 'success' | 'error', message: string) => {
        setToastType(type); setToastMessage(message); setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    const fetchMasivas = useCallback(async (currentPage = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token') || '';
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: '15',
                ...(filtroEstado !== 'Todos' && { estado: filtroEstado }),
                ...(filtroId.trim() && { id: filtroId.trim() }),
            });
            const response = await fetch(
                `https://emisivos.createch.com.ar/notificacionesMasivas?${params}`,
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            const data: ApiResponse = await response.json();
            if (data.status === 'success') {
                setMasivas(data.data || []);
                setTotalPages(data.meta?.totalPages ?? 1);
                setTotalItems(data.meta?.total ?? 0);
                setPage(currentPage);
                setExpandedId(null);
                setDetalle(null);
            } else {
                throw new Error(data.meta?.message || 'Error al obtener las notificaciones masivas');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setIsLoading(false);
        }
    }, [filtroEstado, filtroId]);

    useEffect(() => { fetchMasivas(1); }, [filtroEstado, filtroId]);

    const fetchDetalle = async (id: number) => {
        if (expandedId === id) { setExpandedId(null); setDetalle(null); return; }
        setExpandedId(id);
        setLoadingDetalle(true);
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(
                `https://emisivos.createch.com.ar/notificacionesMasivas/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data: DetalleResponse = await response.json();
            if (data.status === 'success') setDetalle(data.data);
        } catch {
            showToastMessage('error', 'Error al cargar el detalle');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleAnular = async (id: number) => {
        if (!window.confirm(`¿Estás seguro de anular la Notificación Masiva #${id}? Se anularán todas sus notificaciones hijas.`)) return;
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(
                `https://emisivos.createch.com.ar/notificacionesMasivas/${id}/anular`,
                { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                setMasivas(prev => prev.map(m => m.id === id ? { ...m, estado: 'ANULADA' } : m));
                showToastMessage('success', data.meta?.message || `Notificación Masiva #${id} anulada`);
            } else {
                showToastMessage('error', data.meta?.message || 'Error al anular');
            }
        } catch {
            showToastMessage('error', 'Error de conexión');
        }
    };

    const abrirEdicion = (masiva: NotificacionMasiva) => {
        setEditingId(masiva.id);
        setDiasEditando([...masiva.diasDeEnvio]);
    };

    const toggleDiaEdicion = (dia: number) => {
        setDiasEditando(prev =>
            prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort((a, b) => a - b)
        );
    };

    const guardarEdicion = async () => {
        if (!editingId) return;
        if (diasEditando.length === 0) { showToastMessage('error', 'Debe seleccionar al menos un día'); return; }
        setSavingEdit(true);
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(
                `https://emisivos.createch.com.ar/notificacionesMasivas/${editingId}/editar`,
                {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ diasDeEnvio: diasEditando })
                }
            );
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                setMasivas(prev => prev.map(m => m.id === editingId ? { ...m, diasDeEnvio: diasEditando } : m));
                showToastMessage('success', 'Días de envío actualizados. La propagación está corriendo en background.');
                setEditingId(null);
            } else {
                showToastMessage('error', data.meta?.message || 'Error al guardar');
            }
        } catch {
            showToastMessage('error', 'Error de conexión');
        } finally {
            setSavingEdit(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }).format(new Date(dateStr));
    };

    const getEstado = (estado: string) => ESTADO_CONFIG[estado] ?? { label: estado, cls: 'vnm-badge-anulada' };

    return (
        <div className="vnm-wrapper">
            <div className="vnm-header">
                <h2 className="vnm-header-title">Notificaciones Masivas</h2>
                <p className="vnm-header-description">
                    Visualice y gestione los envíos masivos creados. Modifique los días de envío o anule
                    campañas completas. Los cambios se propagan automáticamente a todas las notificaciones hijas.
                </p>
            </div>

            <div className="vnm-container">

                {/* Filtros */}
                <div className="vnm-filters">
                    <div className="vnm-filter-group">
                        <label className="vnm-filter-label">
                            <FaSearch className="vnm-filter-icon" /> Buscar por ID
                        </label>
                        <input
                            type="number"
                            value={filtroId}
                            onChange={(e) => setFiltroId(e.target.value)}
                            placeholder="Ingrese ID..."
                            className="vnm-filter-input"
                        />
                    </div>
                    <div className="vnm-filter-group">
                        <label className="vnm-filter-label">Estado</label>
                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="vnm-filter-select">
                            <option value="Todos">Todos</option>
                            <option value="EN_PROCESO">En Proceso</option>
                            <option value="COMPLETADA">Completada</option>
                            <option value="ANULADA">Anulada</option>
                            <option value="ERROR">Error</option>
                        </select>
                    </div>
                    <div className="vnm-filter-actions">
                        <button onClick={() => fetchMasivas(page)} className="vnm-btn-refresh" disabled={isLoading}>
                            <FaSync className={isLoading ? 'spinning' : ''} />
                            {isLoading ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="vnm-loading">
                        <div className="vnm-spinner" />
                        <span>Cargando notificaciones masivas...</span>
                    </div>
                )}

                {/* Error */}
                {error && !isLoading && (
                    <div className="vnm-error-banner">
                        <FaTimesCircle />
                        <span>{error}</span>
                        <button onClick={() => fetchMasivas(page)} className="vnm-retry-btn">Reintentar</button>
                    </div>
                )}

                {/* Tabla */}
                {!isLoading && !error && (
                    <div className="vnm-table-wrapper">
                        <table className="vnm-table">
                            <thead className="vnm-table-header">
                                <tr>
                                    <th className="vnm-table-header-cell">ID</th>
                                    <th className="vnm-table-header-cell">Nombre notificacion</th>
                                    <th className="vnm-table-header-cell">Plantilla</th>
                                    <th className="vnm-table-header-cell">Días de Envío</th>
                                    <th className="vnm-table-header-cell vnm-table-header-cell-center">Canales</th>
                                    <th className="vnm-table-header-cell vnm-table-header-cell-center">Estado</th>
                                    <th className="vnm-table-header-cell vnm-table-header-cell-center">Afiliados notificados</th>
                                    <th className="vnm-table-header-cell">Creada</th>
                                    <th className="vnm-table-header-cell vnm-table-header-cell-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {masivas.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="vnm-empty">No se encontraron notificaciones masivas</td>
                                    </tr>
                                ) : masivas.map((masiva) => {
                                    const estadoCfg = getEstado(masiva.estado);
                                    const isExpanded = expandedId === masiva.id;

                                    return (
                                        <>
                                            <tr key={masiva.id} className={`vnm-table-row ${isExpanded ? 'vnm-row-expanded' : ''}`}>

                                                <td className="vnm-table-cell vnm-table-cell-id">#{masiva.id}</td>

                                                <td className="vnm-table-cell">
                                                    <span className="vnm-nombre-notif">{masiva.nombreNotificacion}</span>
                                                </td>

                                                <td className="vnm-table-cell">
                                                    {masiva.plantillaId
                                                        ? <span className="vnm-plantilla-badge">{plantillasNombres[masiva.plantillaId] || `ID ${masiva.plantillaId}`}</span>
                                                        : <span className="vnm-sin-dato">Sin plantilla</span>}
                                                </td>

                                                <td className="vnm-table-cell">
                                                    <div className="vnm-dias-container">
                                                        {masiva.diasDeEnvio?.map(d => (
                                                            <span key={d} className="vnm-dia-badge">{d}</span>
                                                        ))}
                                                    </div>
                                                </td>

                                                <td className="vnm-table-cell vnm-table-cell-center">
                                                    <div className="vnm-canales-row">
                                                        <span className={`vnm-canal-icon ${masiva.flagCorreo ? 'canal-active' : 'canal-inactive'}`} title="Email">✉</span>
                                                        <span className={`vnm-canal-icon ${masiva.flagPush ? 'canal-active' : 'canal-inactive'}`} title="Push">🔔</span>
                                                        <span className={`vnm-canal-icon ${masiva.flagMensaje ? 'canal-active' : 'canal-inactive'}`} title="WhatsApp">💬</span>
                                                    </div>
                                                </td>

                                                <td className="vnm-table-cell vnm-table-cell-center">
                                                    <span className={`vnm-badge ${estadoCfg.cls}`}>{estadoCfg.label}</span>
                                                </td>

                                                <td className="vnm-table-cell vnm-table-cell-center">
                                                    <span className="vnm-total-clientes">{masiva.totalClientes.toLocaleString('es-AR')}</span>
                                                </td>

                                                <td className="vnm-table-cell vnm-table-cell-fecha">{formatDate(masiva.createdAt)}</td>

                                                <td className="vnm-table-cell vnm-table-cell-center">
                                                    <div className="vnm-actions">
                                                        <button
                                                            onClick={() => fetchDetalle(masiva.id)}
                                                            className={`vnm-action-button vnm-action-view ${isExpanded ? 'active' : ''}`}
                                                            title="Ver detalle"
                                                        ><FaEye /></button>
                                                        <button
                                                            onClick={() => abrirEdicion(masiva)}
                                                            className="vnm-action-button vnm-action-edit"
                                                            title="Editar días de envío"
                                                            disabled={masiva.estado !== 'COMPLETADA' || (masiva.diasDeEnvio.length === 1 && masiva.diasDeEnvio[0] === 0)}
                                                        ><FaEdit /></button>
                                                        <button
                                                            onClick={() => handleAnular(masiva.id)}
                                                            className="vnm-action-button vnm-action-delete"
                                                            title="Anular"
                                                            disabled={masiva.estado !== 'COMPLETADA' || (masiva.diasDeEnvio.length === 1 && masiva.diasDeEnvio[0] === 0)}
                                                        ><FaTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Panel expandido */}
                                            {isExpanded && (
                                                <tr key={`det-${masiva.id}`} className="vnm-detail-row">
                                                    <td colSpan={9}>
                                                        <div className="vnm-detail-panel">
                                                            {loadingDetalle ? (
                                                                <div className="vnm-loading-inline">
                                                                    <div className="vnm-spinner-sm" />
                                                                    <span>Cargando detalle...</span>
                                                                </div>
                                                            ) : detalle && (
                                                                <div className="vnm-detail-grid">

                                                                    <div className="vnm-detail-item vnm-detail-full">
                                                                        <span className="vnm-detail-label">Resumen de notificaciones hijas</span>
                                                                        <div className="vnm-resumen-hijas">
                                                                            {detalle.resumenHijas.map(r => {
                                                                                const cfg = getEstado(r.estado);
                                                                                return (
                                                                                    <div key={r.estado} className="vnm-resumen-item">
                                                                                        <span className={`vnm-badge ${cfg.cls}`}>{cfg.label}</span>
                                                                                        <span className="vnm-resumen-total">{Number(r.total).toLocaleString('es-AR')}</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>

                                                                    {detalle.filtrosUtilizados && Object.keys(detalle.filtrosUtilizados).length > 0 && (
                                                                        <div className="vnm-detail-item vnm-detail-full">
                                                                            <span className="vnm-detail-label">Filtros utilizados (solo lectura)</span>
                                                                            <div className="vnm-filtros-grid">
                                                                                {Object.entries(detalle.filtrosUtilizados).map(([key, val]) => (
                                                                                    <div key={key} className="vnm-filtro-row">
                                                                                        <span className="vnm-filtro-key">{key}</span>
                                                                                        <span className="vnm-filtro-val">
                                                                                            {Array.isArray(val)
                                                                                                ? (val as unknown[]).join(', ') || '—'
                                                                                                : String(val ?? '—')}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <p className="vnm-filtros-hint">
                                                                                Si desea modificar los filtros, anule esta notificación masiva y cree una nueva.
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div className="vnm-detail-item">
                                                                        <span className="vnm-detail-label">Última actualización</span>
                                                                        <span className="vnm-detail-value">{formatDate(detalle.updatedAt)}</span>
                                                                    </div>

                                                                </div>
                                                            )}
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
                    <div className="vnm-pagination-container">
                        <div className="vnm-total-indicator">
                            <span className="vnm-total-label">Total:</span>
                            <span className="vnm-total-number">{totalItems.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="vnm-pagination-right">
                            <button onClick={() => fetchMasivas(page - 1)} disabled={page === 1 || isLoading} className="vnm-pagination-button">Anterior</button>
                            <div className="vnm-page-jump">
                                <input
                                    type="number" min={1} max={totalPages} value={page}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= totalPages) fetchMasivas(val);
                                    }}
                                    className="vnm-page-input"
                                />
                                <span className="vnm-pagination-info">/ {totalPages}</span>
                            </div>
                            <button onClick={() => fetchMasivas(page + 1)} disabled={page === totalPages || isLoading} className="vnm-pagination-button">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal edición días */}
            {editingId !== null && (
                <div className="vnm-modal-overlay" onClick={() => setEditingId(null)}>
                    <div className="vnm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="vnm-modal-header">
                            <h3 className="vnm-modal-title">Editar Días de Envío</h3>
                            <p className="vnm-modal-subtitle">Notificación Masiva #{editingId}</p>
                            <button className="vnm-modal-close" onClick={() => setEditingId(null)}><FaTimes /></button>
                        </div>
                        <div className="vnm-modal-body">
                            <p className="vnm-modal-hint">Seleccioná los días del mes en los que se enviará la notificación.</p>
                            <div className="vnm-edit-days-grid">
                                {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                                    <button
                                        key={dia}
                                        className={`vnm-edit-day-btn ${diasEditando.includes(dia) ? 'active' : ''}`}
                                        onClick={() => toggleDiaEdicion(dia)}
                                    >
                                        {dia}
                                    </button>
                                ))}
                            </div>
                            <div className={`vnm-edit-status ${diasEditando.length === 0 ? 'sin-dias' : 'con-dias'}`}>
                                <span className="vnm-edit-status-dot" />
                                {diasEditando.length === 0
                                    ? 'Sin días seleccionados'
                                    : `Días seleccionados: ${diasEditando.join(', ')}`}
                            </div>
                        </div>
                        <div className="vnm-modal-footer">
                            <button className="vnm-modal-btn-cancel" onClick={() => setEditingId(null)}>
                                <FaTimes /> Cancelar
                            </button>
                            <button className="vnm-modal-btn-save" onClick={guardarEdicion} disabled={savingEdit || diasEditando.length === 0}>
                                <FaSave /> {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className={`vnm-toast ${toastType === 'success' ? 'vnm-toast-success' : 'vnm-toast-error'}`}>
                    <div className="vnm-toast-content">
                        {toastType === 'success' ? <FaCheckCircle className="vnm-toast-icon" /> : <FaTimesCircle className="vnm-toast-icon" />}
                        <span className="vnm-toast-message">{toastMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerNotificacionesMasivas;
