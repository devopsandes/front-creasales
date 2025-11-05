import { Link, useLocation } from 'react-router-dom'
import { DashItemInterface } from '../../interfaces/components.interface'
import { useState } from 'react'
import './dash-item.css'

const DashItem = (props: DashItemInterface) => {
  const Icon = props.icon
  const location = useLocation()
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  
  // Verificar si la ruta actual coincide con el path del item
  const isActive = props.path !== '' && location.pathname.startsWith(props.path)
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 10
    })
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }
  
  return (
    <>
      <Link 
        className={`di-container ${isActive ? 'di-container-active' : ''}`} 
        to={props.path}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Icon size={25} strokeWidth={1.5}/>
        <p>{props.titulo}</p>
      </Link>
      
      {showTooltip && (
        <div 
          className="di-tooltip"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
        >
          {props.titulo}
        </div>
      )}
    </>
  )
}

export default DashItem