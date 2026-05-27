import { Router } from 'express'
import { pool } from '../db/index.js'

const router = Router()

router.get('/resumo', async (req, res) => {
  try {
    const { mes } = req.query
    const mesFilter = mes ? `AND TO_CHAR(data, 'YYYY-MM') = $1` : ''
    const params = mes ? [mes] : []

    const [receitas, despesas, estoque, pesquisas, criticos] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'receita' ${mesFilter}`, params),
      pool.query(`SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'despesa' ${mesFilter}`, params),
      pool.query('SELECT COALESCE(SUM(qtd), 0) AS total FROM produtos'),
      pool.query("SELECT COUNT(*) AS total FROM pesquisas WHERE status = 'ativa'"),
      pool.query("SELECT COUNT(*) AS total FROM produtos WHERE minimo > 0 AND qtd < minimo"),
    ])

    res.json({
      receitas: Number(receitas.rows[0].total),
      despesas: Number(despesas.rows[0].total),
      estoque: Number(estoque.rows[0].total),
      pesquisasAtivas: Number(pesquisas.rows[0].total),
      produtosCriticos: Number(criticos.rows[0].total),
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
