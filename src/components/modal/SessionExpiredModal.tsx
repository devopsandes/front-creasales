import { AlertCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './session-expired-modal.css'

interface SessionExpiredModalProps {
  isOpen: boolean
  onClose?: () => void
}

const SessionExpiredModal = ({ isOpen, onClose }: SessionExpiredModalProps) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleConfirm = () => {
    if (onClose) onClose()
    localStorage.clear()
    navigate('/auth/signin')
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleConfirm()
    }
  }

  return (
    <div className="session-modal-overlay" onClick={handleOverlayClick}>
      <div className="session-modal-container">
        <button className="session-modal-close" onClick={handleConfirm}>
          <X size={20} />
        </button>
        
        <div className="session-modal-icon">
          <AlertCircle size={32} />
        </div>

        <h2 className="session-modal-title">Sesión Expirada</h2>
        <p className="session-modal-message">
          Su sesión ha caducado. Por favor, inicie sesión nuevamente para continuar.
        </p>

        <div className="session-modal-actions">
          <button 
            className="session-modal-button session-modal-confirm"
            onClick={handleConfirm}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionExpiredModal

