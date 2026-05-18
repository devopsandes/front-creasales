import { useState } from 'react'
import { Usuario } from '../../interfaces/auth.interface'

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
    <div className='modal-overlay' onClick={handleClose}>
      <div className='modal-container' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h3 className='modal-title'>Mencionar operadores</h3>
          <button className='modal-close' onClick={handleClose}>×</button>
        </div>
        <div className='modal-body'>
          {usuarios.length === 0 && (
            <p className='text-gray-500 text-sm'>No hay operadores disponibles</p>
          )}
          {usuarios.map(user => (
            <div
              key={user.id}
              className='flex items-center gap-3 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded'
              onClick={() => toggleUser(user.id)}
            >
              <input
                type='checkbox'
                checked={selected.has(user.id)}
                onChange={() => toggleUser(user.id)}
                onClick={e => e.stopPropagation()}
                className='checkbox'
              />
              <span className='text-sm text-gray-700'>
                {[user.apellido, user.nombre].filter(Boolean).join(', ')}
              </span>
            </div>
          ))}
        </div>
        <div className='modal-footer'>
          <button className='btn-modal-cancel' onClick={handleClose}>
            Cancelar
          </button>
          <button
            className='btn-modal-confirm'
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            Mencionar ({selected.size})
          </button>
        </div>
      </div>
    </div>
  )
}

export default MentionModal