import { useState, useEffect } from 'react'
import api from '../../api'
import './estoque.css'

export default function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState({ nome: '', categoria: '', qtd: '', preco: '', minimo: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const { data } = await api.get('/estoque')
      setProdutos(data)
      setErro(null)
    } catch {
      setErro('Erro ao carregar produtos.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome || !form.qtd) return
    try {
      const { data } = await api.post('/estoque', {
        ...form,
        qtd: Number(form.qtd),
        preco: Number(form.preco),
        minimo: Number(form.minimo)
      })
      setProdutos(prev => [...prev, data])
      setForm({ nome: '', categoria: '', qtd: '', preco: '', minimo: '' })
      setMostrarForm(false)
    } catch {
      alert('Erro ao salvar produto.')
    }
  }

  async function handleRemover(id) {
    try {
      await api.delete(`/estoque/${id}`)
      setProdutos(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Erro ao remover produto.')
    }
  }

  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busca.toLowerCase())
  )

  const totalItens = produtos.reduce((s, p) => s + Number(p.qtd), 0)
  const valorTotal = produtos.reduce((s, p) => s + Number(p.qtd) * Number(p.preco), 0)
  const abaixoMinimo = produtos.filter(p => Number(p.qtd) < Number(p.minimo)).length

  return (
    <div className="estoque">
      <div className="est-resumo">
        <div className="est-stat">
          <span>Total de Itens</span>
          <strong>{totalItens}</strong>
        </div>
        <div className="est-stat">
          <span>Valor em Estoque</span>
          <strong>R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className={`est-stat ${abaixoMinimo > 0 ? 'est-stat--alerta' : ''}`}>
          <span>Abaixo do Mínimo</span>
          <strong>{abaixoMinimo}</strong>
        </div>
      </div>

      <div className="est-box">
        <div className="est-header">
          <input className="est-busca" placeholder="Buscar produto ou categoria..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button className="btn-primary" onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? 'Cancelar' : '+ Novo Produto'}
          </button>
        </div>

        {mostrarForm && (
          <form className="est-form" onSubmit={handleSubmit}>
            <input placeholder="Nome" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
            <input placeholder="Categoria" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} />
            <input type="number" placeholder="Quantidade" value={form.qtd} onChange={e => setForm(p => ({ ...p, qtd: e.target.value }))} />
            <input type="number" placeholder="Preço (R$)" value={form.preco} onChange={e => setForm(p => ({ ...p, preco: e.target.value }))} />
            <input type="number" placeholder="Qtd Mínima" value={form.minimo} onChange={e => setForm(p => ({ ...p, minimo: e.target.value }))} />
            <button type="submit" className="btn-primary">Salvar</button>
          </form>
        )}

        {carregando && <p className="est-estado">Carregando...</p>}
        {erro && <p className="est-estado est-estado--erro">{erro}</p>}

        {!carregando && !erro && (
          <table className="est-tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Preço Unit.</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id}>
                  <td>{p.nome}</td>
                  <td><span className="est-cat">{p.categoria}</span></td>
                  <td>{p.qtd}</td>
                  <td>R$ {Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>R$ {(Number(p.qtd) * Number(p.preco)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`est-status ${Number(p.qtd) < Number(p.minimo) ? 'est-status--baixo' : 'est-status--ok'}`}>
                      {Number(p.qtd) < Number(p.minimo) ? 'Baixo' : 'OK'}
                    </span>
                  </td>
                  <td><button className="btn-remover" onClick={() => handleRemover(p.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
