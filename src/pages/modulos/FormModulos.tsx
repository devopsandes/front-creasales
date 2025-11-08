import {  FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import Spinner23 from "../../components/spinners/Spinner23"
import { createModulo } from "../../services/modulos/modulos.services";
import '../empresa/empresa.css';



const FormModulos = () => {
  const [nombre, setNombre] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [showSpinner, setShowSpinner] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const navigate = useNavigate()

  let token = localStorage.getItem('token')

 

  

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrores([])
    setShowSpinner(true)

    // let token = localStorage.getItem('token')

    if(!token){
      setShowSpinner(false)
      alert('Debe iniciar sesión')
      navigate('/auth/signin')
      return
    }

    if(nombre === '' || descripcion === ''){
        setShowSpinner(false)
        setErrores(['Los campos nombre y descripcion son obligatorios'])
        toast.error('Complete los campos obligatorios')
        return
    }


    const resp = await createModulo(token, {
        nombre,
        descripcion
    })


    if(resp.statusCode === 201){
      setShowSpinner(false)
      setNombre('')
      setDescripcion('')
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
      setShowSpinner(false)
      setErrores(resp.message)
      toast.error('Error al cargar los datos')
    } 
  }

  return (
      <div className="empresa-wrapper">
        {/* Header */}
        <div className="empresa-header">
          <h2 className="empresa-header-title">Gestión de Módulos</h2>
          <p className="empresa-header-description">
            Defina los módulos de atención que utilizará su empresa. Un módulo es un sistema especializado de gestión 
            que puede ser de atención al cliente, comercial o asistencia. Cada empresa puede tener múltiples módulos 
            activos, y cada módulo puede contener varias categorías que organizan los diferentes procesos y funciones 
            dentro de ese módulo.
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
                <label htmlFor="nombre">Nombre:</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  className="input-empresa"
                  placeholder="Ej: Modulo Comercial"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>

             
              <div>
                <label htmlFor="descripcion">Descripción:</label>
                <textarea 
                    name="descripcion" 
                    id="descripcion"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="textarea-empresa"
                >

                </textarea>
              {/*   <input 
                  type="text" 
                  id="desccripcion" 
                  name="desccripcion" 
                  className="input-empresa"
                  placeholder="Ej: Calle 123"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                /> */}
              </div>

             
             
            </div>

            <div className="form-col-wrapper">
              <div className="form-col">
               
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
      </div>
  )
}

export default FormModulos