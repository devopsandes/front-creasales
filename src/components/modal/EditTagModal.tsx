import { useEffect, useState } from 'react'
import { X, Edit2 } from 'lucide-react'
import { updateTag } from '../../services/tags/tags.services'
import TagResultModal from './TagResultModal'
import './edit-tag-modal.css'

interface EditTagModalProps {
  isOpen: boolean
  onClose: () => void
  tagId: string | null
  tagName: string
  onSuccess: () => void
}

const EditTagModal = ({ isOpen, onClose, tagId, tagName, onSuccess }: EditTagModalProps) => {
  const [nombre, setNombre] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showResultModal, setShowResultModal] = useState<boolean>(false)
  const [resultModalData, setResultModalData] = useState<{
    isSuccess: boolean
    message: string
  } | null>(null)

  const token = localStorage.getItem('token') || ''

  useEffect(() => {
    if (isOpen && tagName) {
      setNombre(tagName)
      setError('')
    }
  }, [isOpen, tagName])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = async () => {
    if (!nombre.trim()) {
      setError('El nombre de la etiqueta no puede estar vacío')
      return
    }

    if (!tagId) {
      setResultModalData({
        isSuccess: false,
        message: 'No se pudo identificar la etiqueta.'
      })
      setShowResultModal(true)
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await updateTag(token, tagId, nombre.trim())
      
      if (response.statusCode === 401) {
        setResultModalData({
          isSuccess: false,
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        })
        setShowResultModal(true)
        setLoading(false)
        return
      }

      const isSuccess = !response.statusCode || response.statusCode === 200 || response.statusCode === 201

      if (isSuccess) {
        const successMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || 'La etiqueta ha sido actualizada correctamente.'
        setResultModalData({
          isSuccess: true,
          message: successMessage
        })
        setShowResultModal(true)
        onSuccess()
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || 'Error al actualizar la etiqueta.'
        setResultModalData({
          isSuccess: false,
          message: errorMessage
        })
        setShowResultModal(true)
      }
    } catch (error: any) {
      console.error('Error updating tag:', error)
      let errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.'
      
      if (error.response) {
        const message = Array.isArray(error.response.data?.message)
          ? error.response.data.message.join(', ')
          : error.response.data?.message
        errorMessage = message || 'Error del servidor al actualizar la etiqueta.'
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
    <div className="edit-tag-modal-overlay" onClick={handleOverlayClick}>
      <div className="edit-tag-modal-container">
        <button className="edit-tag-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="edit-tag-modal-icon">
          <Edit2 size={32} />
        </div>

        <h2 className="edit-tag-modal-title">Editar Etiqueta</h2>

        <div className="edit-tag-modal-input-container">
          <label htmlFor="tag-name" className="edit-tag-modal-label">
            Nombre de la Etiqueta
          </label>
          <input
            id="tag-name"
            type="text"
            className="edit-tag-modal-input"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setError('')
            }}
            placeholder="Ingrese el nombre de la etiqueta"
            disabled={loading}
          />
          {error && (
            <p className="edit-tag-modal-error-text">{error}</p>
          )}
        </div>

        <div className="edit-tag-modal-actions">
          <button 
            className="edit-tag-modal-button edit-tag-modal-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="edit-tag-modal-button edit-tag-modal-confirm"
            onClick={handleConfirm}
            disabled={!nombre.trim() || loading}
          >
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      {resultModalData && (
        <TagResultModal
          isOpen={showResultModal}
          onClose={handleResultModalClose}
          isSuccess={resultModalData.isSuccess}
          title={resultModalData.isSuccess ? 'Etiqueta Actualizada' : 'Error al Actualizar Etiqueta'}
          message={resultModalData.message}
        />
      )}
    </div>
  )
}

export default EditTagModal

