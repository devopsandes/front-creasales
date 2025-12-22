import { useEffect, useState } from 'react'
import { X, Tag as TagIcon } from 'lucide-react'
import { getTags, asignarTag } from '../../services/tags/tags.services'
import { Tag } from '../../interfaces/tags.interface'
import { toast } from 'react-toastify'
import TagResultModal from './TagResultModal'
import '../spinners/spinner.css'
import './add-tag-modal.css'

interface AddTagModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tagId: string) => void
  chatId?: string
}

const AddTagModal = ({ isOpen, onClose, onConfirm, chatId }: AddTagModalProps) => {
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState<boolean>(false)
  const [showResultModal, setShowResultModal] = useState<boolean>(false)
  const [resultModalData, setResultModalData] = useState<{
    isSuccess: boolean
    message: string
  } | null>(null)

  const token = localStorage.getItem('token') || ''

  useEffect(() => {
    if (isOpen) {
      const fetchTags = async () => {
        setLoading(true)
        setError('')
        try {
          const response = await getTags(token)
          
          if (response.statusCode === 401) {
            setError('Sesión expirada. Por favor, inicia sesión nuevamente.')
            return
          }
          
          if (response.statusCode === 200 && response.tags) {
            setTags(response.tags)
          } else {
            const errorMessage = Array.isArray(response.message) 
              ? response.message.join(', ') 
              : response.message || 'Error al cargar las etiquetas disponibles.'
            setError(errorMessage)
          }
        } catch (error: any) {
          console.error('Error fetching tags:', error)
          if (error.response) {
            const errorMessage = Array.isArray(error.response.data?.message)
              ? error.response.data.message.join(', ')
              : error.response.data?.message || 'Error del servidor al obtener las etiquetas.'
            setError(errorMessage)
          } else {
            setError('Error de conexión. Por favor, verifica tu conexión a internet.')
          }
        } finally {
          setLoading(false)
        }
      }

      fetchTags()
      setSelectedTagId('')
    }
  }, [isOpen, token])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = async () => {
    if (!selectedTagId) {
      toast.error('Por favor, selecciona una etiqueta')
      return
    }

    if (!chatId) {
      toast.error('No se pudo identificar el chat')
      return
    }

    setIsAssigning(true)
    
    try {
      const response = await asignarTag(token, chatId, selectedTagId)
      
      if (response.statusCode === 401) {
        setResultModalData({
          isSuccess: false,
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        })
        setShowResultModal(true)
        return
      }

      // Si no tiene statusCode o tiene 200/201, es éxito
      const isSuccess = !response.statusCode || response.statusCode === 200 || response.statusCode === 201

      if (isSuccess) {
        const selectedTag = tags.find(tag => tag.id === selectedTagId)
        const tagName = selectedTag?.nombre || 'la etiqueta'
        const successMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || `La etiqueta "${tagName}" ha sido asignada correctamente al chat.`
        setResultModalData({
          isSuccess: true,
          message: successMessage
        })
        setShowResultModal(true)
        onConfirm(selectedTagId)
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message || 'Error al asignar la etiqueta.'
        setResultModalData({
          isSuccess: false,
          message: errorMessage
        })
        setShowResultModal(true)
      }
    } catch (error: any) {
      console.error('Error assigning tag:', error)
      let errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.'
      
      if (error.response) {
        const message = Array.isArray(error.response.data?.message)
          ? error.response.data.message.join(', ')
          : error.response.data?.message
        errorMessage = message || 'Error del servidor al asignar la etiqueta.'
      }
      
      setResultModalData({
        isSuccess: false,
        message: errorMessage
      })
      setShowResultModal(true)
    } finally {
      setIsAssigning(false)
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
      <div className="add-tag-modal-overlay" onClick={handleOverlayClick}>
        <div className="add-tag-modal-container">
          <button className="add-tag-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="add-tag-modal-icon">
            <TagIcon size={32} />
          </div>

          <h2 className="add-tag-modal-title">Asignar Etiqueta</h2>
          <p className="add-tag-modal-subtitle">
            Selecciona una etiqueta para asignar a este chat
          </p>

          {loading ? (
            <div className="add-tag-modal-loading">
              <div className="loader2"></div>
              <p>Cargando etiquetas...</p>
            </div>
          ) : error ? (
            <div className="add-tag-modal-error">
              <p>{error}</p>
            </div>
          ) : (
            <div className="add-tag-modal-select-container">
              <select
                className="add-tag-modal-select"
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                disabled={isAssigning}
              >
                <option value="">Selecciona una etiqueta</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!loading && (
            <div className="add-tag-modal-actions">
              <button 
                className="add-tag-modal-button add-tag-modal-cancel"
                onClick={onClose}
                disabled={isAssigning}
              >
                Cancelar
              </button>
              <button 
                className="add-tag-modal-button add-tag-modal-confirm"
                onClick={handleConfirm}
                disabled={!selectedTagId || !!error || isAssigning}
              >
                {isAssigning ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {resultModalData && (
        <TagResultModal
          isOpen={showResultModal}
          onClose={handleResultModalClose}
          isSuccess={resultModalData.isSuccess}
          message={resultModalData.message}
        />
      )}
    </>
  )
}

export default AddTagModal

