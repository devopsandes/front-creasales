import { 
  Settings, 
  Bot, 
  Building2, 
  MessageCircle, 
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
import QuickReplies from "../icons/QuickReplies";
import DashItem from '../items/DashItem'
import LogoutModal from '../modal/LogoutModal'
import './dashsidebar.css'
import { useNavigate } from "react-router-dom";
import { useState } from "react";

type Props = {
  role: string  
}



const DashSidebar = ({ role }: Props) => {

  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  }

  const handleLogoutConfirm = () => {
    localStorage.clear();
    navigate('/auth/signin');
    setIsLogoutModalOpen(false);
  }

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  }
  return (
    <div className='dashsidebar-container'>
        {(role === 'ROOT' || role === 'ADMIN')  && (
          <>
            <DashItem icon={Building2} path='/dashboard/empresa' titulo="Empresa"/>
            <DashItem icon={MessageCircle} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={TicketCheck} path='/dashboard/tickets' titulo="Tickets"/>
            <DashItem icon={UserCircle2} path='/dashboard/clientes' titulo="Clientes"/>
            <DashItem icon={QuickReplies} path='/dashboard/respuestas-rapidas' titulo="Respuestas rápidas"/>
            <DashItem icon={FaMeta} path='/dashboard/meta' titulo="Meta"/>
            <DashItem icon={UsersRound} path='/dashboard/usuarios' titulo="Usuarios"/>
            <DashItem icon={Bot} path='/dashboard/bot' titulo="BOT/IA"/>
            <DashItem icon={ListChecks} path='/dashboard/estados' titulo="Estados"/>
            <DashItem icon={Boxes} path='/dashboard/modulos' titulo="Modulos"/>
            <DashItem icon={Grid3x3} path='/dashboard/categorias' titulo="Categorias"/>
            <DashItem icon={CheckSquare} path='/dashboard/acciones' titulo="Acciones"/>
            <DashItem icon={Tag} path='/dashboard/tags' titulo="Etiquetas"/>
            <DashItem icon={Settings} path='/dashboard/configuracion' titulo="Configuración"/>
            <DashItem icon={Plug2} path='/dashboard/integraciones' titulo="Integraciones"/>

            <div className="dashsidebar-logout" onClick={handleLogoutClick}>
              <LogOut size={25} strokeWidth={1.5}/>
            </div>
          </>
        )}
        {role === 'USER' && (
          <>
            <DashItem icon={MessageCircle} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={TicketCheck} path='/dashboard/tickets' titulo="Tickets"/>
            <DashItem icon={UserCircle2} path='/dashboard/clientes' titulo="Clientes"/>
            <DashItem icon={QuickReplies} path='/dashboard/respuestas-rapidas' titulo="Respuestas rápidas"/>

            <div className="dashsidebar-logout" onClick={handleLogoutClick}>
              <LogOut size={25} strokeWidth={1.5}/>
            </div>
          </>
        )}
        
        <LogoutModal 
          isOpen={isLogoutModalOpen}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
        />
    </div>
  )
}

export default DashSidebar