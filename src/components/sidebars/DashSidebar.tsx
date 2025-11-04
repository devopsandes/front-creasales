import { 
  Settings, 
  Bot, 
  Building2, 
  MessageSquare, 
  TicketCheck, 
  UserCircle2, 
  UsersRound,
  ListChecks,
  Boxes,
  Grid3x3,
  CheckSquare,
  Tag,
  Plug2,
  LogOut
} from "lucide-react";
import { FaMeta } from "react-icons/fa6";
import DashItem from '../items/DashItem'
import './dashsidebar.css'
import { useNavigate } from "react-router-dom";

type Props = {
  role: string  
}



const DashSidebar = ({ role }: Props) => {

  const navigate = useNavigate();

  const handleLogout = () => {
  // Implement logout functionality here
  const cond = confirm("¿Estás seguro de que quieres cerrar sesión?");
    if(cond){
      localStorage.clear();
      navigate('/auth/signin');
    }
  }
  return (
    <div className='dashsidebar-container'>
        {(role === 'ROOT' || role === 'ADMIN')  && (
          <>
            <DashItem icon={Settings} path='/dashboard/configuracion' titulo="Configuración"/>
            <DashItem icon={Bot} path='/dashboard/bot' titulo="BOT/IA"/>
            <DashItem icon={Building2} path='/dashboard/empresa' titulo="Empresa"/>
            <DashItem icon={MessageSquare} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={TicketCheck} path='/dashboard/tickets' titulo="Tickets"/>
            <DashItem icon={UserCircle2} path='/dashboard/clientes' titulo="Clientes"/>
            <DashItem icon={FaMeta} path='/dashboard/meta' titulo="Meta"/>
            <DashItem icon={UsersRound} path='/dashboard/usuarios' titulo="Usuarios"/>
            <DashItem icon={ListChecks} path='/dashboard/estados' titulo="Estados"/>
            <DashItem icon={Boxes} path='/dashboard/modulos' titulo="Modulos"/>
            <DashItem icon={Grid3x3} path='/dashboard/categorias' titulo="Categorias"/>
            <DashItem icon={CheckSquare} path='/dashboard/acciones' titulo="Acciones"/>
            <DashItem icon={Tag} path='/dashboard/tags' titulo="Etiquetas"/>
            <DashItem icon={Plug2} path='/dashboard/integraciones' titulo="Integraciones"/>

            <div className="dashsidebar-logout" onClick={handleLogout}>
              <LogOut size={25} strokeWidth={1.5}/>
            </div>
          </>
        )}
        {role === 'USER' && (
          <>
            <DashItem icon={MessageSquare} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={TicketCheck} path='/dashboard/tickets' titulo="Tickets"/>
            <DashItem icon={UserCircle2} path='' titulo="Clientes"/>
          </>
        )}
        
    </div>
  )
}

export default DashSidebar