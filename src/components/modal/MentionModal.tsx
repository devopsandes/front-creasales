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
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px',
          width: '100%', maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '85vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: 700 }}>
              @ Mencionar operadores
            </h3>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '12px', lineHeight: '1.5' }}>
              1. Seleccioná uno o más operadores de la lista<br />
              2. Escribí tu nota en el chat<br />
              3. Hacé click en <strong style={{ color: '#fff' }}>Nota Privada</strong> para enviar
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '8px', color: '#fff', cursor: 'pointer',
              width: '30px', height: '30px', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: '12px',
            }}
          >×</button>
        </div>

        {/* Contador */}
        {selected.size > 0 && (
          <div style={{
            background: '#eef2ff', borderBottom: '1px solid #e0e7ff',
            padding: '8px 24px', fontSize: '12px', color: '#4f46e5', fontWeight: 600,
          }}>
            {selected.size} operador{selected.size > 1 ? 'es' : ''} seleccionado{selected.size > 1 ? 's' : ''}
          </div>
        )}

        {/* Lista */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {usuarios.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '24px' }}>
              No hay operadores disponibles
            </p>
          )}
          {usuarios.map(user => {
            const isSelected = selected.has(user.id)
            const nombre = [user.apellido, user.nombre].filter(Boolean).join(', ')
            const iniciales = [user.nombre?.[0], user.apellido?.[0]].filter(Boolean).join('').toUpperCase()
            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 24px', cursor: 'pointer',
                  background: isSelected ? '#eef2ff' : 'transparent',
                  borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? '#4f46e5' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  color: isSelected ? '#fff' : '#64748b',
                  transition: 'all 0.15s',
                }}>
                  {iniciales || '?'}
                </div>
                {/* Nombre */}
                <span style={{
                  fontSize: '14px', fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#3730a3' : '#374151', flex: 1,
                }}>
                  {nombre}
                </span>
                {/* Check */}
                {isSelected && (
                  <span style={{ color: '#4f46e5', fontSize: '16px', fontWeight: 700 }}>✓</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
          background: '#fafafa',
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '9px 20px', borderRadius: '8px', fontSize: '14px',
              fontWeight: 500, cursor: 'pointer', border: '1px solid #e2e8f0',
              background: '#fff', color: '#64748b',
              transition: 'all 0.15s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            style={{
              padding: '9px 20px', borderRadius: '8px', fontSize: '14px',
              fontWeight: 600, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              background: selected.size === 0
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: selected.size === 0 ? '#94a3b8' : '#fff',
              transition: 'all 0.15s',
              boxShadow: selected.size === 0 ? 'none' : '0 4px 12px rgba(79,70,229,0.3)',
            }}
          >
            {selected.size === 0 ? 'Seleccioná operadores' : `Mencionar (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MentionModal