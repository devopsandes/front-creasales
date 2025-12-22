import { X, CheckCircle2, XCircle } from 'lucide-react'
import './tag-result-modal.css'

interface TagResultModalProps {
  isOpen: boolean
  onClose: () => void
  isSuccess: boolean
  title?: string
  message: string
}

const TagResultModal = ({ 
  isOpen, 
  onClose, 
  isSuccess, 
  title, 
  message 
}: TagResultModalProps) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const defaultTitle = isSuccess 
    ? 'Etiqueta Asignada' 
    : 'Error al Asignar Etiqueta'

  return (
    <div className="tag-result-modal-overlay" onClick={handleOverlayClick}>
      <div className="tag-result-modal-container">
        <button className="tag-result-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className={`tag-result-modal-icon ${isSuccess ? 'tag-result-modal-icon-success' : 'tag-result-modal-icon-error'}`}>
          {isSuccess ? (
            <CheckCircle2 size={32} />
          ) : (
            <XCircle size={32} />
          )}
        </div>

        <h2 className="tag-result-modal-title">{title || defaultTitle}</h2>
        <p className="tag-result-modal-message">
          {message}
        </p>

        <div className="tag-result-modal-actions">
          <button 
            className={`tag-result-modal-button ${isSuccess ? 'tag-result-modal-confirm' : 'tag-result-modal-error-button'}`}
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TagResultModal

