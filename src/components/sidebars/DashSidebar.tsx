import { HiCog, HiCpuChip, HiClipboardDocumentList, HiMiniUsers, HiMiniTicket } from "react-icons/hi2";
import { FaComments, FaMeta } from "react-icons/fa6";
import { FaTasks, FaAddressBook, FaThList, FaCodepen, FaTable } from "react-icons/fa";
import DashItem from '../items/DashItem'
import './dashsidebar.css'

type Props = {
  role: string  
}

const DashSidebar = ({ role }: Props) => {
  return (
    <div className='dashsidebar-container'>
        {(role === 'ROOT' || role === 'ADMIN')  && (
          <>
            <DashItem icon={HiCog} path='' titulo="Configuración"/>
            <DashItem icon={HiCpuChip} path='' titulo="BOT/IA"/>
            <DashItem icon={HiClipboardDocumentList} path='/dashboard/empresa' titulo="Empresa"/>
            <DashItem icon={FaComments} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={HiMiniTicket} path='' titulo="Tickets"/>
            <DashItem icon={FaAddressBook} path='' titulo="Clientes"/>
            <DashItem icon={FaMeta} path='/dashboard/meta' titulo="Meta"/>
            <DashItem icon={HiMiniUsers} path='/dashboard/usuarios' titulo="Usuarios"/>
            <DashItem icon={FaThList} path='/dashboard/estados' titulo="Estados"/>
            <DashItem icon={FaCodepen} path='/dashboard/modulos' titulo="Modulos"/>
            <DashItem icon={FaTable} path='/dashboard/categorias' titulo="Categorias"/>
            <DashItem icon={FaTasks} path='/dashboard/tareas' titulo="Tareas"/>
          </>
        )}
        {role === 'USER' && (
          <>
            <DashItem icon={FaComments} path='/dashboard/chats' titulo="Chats"/>
            <DashItem icon={HiMiniTicket} path='' titulo="Tickets"/>
            <DashItem icon={FaAddressBook} path='' titulo="Clientes"/>
          </>
        )}
        
    </div>
  )
}

export default DashSidebar