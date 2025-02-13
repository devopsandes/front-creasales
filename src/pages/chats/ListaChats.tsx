import { Link } from "react-router-dom"

const ListaChats = () => {
  return (
    <div className='main-chat'>
        <div className="header-lista">
            <div className="header-item">
                <p>Estado</p>
                <select name="" id="" className="select-empresa">
                    <option value="">Opcion 1</option>
                </select>
            </div>
            <div className="header-item">
                <p>Categoria</p>
                <select name="" id="" className="select-empresa">
                    <option value="">Opcion 1</option>
                </select>
            </div>
            <div className="header-item">
                <p>Operador</p>
                <select name="" id="" className="select-empresa">
                    <option value="">Opcion 1</option>
                </select>
            </div>
        </div>
        <div className="lista-main">
            <div className="col-lista">
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link> 
               
            </div>
            <div className="col-lista">
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link> 
            </div>
            <div className="col-lista">
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link>
                <Link to="/dashboard/chats/sarasa" className="item-lista">chat</Link> 
            </div>
        </div>
    </div>
  )
}

export default ListaChats