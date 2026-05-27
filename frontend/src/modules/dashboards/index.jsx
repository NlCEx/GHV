import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import api from '../../api'
import './dashboards.css'

const vendasData = [
  { mes: 'Jan', valor: 12000 },
  { mes: 'Fev', valor: 18500 },
  { mes: 'Mar', valor: 15000 },
  { mes: 'Abr', valor: 22000 },
  { mes: 'Mai', valor: 19000 },
  { mes: 'Jun', valor: 27000 },
]

const estoqueData = [
  { categoria: 'Eletrônicos', qtd: 45 },
  { categoria: 'Roupas', qtd: 120 },
  { categoria: 'Alimentos', qtd: 200 },
  { categoria: 'Outros', qtd: 80 },
]

export default function Dashboards() {
  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/dashboards/resumo')
      .then(({ data }) => setResumo(data))
      .catch(() => setResumo(null))
      .finally(() => setCarregando(false))
  }, [])

  const saldo = resumo ? resumo.receitas - resumo.despesas : 0

  const cards = resumo
    ? [
        { label: 'Receita Total', value: `R$ ${resumo.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'success' },
        { label: 'Despesas', value: `R$ ${resumo.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'danger' },
        { label: 'Saldo', value: `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: saldo >= 0 ? 'primary' : 'danger' },
        { label: 'Itens em Estoque', value: resumo.estoque, color: 'primary' },
        { label: 'Pesquisas Ativas', value: resumo.pesquisasAtivas, color: 'warning' },
      ]
    : []

  return (
    <div className="dashboards">
      {carregando && <p style={{ color: '#888' }}>Carregando dados...</p>}

      {!carregando && (
        <>
          <div className="dash-cards">
            {cards.map(card => (
              <div key={card.label} className="dash-card">
                <span className="dash-card-label">{card.label}</span>
                <span className="dash-card-value">{card.value}</span>
              </div>
            ))}
          </div>

          <div className="dash-charts">
            <div className="dash-chart-box">
              <h3>Receita Mensal (exemplo)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={vendasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `R$ ${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="valor" stroke="#1a73e8" fill="#e8f0fe" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-chart-box">
              <h3>Estoque por Categoria (exemplo)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={estoqueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
