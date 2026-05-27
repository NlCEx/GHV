import { useState, useEffect } from 'react'
import api from '../../api'
import './pesquisa.css'

const statusLabel = { ativa: 'Ativa', concluida: 'Concluída', rascunho: 'Rascunho' }

export default function Pesquisa() {
  const [pesquisas, setPesquisas] = useState([])
  const [form, setForm] = useState({ titulo: '', status: 'rascunho', data: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtro, setFiltro] = useState('todas')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const { data } = await api.get('/pesquisa')
      setPesquisas(data)
      setErro(null)
    } catch {
      setErro('Erro ao carregar pesquisas.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo) return
    try {
      const { data } = await api.post('/pesquisa', form)
      setPesquisas(prev => [data, ...prev])
      setForm({ titulo: '', status: 'rascunho', data: '' })
      setMostrarForm(false)
    } catch {
      alert('Erro ao salvar pesquisa.')
    }
  }

  async function handleRemover(id) {
    try {
      await api.delete(`/pesquisa/${id}`)
      setPesquisas(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Erro ao remover pesquisa.')
    }
  }

  const filtradas = filtro === 'todas' ? pesquisas : pesquisas.filter(p => p.status === filtro)
  const totalRespostas = pesquisas.reduce((s, p) => s + Number(p.respostas), 0)
  const ativas = pesquisas.filter(p => p.status === 'ativa').length

  return (
    <div className="pesquisa">
      <div className="pes-resumo">
        <div className="pes-stat">
          <span>Total de Pesquisas</span>
          <strong>{pesquisas.length}</strong>
        </div>
        <div className="pes-stat">
          <span>Pesquisas Ativas</span>
          <strong>{ativas}</strong>
        </div>
        <div className="pes-stat">
          <span>Total de Respostas</span>
          <strong>{totalRespostas}</strong>
        </div>
      </div>

      <div className="pes-box">
        <div className="pes-header">
          <div className="pes-filtros">
            {['todas', 'ativa', 'concluida', 'rascunho'].map(f => (
              <button
                key={f}
                className={`pes-filtro-btn ${filtro === f ? 'pes-filtro-btn--ativo' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f === 'todas' ? 'Todas' : statusLabel[f]}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? 'Cancelar' : '+ Nova Pesquisa'}
          </button>
        </div>

        {mostrarForm && (
          <form className="pes-form" onSubmit={handleSubmit}>
            <input placeholder="Título da pesquisa" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="rascunho">Rascunho</option>
              <option value="ativa">Ativa</option>
              <option value="concluida">Concluída</option>
            </select>
            <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            <button type="submit" className="btn-primary">Salvar</button>
          </form>
        )}

        {carregando && <p className="pes-vazio">Carregando...</p>}
        {erro && <p className="pes-vazio" style={{ color: 'var(--danger)' }}>{erro}</p>}

        {!carregando && !erro && (
          <div className="pes-lista">
            {filtradas.map(p => (
              <div key={p.id} className="pes-item">
                <div className="pes-item-info">
                  <span className="pes-item-titulo">{p.titulo}</span>
                  <span className="pes-item-data">
                    {p.data ? new Date(p.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                  </span>
                </div>
                <div className="pes-item-right">
                  <span className="pes-respostas">{p.respostas} respostas</span>
                  <span className={`pes-badge pes-badge--${p.status}`}>{statusLabel[p.status]}</span>
                  <button className="btn-remover" onClick={() => handleRemover(p.id)}>✕</button>
                </div>
              </div>
            ))}
            {filtradas.length === 0 && <p className="pes-vazio">Nenhuma pesquisa encontrada.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
