import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/index.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { login, senha, lembrar } = req.body
  if (!login || !senha) {
    return res.status(400).json({ erro: 'Login e senha são obrigatórios.' })
  }
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE login = $1', [login])
    const usuario = rows[0]
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: 'Login ou senha incorretos.' })
    }
    const expiracao = lembrar ? '30d' : '8h'
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, login: usuario.login },
      process.env.JWT_SECRET,
      { expiresIn: expiracao }
    )
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, login: usuario.login } })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ erro: 'Não autenticado.' })
  try {
    const token = header.slice(7)
    const dados = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ id: dados.id, nome: dados.nome, login: dados.login })
  } catch {
    res.status(401).json({ erro: 'Token inválido.' })
  }
})

export default router
