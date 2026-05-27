import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', senha: '', lembrar: false })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const loginSalvo = localStorage.getItem('ghv_login_salvo')
    if (loginSalvo) setForm(p => ({ ...p, login: loginSalvo, lembrar: true }))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(form.login, form.senha, form.lembrar)
      if (form.lembrar) {
        localStorage.setItem('ghv_login_salvo', form.login)
      } else {
        localStorage.removeItem('ghv_login_salvo')
      }
      navigate('/dashboards')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-box">
        <div className="login-logo">
          <span className="login-logo-text">GHV</span>
          <span className="login-logo-sub">Sistema</span>
        </div>

        <h2 className="login-titulo">Bem-vindo de volta</h2>
        <p className="login-sub">Faça login para acessar o sistema</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-campo">
            <label>Login</label>
            <input
              type="text"
              placeholder="seu usuário"
              value={form.login}
              onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="login-campo">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
              required
            />
          </div>

          <label className="login-lembrar">
            <input
              type="checkbox"
              checked={form.lembrar}
              onChange={e => setForm(p => ({ ...p, lembrar: e.target.checked }))}
            />
            <span>Salvar login</span>
          </label>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" className="login-btn" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="login-hint">Acesso padrão: admin / admin123</p>
      </div>
    </div>
  )
}
