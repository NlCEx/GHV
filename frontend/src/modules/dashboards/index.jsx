import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
  AreaChart, Area,
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
const truncar = (s, n = 24) => !s ? '' : s.length > n ? s.substring(0, n) + '…' : s

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#00bcd4']
const MESES_ABR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const mesAtual = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function abreviarDescricao(desc, max = 28) {
  if (!desc) return ''
  const sem = desc
    .replace(/^[A-Z0-9\.\-]+\s+-\s+/i, '')
    .replace(/^(GHV|BIOTEC|FLEXPELL|UNICARE|PLAST JOIA|SINEPLAST|AVANUTRE|ARAKEN)\s+-?\s*/i, '')
  return sem.length > max ? sem.substring(0, max) + '…' : sem
}

function Variacao({ atual, anterior, invertido = false }) {
  if (anterior == null || anterior === 0) return null
  const pct = ((atual - anterior) / anterior) * 100
  const positivo = invertido ? pct <= 0 : pct >= 0
  return (
    <span className={`dash-badge ${positivo ? 'dash-badge--up' : 'dash-badge--down'}`}>
      {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export default function Dashboards() {
  const [resumo, setResumo] = useState(null)
  const [digisat, setDigisat] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [ultimosLancamentos, setUltimosLancamentos] = useState([])
  const [distribuicao, setDistribuicao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [mesFiltro, setMesFiltro] = useState(mesAtual)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef()

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const mesParam = mesFiltro ? `?mes=${mesFiltro}` : ''
      const [r, d, t, ul, dist] = await Promise.all([
        api.get(`/dashboards/resumo${mesParam}`),
        api.get('/dashboards/digisat'),
        api.get('/dashboards/tendencia'),
        api.get('/dashboards/ultimos-lancamentos'),
        api.get(`/dashboards/distribuicao${mesParam}`),
      ])
      setResumo(r.data)
      setDigisat(d.data)
      setTendencia(t.data)
      setUltimosLancamentos(ul.data)
      setDistribuicao(dist.data)
      setUltimaAtualizacao(new Date())
    } catch { /* silent */ }
    finally { setCarregando(false) }
  }, [mesFiltro])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') carregar() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [carregar])

  useEffect(() => {
    const id = setInterval(carregar, 60_000)
    return () => clearInterval(id)
  }, [carregar])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivoSelecionado(file)
    setUploadMsg('')
  }

  function cancelarSelecao() {
    setArquivoSelecionado(null)
    setUploadMsg('')
    fileRef.current.value = ''
  }

  async function confirmarImportacao() {
    if (!arquivoSelecionado) return
    setUploading(true)
    setUploadMsg('')
    const form = new FormData()
    form.append('pdf', arquivoSelecionado)
    try {
      const { data } = await api.post('/digisat/importar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadMsg(`✅ ${data.total_produtos} produtos importados!`)
      setArquivoSelecionado(null)
      fileRef.current.value = ''
      await carregar()
    } catch (err) {
      setUploadMsg('❌ ' + (err.response?.data?.erro || 'Erro ao importar PDF'))
    } finally {
      setUploading(false)
    }
  }

  const saldo = resumo ? resumo.receitas - resumo.despesas : 0
  const saldoAnterior = resumo?.anterior
    ? resumo.anterior.receitas - resumo.anterior.despesas
    : null

  // Tendência com saldo acumulado
  let acumulado = 0
  const tendenciaData = tendencia.map(t => {
    const [, m] = t.mes.split('-')
    const rec = Number(t.receitas)
    const des = Number(t.despesas)
    acumulado += rec - des
    return { mes: MESES_ABR[parseInt(m) - 1], receitas: rec, despesas: des, saldoAcumulado: acumulado }
  })

  const topChartData = (digisat?.topProdutos || []).map(p => ({
    nome: abreviarDescricao(p.descricao),
    valor: Number(p.total_vendas),
  }))

  const estoqueBaixoData = (digisat?.estoqueBaixo || []).map(p => ({
    nome: abreviarDescricao(p.descricao, 24),
    saldo: Number(p.saldo),
  }))

  const distReceitasData = (distribuicao?.receitas || []).map(r => ({
    nome: truncar(r.descricao),
    total: Number(r.total),
  }))

  const distDespesasData = (distribuicao?.despesas || []).map(r => ({
    nome: truncar(r.descricao),
    total: Number(r.total),
  }))

  const labelMes = mesFiltro
    ? `${MESES_ABR[parseInt(mesFiltro.split('-')[1]) - 1]} ${mesFiltro.split('-')[0]}`
    : 'Todos os períodos'

  return (
    <div className="dashboards">
      {/* ── Barra de filtro ── */}
      <div className="dash-filter-bar">
        <input
          type="month"
          value={mesFiltro}
          onChange={e => setMesFiltro(e.target.value)}
          className="dash-mes-input"
        />
        <button
          className={`dash-btn-todos${!mesFiltro ? ' active' : ''}`}
          onClick={() => setMesFiltro('')}
        >
          Todos os períodos
        </button>
        <button
          className={`dash-btn-refresh${carregando ? ' spinning' : ''}`}
          onClick={carregar}
          disabled={carregando}
          title="Atualizar dados"
        >
          🔄
        </button>
        {ultimaAtualizacao && (
          <span className="dash-update-time">
            {carregando ? 'Atualizando...' : `Atualizado às ${ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        )}
      </div>

      {/* Skeleton primeiro carregamento */}
      {carregando && !resumo && (
        <div className="dash-skeleton-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="dash-skeleton-card" />)}
        </div>
      )}

      {resumo && (
        <>
          {/* ── Cards Financeiros ── */}
          <div>
            <div className="dash-section-header">
              <span className="dash-section-title">Financeiro</span>
              <span className="dash-section-sub">{labelMes}</span>
            </div>
            <div className="dash-cards">
              {[
                {
                  label: 'Receitas',
                  value: `R$ ${fmt(resumo.receitas)}`,
                  color: 'success',
                  badge: <Variacao atual={resumo.receitas} anterior={resumo.anterior?.receitas} />,
                },
                {
                  label: 'Despesas',
                  value: `R$ ${fmt(resumo.despesas)}`,
                  color: 'danger',
                  badge: <Variacao atual={resumo.despesas} anterior={resumo.anterior?.despesas} invertido />,
                },
                {
                  label: 'Saldo',
                  value: `R$ ${fmt(saldo)}`,
                  color: saldo >= 0 ? 'success' : 'danger',
                  badge: <Variacao atual={saldo} anterior={saldoAnterior} />,
                },
                {
                  label: 'Itens em Estoque',
                  value: Number(resumo.estoque).toLocaleString('pt-BR'),
                  color: 'primary',
                },
                {
                  label: 'Pesquisas Ativas',
                  value: resumo.pesquisasAtivas,
                  color: 'warning',
                },
                {
                  label: 'Estoque Crítico',
                  value: resumo.produtosCriticos,
                  color: resumo.produtosCriticos > 0 ? 'danger' : 'success',
                },
              ].map(c => (
                <div key={c.label} className="dash-card">
                  <span className="dash-card-label">{c.label}</span>
                  <span className={`dash-card-value dash-card-value--${c.color}`}>{c.value}</span>
                  {c.badge}
                </div>
              ))}
            </div>
          </div>

          {/* ── Tendência + Saldo Acumulado ── */}
          {tendenciaData.length > 1 && (
            <div className="dash-charts">
              <div className="dash-chart-box">
                <h3>Receitas × Despesas — últimos {tendenciaData.length} meses</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tendenciaData} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={68} />
                    <Tooltip formatter={(v, n) => [`R$ ${fmt(v)}`, n === 'receitas' ? 'Receitas' : 'Despesas']} />
                    <Legend formatter={n => n === 'receitas' ? 'Receitas' : 'Despesas'} />
                    <Bar dataKey="receitas" name="receitas" fill="#34a853" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="despesas" name="despesas" fill="#ea4335" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="dash-chart-box">
                <h3>Saldo acumulado</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={tendenciaData} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={68} />
                    <Tooltip formatter={(v) => [`R$ ${fmt(v)}`, 'Saldo acumulado']} />
                    <Area
                      type="monotone"
                      dataKey="saldoAcumulado"
                      stroke="#1a73e8"
                      fill="url(#gradSaldo)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#1a73e8' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Distribuição por lançamento ── */}
          {(distReceitasData.length > 0 || distDespesasData.length > 0) && (
            <div className="dash-charts">
              {distReceitasData.length > 0 && (
                <div className="dash-chart-box">
                  <h3>Top receitas{mesFiltro ? ` — ${labelMes}` : ''}</h3>
                  <ResponsiveContainer width="100%" height={Math.max(160, distReceitasData.length * 36)}>
                    <BarChart data={distReceitasData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmtK(v)} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip formatter={(v) => [`R$ ${fmt(v)}`, 'Total']} />
                      <Bar dataKey="total" fill="#34a853" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {distDespesasData.length > 0 && (
                <div className="dash-chart-box">
                  <h3>Top despesas{mesFiltro ? ` — ${labelMes}` : ''}</h3>
                  <ResponsiveContainer width="100%" height={Math.max(160, distDespesasData.length * 36)}>
                    <BarChart data={distDespesasData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmtK(v)} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip formatter={(v) => [`R$ ${fmt(v)}`, 'Total']} />
                      <Bar dataKey="total" fill="#ea4335" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── Últimos lançamentos ── */}
          {ultimosLancamentos.length > 0 && (
            <div className="dash-chart-box">
              <h3>Últimos lançamentos</h3>
              <div className="dash-lancamentos">
                {ultimosLancamentos.map(l => (
                  <div key={l.id} className="dash-lancamento-row">
                    <span className="dash-lanc-data">
                      {new Date(l.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="dash-lanc-desc">{l.descricao}</span>
                    <span className={`dash-lanc-tipo dash-lanc-tipo--${l.tipo}`}>
                      {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                    <span className={`dash-lanc-valor ${l.tipo === 'receita' ? 'dash-card-value--success' : 'dash-card-value--danger'}`}>
                      {l.tipo === 'receita' ? '+' : '-'} R$ {fmt(l.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Digisat ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#374151' }}>
              📊 Dados Digisat
              {digisat?.importacao && (
                <span style={{ fontWeight: 400, fontSize: 13, color: '#6b7280', marginLeft: 10 }}>
                  — Período: {digisat.importacao.periodo} · importado em {new Date(digisat.importacao.criado_em).toLocaleDateString('pt-BR')}
                </span>
              )}
            </h3>

            {!arquivoSelecionado && !uploading && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                background: '#1a73e8', color: '#fff', borderRadius: 6, cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
              }}>
                📥 Carregar PDF Digisat
                <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}

            {arquivoSelecionado && !uploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 14px' }}>
                <span style={{ fontSize: 13, color: '#0369a1' }}>📄 {arquivoSelecionado.name}</span>
                <button
                  onClick={confirmarImportacao}
                  style={{ padding: '5px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >✅ Importar</button>
                <button
                  onClick={cancelarSelecao}
                  style={{ padding: '5px 10px', background: 'none', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                >Cancelar</button>
              </div>
            )}

            {uploading && <span style={{ fontSize: 13, color: '#6b7280' }}>⏳ Processando PDF...</span>}
            {uploadMsg && (
              <span style={{ fontSize: 13, color: uploadMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
                {uploadMsg}
              </span>
            )}
          </div>

          {!digisat ? (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: 15 }}>Nenhum dado Digisat importado.</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Clique em "Carregar PDF Digisat" para importar o relatório.</p>
            </div>
          ) : (
            <>
              <div className="dash-cards" style={{ marginBottom: 4 }}>
                {[
                  { label: 'Total de Vendas', value: `R$ ${fmt(digisat.resumo.total_vendas)}`, color: 'success' },
                  { label: 'Produtos Importados', value: digisat.resumo.total_produtos, color: 'primary' },
                  { label: 'Em Estoque', value: digisat.resumo.produtos_em_estoque, color: 'primary' },
                  { label: 'Estoque Total (un.)', value: Number(digisat.resumo.total_saldo).toLocaleString('pt-BR'), color: 'warning' },
                  { label: 'Maior Venda', value: `R$ ${fmt(digisat.resumo.maior_venda)}`, color: 'success' },
                ].map(c => (
                  <div key={c.label} className="dash-card">
                    <span className="dash-card-label">{c.label}</span>
                    <span className={`dash-card-value dash-card-value--${c.color}`}>{c.value}</span>
                  </div>
                ))}
              </div>

              <div className="dash-charts">
                <div className="dash-chart-box">
                  <h3>Top 10 Produtos — Total Vendido (R$)</h3>
                  {topChartData.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>Sem dados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={145} />
                        <Tooltip formatter={(v) => [`R$ ${fmt(v)}`, 'Total vendido']} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                          {topChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

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
