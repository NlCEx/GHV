import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import api from '../../api'
import './dashboards.css'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = v => {
  const n = Number(v || 0)
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
  return `R$ ${fmt(n)}`
}

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#00bcd4', '#ff7043', '#8bc34a', '#795548', '#607d8b']

function abreviarDescricao(desc, max = 28) {
  if (!desc) return ''
  // Remove brand prefix (before first " - " or first space word)
  const sem = desc.replace(/^[A-Z0-9\.\-]+\s+-\s+/i, '').replace(/^(GHV|BIOTEC|FLEXPELL|UNICARE|PLAST JOIA|SINEPLAST|AVANUTRE|ARAKEN)\s+-?\s*/i, '')
  return sem.length > max ? sem.substring(0, max) + '…' : sem
}

export default function Dashboards() {
  const [resumo, setResumo] = useState(null)
  const [digisat, setDigisat] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    try {
      const [r, d] = await Promise.all([
        api.get('/dashboards/resumo'),
        api.get('/dashboards/digisat'),
      ])
      setResumo(r.data)
      setDigisat(d.data)
    } catch { /* silent */ }
    finally { setCarregando(false) }
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadMsg('')
    setUploading(true)
    const form = new FormData()
    form.append('pdf', file)
    try {
      const { data } = await api.post('/digisat/importar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadMsg(`✅ ${data.total_produtos} produtos importados`)
      await carregar()
    } catch (err) {
      setUploadMsg('❌ ' + (err.response?.data?.erro || 'Erro ao importar PDF'))
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const saldo = resumo ? resumo.receitas - resumo.despesas : 0

  const topChartData = (digisat?.topProdutos || []).map(p => ({
    nome: abreviarDescricao(p.descricao),
    valor: Number(p.total_vendas),
    saldo: Number(p.saldo),
  }))

  const estoqueBaixoData = (digisat?.estoqueBaixo || []).map(p => ({
    nome: abreviarDescricao(p.descricao, 24),
    saldo: Number(p.saldo),
  }))

  return (
    <div className="dashboards">
      {carregando ? (
        <p style={{ color: '#888', padding: 20 }}>Carregando dados...</p>
      ) : (
        <>
          {/* ── Financeiro cards ── */}
          {resumo && (
            <div className="dash-cards">
              {[
                { label: 'Receita Total', value: `R$ ${fmt(resumo.receitas)}`, color: 'success' },
                { label: 'Despesas', value: `R$ ${fmt(resumo.despesas)}`, color: 'danger' },
                { label: 'Saldo', value: `R$ ${fmt(saldo)}`, color: saldo >= 0 ? 'primary' : 'danger' },
                { label: 'Itens em Estoque', value: resumo.estoque, color: 'primary' },
                { label: 'Pesquisas Ativas', value: resumo.pesquisasAtivas, color: 'warning' },
              ].map(c => (
                <div key={c.label} className="dash-card">
                  <span className="dash-card-label">{c.label}</span>
                  <span className="dash-card-value">{c.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Digisat section ── */}
          <div style={{ margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#374151' }}>
              📊 Dados Digisat
              {digisat?.importacao && (
                <span style={{ fontWeight: 400, fontSize: 13, color: '#6b7280', marginLeft: 10 }}>
                  — Período: {digisat.importacao.periodo} · importado em {new Date(digisat.importacao.criado_em).toLocaleDateString('pt-BR')}
                </span>
              )}
            </h3>

            {/* Upload button */}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
              background: '#1a73e8', color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
              fontSize: 13, fontWeight: 500, opacity: uploading ? 0.7 : 1,
            }}>
              {uploading ? '⏳ Processando...' : '📥 Carregar PDF Digisat'}
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            {uploadMsg && <span style={{ fontSize: 13, color: uploadMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{uploadMsg}</span>}
          </div>

          {!digisat ? (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: 15 }}>Nenhum dado Digisat importado.</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Clique em "Carregar PDF Digisat" para importar o relatório.</p>
            </div>
          ) : (
            <>
              {/* Digisat KPI cards */}
              <div className="dash-cards" style={{ marginBottom: 20 }}>
                {[
                  { label: 'Total de Vendas', value: `R$ ${fmt(digisat.resumo.total_vendas)}`, color: 'success' },
                  { label: 'Produtos Importados', value: digisat.resumo.total_produtos, color: 'primary' },
                  { label: 'Em Estoque', value: digisat.resumo.produtos_em_estoque, color: 'primary' },
                  { label: 'Estoque Total (un.)', value: Number(digisat.resumo.total_saldo).toLocaleString('pt-BR'), color: 'warning' },
                  { label: 'Maior Venda', value: `R$ ${fmt(digisat.resumo.maior_venda)}`, color: 'success' },
                ].map(c => (
                  <div key={c.label} className="dash-card">
                    <span className="dash-card-label">{c.label}</span>
                    <span className="dash-card-value">{c.value}</span>
                  </div>
                ))}
              </div>

              <div className="dash-charts">
                {/* Top 10 produtos por vendas */}
                <div className="dash-chart-box">
                  <h3>Top 10 Produtos — Total Vendido (R$)</h3>
                  {topChartData.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>Sem dados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={145} />
                        <Tooltip formatter={(v, n) => [`R$ ${fmt(v)}`, 'Total vendido']} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                          {topChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Estoque baixo */}
                <div className="dash-chart-box">
                  <h3>⚠️ Produtos com Estoque Baixo (≤ 10 un.)</h3>
                  {estoqueBaixoData.length === 0 ? (
                    <p style={{ color: '#16a34a', fontSize: 13 }}>Nenhum produto com estoque crítico.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={estoqueBaixoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={145} />
                        <Tooltip formatter={(v) => [v + ' un.', 'Saldo']} />
                        <Bar dataKey="saldo" radius={[0, 4, 4, 0]}>
                          {estoqueBaixoData.map((entry, i) => (
                            <Cell key={i} fill={entry.saldo === 0 ? '#ef4444' : entry.saldo <= 5 ? '#f97316' : '#fbbf24'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
