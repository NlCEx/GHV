import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboards from './modules/dashboards'
import Financeiro from './modules/financeiro'
import Estoque from './modules/estoque'
import Pesquisa from './modules/pesquisa'
import Usuarios from './modules/usuarios'
import Digisat from './modules/digisat'

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return <div style={{ padding: 40, color: '#888' }}>Carregando...</div>
  return usuario ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <RotaProtegida>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboards" replace />} />
              <Route path="/dashboards" element={<Dashboards />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/pesquisa" element={<Pesquisa />} />
              <Route path="/digisat" element={<Digisat />} />
              <Route path="/usuarios" element={<Usuarios />} />
            </Routes>
          </Layout>
        </RotaProtegida>
      } />
    </Routes>
  )
}
