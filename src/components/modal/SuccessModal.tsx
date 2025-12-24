import { CheckCircle2, X } from 'lucide-react'
import './success-modal.css'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

const SuccessModal = ({ isOpen, onClose, title = 'Éxito', message = 'Operación realizada correctamente' }: SuccessModalProps) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="success-modal-overlay" onClick={handleOverlayClick}>
      <div className="success-modal-container">
        <button className="success-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="success-modal-icon">
          <CheckCircle2 size={32} />
        </div>

        <h2 className="success-modal-title">{title}</h2>
        <p className="success-modal-message">
          {message}
        </p>

        <div className="success-modal-actions">
          <button 
            className="success-modal-button success-modal-confirm"
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal

