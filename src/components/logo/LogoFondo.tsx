import './logoFondo.css';

const LogoFondo = () => {
  return (
    <div className="container-logo">
        <div className='franja-cel'></div>
        <div className='logo-cel'>
            <img src="/src/assets/logo-sol.png" alt="logo-sol" width={200} height={200} />
        </div>
        <div className='franja-cel'></div>
    </div>
  )
}

export default LogoFondo