import { Router } from 'express'
import { pool } from '../db/index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pesquisas ORDER BY data DESC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { titulo, status, data } = req.body
  try {
    const { rows } = await pool.query(
      'INSERT INTO pesquisas (titulo, status, data, respostas) VALUES ($1, $2, $3, 0) RETURNING *',
      [titulo, status, data]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pesquisas WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
