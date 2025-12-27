import { Routes, Route } from 'react-router-dom'
import {  useSelector } from 'react-redux'
import { useEffect } from 'react'
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
import DatosMeta from '../pages/meta/DatosMeta'
import FormModulos from '../pages/modulos/FormModulos'
import FormCategorias from '../pages/categorias/FormCategorias'
import Configuracion from '../pages/configuracion/Configuracion'
import BotIA from '../pages/bot/BotIA'
import DashboardHome from '../pages/dashboard-home/DashboardHome'
import Chats from '../pages/chats/Chats'
import { navCategorias, navChats, navEmpresa, navEstados, navMeta, navModulos, navUsuarios, navTickets, navTags, navAcciones, navClientes, navIntegraciones } from '../utils/navegacion'
import ListaChats from '../pages/chats/ListaChats'
import LogoFondo from '../components/logo/LogoFondo'
import TableUsers from '../pages/usuarios/TableUsers'
import TableTickets from '../pages/tickets/TableTickets'
import TableTags from '../pages/tags/TableTags'
import TableAcciones from '../pages/acciones/TableAcciones'
import TableClientes from '../pages/clientes/TableClientes'
import Terminos from '../pages/legal/Terminos'
import EliminarDatos from '../pages/legal/EliminarDatos'
import MainView from '../pages/main/MainView'
import TableIntegraciones from '../pages/integraciones/TableIntegraciones'

const AppRouter = () => {
  const message = useSelector((state: RootState) => state.auth.message);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const role = localStorage.getItem('role')
  useEffect(() => {},[])

 
  const authenticated = (): boolean => {
    const token = localStorage.getItem('token')

    if(isAuthenticated){
      return true
    }

    return token ? true : false
  }

 

  

  const msgLogin = `Su cuenta no ha sido validada, revise su casilla de email para validar la misma e inicie sesión`
  const msgValidacion = `Su cuenta ha sido validada correctamente ya puede iniciar sesión en la misma`

  /* 
  TODO: Tener en cuenta los roles en los desarrollos
  TODO: realizar las rutas faltantes y las vistas de las mismas
  */

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
          <>
            <PrivateRoute isAuthenticated={authenticated()}>
              <Dashboard />
            </PrivateRoute>
          </>
          
          }
        >
          <Route index element={<DashboardHome />} />
          
          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='configuracion' element={<Configuracion />} />
          )}
          
          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='bot' element={<BotIA />} />
          )}
          
          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='empresa' element={<NavTag tags={navEmpresa} />}>
              <Route index element={<DatosEmpresa/>}/>
              <Route path='form' element={<FormEmpresa/>}/>
            </Route>
          )}
        
          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='modulos' element={<NavTag tags={navModulos} />}>
              <Route index element={<FormModulos />}/>
              <Route path='datos' element={<DatosEmpresa/>}/>
            </Route>
          )}

          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='estados' element={<NavTag tags={navEstados} />}>
              <Route index element={<FormEstados/>}/>
              <Route path='datos' element={<DatosEmpresa/>}/>
            </Route>
          )}

          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='meta' element={<NavTag tags={navMeta} />}>
              <Route index element={<FormMeta />}/>
              <Route path='datos' element={<DatosMeta/>}/>
            </Route>
          )}

          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='usuarios' element={<NavTag tags={navUsuarios} />}>
              {/* <Route index element={<FormUsuarios />}/> */}
              {/* <Route path='lista' element={<TableUsers/>}/> */}
              <Route index element={<TableUsers/>}/>
            </Route>
          )}

          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='categorias' element={<NavTag tags={navCategorias} />}>
              <Route index element={<FormCategorias />}/>
              <Route path='datos' element={<DatosEmpresa/>}/>
            </Route>
          )}

          {(role === 'ROOT' || role === 'ADMIN') && (
            <Route path='acciones' element={<NavTag tags={navAcciones} />}>
              <Route index element={<TableAcciones />}/>
            </Route>
          )}
        

          <Route path='chats' element={<NavTag tags={navChats} />}>
            <Route  element={<ListaChats />}>
              {/* <Route index element={<ListaChats/>}/> */}
              <Route index element={<LogoFondo />}/>
              <Route path=':id' element={<Chats/>}/>
            </Route >
            {/* <Route path=':id' element={<Chats/>}/> */}
          </Route>

          <Route path='tickets' element={<NavTag tags={navTickets} />}>
            <Route index element={<TableTickets/>}/>
          </Route>

          <Route path='clientes' element={<NavTag tags={navClientes} />}>
            <Route index element={<TableClientes/>}/>
          </Route>

          <Route path='tags' element={<NavTag tags={navTags} />}>
            <Route index element={<TableTags/>}/>
          </Route>

          <Route path='integraciones' element={<NavTag tags={navIntegraciones} />}>
            <Route index element={<TableIntegraciones/>}/>
          </Route>




        </Route>

        <Route path='/' element={<MainView />} />

        <Route path='/legal'>

          <Route path='terminos' element={<Terminos/>} />
          <Route path='eliminar' element={<EliminarDatos/>} />


        </Route>
       
        <Route path='*' element={<Auth />}>
          <Route path='*' element={<Message msg={'404 Oops no hay nada en esta ruta...'} tipo={'auth'} />}/>
        </Route>
    </Routes>
  )
}

export default AppRouter