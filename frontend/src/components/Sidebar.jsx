import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { path: '/dashboards', label: 'Dashboards', icon: '📊' },
  { path: '/financeiro', label: 'Financeiro', icon: '💰' },
  { path: '/estoque', label: 'Estoque', icon: '📦' },
  { path: '/pesquisa', label: 'Pesquisa', icon: '🔍' },
  { path: '/digisat', label: 'Digisat', icon: '📥' },
  { path: '/usuarios', label: 'Usuários', icon: '👥' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">GHV</span>
        <span className="sidebar-logo-sub">Sistema</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
