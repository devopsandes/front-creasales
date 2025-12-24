import { ChangeEvent, FormEvent, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import Spinner23 from "../../components/spinners/Spinner23"
import { createEstado } from "../../services/estados/estados.services"
import { REF_STATES, STATES_CLIENT, STATES_TICKETS, STATES_USER } from "../../utils/constans";
import './estados.css'


const FormEstados = () => {
  const [nombre, setNombre] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [referencia, setReferencia] = useState<string>('USER')
  const [showSpinner, setShowSpinner] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const navigate = useNavigate()

  useEffect(()=>{
    setNombre('')
    if(referencia === 'USER')
      setNombre(STATES_USER[0].nombre)
    if(referencia === 'CLIENTE')
      setNombre(STATES_CLIENT[0].nombre)
    if(referencia === 'TICKET')
      setNombre(STATES_TICKETS[0].nombre)
  },[referencia])

  

  const handleChangeReferencia = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setReferencia(selectedText)
  }

  const handleChangeNombre = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setNombre(selectedText)
  }

 

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrores([])
    setShowSpinner(true)

    let token = localStorage.getItem('token')

    if(!token){
      setShowSpinner(false)
      alert('Debe iniciar sesión')
      navigate('/auth/signin')
      return
    }

    const resp = await createEstado(token, {nombre, descripcion, referencia})


    if(resp.statusCode === 201){
      setShowSpinner(false)
      setNombre('')
      setDescripcion('')
      toast.success(resp.msg)
      // limpiar el formulario
    }else if(resp.statusCode === 401){
      console.log(resp.message);
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
      <div className="empresa-wrapper">
        {/* Header */}
        <div className="empresa-header">
          <h2 className="empresa-header-title">Gestión de Estados</h2>
          <p className="empresa-header-description">
            Cree y administre estados personalizados para organizar el seguimiento de usuarios, clientes y tickets.
          </p>
        </div>

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
                <label htmlFor="referencia">Referencia:</label>
                <select 
                  name="referencia" 
                  id="referencia" 
                  className="select-empresa"
                  value={referencia}
                  onChange={handleChangeReferencia}
                >
                  {REF_STATES.map(ref => (
                    <option value={ref.nombre} key={ref.id}>{ref.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nombre">Nombre:</label>
                <select 
                  name="nombre" 
                  id="nombre" 
                  className="select-empresa"
                  value={nombre}
                  onChange={handleChangeNombre}
                >
                    {referencia === 'USER' && STATES_USER.map(user => (
                        <option value={user.nombre} key={user.id}>{user.nombre}</option>
                    ))}
                    {referencia === 'CLIENTE' && STATES_CLIENT.map(client => (
                        <option value={client.nombre} key={client.id}>{client.nombre}</option>
                    ))}
                    {referencia === 'TICKET' && STATES_TICKETS.map(ticket => (
                        <option value={ticket.nombre} key={ticket.id}>{ticket.nombre}</option>
                    ))}
                 
                </select>
              </div>
              <div>
                <label htmlFor="descripcion">Descripción:</label>
                <textarea 
                    name="descripcion" 
                    id="descripcion"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="textarea-empresa"
                    placeholder="Escriba una breve descripción del estado. Por ejemplo: 'Cliente que ha realizado su primera compra' o 'Ticket en espera de respuesta del cliente'."
                >

                </textarea>
              </div>
            </div>

            <div className="form-col-wrapper">
              <div className="form-col">
                <h3 className="form-col-title">¿Cómo funcionan los estados?</h3>
                <p>
                  Los estados le permiten clasificar y organizar diferentes elementos de su sistema según su situación actual.
                </p>
                <p>
                  <strong>Estados de Usuarios:</strong> Evalúan el desempeño o rendimiento de sus operadores 
                  (Excelente, Muy Bueno, Bueno, Regular, Bajo, Insuficiente).
                </p>
                <p>
                  <strong>Estados de Clientes:</strong> Controlan el ciclo de vida de sus clientes desde que ingresan 
                  hasta su situación actual (Nuevo, Activo, Inactivo, Reactivado, Baja).
                </p>
                <p>
                  <strong>Estados de Tickets:</strong> Gestionan el progreso de las solicitudes o casos de soporte 
                  (En Proceso, Pendiente, Resuelto, Cerrado, Reabierto).
                </p>
                <p>
                  💡 <strong>Importante:</strong> Varios registros pueden compartir el mismo estado. Por ejemplo, 
                  múltiples tickets pueden estar "Pendientes" o varios clientes pueden estar "Activos" al mismo tiempo.
                </p>
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
      </div>
  )
}

export default FormEstados