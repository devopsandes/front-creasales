import { ChangeEvent, FormEvent, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import Spinner23 from "../../components/spinners/Spinner23"
import { Modulo } from "../../interfaces/modulos.interface";
import { findAllModulos } from "../../services/modulos/modulos.services";
import { createCategoria } from "../../services/categorias/categorias.services";
import '../empresa/empresa.css';


const FormCategorias = () => {
  const [nombre, setNombre] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [modulo, setModulo] = useState<string>('')
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [showSpinner, setShowSpinner] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const navigate = useNavigate()

  const token = localStorage.getItem('token')


  useEffect(()=>{

    const inicio = async (token: string) => {
      const resp = await findAllModulos(token)
      setModulos(resp.modulos)
      
      return modulos
    }

    inicio(token!)
  },[])

  

  

  const handleChangeModulo = (e: ChangeEvent<HTMLSelectElement>) => {
    // const selectedText = e.target.options[e.target.selectedIndex].text;
    // console.log(e.target.value);
    setModulo(e.target.value)
    // console.log(selectedText);
    
  }

 
 

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrores([])
    setShowSpinner(true)

    const token = localStorage.getItem('token')

    if(!token){
      setShowSpinner(false)
      alert('Debe iniciar sesión')
      navigate('/auth/signin')
      return
    }

    const resp = await createCategoria(token, {nombre, descripcion, modulo_id: modulo})


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
          <h2 className="empresa-header-title">Gestión de Categorías</h2>
          <p className="empresa-header-description">
            Defina las categorías que organizan los diferentes procesos dentro de cada módulo. Las categorías funcionan 
            como departamentos especializados (por ejemplo: Fiscalización, Atención, Ventas, Afiliaciones) que agrupan 
            y clasifican las conversaciones de chat según su tipo o función. Cada categoría pertenece a un módulo específico 
            y puede recibir múltiples chats relacionados con esa área de trabajo.
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
                <label htmlFor="referencia">Modulo:</label>
                <select 
                  name="referencia" 
                  id="referencia" 
                  className="select-empresa"
                  value={modulo}
                  onChange={handleChangeModulo}
                >
                    <option value="">-- Seleccione --</option>
                    {modulos != undefined && modulos.map(mod => (
                        <option value={mod.id} key={mod.id}>{mod.nombre}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="nombre">Nombre:</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  className="input-empresa"
                  placeholder="Ej: Fiscalización, Prestaciones, etc"
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
      </div>
  )
}

export default FormCategorias