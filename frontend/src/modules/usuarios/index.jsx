import { useState, useEffect } from 'react'
import api from '../../api'
import './usuarios.css'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nome: '', login: '', senha: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [senhaEditar, setSenhaEditar] = useState({ id: null, valor: '' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const { data } = await api.get('/usuarios')
      setUsuarios(data)
      setErro(null)
    } catch {
      setErro('Erro ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleCriar(e) {
    e.preventDefault()
    if (!form.nome || !form.login || !form.senha) return
    try {
      const { data } = await api.post('/usuarios', form)
      setUsuarios(prev => [data, ...prev])
      setForm({ nome: '', login: '', senha: '' })
      setMostrarForm(false)
      setErro(null)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar usuário.')
    }
  }

  async function handleRemover(id) {
    if (!confirm('Remover este usuário?')) return
    try {
      await api.delete(`/usuarios/${id}`)
      setUsuarios(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao remover usuário.')
    }
  }

  async function handleTrocarSenha(id) {
    if (!senhaEditar.valor) return
    try {
      await api.put(`/usuarios/${id}/senha`, { senha: senhaEditar.valor })
      setSenhaEditar({ id: null, valor: '' })
      alert('Senha alterada com sucesso.')
    } catch {
      alert('Erro ao alterar senha.')
    }
  }

  return (
    <div className="usuarios">
      <div className="usr-header">
        <div className="usr-info">
          <h3>{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</h3>
        </div>
        <button className="btn-primary" onClick={() => { setMostrarForm(v => !v); setErro(null) }}>
          {mostrarForm ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {mostrarForm && (
        <div className="usr-form-box">
          <h4>Novo Usuário</h4>
          <form className="usr-form" onSubmit={handleCriar}>
            <div className="usr-campo">
              <label>Nome completo</label>
              <input
                placeholder="Ex: João Silva"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="usr-campo">
              <label>Login</label>
              <input
                placeholder="Ex: joao.silva"
                value={form.login}
                onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
              />
            </div>
            <div className="usr-campo">
              <label>Senha inicial</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
              />
            </div>
            {erro && <p className="usr-erro">{erro}</p>}
            <button type="submit" className="btn-primary">Criar Usuário</button>
          </form>
        </div>
      )}

      {carregando && <p className="usr-estado">Carregando...</p>}

      {!carregando && (
        <div className="usr-lista">
          {usuarios.map(u => (
            <div key={u.id} className="usr-item">
              <div className="usr-avatar">{u.nome.charAt(0).toUpperCase()}</div>
              <div className="usr-dados">
                <span className="usr-nome">{u.nome}</span>
                <span className="usr-login">@{u.login}</span>
              </div>
              <div className="usr-desde">
                Desde {new Date(u.criado_em).toLocaleDateString('pt-BR')}
              </div>

              <div className="usr-acoes">
                {senhaEditar.id === u.id ? (
                  <div className="usr-senha-form">
                    <input
                      type="password"
                      placeholder="Nova senha"
                      value={senhaEditar.valor}
                      onChange={e => setSenhaEditar(p => ({ ...p, valor: e.target.value }))}
                      autoFocus
                    />
                    <button className="btn-salvar" onClick={() => handleTrocarSenha(u.id)}>Salvar</button>
                    <button className="btn-cancelar" onClick={() => setSenhaEditar({ id: null, valor: '' })}>✕</button>
                  </div>
                ) : (
                  <button className="btn-senha" onClick={() => setSenhaEditar({ id: u.id, valor: '' })}>
                    Trocar senha
                  </button>
                )}
                <button className="btn-remover" onClick={() => handleRemover(u.id)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
