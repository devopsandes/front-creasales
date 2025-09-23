import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import { Provider } from 'react-redux'
import './index.css'
import store from './app/store.ts'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
        <Router>
          <Routes>
            <Route path='/*' element={<App />}/>
          </Routes>
        </Router>
    </Provider> 
  </StrictMode>,
)


