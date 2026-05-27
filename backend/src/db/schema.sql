CREATE TABLE IF NOT EXISTS lancamentos (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('receita', 'despesa')) NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  data DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT,
  qtd INTEGER NOT NULL DEFAULT 0,
  preco NUMERIC(12, 2) NOT NULL DEFAULT 0,
  minimo INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pesquisas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('ativa', 'concluida', 'rascunho')) DEFAULT 'rascunho',
  respostas INTEGER DEFAULT 0,
  data DATE,
  criado_em TIMESTAMP DEFAULT NOW()
);
