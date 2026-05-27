import { useState, useEffect } from 'react'
import api from '../../api'
import './financeiro.css'

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([])
  const [form, setForm] = useState({ descricao: '', tipo: 'receita', valor: '', data: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const { data } = await api.get('/financeiro')
      setLancamentos(data)
      setErro(null)
    } catch {
      setErro('Erro ao carregar lançamentos.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data) return
    try {
      const { data } = await api.post('/financeiro', { ...form, valor: Number(form.valor) })
      setLancamentos(prev => [data, ...prev])
      setForm({ descricao: '', tipo: 'receita', valor: '', data: '' })
      setMostrarForm(false)
    } catch {
      alert('Erro ao salvar lançamento.')
    }
  }

  async function handleRemover(id) {
    try {
      await api.delete(`/financeiro/${id}`)
      setLancamentos(prev => prev.filter(l => l.id !== id))
    } catch {
      alert('Erro ao remover lançamento.')
    }
  }

  const totalReceitas = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + Number(l.valor), 0)
  const totalDespesas = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + Number(l.valor), 0)
  const saldo = totalReceitas - totalDespesas

  return (
    <div className="financeiro">
      <div className="fin-resumo">
        <div className="fin-card fin-card--receita">
          <span>Total Receitas</span>
          <strong>R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className="fin-card fin-card--despesa">
          <span>Total Despesas</span>
          <strong>R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className={`fin-card fin-card--saldo ${saldo >= 0 ? 'fin-card--pos' : 'fin-card--neg'}`}>
          <span>Saldo</span>
          <strong>R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
      </div>

      <div className="fin-tabela-box">
        <div className="fin-tabela-header">
          <h3>Lançamentos</h3>
          <button className="btn-primary" onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? 'Cancelar' : '+ Novo Lançamento'}
          </button>
        </div>

        {mostrarForm && (
          <form className="fin-form" onSubmit={handleSubmit}>
            <input placeholder="Descrição" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
            <input type="number" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
            <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            <button type="submit" className="btn-primary">Salvar</button>
          </form>
        )}

        {carregando && <p className="fin-estado">Carregando...</p>}
        {erro && <p className="fin-estado fin-estado--erro">{erro}</p>}

        {!carregando && !erro && (
          <table className="fin-tabela">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map(l => (
                <tr key={l.id}>
                  <td>{l.descricao}</td>
                  <td>
                    <span className={`fin-badge fin-badge--${l.tipo}`}>
                      {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className={l.tipo === 'receita' ? 'fin-valor--pos' : 'fin-valor--neg'}>
                    {l.tipo === 'despesa' ? '-' : '+'}R$ {Number(l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>{new Date(l.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td><button className="btn-remover" onClick={() => handleRemover(l.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
