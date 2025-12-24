import { LogOut, X } from 'lucide-react'
import './logout-modal.css'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const LogoutModal = ({ isOpen, onClose, onConfirm }: LogoutModalProps) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="logout-modal-overlay" onClick={handleOverlayClick}>
      <div className="logout-modal-container">
        <button className="logout-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="logout-modal-icon">
          <LogOut size={32} />
        </div>

        <h2 className="logout-modal-title">Cerrar Sesión</h2>
        <p className="logout-modal-message">
          ¿Estás seguro de que quieres cerrar sesión?
        </p>

        <div className="logout-modal-actions">
          <button 
            className="logout-modal-button logout-modal-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="logout-modal-button logout-modal-confirm"
            onClick={onConfirm}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutModal

