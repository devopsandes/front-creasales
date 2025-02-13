import { HiCog } from "react-icons/hi2";
import { HiCpuChip } from "react-icons/hi2";
import { FaComments } from "react-icons/fa6";
import { FaTasks } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import { FaThList } from "react-icons/fa";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { HiMiniUsers } from "react-icons/hi2";
import { HiMiniTicket } from "react-icons/hi2";
import { FaCodepen } from "react-icons/fa";
import { FaTable } from "react-icons/fa";
import DashItem from '../items/DashItem'
import './dashsidebar.css'

const DashSidebar = () => {
  return (
    <div className='dashsidebar-container'>
        <DashItem icon={HiCog} path='' titulo="Configuración"/>
        <DashItem icon={HiCpuChip} path='' titulo="BOT/IA"/>
        <DashItem icon={HiClipboardDocumentList} path='/dashboard/empresa' titulo="Empresa"/>
        <DashItem icon={FaComments} path='/dashboard/chats' titulo="Chats"/>
        <DashItem icon={HiMiniTicket} path='' titulo="Tickets"/>
        <DashItem icon={FaMeta} path='/dashboard/meta' titulo="Meta"/>
        <DashItem icon={HiMiniUsers} path='/dashboard/usuarios' titulo="Usuarios"/>
        <DashItem icon={FaThList} path='/dashboard/estados' titulo="Estados"/>
        <DashItem icon={FaCodepen} path='/dashboard/modulos' titulo="Modulos"/>
        <DashItem icon={FaTable} path='/dashboard/categorias' titulo="Categorias"/>
        <DashItem icon={FaTasks} path='/dashboard/tareas' titulo="Tareas"/>
    </div>
  )
}

export default DashSidebar