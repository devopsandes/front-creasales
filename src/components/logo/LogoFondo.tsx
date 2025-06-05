import './logoFondo.css';
import logo from '../../assets/logo-sol.png'

const LogoFondo = () => {
  return (
    <div className="container-logo">
        <div className='franja-cel'></div>
        <div className='logo-cel'>
            <img src={logo} alt="logo-sol" width={200} height={200} />
        </div>
        <div className='franja-cel'></div>
    </div>
  )
}

export default LogoFondo