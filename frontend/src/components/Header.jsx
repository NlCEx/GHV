import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const titles = {
  '/dashboards': 'Dashboards',
  '/financeiro': 'Financeiro',
  '/estoque': 'Estoque',
  '/pesquisa': 'Pesquisa',
}

export default function Header() {
  const { pathname } = useLocation()
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const title = titles[pathname] ?? 'GHV'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        <span className="header-user">{usuario?.nome}</span>
        <button className="header-logout" onClick={handleLogout}>Sair</button>
      </div>
    </header>
  )
}
