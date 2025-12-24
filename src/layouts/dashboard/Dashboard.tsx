import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import DashSidebar from "../../components/sidebars/DashSidebar";
import Topbar from "../../components/topbar/Topbar";
import SessionExpiredModal from "../../components/modal/SessionExpiredModal";
import { empresaXUser } from "../../services/empresas/empresa.services";
import { usuariosXRole } from "../../services/auth/auth.services";
import './dashboard.css'
import { useDispatch, useSelector  } from "react-redux";
import { Socket } from "socket.io-client";
import { connectSocket,  getSocket } from "../../app/slices/socketSlice";
import { setEmpresa, setUser } from "../../app/slices/authSlice";
import { openSessionExpired, closeSessionExpired } from "../../app/slices/actionSlice";
import { RootState } from "../../app/store";
<<<<<<< HEAD
=======
import { setupAxiosInterceptors } from "../../utils/axiosInterceptor";
import { useTokenRefresh } from "../../hooks/useTokenRefresh";
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256



const Dashboard = () => {

  let role: string | null = localStorage.getItem('role')
  const dispatch = useDispatch()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const sessionExpired = useSelector((state: RootState) => state.action.sessionExpired)
  
  let socket: Socket | null = null
  
<<<<<<< HEAD
=======
  // Configurar interceptores de axios para manejo de tokens
  useEffect(() => {
    setupAxiosInterceptors()
  }, [])

  // Verificar periódicamente el estado del token
  useTokenRefresh(2, 5) // Verifica cada 2 minutos, alerta 5 minutos antes de expirar
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256

  useEffect(() => {
    role = role ? localStorage.getItem('role') : null
    //TODO: tengo que poner un toast cada vez que se haya asignado un chat a un operador
  },[])


// revisar el siguiente useEffect, no se si es necesario
 /*  useEffect(()=>{

    toast.success(`${mensaje} - PRUEBA` );
  },[mensaje]) */

  useEffect(() => {
          try {
              dispatch(connectSocket())
              socket = getSocket()
              
              return () => {
                  if(!socket?.connected){
                  
                  }
                  // dispatch(disconnectSocket())
              }
          } catch (error) {
<<<<<<< HEAD
              console.log(error);
=======
              console.error('Error conectando socket:', error);
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
          }
    },[dispatch])
  

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
<<<<<<< HEAD
    console.log('Dashboard useEffect - token:', token)
    console.log('Dashboard useEffect - userId:', userId)
    
=======
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
    if(token){
      // Obtener empresa
      empresaXUser(token)
        .then(data => {
          if(data.statusCode === 401){
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            localStorage.removeItem('userId')
            return navigate('/auth/signin')
          }
          if(!data?.empresa){
            return toast.warn('llenar los datos de su empresa')
          }
          dispatch(setEmpresa(data.empresa))
        })
        .catch(error => {
<<<<<<< HEAD
          console.log(error);
=======
          console.error('Error obteniendo empresa:', error);
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
        })
      
      // Obtener usuario actual
      if(userId){
<<<<<<< HEAD
        console.log('Obteniendo usuarios...')
        usuariosXRole('', token)
          .then(data => {
            console.log('Respuesta usuariosXRole:', data)
            if(data.users){
              console.log('Usuarios encontrados:', data.users.length)
              const currentUser = data.users.find(u => u.id === userId)
              console.log('Usuario actual encontrado:', currentUser)
=======
        usuariosXRole('', token)
          .then(data => {
            if(data.users){
              const currentUser = data.users.find(u => u.id === userId)
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
              if(currentUser){
                const userData = {
                  id: currentUser.id,
                  name: `${currentUser.nombre} ${currentUser.apellido}`,
                  email: currentUser.email
                }
<<<<<<< HEAD
                console.log('Despachando setUser con:', userData)
                dispatch(setUser(userData))
              } else {
                console.log('No se encontró usuario con id:', userId)
              }
            } else {
              console.log('No hay users en la respuesta')
            }
          })
          .catch(error => {
            console.log('Error obteniendo usuarios:', error);
          })
      } else {
        console.log('No hay userId en localStorage')
=======
                dispatch(setUser(userData))
              }
            }
          })
          .catch(error => {
            console.error('Error obteniendo usuarios:', error);
          })
>>>>>>> 2e0844f41bf16653730d55dfef7847e2c8a9a256
      }
    }
  },[])

   useEffect(()=>{
  
          
          if(!socket) return
          
          const handleOperadorAsignado = (payload: string) => {
            toast.success(payload)
          }
         
  
          const handleError = (error: any) => {
              if (error.name === 'TokenExpiredError') {
                  dispatch(openSessionExpired())
                  return
              }
              dispatch(openSessionExpired())
              return
          }
  
      
  
          socket.on('error',handleError)
          socket.on('operador-asignado',handleOperadorAsignado)

  
  
          return () => {
              socket!.off('error', handleError)
              socket!.off('operador-asignado', handleOperadorAsignado)
          }
      },[socket]) 
  
  
  const handleSidebarClick = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  return (
    <>
      <Topbar />
      <section className="dash-layout">
        <div 
          className={`dash-sidebar ${sidebarExpanded ? 'expanded' : ''}`}
          onClick={handleSidebarClick}
        >
          <DashSidebar role={role!}/>
        </div>
        <div className="dash-body">
          <Outlet />
        </div>
        <ToastContainer
          autoClose={3000} 
          closeButton 
          pauseOnHover
          draggable
          limit={1}
        />
        <SessionExpiredModal 
          isOpen={sessionExpired}
          onClose={() => dispatch(closeSessionExpired())}
        />
        
        {/* <button 
          onClick={() => dispatch(openSessionExpired())}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 24px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            zIndex: 9998,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#dc2626'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#ef4444'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          🧪 Probar Modal Sesión
        </button> */}
      </section>
    </>
  )
}

export default Dashboard