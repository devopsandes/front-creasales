import { Link } from 'react-router-dom'
import { DashItemInterface } from '../../interfaces/components.interface'
import './dash-item.css'

const DashItem = (props: DashItemInterface) => {
  return (
    <Link className='di-container' to={props.path}>
      <props.icon size={25}/>
      <p>{props.titulo}</p>
    </Link>
  )
}

export default DashItem