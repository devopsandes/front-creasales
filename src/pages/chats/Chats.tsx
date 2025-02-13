import  { FormEvent } from 'react'
import { FaCircleUser } from "react-icons/fa6";
import './chats.css'

const Chats = () => {

    const handleClickBtn = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        alert('debo ejecutar la funcion para enviar un mensaje')
    }


  return (
    <div className='chats-container'>
        <div className='main-chat'>
            <div className='header-chat'>
                <div className='header-icon'>
                    <FaCircleUser size={25}/>
                </div>
            </div>
            <div className='body-chat'>
                <div className='contenedor-salida'>
                    <p className='mensaje-salida'> mensaje de salida </p> 
                </div>
                <div className='contenedor-entrada'>
                    <p className='mensaje-entrada'> mensaje de entrada</p>
                </div>
            </div>
            <div className='footer-chat'>
                <form action="" className='enviar-msj' onSubmit={handleClickBtn}>
                    <input type="text" placeholder='Escriba un mensaje' className='input-msg' />
                    <button type='submit' className='btn-msg' >Enviar</button>
                </form>
            </div>
        </div>
        {/* <div className='sidebar-chat'>sidebar chat</div> */}
    </div>
  )
}

export default Chats