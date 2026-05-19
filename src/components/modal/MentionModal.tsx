import { useState } from 'react'
import { Usuario } from '../../interfaces/auth.interface'
import './MentionModal.css'

interface Props {
  isOpen: boolean
  usuarios: Usuario[]
  onClose: () => void
  onConfirm: (selectedUsers: Usuario[]) => void
}

const MentionModal = ({ isOpen, usuarios, onClose, onConfirm }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const toggleUser = (userId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleConfirm = () => {
    const selectedUsers = usuarios.filter(u => selected.has(u.id))
    onConfirm(selectedUsers)
    setSelected(new Set())
  }

  const handleClose = () => {
    setSelected(new Set())
    onClose()
  }

  return (
    <div className='mention-modal-overlay' onClick={handleClose}>
      <div className='mention-modal-container' onClick={e => e.stopPropagation()}>

        <div className='mention-modal-header'>
          <div className='mention-modal-header-content'>
            <h3 className='mention-modal-title'>@ Mencionar operadores</h3>
            <p className='mention-modal-steps'>
              1. Seleccioná uno o más operadores de la lista<br />
              2. Escribí tu nota en el chat<br />
              3. Hacé click en <strong>Nota Privada</strong> para enviar
            </p>
          </div>
          <button className='mention-modal-close' onClick={handleClose}>×</button>
        </div>

        {selected.size > 0 && (
          <div className='mention-modal-counter'>
            {selected.size} operador{selected.size > 1 ? 'es' : ''} seleccionado{selected.size > 1 ? 's' : ''}
          </div>
        )}

        <div className='mention-modal-list'>
          {usuarios.length === 0 && (
            <p className='mention-modal-empty'>No hay operadores disponibles</p>
          )}
          {usuarios.map(user => {
            const isSelected = selected.has(user.id)
            const nombre = [user.apellido, user.nombre].filter(Boolean).join(', ')
            const iniciales = [user.nombre?.[0], user.apellido?.[0]].filter(Boolean).join('').toUpperCase()
            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`mention-modal-item ${isSelected ? 'selected' : ''}`}
              >
                <div className={`mention-modal-avatar ${isSelected ? 'selected' : ''}`}>
                  {iniciales || '?'}
                </div>
                <span className={`mention-modal-name ${isSelected ? 'selected' : ''}`}>
                  {nombre}
                </span>
                {isSelected && <span className='mention-modal-check'>✓</span>}
              </div>
            )
          })}
        </div>

        <div className='mention-modal-footer'>
          <button className='mention-modal-btn-cancel' onClick={handleClose}>
            Cancelar
          </button>
          <button
            className='mention-modal-btn-confirm'
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            {selected.size === 0 ? 'Seleccioná operadores' : `Mencionar (${selected.size})`}
          </button>
        </div>

      </div>
    </div>
  )
}

export default MentionModal