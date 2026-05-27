import { Router } from 'express'
import { pool } from '../db/index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY nome')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { nome, categoria, qtd, preco, minimo } = req.body
  try {
    const { rows } = await pool.query(
      'INSERT INTO produtos (nome, categoria, qtd, preco, minimo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, categoria, qtd, preco, minimo]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { nome, categoria, qtd, preco, minimo } = req.body
  try {
    const { rows } = await pool.query(
      'UPDATE produtos SET nome=$1, categoria=$2, qtd=$3, preco=$4, minimo=$5 WHERE id=$6 RETURNING *',
      [nome, categoria, qtd, preco, minimo, req.params.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
