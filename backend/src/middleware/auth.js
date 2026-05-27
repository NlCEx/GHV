import jwt from 'jsonwebtoken'

export function autenticar(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }
  try {
    const token = header.slice(7)
    req.usuario = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' })
  }
}
