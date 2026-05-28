import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import DashSidebar from "../../components/sidebars/DashSidebar";
import Topbar from "../../components/topbar/Topbar";
import SessionExpiredModal from "../../components/modal/SessionExpiredModal";
import { usuariosXRole } from "../../services/auth/auth.services";
import './dashboard.css'
import { useDispatch, useSelector  } from "react-redux";
import { connectSocket,  getSocket } from "../../app/slices/socketSlice";
import { setUser } from "../../app/slices/authSlice";
import { openSessionExpired, closeSessionExpired } from "../../app/slices/actionSlice";
import { RootState } from "../../app/store";
import { setupAxiosInterceptors } from "../../utils/axiosInterceptor";
import { useTokenRefresh } from "../../hooks/useTokenRefresh";
import { useMentionsSync } from "../../hooks/useMentionsSync";
import { getSocketAuthSessionReason } from "../../utils/authSession";



const Dashboard = () => {

  let role: string | null = localStorage.getItem('role')
  const dispatch = useDispatch()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const sessionExpired = useSelector((state: RootState) => state.action.sessionExpired)
  const sessionExpiredReason = useSelector((state: RootState) => state.action.sessionExpiredReason)
  const socketConnected = useSelector((state: RootState) => state.socket.isConnected)
  useMentionsSync()
  
  useEffect(() => {
    setupAxiosInterceptors()
  }, [])

  useTokenRefresh(2, 5)

  useEffect(() => {
    role = role ? localStorage.getItem('role') : null
  },[])

  useEffect(() => {
    try {
      dispatch(connectSocket())
    } catch (error) {
      console.error('Error conectando socket:', error);
    }
  },[dispatch])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    if(token){
      if(userId){
        usuariosXRole('', token)
          .then(data => {
            if(data.users){
              const currentUser = data.users.find(u => u.id === userId)
              if(currentUser){
                const userData = {
                  id: currentUser.id,
                  name: `${currentUser.nombre} ${currentUser.apellido}`,
                  email: currentUser.email
                }
                dispatch(setUser(userData))
              }
            }
          })
          .catch(error => {
            console.error('Error obteniendo usuarios:', error);
          })
      }
    }
  },[])

  useEffect(()=>{
    const socket = getSocket()
    if(!socket) return

    const handleOperadorAsignado = (payload: string) => {
      toast.success(payload)
    }

    const handleError = (error: any) => {
      const authReason = getSocketAuthSessionReason(error)
      if (authReason === 'expired') {
        dispatch(openSessionExpired('expired'))
        return
      }
      console.warn('Socket error sin expiración explícita de token:', error)
    }

    socket.on('error',handleError)
    socket.on('operador-asignado',handleOperadorAsignado)

    return () => {
      socket!.off('error', handleError)
      socket!.off('operador-asignado', handleOperadorAsignado)
    }
  },[socketConnected, dispatch]) 
  
  
  const handleSidebarClick = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  return (
    <>
      <Topbar />
      <section className="dash-layout">
        <div 
          className={`dash-sidebar ${sidebarExpanded ? 'expanded' : ''}`}
          onDoubleClick={handleSidebarClick}
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
          reason={sessionExpiredReason}
        />
      </section>
    </>
  )
}

export default Dashboard