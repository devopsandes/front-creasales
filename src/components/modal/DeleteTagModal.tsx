import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { deleteTag } from '../../services/tags/tags.services'
import { Tag } from '../../interfaces/tags.interface'
import TagResultModal from './TagResultModal'
import { capitalizeWords } from '../../utils/functions'
import './delete-tag-modal.css'

interface DeleteTagModalProps {
  isOpen: boolean
  onClose: () => void
  tag: Tag | null
  onSuccess: () => void
}

const DeleteTagModal = ({ isOpen, onClose, tag, onSuccess }: DeleteTagModalProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [showResultModal, setShowResultModal] = useState<boolean>(false)
  const [resultModalData, setResultModalData] = useState<{
    isSuccess: boolean
    message: string
  } | null>(null)

  const token = localStorage.getItem('token') || ''

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = async () => {
    if (!tag) {
      setResultModalData({
        isSuccess: false,
        message: 'No se pudo identificar la etiqueta.'
      })
      setShowResultModal(true)
      return
    }

    setLoading(true)
    
    try {
      const response = await deleteTag(token, tag.id)
      
      if (response.statusCode === 401) {
        setResultModalData({
          isSuccess: false,
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        })
        setShowResultModal(true)
        setLoading(false)
        return
      }

      const isSuccess = !response.statusCode || response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 204

      if (isSuccess) {
        const successMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || 'La etiqueta ha sido eliminada correctamente.'
        setResultModalData({
          isSuccess: true,
          message: successMessage
        })
        setShowResultModal(true)
        onSuccess()
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || 'Error al eliminar la etiqueta.'
        setResultModalData({
          isSuccess: false,
          message: errorMessage
        })
        setShowResultModal(true)
      }
    } catch (error: any) {
      console.error('Error deleting tag:', error)
      let errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.'
      
      if (error.response) {
        const message = Array.isArray(error.response.data?.message)
          ? error.response.data.message.join(', ')
          : error.response.data?.message
        errorMessage = message || 'Error del servidor al eliminar la etiqueta.'
      }
      
      setResultModalData({
        isSuccess: false,
        message: errorMessage
      })
      setShowResultModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleResultModalClose = () => {
    setShowResultModal(false)
    const wasSuccess = resultModalData?.isSuccess
    setResultModalData(null)
    if (wasSuccess) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="delete-tag-modal-overlay" onClick={handleOverlayClick}>
        <div className="delete-tag-modal-container">
          <button className="delete-tag-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="delete-tag-modal-icon">
            <Trash2 size={32} />
          </div>

          <h2 className="delete-tag-modal-title">¿Está seguro que quiere eliminar esta etiqueta?</h2>

          {tag && (
            <div className="delete-tag-modal-info">
              <div className="delete-tag-modal-info-item">
                <span className="delete-tag-modal-info-label">Nombre:</span>
                <span className="delete-tag-modal-info-value">{tag.nombre.toUpperCase()}</span>
              </div>
              <div className="delete-tag-modal-info-item">
                <span className="delete-tag-modal-info-label">Empresa:</span>
                <span className="delete-tag-modal-info-value">{capitalizeWords(tag.empresa.nombre)}</span>
              </div>
            </div>
          )}

          <div className="delete-tag-modal-actions">
            <button 
              className="delete-tag-modal-button delete-tag-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              className="delete-tag-modal-button delete-tag-modal-confirm"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>

      {resultModalData && (
        <TagResultModal
          isOpen={showResultModal}
          onClose={handleResultModalClose}
          isSuccess={resultModalData.isSuccess}
          title={resultModalData.isSuccess ? 'Etiqueta Eliminada' : 'Error al Eliminar Etiqueta'}
          message={resultModalData.message}
        />
      )}
    </>
  )
}

export default DeleteTagModal

