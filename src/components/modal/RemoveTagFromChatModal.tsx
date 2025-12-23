import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { removeTagFromChat } from '../../services/tags/tags.services'
import TagResultModal from './TagResultModal'
import { ChatTag } from '../../interfaces/chats.interface'
import './remove-tag-from-chat-modal.css'

interface RemoveTagFromChatModalProps {
  isOpen: boolean
  onClose: () => void
  tag: ChatTag | null
  chatId: string | undefined
  onSuccess: () => void
}

const RemoveTagFromChatModal = ({ isOpen, onClose, tag, chatId, onSuccess }: RemoveTagFromChatModalProps) => {
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
    if (!tag || !chatId) {
      setResultModalData({
        isSuccess: false,
        message: 'No se pudo identificar la etiqueta o el chat.'
      })
      setShowResultModal(true)
      return
    }

    setLoading(true)
    
    try {
      const response = await removeTagFromChat(token, chatId, tag.id)
      
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
          : response.message || 'La etiqueta ha sido eliminada correctamente del chat.'
        setResultModalData({
          isSuccess: true,
          message: successMessage
        })
        setShowResultModal(true)
        onSuccess()
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || 'Error al eliminar la etiqueta del chat.'
        setResultModalData({
          isSuccess: false,
          message: errorMessage
        })
        setShowResultModal(true)
      }
    } catch (error: any) {
      console.error('Error removing tag from chat:', error)
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
      <div className="remove-tag-from-chat-modal-overlay" onClick={handleOverlayClick}>
        <div className="remove-tag-from-chat-modal-container">
          <button className="remove-tag-from-chat-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="remove-tag-from-chat-modal-icon">
            <AlertCircle size={32} />
          </div>

          <h2 className="remove-tag-from-chat-modal-title">¿Estás seguro que quieres eliminar esta etiqueta?</h2>

          {tag && (
            <div className="remove-tag-from-chat-modal-tag-info">
              <p className="remove-tag-from-chat-modal-tag-name">{tag.nombre.toUpperCase()}</p>
            </div>
          )}

          <div className="remove-tag-from-chat-modal-actions">
            <button 
              className="remove-tag-from-chat-modal-button remove-tag-from-chat-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              className="remove-tag-from-chat-modal-button remove-tag-from-chat-modal-confirm"
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

export default RemoveTagFromChatModal

