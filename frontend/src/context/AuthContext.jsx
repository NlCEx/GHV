import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ghv_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(({ data }) => setUsuario(data))
        .catch(() => logout())
        .finally(() => setCarregando(false))
    } else {
      setCarregando(false)
    }
  }, [])

  async function login(loginUsuario, senha, lembrar = false) {
    const { data } = await api.post('/auth/login', { login: loginUsuario, senha, lembrar })
    localStorage.setItem('ghv_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUsuario(data.usuario)
  }

  function logout() {
    localStorage.removeItem('ghv_token')
    delete api.defaults.headers.common['Authorization']
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
