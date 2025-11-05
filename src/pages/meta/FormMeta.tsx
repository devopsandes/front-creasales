import {  FormEvent, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import Spinner23 from "../../components/spinners/Spinner23"
import { createMeta } from "../../services/meta/meta.services";


const SERVICIOS = [
    {id: 1, nombre: 'WHATSAPP'},
    {id: 2, nombre: 'MARKETING'},
    {id: 3, nombre: 'AMBAS'},
   
]


const FormMeta = () => {
  const [accessToken, setAccessToken] = useState<string>('')
  const [userToken, setUserToken] = useState<string>('')
  const [idPhoneNumber, setIdPhoneNumber] = useState<string>('')
  const [servicios, setServicios] = useState<string>(SERVICIOS[0].nombre)
  const [showSpinner, setShowSpinner] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const navigate = useNavigate()

  useEffect(()=>{
   
  },[])

  

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrores([])
    setShowSpinner(true)

    console.log(servicios);
    

    let token = localStorage.getItem('token')

    if(!token){
      setShowSpinner(false)
      alert('Debe iniciar sesión')
      navigate('/auth/signin')
      return
    }

    if(accessToken === '' || idPhoneNumber === ''){
        setShowSpinner(false)
        setErrores(['Los campos ID Phone Number y Access Token son obligatorios'])
        toast.error('Complete los campos obligatorios')
        return
    }

    if(servicios === SERVICIOS[2].nombre || servicios === SERVICIOS[1].nombre){
        setShowSpinner(false)
        setErrores(['El campo User Token es obligatorio en los servicios de marketing'])
        toast.error('Complete los campos obligatorios')
        return
    }

    const resp = await createMeta(token, {
        graph_api_token: accessToken, 
        user_token: userToken.length > 0 ? userToken : undefined, 
        id_phone_number: +idPhoneNumber,
        servicios
    })


    if(resp.statusCode === 201){
      setShowSpinner(false)
      setAccessToken('')
      setUserToken('')
      setIdPhoneNumber('')
      toast.success(resp.msg)
      // limpiar el formulario
    }else if(resp.statusCode === 401){
      alert('El token ha expirado debe iniciar sesión nuevamente')
      navigate('/auth/signin')

    }else if(resp.statusCode === 500){
      setShowSpinner(false)
      setErrores([`${resp.message}`])
      toast.error('Error al cargar los datos')

      
    }else {
      console.log(resp.message);
      setShowSpinner(false)
      setErrores(resp.message)
      toast.error('Error al cargar los datos')
    } 
  

  }

  return (
      <>
        {showSpinner ? (
          <Spinner23 />
        ) : (
          <form action="" className="form-empresa" onSubmit={handleSubmit}>
              {errores.length > 0 && (
                <div className="form-errores">
                {
                  errores.map((err,index) => (
                    <p key={index} className="msg-error">
                      {err}
                    </p>
                  ))
                }
                </div>
              )}

            <div className="form-col">
              <div>
                <label htmlFor="graph_api_token">Access Token:</label>
                <input 
                  type="password" 
                  id="graph_api_token" 
                  name="graph_api_token" 
                  className="input-empresa"
                  placeholder="Ej: EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ..."
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="user_token">User Token:</label>
                <input 
                  type="password" 
                  id="user_token" 
                  name="user_token" 
                  className="input-empresa"
                  placeholder="Ej: EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ..."
                  value={userToken}
                  onChange={e => setUserToken(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="id_phone_number">ID Phone Number:</label>
                <input 
                  type="text" 
                  id="id_phone_number" 
                  name="id_phone_number" 
                  className="input-empresa"
                  placeholder="Ej: 271558629387548"
                  value={idPhoneNumber}
                  onChange={e => setIdPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="servicios">Servicios:</label>
                <select 
                  name="servicios" 
                  id="servicios" 
                  className="select-empresa"
                  value={servicios}
                  onChange={(e) => setServicios(e.target.value)}
                >
                  {SERVICIOS.map(ref => (
                    <option value={ref.nombre} key={ref.id}>{ref.nombre}</option>
                  ))}
                </select>
              </div>
             
             
            
            
             
             
            </div>

            <div className="form-col-wrapper">
              <div className="form-col">
               
               <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi facilis quis expedita, ratione voluptatum doloribus quas blanditiis. Maiores quam corporis pariatur excepturi corrupti debitis ab ea praesentium ipsum, vel cum?</p>
               <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi facilis quis expedita, ratione voluptatum doloribus quas blanditiis. Maiores quam corporis pariatur excepturi corrupti debitis ab ea praesentium ipsum, vel cum?</p>
               <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi facilis quis expedita, ratione voluptatum doloribus quas blanditiis. Maiores quam corporis pariatur excepturi corrupti debitis ab ea praesentium ipsum, vel cum?</p>
              </div>
              
              <button type="submit" className="btn-empresa">
                Cargar datos
              </button>
            </div>
          </form>
         
        )}
       <ToastContainer
          autoClose={3000} 
          closeButton 
          pauseOnHover
          draggable
          limit={1}
        />
      </>
  )
}

export default FormMeta