import { FormEvent, useState } from 'react'
import { Link, useNavigate  } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addMessage } from '../../../app/slices/authSlice'
import { sendEmailRecuperarPass } from '../../../services/auth/auth.services'
import Spinner from '../../../components/spinners/Spinner'

const RecuperarPass = () => {
    const [email,setEmail] = useState('')
    const [msgError,setMsgError] = useState('')
    const [showSpinner, setShowSpinner] = useState(false)

    const navigate = useNavigate()
    const dispatch = useDispatch()
   


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if(email.length === 0){
            setMsgError('Debe ingresar un email')
            return
        }

        if(!emailRegex.test(email)){
            setMsgError('Debe ingresar un formato válido para el email')
            return
        }

        setShowSpinner(true)

        const resp = await sendEmailRecuperarPass(email)

        

        if(resp.statusCode === 200){
            dispatch(addMessage(resp.msg))
            navigate('/auth/mensaje')
        }else {
            setMsgError(resp.message[0])
        }

        setShowSpinner(false)

        

    }

    return (
        <>
        {showSpinner ? (
            <Spinner />
        ) : (
            <div className="login-container">
                <form  className="login-form" onSubmit={handleSubmit}>
                    <h2>Recuperar Contraseña</h2>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email"  
                            placeholder="Ingrese su email" 
                            onChange={(e) => setEmail(e.target.value)}
                            // required 
                        />
                    </div>
                    <button type="submit" className="login-button">Enviar Email</button>
                    <p className="signup-link">
                        <Link to={'/auth/signup'}>Registrarse</Link> / <Link to={'/auth/signin'}>Iniciar Sesión</Link>
                    </p>

                    {msgError.length > 0 && (
                        <p className="msg-error">
                            {msgError}
                        </p>
                    )}

                </form>
            </div>
        )}
           
        </>
    ) 
}

export default RecuperarPass