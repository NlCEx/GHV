import { Router } from 'express'
import { pool } from '../db/index.js'

const router = Router()

router.get('/resumo', async (req, res) => {
  try {
    const [receitas, despesas, estoque, pesquisas] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'receita'"),
      pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos WHERE tipo = 'despesa'"),
      pool.query('SELECT COALESCE(SUM(qtd), 0) AS total FROM produtos'),
      pool.query("SELECT COUNT(*) AS total FROM pesquisas WHERE status = 'ativa'"),
    ])

    res.json({
      receitas: Number(receitas.rows[0].total),
      despesas: Number(despesas.rows[0].total),
      estoque: Number(estoque.rows[0].total),
      pesquisasAtivas: Number(pesquisas.rows[0].total),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
