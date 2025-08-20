import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import DashSidebar from "../../components/sidebars/DashSidebar";
import { empresaXUser } from "../../services/empresas/empresa.services";
import './dashboard.css'
import { useDispatch  } from "react-redux";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "../../app/slices/socketSlice";
import { setEmpresa } from "../../app/slices/authSlice";
// import { RootState } from "../../app/store";



const Dashboard = () => {

  let role: string | null = localStorage.getItem('role')
  const dispatch = useDispatch()
  /* const alerta = useSelector((state: RootState) => state.action.alerta);
  const mensaje = useSelector((state: RootState) => state.action.msg); */
  
  let socket: Socket | null = null
  

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
                      /* alert('Su sesión ha caducado, por favor inicie sesión nuevamente');
                      navigate('/auth/signin')
                      return */
                  }
                  dispatch(disconnectSocket())
              }
          } catch (error) {
              console.log(error);
          }
    },[dispatch])
  

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if(token){
      empresaXUser(token)
        .then(data => {
          if(data.statusCode === 401){
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            return navigate('/auth/signin')
          }
          if(data?.empresa === null){
            return toast.warn('llenar los datos de su empresa')
          }
          dispatch(setEmpresa(data.empresa.nombre))
          
        })
        .catch(error => {
          console.log(error);
        })  
    }
  },[])

   useEffect(()=>{
  
          
          if(!socket) return
          
          const handleOperadorAsignado = (payload: string) => {
            toast.success(payload)
          }
         
  
          const handleError = (error: any) => {
              if (error.name === 'TokenExpiredError') {
                  alert('Su sesión ha caducado')
                  navigate('/auth/signin')
                  return
              }
              alert('Su sesión ha caducado')
              navigate('/auth/signin')
              return
          }
  
      
  
          socket.on('error',handleError)
          socket.on('operador-asignado',handleOperadorAsignado)

  
  
          return () => {
              socket!.off('error', handleError)
              socket!.off('operador-asignado', handleOperadorAsignado)
          }
      },[socket]) 
  
  
  return (
    <section className="dash-layout">
        <div className="dash-sidebar">
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
    </section>
  )
}

export default Dashboard