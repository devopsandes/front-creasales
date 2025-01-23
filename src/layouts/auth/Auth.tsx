import { Outlet } from 'react-router-dom'
import './auth.css'

const Auth = () => {
  return (
    <div className="contenedor">
      <Outlet />
    </div>
  )
}

export default Auth