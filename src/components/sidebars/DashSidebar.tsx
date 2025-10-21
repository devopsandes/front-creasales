import { HiCog, HiCpuChip, HiClipboardDocumentList, HiMiniUsers, HiMiniTicket } from "react-icons/hi2";
import { FaComments, FaMeta } from "react-icons/fa6";
import { IoMdLogOut } from "react-icons/io";
import { FaTasks, FaAddressBook, FaThList, FaCodepen, FaTable, FaTags, FaPlug } from "react-icons/fa";
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
            <DashItem icon={HiCog} path='' titulo="Configuración"/>
            <DashItem icon={HiCpuChip} path='' titulo="BOT/IA"/>
            <DashItem icon={HiClipboardDocumentList} path='/dashboard/empresa' titulo="Empresa"/>
            <DashItem icon={FaComments} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={HiMiniTicket} path='/dashboard/tickets' titulo="Tickets"/>
            <DashItem icon={FaAddressBook} path='/dashboard/clientes' titulo="Clientes"/>
            <DashItem icon={FaMeta} path='/dashboard/meta' titulo="Meta"/>
            <DashItem icon={HiMiniUsers} path='/dashboard/usuarios' titulo="Usuarios"/>
            <DashItem icon={FaThList} path='/dashboard/estados' titulo="Estados"/>
            <DashItem icon={FaCodepen} path='/dashboard/modulos' titulo="Modulos"/>
            <DashItem icon={FaTable} path='/dashboard/categorias' titulo="Categorias"/>
            <DashItem icon={FaTasks} path='/dashboard/acciones' titulo="Acciones"/>
            <DashItem icon={FaTags} path='/dashboard/tags' titulo="Etiquetas"/>
            <DashItem icon={FaPlug} path='/dashboard/integraciones' titulo="Integraciones"/>

            <div className="dashsidebar-logout" onClick={handleLogout}>
              <IoMdLogOut size={25}/>
            </div>
          </>
        )}
        {role === 'USER' && (
          <>
            <DashItem icon={FaComments} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={HiMiniTicket} path='/dashboard/tickets' titulo="Tickets"/>
            <DashItem icon={FaAddressBook} path='' titulo="Clientes"/>
          </>
        )}
        
    </div>
  )
}

export default DashSidebar