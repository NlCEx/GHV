import { useState, useEffect, useRef } from 'react'
import api from '../../api'

const fmt = v => v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = v => v == null ? '—' : Number(v).toLocaleString('pt-BR')

export default function Digisat() {
  const [importacoes, setImportacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [importacaoAberta, setImportacaoAberta] = useState(null)
  const [itens, setItens] = useState([])
  const [carregandoItens, setCarregandoItens] = useState(false)
  const [busca, setBusca] = useState('')
  const fileRef = useRef()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    try {
      const { data } = await api.get('/digisat/importacoes')
      setImportacoes(data)
    } catch { setErro('Erro ao carregar importações.') }
    finally { setCarregando(false) }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivoSelecionado(file)
    setErro('')
    setSucesso('')
  }

  function cancelarSelecao() {
    setArquivoSelecionado(null)
    setErro('')
    setSucesso('')
    fileRef.current.value = ''
  }

  async function confirmarImportacao() {
    if (!arquivoSelecionado) return
    setErro('')
    setSucesso('')
    setUploading(true)
    const form = new FormData()
    form.append('pdf', arquivoSelecionado)
    try {
      const { data } = await api.post('/digisat/importar', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSucesso(`Importação concluída: ${data.total_produtos} produtos importados.`)
      setArquivoSelecionado(null)
      fileRef.current.value = ''
      await carregar()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao importar PDF.')
    } finally {
      setUploading(false)
    }
  }

  async function abrirImportacao(imp) {
    if (importacaoAberta?.id === imp.id) { setImportacaoAberta(null); setItens([]); return }
    setImportacaoAberta(imp)
    setBusca('')
    setCarregandoItens(true)
    try {
      const { data } = await api.get(`/digisat/importacoes/${imp.id}/itens`)
      setItens(data)
    } catch { setErro('Erro ao carregar itens.') }
    finally { setCarregandoItens(false) }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta importação?')) return
    await api.delete(`/digisat/importacoes/${id}`)
    if (importacaoAberta?.id === id) { setImportacaoAberta(null); setItens([]) }
    await carregar()
  }

  const itensFiltrados = itens.filter(it =>
    !busca || it.descricao?.toLowerCase().includes(busca.toLowerCase()) || it.codigo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>Importação Digisat</h2>

      {/* Upload */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px #0001', border: '2px dashed #d1d5db' }}>
        <p style={{ margin: '0 0 4px', color: '#374151', fontWeight: 500 }}>Importar relatório PDF do Digisat</p>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>Selecione o relatório "Itens vendidos" exportado do sistema Digisat e clique em Importar.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Passo 1: selecionar arquivo */}
          {!arquivoSelecionado && !uploading && (
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              background: '#1a73e8', color: '#fff', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}>
              📂 Selecionar PDF
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          )}

          {/* Passo 2: confirmar importação */}
          {arquivoSelecionado && !uploading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 14px' }}>
                <span style={{ fontSize: 13, color: '#0369a1' }}>📄 {arquivoSelecionado.name}</span>
              </div>
              <button
                onClick={confirmarImportacao}
                style={{ padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                ✅ Importar agora
              </button>
              <button
                onClick={cancelarSelecao}
                style={{ padding: '8px 14px', background: 'none', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}
              >
                Cancelar
              </button>
            </>
          )}

          {uploading && <span style={{ color: '#6b7280', fontSize: 14 }}>⏳ Processando PDF...</span>}
        </div>

        {erro && <p style={{ color: '#dc2626', marginTop: 12, fontSize: 14 }}>{erro}</p>}
        {sucesso && <p style={{ color: '#16a34a', marginTop: 12, fontSize: 14 }}>{sucesso}</p>}
      </div>

      {/* Lista de importações */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px #0001', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Importações realizadas</h3>
        </div>

        {carregando ? (
          <p style={{ padding: 20, color: '#9ca3af' }}>Carregando...</p>
        ) : importacoes.length === 0 ? (
          <p style={{ padding: 20, color: '#9ca3af' }}>Nenhuma importação encontrada.</p>
        ) : (
          importacoes.map(imp => (
            <div key={imp.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', gap: 16 }}
                onClick={() => abrirImportacao(imp)}
              >
                <span style={{ fontSize: 20 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{imp.arquivo_nome}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {imp.periodo && <span style={{ marginRight: 12 }}>Período: {imp.periodo}</span>}
                    <span style={{ marginRight: 12 }}>{imp.total_produtos} produtos</span>
                    <span>Total vendas: R$ {fmt(imp.total_vendas)}</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {new Date(imp.criado_em).toLocaleString('pt-BR')}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); excluir(imp.id) }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: '2px 8px' }}
                  title="Excluir"
                >🗑</button>
                <span style={{ color: '#9ca3af' }}>{importacaoAberta?.id === imp.id ? '▲' : '▼'}</span>
              </div>

              {importacaoAberta?.id === imp.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f9fafb' }}>
                  <div style={{ display: 'flex', gap: 12, margin: '14px 0 12px' }}>
                    <input
                      placeholder="Buscar por código ou descrição..."
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      style={{ flex: 1, padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                    />
                    <span style={{ color: '#6b7280', fontSize: 13, alignSelf: 'center' }}>
                      {itensFiltrados.length} de {itens.length} produtos
                    </span>
                  </div>

                  {carregandoItens ? (
                    <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando itens...</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f9fafb' }}>
                            {['Código', 'Descrição', 'Saldo', 'Preço (R$)', 'Total Vendas (R$)', 'N. Vendas'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {itensFiltrados.map(it => (
                            <tr key={it.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: '#374151' }}>{it.codigo}</td>
                              <td style={{ padding: '7px 12px', maxWidth: 300, color: '#374151' }}>{it.descricao}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right', color: it.saldo > 0 ? '#16a34a' : '#dc2626' }}>{fmtInt(it.saldo)}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right' }}>{fmt(it.preco)}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 500 }}>R$ {fmt(it.total_vendas)}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right' }}>{fmtInt(it.n_vendas)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
