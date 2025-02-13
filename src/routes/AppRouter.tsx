import { Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Auth from '../layouts/auth/Auth'
import Login from '../pages/auth/login/Login'
import Register from '../pages/auth/register/Register'
import Message from '../components/messages/Message'
import RecuperarPass from '../pages/auth/recuperar-pass/RecuperarPass'
import Dashboard from '../layouts/dashboard/Dashboard'
import { RootState } from '../app/store'
import FormPass from '../pages/auth/form-pass/FormPass'
import PrivateRoute from './PrivateRoute'
import FormEmpresa from '../pages/empresa/FormEmpresa'
import DatosEmpresa from '../pages/empresa/DatosEmpresa'
import FormEstados from '../pages/estados/FormEstados'
import NavTag from '../components/navs/NavTag'
import FormMeta from '../pages/meta/FormMeta'
import FormModulos from '../pages/modulos/FormModulos'
import FormUsuarios from '../pages/usuarios/FormUsuarios'
import FormCategorias from '../pages/categorias/FormCategorias'
import FormTareas from '../pages/tareas/FormTareas'
import Chats from '../pages/chats/Chats'
import BusquedaChats from '../pages/chats/BusquedaChats'
import { navCategorias, navChats, navEmpresa, navEstados, navMeta, navModulos, navTareas, navUsuarios } from '../utils/navegacion'
import ListaChats from '../pages/chats/ListaChats'

const AppRouter = () => {
  const message = useSelector((state: RootState) => state.auth.message);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const authenticated = (): boolean => {
    const token = localStorage.getItem('token')

    if(isAuthenticated){
      return true
    }

    return token ? true : false
  }

 

  

  const msgLogin = `Su cuenta no ha sido validada, revise su casilla de email para validar la misma e inicie sesión`
  const msgValidacion = `Su cuenta ha sido validada correctamente ya puede iniciar sesión en la misma`

  return (
    <Routes>
        <Route path='/auth' element={<Auth />}>
          <Route path='signin' element={<Login />}/>
          <Route path='signup' element={<Register />}/>
          <Route path='recuperar-pass' element={<RecuperarPass />}/>
          <Route path='form-pass' element={<FormPass />}/>
          <Route path='mensaje' element={<Message msg={message} tipo={'auth'}  />}/>
          <Route path='mensaje-login' element={<Message msg={msgLogin} tipo={'auth'}  />}/>
          <Route path='mensaje-recuperar' element={<Message msg={msgLogin} tipo={'auth'}  />}/>
          <Route path='validar-cuenta' element={<Message msg={msgValidacion} tipo={'auth'}  />}/>
          <Route path='*' element={<Message msg={'404 Oops no hay nada en esta ruta...'} tipo={'auth'}  />}/>
        </Route>
        <Route path='/dashboard' element={
          <PrivateRoute isAuthenticated={authenticated()}>
            <Dashboard />
          </PrivateRoute>
          }
        >
          <Route path='empresa' element={<NavTag tags={navEmpresa} />}>
            <Route index element={<FormEmpresa/>}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='modulos' element={<NavTag tags={navModulos} />}>
            <Route index element={<FormModulos />}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='estados' element={<NavTag tags={navEstados} />}>
            <Route index element={<FormEstados/>}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='meta' element={<NavTag tags={navMeta} />}>
            <Route index element={<FormMeta />}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='usuarios' element={<NavTag tags={navUsuarios} />}>
            <Route index element={<FormUsuarios />}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='categorias' element={<NavTag tags={navCategorias} />}>
            <Route index element={<FormCategorias />}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='tareas' element={<NavTag tags={navTareas} />}>
            <Route index element={<FormTareas />}/>
            <Route path='datos' element={<DatosEmpresa/>}/>
          </Route>

          <Route path='chats' element={<NavTag tags={navChats} />}>
            <Route  element={<BusquedaChats />}>
              <Route index element={<ListaChats/>}/>
              <Route path=':id' element={<Chats/>}/>
            </Route >
            {/* <Route path=':id' element={<Chats/>}/> */}
          </Route>





        </Route>
       
        <Route path='*' element={<Auth />}>
          <Route path='*' element={<Message msg={'404 Oops no hay nada en esta ruta...'} tipo={'auth'} />}/>
        </Route>
    </Routes>
  )
}

export default AppRouter