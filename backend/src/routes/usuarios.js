import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, login, criado_em FROM usuarios ORDER BY criado_em DESC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.post('/', async (req, res) => {
  const { nome, login, senha } = req.body
  if (!nome || !login || !senha) {
    return res.status(400).json({ erro: 'Nome, login e senha são obrigatórios.' })
  }
  try {
    const hash = await bcrypt.hash(senha, 10)
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nome, login, senha) VALUES ($1, $2, $3) RETURNING id, nome, login, criado_em',
      [nome, login, hash]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Este login já está em uso.' })
    }
    res.status(500).json({ erro: err.message })
  }
})

router.put('/:id/senha', async (req, res) => {
  const { senha } = req.body
  if (!senha) return res.status(400).json({ erro: 'Nova senha é obrigatória.' })
  try {
    const hash = await bcrypt.hash(senha, 10)
    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [hash, req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode remover sua própria conta.' })
  }
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

export default router
