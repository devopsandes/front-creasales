import { Bell } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../app/store'
import { capitalizeWords } from '../../utils/functions'
import './topbar.css'

const Topbar = () => {
  // Obtener nombre de usuario del estado global
  const user = useSelector((state: RootState) => state.auth.user)
  const userName = capitalizeWords(user?.name || 'Usuario')
  const empresa = useSelector((state: RootState) => state.auth.empresa)
  
  return (
    <div className="topbar-container">
      <div className="topbar-left">
        <img 
          src="/images/FavicomCreaTech.jpeg" 
          alt="CreaTech Logo" 
          className="topbar-logo"
        />
        <div className="topbar-divider"></div>
        <span className="topbar-brand">CreaSales</span>
      </div>
      
      <div className="topbar-center"></div>
      
      <div className="topbar-right">
        {empresa && (
          <>
            <span className="topbar-empresa">{capitalizeWords(empresa.nombre)}</span>
            <div className="topbar-divider"></div>
          </>
        )}
        <button className="topbar-notifications" aria-label="Notificaciones">
          <Bell size={20} strokeWidth={1.5} />
          <span className="topbar-notification-badge">3</span>
        </button>
        <div className="topbar-divider"></div>
        <span className="topbar-username">{userName}</span>
        <div className="topbar-divider"></div>
        <div className="topbar-avatar">
          <img 
            src="/images/default-avatar.png" 
            alt="Avatar"
            onError={(e) => {
              // Si no existe la imagen, mostrar iniciales
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <span className="topbar-avatar-initials">
            {userName.substring(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Topbar

