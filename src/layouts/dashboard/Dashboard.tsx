import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import DashSidebar from "../../components/sidebars/DashSidebar";
import { empresaXUser } from "../../services/empresas/empresa.services";
import './dashboard.css'



const Dashboard = () => {

  let role: string | null = localStorage.getItem('role')

  useEffect(() => {
    role = role ? localStorage.getItem('role') : null
    
  },[])

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
            return toast.warn('Debe llenar los datos de su empresa')
          }
        })
        .catch(error => {
          console.log(error);
        })  
    }
  },[])
  
  return (
    <section className="dash-layout">
        <div className="dash-sidebar">
          <DashSidebar role={role!}/>

        </div>
        <div className="dash-body">
          <Outlet />
        </div>
        <ToastContainer />
    </section>
  )
}

export default Dashboard