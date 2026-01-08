import { XCircle, X } from 'lucide-react'
import './error-modal.css'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

const ErrorModal = ({ isOpen, onClose, title = 'Error', message = 'Ocurrió un error al realizar la operación' }: ErrorModalProps) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="error-modal-overlay" onClick={handleOverlayClick}>
      <div className="error-modal-container">
        <button className="error-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="error-modal-icon">
          <XCircle size={32} />
        </div>

        <h2 className="error-modal-title">{title}</h2>
        <p className="error-modal-message">
          {message}
        </p>

        <div className="error-modal-actions">
          <button 
            className="error-modal-button error-modal-confirm"
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorModal



