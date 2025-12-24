import { Archive, X } from 'lucide-react'
import './archive-modal.css'

interface ArchiveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const ArchiveModal = ({ isOpen, onClose, onConfirm }: ArchiveModalProps) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="archive-modal-overlay" onClick={handleOverlayClick}>
      <div className="archive-modal-container">
        <button className="archive-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="archive-modal-icon">
          <Archive size={32} />
        </div>

        <h2 className="archive-modal-title">Archivar Chat</h2>
        <p className="archive-modal-message">
          ¿Quiere archivar el siguiente chat?
        </p>

        <div className="archive-modal-actions">
          <button 
            className="archive-modal-button archive-modal-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="archive-modal-button archive-modal-confirm"
            onClick={onConfirm}
          >
            Archivar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArchiveModal

