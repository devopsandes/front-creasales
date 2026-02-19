// Plantillas.tsx

import { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import './Plantillas.css';

interface Plantilla {
  id: string;
  nombre: string;
  contenido: string;
  createdAt: Date;
}

const ITEMS_PER_PAGE = 8;

const Plantillas = () => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([
    {
      id: "1",
      nombre: "Bienvenida",
      contenido: "¡Bienvenido a nuestra plataforma! Estamos encantados de tenerte con nosotros.",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      nombre: "Recordatorio de pago",
      contenido: "Le recordamos que tiene un pago pendiente. Por favor, regularice su situación.",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: "3",
      nombre: "Promoción especial",
      contenido: "¡Oferta exclusiva! Aprovecha nuestros descuentos especiales por tiempo limitado.",
      createdAt: new Date("2024-02-01"),
    },
  ]);

  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<Plantilla | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    nombre: "",
    contenido: "",
  });

  const totalPages = Math.ceil(plantillas.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentPlantillas = plantillas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleOpenModal = (plantilla?: Plantilla) => {
    if (plantilla) {
      setEditingPlantilla(plantilla);
      setFormData({
        nombre: plantilla.nombre,
        contenido: plantilla.contenido,
      });
    } else {
      setEditingPlantilla(null);
      setFormData({
        nombre: "",
        contenido: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlantilla(null);
    setFormData({
      nombre: "",
      contenido: "",
    });
  };

  const handleSavePlantilla = () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      showToastMessage('error', 'Por favor, ingrese un nombre para la plantilla');
      return;
    }

    if (!formData.contenido.trim()) {
      showToastMessage('error', 'Por favor, ingrese el contenido de la plantilla');
      return;
    }

    if (editingPlantilla) {
      // Editar plantilla existente
      setPlantillas(
        plantillas.map((p) =>
          p.id === editingPlantilla.id
            ? {
                ...p,
                nombre: formData.nombre,
                contenido: formData.contenido,
              }
            : p
        )
      );
      showToastMessage('success', 'Plantilla actualizada exitosamente');
    } else {
      // Crear nueva plantilla
      const nuevaPlantilla: Plantilla = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        contenido: formData.contenido,
        createdAt: new Date(),
      };
      setPlantillas([...plantillas, nuevaPlantilla]);
      showToastMessage('success', 'Plantilla creada exitosamente');
    }

    handleCloseModal();
  };

  const handleDeletePlantilla = (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?`)) {
      setPlantillas(plantillas.filter((p) => p.id !== id));
      showToastMessage('success', 'Plantilla eliminada exitosamente');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="plantillas-wrapper">
      {/* Header */}
      <div className="plantillas-header">
        <h2 className="plantillas-header-title">Gestión de Plantillas</h2>
        <p className="plantillas-header-description">
          Cree y administre plantillas de mensajes reutilizables para sus Notificaciones. 
          Configure el contenido y mantenga la consistencia en sus comunicaciones.
        </p>
      </div>

      <div className="plantillas-container">
        {/* Tabla de Plantillas */}
        <div className="plantillas-table-wrapper">
          <table className="plantillas-table">
            <thead className="plantillas-table-header">
              <tr>
                <th className="plantillas-table-header-cell">#</th>
                <th className="plantillas-table-header-cell">Nombre</th>
                <th className="plantillas-table-header-cell">Contenido</th>
                <th className="plantillas-table-header-cell">Fecha de Creación</th>
                <th className="plantillas-table-header-cell plantillas-table-header-cell-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPlantillas.map((plantilla, index) => (
                <tr key={plantilla.id} className="plantillas-table-row">
                  <td className="plantillas-table-cell plantillas-table-cell-numero">
                    {startIndex + index + 1}
                  </td>
                  <td className="plantillas-table-cell plantillas-table-cell-nombre">
                    {plantilla.nombre}
                  </td>
                  <td className="plantillas-table-cell plantillas-table-cell-contenido">
                    {plantilla.contenido.substring(0, 80)}
                    {plantilla.contenido.length > 80 && '...'}
                  </td>
                  <td className="plantillas-table-cell plantillas-table-cell-fecha">
                    {formatDate(plantilla.createdAt)}
                  </td>
                  <td className="plantillas-table-cell plantillas-table-cell-center">
                    <div className="plantillas-actions">
                      <button
                        onClick={() => handleOpenModal(plantilla)}
                        className="plantillas-action-button plantillas-action-edit"
                        title="Editar plantilla"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeletePlantilla(plantilla.id, plantilla.nombre)}
                        className="plantillas-action-button plantillas-action-delete"
                        title="Eliminar plantilla"
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
        <div className="plantillas-pagination-container">
          <div className="plantillas-pagination-left">
            <button
              onClick={() => handleOpenModal()}
              className="plantillas-button-create"
            >
              <FaPlus className="plantillas-button-icon" />
              Crear Plantilla
            </button>
            <div className="plantillas-total-indicator">
              <span className="plantillas-total-label">Total de Plantillas:</span>
              <span className="plantillas-total-number">{plantillas.length}</span>
            </div>
          </div>
          <div className="plantillas-pagination-right">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="plantillas-pagination-button"
            >
              Anterior
            </button>
            <span className="plantillas-pagination-info">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="plantillas-pagination-button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Crear/Editar Plantilla */}
      {showModal && (
        <div className="plantillas-modal-overlay" onClick={handleCloseModal}>
          <div className="plantillas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plantillas-modal-header">
              <h3 className="plantillas-modal-title">
                {editingPlantilla ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </h3>
              <button onClick={handleCloseModal} className="plantillas-modal-close">
                <FaTimes />
              </button>
            </div>

            <div className="plantillas-modal-body">
              {/* Nombre */}
              <div className="plantillas-modal-group">
                <label className="plantillas-modal-label">Nombre de la Plantilla</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Bienvenida, Promoción, etc."
                  className="plantillas-modal-input"
                />
              </div>

              {/* Contenido */}
              <div className="plantillas-modal-group">
                <label className="plantillas-modal-label">Contenido del Mensaje</label>
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  placeholder="Escriba el contenido de la plantilla..."
                  className="plantillas-modal-textarea"
                  rows={6}
                />
              </div>
            </div>

            <div className="plantillas-modal-footer">
              <button onClick={handleCloseModal} className="plantillas-modal-button-cancel">
                Cancelar
              </button>
              <button onClick={handleSavePlantilla} className="plantillas-modal-button-save">
                {editingPlantilla ? 'Actualizar' : 'Crear'} Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`plantillas-toast ${toastType === 'success' ? 'plantillas-toast-success' : 'plantillas-toast-error'}`}>
          <div className="plantillas-toast-content">
            {toastType === 'success' ? (
              <FaCheckCircle className="plantillas-toast-icon" />
            ) : (
              <FaTimesCircle className="plantillas-toast-icon" />
            )}
            <span className="plantillas-toast-message">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plantillas;
