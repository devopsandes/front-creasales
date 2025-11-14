import { Trash2, X } from 'lucide-react'
import './delete-modal.css'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="delete-modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-modal-container">
        <button className="delete-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="delete-modal-icon">
          <Trash2 size={32} />
        </div>

        <h2 className="delete-modal-title">Eliminar Chat</h2>
        <p className="delete-modal-message">
          ¿Quiere eliminar esta conversación?
        </p>

        <div className="delete-modal-actions">
          <button 
            className="delete-modal-button delete-modal-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="delete-modal-button delete-modal-confirm"
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal

