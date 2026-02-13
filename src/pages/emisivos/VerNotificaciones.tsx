import { useState, useMemo } from "react";
import { FaEye, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaSearch } from "react-icons/fa";
import './verNotificaciones.css';

interface Notificacion {
  id: number;
  cuil: string;
  tipo: string;
  estado: string;
  flagMensaje: number;
  flagCorreo: number;
  flagPush: number;
  clienteId: string;
  reiterancia: number;
  periodicidad: number;
  createdAt: Date;
}

const ITEMS_PER_PAGE = 10;

const VerNotificaciones = () => {
  // Datos de ejemplo hardcodeados
  const [notificaciones] = useState<Notificacion[]>([
    {
      id: 1,
      cuil: "20123456789",
      tipo: "Bienvenida",
      estado: "Enviado",
      flagMensaje: 1,
      flagCorreo: 1,
      flagPush: 0,
      clienteId: "20123456789",
      reiterancia: 2,
      periodicidad: 5,
      createdAt: new Date("2026-02-01"),
    },
    {
      id: 2,
      cuil: "20987654321",
      tipo: "Recordatorio de Pago",
      estado: "Pendiente",
      flagMensaje: 0,
      flagCorreo: 1,
      flagPush: 1,
      clienteId: "20987654321",
      reiterancia: 3,
      periodicidad: 10,
      createdAt: new Date("2026-02-02"),
    },
    {
      id: 3,
      cuil: "Masivo",
      tipo: "Promoción",
      estado: "Enviado",
      flagMensaje: 1,
      flagCorreo: 1,
      flagPush: 1,
      clienteId: "Masivo",
      reiterancia: 1,
      periodicidad: 15,
      createdAt: new Date("2026-02-03"),
    },
    {
      id: 4,
      cuil: "20456789123",
      tipo: "Deuda",
      estado: "Fallido",
      flagMensaje: 1,
      flagCorreo: 0,
      flagPush: 0,
      clienteId: "20456789123",
      reiterancia: 4,
      periodicidad: 20,
      createdAt: new Date("2026-02-04"),
    },
    {
      id: 5,
      cuil: "Masivo",
      tipo: "Beneficio",
      estado: "Enviado",
      flagMensaje: 0,
      flagCorreo: 1,
      flagPush: 1,
      clienteId: "Masivo",
      reiterancia: 1,
      periodicidad: 7,
      createdAt: new Date("2026-02-05"),
    },
    {
      id: 6,
      cuil: "20789456123",
      tipo: "Pre-Alta",
      estado: "Pendiente",
      flagMensaje: 1,
      flagCorreo: 1,
      flagPush: 0,
      clienteId: "20789456123",
      reiterancia: 2,
      periodicidad: 12,
      createdAt: new Date("2026-01-28"),
    },
    {
      id: 7,
      cuil: "20321654987",
      tipo: "Pago Recibido",
      estado: "Enviado",
      flagMensaje: 0,
      flagCorreo: 1,
      flagPush: 1,
      clienteId: "20321654987",
      reiterancia: 1,
      periodicidad: 3,
      createdAt: new Date("2026-01-25"),
    },
    {
      id: 8,
      cuil: "Masivo",
      tipo: "Prevención de Estafas",
      estado: "Enviado",
      flagMensaje: 1,
      flagCorreo: 1,
      flagPush: 1,
      clienteId: "Masivo",
      reiterancia: 1,
      periodicidad: 28,
      createdAt: new Date("2026-01-20"),
    },
  ]);

  const [page, setPage] = useState(1);
  const [filtroCuil, setFiltroCuil] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  // Aplicar filtros
  const notificacionesFiltradas = useMemo(() => {
    return notificaciones.filter((notif) => {
      const cumpleFiltroEstado = filtroEstado === "Todos" || notif.estado === filtroEstado;
      const cumpleFiltroCuil = filtroCuil === "" || notif.cuil.toLowerCase().includes(filtroCuil.toLowerCase());
      return cumpleFiltroEstado && cumpleFiltroCuil;
    });
  }, [notificaciones, filtroEstado, filtroCuil]);

  const totalPages = Math.ceil(notificacionesFiltradas.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentNotificaciones = notificacionesFiltradas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Resetear página cuando cambian los filtros
  useMemo(() => {
    setPage(1);
  }, [filtroCuil, filtroEstado]);

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleView = (id: number) => {
    showToastMessage('success', `Ver detalles de notificación #${id}`);
  };

  const handleEdit = (id: number) => {
    showToastMessage('success', `Editar notificación #${id}`);
  };

  const handleDelete = (id: number, tipo: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la notificación "${tipo}"?`)) {
      showToastMessage('success', `Notificación #${id} eliminada exitosamente`);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: { [key: string]: string } = {
      'Enviado': 'ver-notif-badge-success',
      'Pendiente': 'ver-notif-badge-warning',
      'Fallido': 'ver-notif-badge-error',
    };
    return badges[estado] || 'ver-notif-badge-default';
  };

  return (
    <div className="ver-notif-wrapper">
      {/* Header */}
      <div className="ver-notif-header">
        <h2 className="ver-notif-header-title">Notificaciones Creadas</h2>
        <p className="ver-notif-header-description">
          Visualice y gestione todas las notificaciones que han sido enviadas a sus clientes.
          Revise el estado, los canales utilizados y los datos de cada envío.
        </p>
      </div>

      <div className="ver-notif-container">
        {/* Filtros de Búsqueda */}
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
            <label className="ver-notif-filter-label">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="ver-notif-filter-select"
            >
              <option value="Todos">Todos</option>
              <option value="Enviado">Enviado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Fallido">Fallido</option>
            </select>
          </div>
        </div>

        {/* Tabla de Notificaciones */}
        <div className="ver-notif-table-wrapper">
          <table className="ver-notif-table">
            <thead className="ver-notif-table-header">
              <tr>
                <th className="ver-notif-table-header-cell">ID</th>
                <th className="ver-notif-table-header-cell">CUIL</th>
                <th className="ver-notif-table-header-cell">Tipo</th>
                <th className="ver-notif-table-header-cell">Estado</th>
                <th className="ver-notif-table-header-cell">WhatsApp</th>
                <th className="ver-notif-table-header-cell">Email</th>
                <th className="ver-notif-table-header-cell">Push</th>
                <th className="ver-notif-table-header-cell">Cliente ID</th>
                <th className="ver-notif-table-header-cell">Reiterancia</th>
                <th className="ver-notif-table-header-cell">Periodicidad</th>
                <th className="ver-notif-table-header-cell">Fecha</th>
                <th className="ver-notif-table-header-cell ver-notif-table-header-cell-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentNotificaciones.map((notif) => (
                <tr key={notif.id} className="ver-notif-table-row">
                  <td className="ver-notif-table-cell ver-notif-table-cell-id">
                    #{notif.id}
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-cuil">
                    {notif.cuil}
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-tipo">
                    {notif.tipo}
                  </td>
                  <td className="ver-notif-table-cell">
                    <span className={`ver-notif-badge ${getEstadoBadge(notif.estado)}`}>
                      {notif.estado}
                    </span>
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-center">
                    <span className={`ver-notif-flag ${notif.flagMensaje ? 'ver-notif-flag-active' : 'ver-notif-flag-inactive'}`}>
                      {notif.flagMensaje ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-center">
                    <span className={`ver-notif-flag ${notif.flagCorreo ? 'ver-notif-flag-active' : 'ver-notif-flag-inactive'}`}>
                      {notif.flagCorreo ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-center">
                    <span className={`ver-notif-flag ${notif.flagPush ? 'ver-notif-flag-active' : 'ver-notif-flag-inactive'}`}>
                      {notif.flagPush ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-cliente">
                    {notif.clienteId}
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-center">
                    {notif.reiterancia}
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-center">
                    {notif.periodicidad}
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-fecha">
                    {formatDate(notif.createdAt)}
                  </td>
                  <td className="ver-notif-table-cell ver-notif-table-cell-center">
                    <div className="ver-notif-actions">
                      <button
                        onClick={() => handleView(notif.id)}
                        className="ver-notif-action-button ver-notif-action-view"
                        title="Ver detalles"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(notif.id)}
                        className="ver-notif-action-button ver-notif-action-edit"
                        title="Editar notificación"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(notif.id, notif.tipo)}
                        className="ver-notif-action-button ver-notif-action-delete"
                        title="Eliminar notificación"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="ver-notif-pagination-container">
          <div className="ver-notif-total-indicator">
            <span className="ver-notif-total-label">Total de Notificaciones:</span>
            <span className="ver-notif-total-number">{notificacionesFiltradas.length}</span>
          </div>
          <div className="ver-notif-pagination-right">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="ver-notif-pagination-button"
            >
              Anterior
            </button>
            <span className="ver-notif-pagination-info">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="ver-notif-pagination-button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`ver-notif-toast ${toastType === 'success' ? 'ver-notif-toast-success' : 'ver-notif-toast-error'}`}>
          <div className="ver-notif-toast-content">
            {toastType === 'success' ? (
              <FaCheckCircle className="ver-notif-toast-icon" />
            ) : (
              <FaTimesCircle className="ver-notif-toast-icon" />
            )}
            <span className="ver-notif-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerNotificaciones;
