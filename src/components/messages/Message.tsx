import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addMessage } from '../../app/slices/authSlice'
import { MessageProps } from './message.interface'
import { tokenValidacion } from '../../services/auth/auth.services'
import Spinner from '../spinners/Spinner'
import './message.css'


const Message = ({msg, tipo}: MessageProps) => {
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const [searchParams] = useSearchParams()

  const dispatch = useDispatch()

  const msj1 = searchParams.get('msg')

  useEffect(() => {
    const token = searchParams.get('token')

    return () => {
      if(token){
        setShow(true)
        const resp = tokenValidacion(token)
        // alert('tengo que validar la cuenta');
        resp.then(res => {
          console.log(res);

          if(res.statusCode === 200)
            dispatch(addMessage(res.msg))

          if(res.statusCode === 404)
            setError(res.message[0])
          
          setShow(false)
        })
      }
    }
 
  },[])


  if(error.length > 0)
    return (<h2 className='title-error'>{error}</h2>)
    

  return (
    <>
     {show ? (
      <Spinner />
      ) : (
      <p className='msg-register signup-link'>
        {msj1} 
        {tipo === 'auth' && (
          <>
            {'\t -> \t'}
            <Link to={'/auth/signin'}>Iniciar Sesión</Link>
          </>
        )}
      </p>
    )}
    </>
   
   
  )
}

export default Message