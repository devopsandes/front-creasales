import { FormEvent, useEffect, useState }from 'react'
import {  useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addMessage } from '../../../app/slices/authSlice'
import Spinner from '../../../components/spinners/Spinner'
import { cambiarPassword } from '../../../services/auth/auth.services'

const FormPass = () => {
    const [showSpinner, setShowSpinner] = useState(false)
    const [pass, setPass] = useState('')
    const [repePass, setRepePass] = useState('')
    const [msgError, setMsgError] = useState('')

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [searchParams] = useSearchParams()
    let token = searchParams.get('token')

    useEffect(() => {
        setMsgError('')
        if(!token){
            dispatch(addMessage('Token no válido'))
            navigate('/auth/mensaje')
        }
    },[])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if(pass.length === 0 || repePass.length === 0){
            setMsgError('Ambos campos son obligatorios')
            return
        }

        if(pass !== repePass){
            setMsgError('Las contraseñas no coinciden')
            return
        }

        setShowSpinner(true)
        const respuesta = await cambiarPassword(token!,pass)
        console.log(respuesta);
        if(respuesta.statusCode === 200){
            setMsgError('')
            dispatch(addMessage('Contraseña actulizada correctamente'))
            navigate('/auth/mensaje')
        }else {
            setMsgError(respuesta.message[0])
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
                            <label htmlFor="pass">Contraseña</label>
                            <input 
                                type="password" 
                                id="pass" 
                                name="pass"  
                                placeholder="Ingrese su nueva contraseña" 
                                onChange={(e) => setPass(e.target.value)}
                                // required 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="repe-pass">Repetir Contraseña</label>
                            <input 
                                type="password" 
                                id="repe-pass" 
                                name="repe-pass"  
                                placeholder="Repita su nueva contraseña" 
                                onChange={(e) => setRepePass(e.target.value)}
                                // required 
                            />
                        </div>
                        <button type="submit" className="login-button">Cambiar Contraseña</button>
                        {/*  <p className="signup-link">
                            <Link to={'/auth/signin'}>Iniciar Sesión</Link>
                        </p> */}

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

export default FormPass