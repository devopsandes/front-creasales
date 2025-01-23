import { HiCog } from "react-icons/hi2";
import { HiCpuChip } from "react-icons/hi2";
import { FaComments } from "react-icons/fa6";
import { LuListCollapse } from "react-icons/lu";
import { FaMeta } from "react-icons/fa6";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { HiMiniUsers } from "react-icons/hi2";
import { HiMiniTicket } from "react-icons/hi2";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import DashItem from '../items/DashItem'
import './dashsidebar.css'

const DashSidebar = () => {
  return (
    <div className='dashsidebar-container'>
        <DashItem icon={HiCog} path='' titulo="Configuración"/>
        <DashItem icon={HiCpuChip} path='' titulo="BOT/IA"/>
        <DashItem icon={HiClipboardDocumentList} path='/dashboard/empresa' titulo="Empresa"/>
        <DashItem icon={FaComments} path='' titulo="Chats"/>
        <DashItem icon={LuListCollapse} path='/dashboard/estados' titulo="Estados"/>
        <DashItem icon={HiMiniTicket} path='' titulo="Tickets"/>
        <DashItem icon={FaMeta} path='/dashboard/meta' titulo="Meta"/>
        <DashItem icon={HiMiniUsers} path='/dashboard/usuarios' titulo="Usuarios"/>
        <DashItem icon={HiMiniWrenchScrewdriver} path='/dashboard/modulos' titulo="Modulos"/>
    </div>
  )
}

export default DashSidebar