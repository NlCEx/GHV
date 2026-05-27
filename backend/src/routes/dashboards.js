import { Router } from 'express'
import { pool } from '../db/index.js'

const router = Router()

router.get('/resumo', async (req, res) => {
  try {
    const { mes } = req.query
    const mesFilter = mes ? `AND TO_CHAR(data, 'YYYY-MM') = $1` : ''
    const params = mes ? [mes] : []

    // Mês anterior para comparação
    let prevParams = []
    let prevMesFilter = ''
    if (mes) {
      const [year, month] = mes.split('-').map(Number)
      const prevYear = month === 1 ? year - 1 : year
      const prevMonth = month === 1 ? 12 : month - 1
      const prevMes = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
      prevMesFilter = `AND TO_CHAR(data, 'YYYY-MM') = $1`
      prevParams = [prevMes]
    }

    const [receitas, despesas, estoque, pesquisas, criticos, prevReceitas, prevDespesas] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'receita' ${mesFilter}`, params),
      pool.query(`SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'despesa' ${mesFilter}`, params),
      pool.query('SELECT COALESCE(SUM(qtd), 0) AS total FROM produtos'),
      pool.query("SELECT COUNT(*) AS total FROM pesquisas WHERE status = 'ativa'"),
      pool.query("SELECT COUNT(*) AS total FROM produtos WHERE minimo > 0 AND qtd < minimo"),
      pool.query(`SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'receita' ${prevMesFilter}`, prevParams),
      pool.query(`SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'despesa' ${prevMesFilter}`, prevParams),
    ])

    res.json({
      receitas: Number(receitas.rows[0].total),
      despesas: Number(despesas.rows[0].total),
      estoque: Number(estoque.rows[0].total),
      pesquisasAtivas: Number(pesquisas.rows[0].total),
      produtosCriticos: Number(criticos.rows[0].total),
      anterior: mes ? {
        receitas: Number(prevReceitas.rows[0].total),
        despesas: Number(prevDespesas.rows[0].total),
      } : null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/tendencia', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT
          TO_CHAR(data, 'YYYY-MM') AS mes,
          SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS receitas,
          SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS despesas
        FROM lancamentos
        GROUP BY mes
        ORDER BY mes DESC
        LIMIT 12
      ) t
      ORDER BY mes ASC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/ultimos-lancamentos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, descricao, tipo, valor, data
      FROM lancamentos
      ORDER BY data DESC, id DESC
      LIMIT 8
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/distribuicao', async (req, res) => {
  try {
    const { mes } = req.query
    const mesFilter = mes ? `AND TO_CHAR(data, 'YYYY-MM') = $1` : ''
    const params = mes ? [mes] : []

    const { rows } = await pool.query(`
      SELECT tipo, descricao, SUM(valor) AS total
      FROM lancamentos
      WHERE 1=1 ${mesFilter}
      GROUP BY tipo, descricao
      ORDER BY tipo, total DESC
    `, params)

    res.json({
      receitas: rows.filter(r => r.tipo === 'receita').slice(0, 6),
      despesas: rows.filter(r => r.tipo === 'despesa').slice(0, 6),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/digisat', async (req, res) => {
  try {
    const impRes = await pool.query('SELECT * FROM digisat_importacoes ORDER BY criado_em DESC LIMIT 1')
    if (impRes.rows.length === 0) return res.json(null)

    const imp = impRes.rows[0]

    const [topRes, resumoRes, estoqueBaixoRes] = await Promise.all([
      pool.query(`
        SELECT codigo, descricao, total_vendas, saldo, n_vendas, preco
        FROM digisat_itens
        WHERE importacao_id = $1 AND total_vendas > 0
        ORDER BY total_vendas DESC
        LIMIT 10
      `, [imp.id]),
      pool.query(`
        SELECT
          COALESCE(SUM(total_vendas), 0) AS total_vendas,
          COALESCE(SUM(saldo), 0)        AS total_saldo,
          COUNT(*)                        AS total_produtos,
          COUNT(CASE WHEN saldo > 0 THEN 1 END) AS produtos_em_estoque,
          COALESCE(MAX(total_vendas), 0) AS maior_venda
        FROM digisat_itens
        WHERE importacao_id = $1
      `, [imp.id]),
      pool.query(`
        SELECT codigo, descricao, saldo
        FROM digisat_itens
        WHERE importacao_id = $1 AND saldo <= 10 AND saldo >= 0
        ORDER BY saldo ASC
        LIMIT 8
      `, [imp.id]),
    ])

    res.json({
      importacao: imp,
      topProdutos: topRes.rows,
      resumo: resumoRes.rows[0],
      estoqueBaixo: estoqueBaixoRes.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
