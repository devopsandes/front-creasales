import { Outlet } from "react-router-dom"

const BusquedaChats = () => {
  return (
    <div className="chats-container">
        <div className="main-chat">
          <Outlet />
        </div>
        <div className="sidebar-chat">
        </div>
    </div>
  )
}

export default BusquedaChats