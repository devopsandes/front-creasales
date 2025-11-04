import { Link, useLocation } from 'react-router-dom'
import { DashItemInterface } from '../../interfaces/components.interface'
import './dash-item.css'

const DashItem = (props: DashItemInterface) => {
  const Icon = props.icon
  const location = useLocation()
  
  // Verificar si la ruta actual coincide con el path del item
  const isActive = props.path !== '' && location.pathname.startsWith(props.path)
  
  return (
    <Link 
      className={`di-container ${isActive ? 'di-container-active' : ''}`} 
      to={props.path} 
      data-title={props.titulo}
    >
      <Icon size={25} strokeWidth={1.5}/>
      <p>{props.titulo}</p>
    </Link>
  )
}

export default DashItem