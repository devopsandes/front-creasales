import { useState, useRef, useEffect } from 'react'
import { MoreVertical, X, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import AddTagModal from '../modal/AddTagModal'
import RemoveTagFromChatModal from '../modal/RemoveTagFromChatModal'
import { ChatTag } from '../../interfaces/chats.interface'
import { setChats } from '../../app/slices/actionSlice'
import { getChats } from '../../services/chats/chats.services'
import './chat-info-dropdown.css'

interface ChatInfoDropdownProps {
  dataUser: any
  tags?: ChatTag[]
}

const ChatInfoDropdown = ({ dataUser, tags = [] }: ChatInfoDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showAddTagTooltip, setShowAddTagTooltip] = useState(false)
  const [addTagTooltipStyle, setAddTagTooltipStyle] = useState<React.CSSProperties>({})
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false)
  const [isRemoveTagModalOpen, setIsRemoveTagModalOpen] = useState(false)
  const [tagToRemove, setTagToRemove] = useState<ChatTag | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const addTagButtonRef = useRef<HTMLButtonElement>(null)
  const { id: chatId } = useParams()
  const dispatch = useDispatch()
  const token = localStorage.getItem('token') || ''

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownMaxHeight = 600
      const bottomMargin = 40 // ~1cm de margen inferior
      const spaceBelow = viewportHeight - rect.bottom - bottomMargin
      
      // Calcular la altura óptima del dropdown
      const optimalHeight = Math.min(dropdownMaxHeight, spaceBelow)
      
      setDropdownStyle({
        top: `${rect.bottom + 8}px`,
        maxHeight: `${optimalHeight}px`,
      })
    }
  }, [isOpen])

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const tooltipWidth = 180 // Ancho aproximado del tooltip
      const viewportWidth = window.innerWidth
      
      // Calcular posición centrada, pero ajustada si se sale del viewport
      let leftPosition = rect.left + rect.width / 2
      
      // Si el tooltip se sale por la derecha, moverlo a la izquierda
      if (leftPosition + tooltipWidth / 2 > viewportWidth - 10) {
        leftPosition = viewportWidth - tooltipWidth / 2 - 20
      }
      
      setTooltipStyle({
        top: `${rect.top - 10}px`,
        left: `${leftPosition}px`,
      })
      setShowTooltip(true)
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const handleAddTagMouseEnter = () => {
    if (addTagButtonRef.current) {
      const rect = addTagButtonRef.current.getBoundingClientRect()
      const tooltipWidth = 150
      const viewportWidth = window.innerWidth
      
      let leftPosition = rect.left + rect.width / 2
      
      if (leftPosition + tooltipWidth / 2 > viewportWidth - 10) {
        leftPosition = viewportWidth - tooltipWidth / 2 - 20
      }
      
      setAddTagTooltipStyle({
        top: `${rect.top - 10}px`,
        left: `${leftPosition}px`,
      })
      setShowAddTagTooltip(true)
    }
  }

  const handleAddTagMouseLeave = () => {
    setShowAddTagTooltip(false)
  }

  const handleAddTagClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsAddTagModalOpen(true)
  }

  const handleTagConfirm = async (_tagId: string) => {
    try {
      const chatos = await getChats(token, '1', '100')
      dispatch(setChats(chatos.chats))
    } catch (error) {
      console.error('Error refreshing chats after tag assignment:', error)
    }
  }

  const handleTagRemoveClick = (e: React.MouseEvent<HTMLSpanElement>, tag: ChatTag) => {
    e.stopPropagation()
    setTagToRemove(tag)
    setIsRemoveTagModalOpen(true)
  }

  const handleRemoveTagSuccess = async () => {
    try {
      const chatos = await getChats(token, '1', '100')
      dispatch(setChats(chatos.chats))
    } catch (error) {
      console.error('Error refreshing chats:', error)
    }
  }

  return (
    <div className="chat-info-dropdown" ref={dropdownRef}>
      <button 
        ref={buttonRef}
        className="chat-info-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Información del chat"
      >
        <MoreVertical size={20} />
      </button>

      {showTooltip && !isOpen && (
        <div className="chat-info-tooltip" style={tooltipStyle}>
          Información del Chat
        </div>
      )}

      {isOpen && (
        <div className="chat-info-dropdown-menu" style={dropdownStyle}>
          <div className="chat-info-dropdown-header">
            <h3>Información del Chat</h3>
            <button 
              className="chat-info-dropdown-close"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="chat-info-dropdown-content">
            <div className="w-full">
              <div className="chat-info-label-container">
                <p className="chat-info-label">Etiquetas</p>
                <button
                  ref={addTagButtonRef}
                  className="chat-info-add-tag-button"
                  onClick={handleAddTagClick}
                  onMouseEnter={handleAddTagMouseEnter}
                  onMouseLeave={handleAddTagMouseLeave}
                  aria-label="Agregar etiqueta"
                >
                  <Plus size={12} />
                </button>
                {showAddTagTooltip && (
                  <div className="chat-info-tooltip" style={addTagTooltipStyle}>
                    Agregar etiqueta
                  </div>
                )}
              </div>
              <div className="chat-tags-panel">
                {tags && tags.length > 0 ? (
                  tags.map(tag => (
                    <p key={tag.id} className="chat-tag">
                      {tag.nombre} 
                      <span 
                        className="chat-tag-close" 
                        onClick={(e) => handleTagRemoveClick(e, tag)}
                        style={{ cursor: 'pointer' }}
                      >
                        ×
                      </span>
                    </p>
                  ))
                ) : null}
              </div>
            </div>

            <div className="chat-info-item">
              <span className="chat-info-label-inline">Canal:</span>
              <span className="chat-info-value">Whatsapp</span>
            </div>

            <div className="chat-info-item">
              <span className="chat-info-label-inline">Estado:</span>
              <span className="chat-info-value">Abierto</span>
            </div>

            <div className="chat-info-item">
              <span className="chat-info-label-inline">ChatBot:</span>
              <span className="chat-info-value">#andessalud</span>
            </div>

            <div className="chat-info-item">
              <span className="chat-info-label-inline">Departamento:</span>
              <span className="chat-info-value">Atención</span>
            </div>

            <div className="chat-info-item">
              <span className="chat-info-label-inline">Asignado:</span>
              <span className="chat-info-value">John Doe</span>
            </div>

            {dataUser?.mail && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Email:</span>
                <span className="chat-info-value">{dataUser.mail}</span>
              </div>
            )}

            {dataUser?.celular && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Teléfono:</span>
                <span className="chat-info-value">{dataUser.celular}</span>
              </div>
            )}

            <div className="chat-info-item">
              <span className="chat-info-label-inline">TipoAltaBaja:</span>
              <span className="chat-info-value">Alta</span>
            </div>

            {dataUser?.planAfiliado && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Plan Prestacional:</span>
                <span className="chat-info-value">{dataUser.planAfiliado}</span>
              </div>
            )}

            {dataUser?.provinciaDom && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Provincia:</span>
                <span className="chat-info-value">{dataUser.provinciaDom}</span>
              </div>
            )}

            <div className="chat-info-item">
              <span className="chat-info-label-inline">Via Clinica:</span>
              <span className="chat-info-value">CATEGORIA D;SC</span>
            </div>

            {dataUser?.CUILTitular && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Cuil Afiliado:</span>
                <span className="chat-info-value">{dataUser.CUILTitular}</span>
              </div>
            )}

            {dataUser?.IdAfiliadoTitular && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Id Afiliado Titular:</span>
                <span className="chat-info-value">{dataUser.IdAfiliadoTitular}</span>
              </div>
            )}

            {dataUser?.mesAlta && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Fecha Alta:</span>
                <span className="chat-info-value">{dataUser.mesAlta}</span>
              </div>
            )}

            {dataUser?.OSAndes && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Obra social:</span>
                <span className="chat-info-value">{dataUser.OSAndes}</span>
              </div>
            )}

            {dataUser?.localidadDom && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">Localidad:</span>
                <span className="chat-info-value">{dataUser.localidadDom}</span>
              </div>
            )}

            {dataUser?.CUILTitular && (
              <div className="chat-info-item">
                <span className="chat-info-label-inline">DNI:</span>
                <span className="chat-info-value">
                  {dataUser.CUILTitular.toString().slice(2, -1)}
                </span>
              </div>
            )}

            <div className="chat-info-item">
              <span className="chat-info-label-inline">Zoho Ticket id:</span>
              <span className="chat-info-value">#260937</span>
            </div>
          </div>
        </div>
      )}
      
      <AddTagModal
        isOpen={isAddTagModalOpen}
        onClose={() => setIsAddTagModalOpen(false)}
        onConfirm={handleTagConfirm}
        chatId={chatId}
      />
      <RemoveTagFromChatModal
        isOpen={isRemoveTagModalOpen}
        onClose={() => {
          setIsRemoveTagModalOpen(false)
          setTagToRemove(null)
        }}
        tag={tagToRemove}
        chatId={chatId}
        onSuccess={handleRemoveTagSuccess}
      />
    </div>
  )
}

export default ChatInfoDropdown

