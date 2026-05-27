import express from 'express'
import multer from 'multer'
import { createRequire } from 'module'
import { pool } from '../db/index.js'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

function brToFloat(s) {
  if (!s) return 0
  return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0
}

const SKIP_PATTERNS = [
  /^GHV PRODUTOS MEDICOS AVANCADOS LTDA$/,
  /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  /^Itens vendidos$/,
  /^Tipo: Todos\./,
  /^Descri[çc][aã]oSaldoPre[çc]oDesc\.Total$/i,
  /^Empresa:/,
  /^C[oó]digoN\. VendasAcresc\.% Desc\.Qtd$/,
  /^Lotes vendidos$/,
  /^LoteData validadeQuantidade$/,
  /^Gerado em/,
  /^Desenvolvido por DigiSat/,
]

const BR = '\\d{1,3}(?:\\.\\d{3})*,\\d{2}'
const DATA_REGEX = new RegExp(`^(${BR})(${BR})(${BR})(${BR})(.*)$`)
const QTD_REGEX = new RegExp(`^(${BR})(${BR})%(-?${BR})$`)
const N_VENDAS_REGEX = /^-?\d{1,5}$/
const LOT_DATE_REGEX = /\d{2}\/\d{2}\/\d{4}/

function parsePdfText(text) {
  const lines = text.split('\n').map(l => l.trim())
  const products = []
  let descLines = []
  let current = null
  let inLots = false
  let awaitCode = false

  for (const line of lines) {
    if (!line) continue
    if (SKIP_PATTERNS.some(p => p.test(line))) { inLots = false; continue }
    if (line === 'Lotes vendidos') { inLots = true; continue }
    if (line === 'LoteData validadeQuantidade') continue
    if (inLots && LOT_DATE_REGEX.test(line)) continue
    if (inLots && !LOT_DATE_REGEX.test(line)) inLots = false

    const dataM = line.match(DATA_REGEX)
    const qtdM = line.match(QTD_REGEX)
    const isNV = N_VENDAS_REGEX.test(line)

    // Awaiting code continuation from previous data line
    if (awaitCode) {
      if (!dataM && !qtdM && !LOT_DATE_REGEX.test(line)) {
        if (isNV) {
          // This is actually the n_vendas — code stays empty
          awaitCode = false
          if (current) current.nvendas = parseInt(line)
          continue
        }
        if (current) current.codigo += line.trim()
        awaitCode = false
        continue
      }
      awaitCode = false
    }

    if (dataM) {
      // Save completed product
      if (current && current.nvendas !== undefined && current.qtd !== undefined) {
        products.push(current)
      }
      current = {
        descricao: descLines.join(' ').trim(),
        saldo: brToFloat(dataM[1]),
        preco: brToFloat(dataM[2]),
        total: brToFloat(dataM[3]),
        codigo: dataM[5].trim(),
        nvendas: undefined,
        qtd: undefined,
      }
      descLines = []
      if (!current.codigo) awaitCode = true
      continue
    }

    if (current && current.nvendas === undefined && isNV) {
      current.nvendas = parseInt(line)
      continue
    }

    if (current && current.nvendas !== undefined && qtdM) {
      current.qtd = brToFloat(qtdM[3])
      products.push(current)
      current = null
      descLines = []
      inLots = false
      continue
    }

    // Description line
    if (!dataM && !qtdM && !LOT_DATE_REGEX.test(line)) {
      if (current === null) {
        descLines.push(line)
      }
    }
  }

  if (current && current.codigo) products.push(current)
  return products
}

// POST /api/digisat/importar — upload PDF and save
router.post('/importar', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })

    const parsed = await pdfParse(req.file.buffer)
    const produtos = parsePdfText(parsed.text)

    if (produtos.length === 0) {
      return res.status(422).json({ erro: 'Nenhum produto encontrado no PDF.' })
    }

    // Extract period from text
    const periodoMatch = parsed.text.match(/De\s+(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}\s+até\s+(\d{2}\/\d{2}\/\d{4})/)
    const periodo = periodoMatch ? `${periodoMatch[1]} a ${periodoMatch[2]}` : null
    const totalVendas = produtos.reduce((acc, p) => acc + (p.total || 0), 0)

    const importRes = await pool.query(
      'INSERT INTO digisat_importacoes (arquivo_nome, periodo, total_produtos, total_vendas) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.file.originalname, periodo, produtos.length, totalVendas]
    )
    const importacao = importRes.rows[0]

    for (const p of produtos) {
      await pool.query(
        'INSERT INTO digisat_itens (importacao_id, codigo, descricao, saldo, preco, total_vendas, n_vendas, qtd) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [importacao.id, p.codigo || '', p.descricao || '', p.saldo, p.preco, p.total, p.nvendas ?? null, p.qtd ?? null]
      )
    }

    res.json({ ...importacao, produtos_preview: produtos.slice(0, 5) })
  } catch (e) {
    console.error('Erro ao importar PDF:', e)
    res.status(500).json({ erro: e.message })
  }
})

// GET /api/digisat/importacoes
router.get('/importacoes', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM digisat_importacoes ORDER BY criado_em DESC')
  res.json(rows)
})

// GET /api/digisat/importacoes/:id/itens
router.get('/importacoes/:id/itens', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM digisat_itens WHERE importacao_id=$1 ORDER BY descricao',
    [req.params.id]
  )
  res.json(rows)
})

// DELETE /api/digisat/importacoes/:id
router.delete('/importacoes/:id', async (req, res) => {
  await pool.query('DELETE FROM digisat_importacoes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

export default router
