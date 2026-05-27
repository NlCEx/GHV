import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import financeiroRoutes from './routes/financeiro.js'
import estoqueRoutes from './routes/estoque.js'
import pesquisaRoutes from './routes/pesquisa.js'
import dashboardsRoutes from './routes/dashboards.js'
import usuariosRoutes from './routes/usuarios.js'
import digisatRoutes from './routes/digisat.js'
import { autenticar } from './middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/financeiro', autenticar, financeiroRoutes)
app.use('/api/estoque', autenticar, estoqueRoutes)
app.use('/api/pesquisa', autenticar, pesquisaRoutes)
app.use('/api/dashboards', autenticar, dashboardsRoutes)
app.use('/api/usuarios', autenticar, usuariosRoutes)
app.use('/api/digisat', autenticar, digisatRoutes)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Servir o frontend React em produção
const frontendDist = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`GHV rodando na porta ${PORT}`))
