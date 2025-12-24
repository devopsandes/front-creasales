import { ChangeEvent, FormEvent, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getMunicipios, getProvincias } from "../../services/common/common.services"
import { Municipio, Provincia } from "../../interfaces/common.interface"
import { sectores, tamanos } from "../../utils/constans"
import { createEmpresa } from "../../services/empresas/empresa.services"
import { ToastContainer, toast } from 'react-toastify';
import Spinner23 from "../../components/spinners/Spinner23"
import './empresa.css'

const FormEmpresa = () => {
  const [nombre, setNombre] = useState<string>('')
  const [direccion, setDireccion] = useState<string>('')
  const [sitioWeb, setSitioWeb] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [telefono, setTelefono] = useState<string>('')
  const [cuit, setCuit] = useState<string>('')
  const [pais, setPais] = useState<string>('')
  const [provincia, setProvincia] = useState<string>('')
  const [municipio, setMunicipio] = useState<string>('')
  const [sector, setSector] = useState<string>('')
  const [tamano, setTamano] = useState<string>('')
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [idProvincia, setIdProvincia] = useState<number>(0)
  const [showSpinner, setShowSpinner] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const navigate = useNavigate()

  useEffect(() => {

    getProvincias()
      .then(data => {
        setProvincias(data.provincias)
      })
      .catch(error => {
        console.log(error)
      })

  },[])

  useEffect(() => {
    getMunicipios(idProvincia)
      .then(data => {
        setMunicipios(data.municipios)
      })
      .catch(error => {
        console.log(error)
      })
  },[idProvincia])

  const handleSelectProvincia = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setProvincia(selectedText)    
    setIdProvincia(+e.target.value)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowSpinner(true)

    let token = localStorage.getItem('token')

    const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/

   /*  if(nombre.trim() === '' || direccion.trim() === '' || sitioWeb.trim() === '' || email.trim() === '' || telefono.trim() === '' || cuit.trim() === '' || pais.trim() === '' || provincia.trim() === '' || municipio.trim() === '' || sector.trim() === '' || tamano.trim() === '') {
      alert('Todos los campos son obligatorios')
      return
    } */

    if(!token){
      setShowSpinner(false)
      alert('Debe iniciar sesión')
      navigate('/auth/signin')
      return
    }

    if(!regex.test(sitioWeb)){
      alert('Sitio web inválido')
      setShowSpinner(false)
      return
    }

    const resp = await createEmpresa(token!,{
      nombre,
      direccion,
      sitio_web: sitioWeb,
      email,
      telefono,
      pais: pais == 'ar' ? 'Argentina' : '',
      provincia,
      municipio,
      CUIT: cuit,
      sector,
      tamano
    })

    setShowSpinner(false)

    if(resp.statusCode === 201){
      setShowSpinner(false)
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
      // console.log(resp.message);
      setShowSpinner(false)
      setErrores(resp.message)
      toast.error('Error al cargar los datos')
    }

  }

  const handleClose = () => {
    setErrores([])
  }

  return (
      <>
        {showSpinner ? (
          <Spinner23 />
        ) : (
          <div className="empresa-wrapper">
            {/* Header */}
            <div className="empresa-header">
              <h2 className="empresa-header-title">Configuración de Empresa</h2>
              <p className="empresa-header-description">
                Complete la información de su empresa para personalizar el sistema y mejorar la experiencia de sus clientes.
              </p>
            </div>

            <form action="" className="form-empresa" onSubmit={handleSubmit}>
              {errores.length > 0 && (
                <div className="form-errores">
                {
                  errores.map((err,index) => (
                    <>
                      <p className="msg-cruz" onClick={handleClose}>X</p>
                      <p key={index} className="msg-error">
                        {err}
                      </p>
                    </>
                   
                  ))
                }
                </div>
              )}
            <div className="form-col">
              <h3 className="form-col-title">Información General</h3>
              <div>
                <label htmlFor="nombre">Nombre:</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  className="input-empresa"
                  placeholder="Ej: Empresa SRL"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="direccion">Dirección:</label>
                <input 
                  type="text" 
                  id="direccion" 
                  name="direccion" 
                  className="input-empresa"
                  placeholder="Ej: Calle 123"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="sitioWeb">Sitio Web:</label>
                <input 
                  type="text" 
                  id="sitioWeb" 
                  name="sitioWeb" 
                  className="input-empresa"
                  placeholder="Ej: www.sitioweb.com"
                  value={sitioWeb}
                  onChange={e => setSitioWeb(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email">Email:</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  className="input-empresa"
                  placeholder="Ej: correo@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="telefono">Teléfono:</label>
                <input 
                  type="text" 
                  id="telefono" 
                  name="telefono" 
                  className="input-empresa"
                  placeholder="Ej: 5492615345678"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="telefono">CUIT:</label>
                <input 
                  type="text" 
                  id="telefono" 
                  name="telefono" 
                  className="input-empresa" 
                  placeholder="Ej: 30-78954632-7"
                  value={cuit}
                  onChange={e => setCuit(e.target.value)}
                />
              </div>
            </div>

            <div className="form-col-wrapper">
              <div className="form-col">
                <h3 className="form-col-title">Ubicación y Clasificación</h3>
                <div>
                  <label htmlFor="telefono">Pais:</label>
                  <select 
                    name="" 
                    id="" 
                    className="select-empresa"
                    value={pais}
                    onChange={e => setPais(e.target.value)}
                  >
                    <option value="">-- Seleccione --</option>
                    <option value="ar">Argentina</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="telefono">Provincia:</label>
                  <select 
                    name="" 
                    id="" 
                    className="select-empresa" 
                    // value={provincia}
                    onChange={handleSelectProvincia}
                  >
                    <option value="">-- Seleccione --</option>
                    {provincias?.length > 0 && (
                      provincias.map( prov => (
                        <option value={prov.id} key={prov.id}>{prov.nombre}</option>
                      ))
                    )}
                  
                  </select>
                </div>
                <div>
                  <label htmlFor="telefono">Ciudad:</label>
                  <select 
                    name="" 
                    id="" 
                    className="select-empresa"
                    value={municipio}
                    onChange={e => setMunicipio(e.target.value)}
                  >
                    <option value="">-- Seleccione --</option>
                    {municipios?.length > 0 && (
                      municipios.map( muni => (
                        <option value={muni.nombre} key={muni.id}>{muni.nombre}</option>
                      ))
                    )}
                  
                  </select>
                </div>
                <div>
                  <label htmlFor="telefono">Sector:</label>
                  <select 
                    name="" 
                    id="" 
                    className="select-empresa" 
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                  >
                    <option value="">-- Seleccione --</option>
                    {sectores.map(sector => (
                      <option value={sector.value} key={sector.value}>{sector.label}</option>
                    ))}
                  
                  </select>
                </div>
                <div>
                  <label htmlFor="telefono">Tamaño:</label>
                  <select 
                    name="" 
                    id="" 
                    className="select-empresa"
                    value={tamano} 
                    onChange={e => setTamano(e.target.value)}
                  >
                    <option value="">-- Seleccione --</option>
                    {tamanos.map(sector => (
                      <option value={sector.value} key={sector.value}>{sector.label}</option>
                    ))}
                  
                  </select>
                </div>
              </div>
              
              <button type="submit" className="btn-empresa">
                Guardar Datos
              </button>
            </div>
          </form>
          </div>
         
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

export default FormEmpresa