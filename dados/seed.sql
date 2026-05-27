-- Dados de exemplo para desenvolvimento

INSERT INTO lancamentos (descricao, tipo, valor, data) VALUES
  ('Venda de produtos',         'receita', 5000.00, '2026-05-01'),
  ('Aluguel do escritório',     'despesa', 1800.00, '2026-05-03'),
  ('Serviços prestados',        'receita', 3200.00, '2026-05-10'),
  ('Fornecedor de materiais',   'despesa',  950.00, '2026-05-12'),
  ('Comissões recebidas',       'receita', 1500.00, '2026-05-20'),
  ('Conta de energia',          'despesa',  320.00, '2026-05-15'),
  ('Venda online',              'receita', 2800.00, '2026-05-22'),
  ('Manutenção equipamentos',   'despesa',  600.00, '2026-05-25');

INSERT INTO produtos (nome, categoria, qtd, preco, minimo) VALUES
  ('Notebook Dell',       'Eletrônicos', 15, 3200.00, 5),
  ('Cadeira Ergonômica',  'Móveis',       8,  890.00, 3),
  ('Monitor 24"',         'Eletrônicos',  4, 1200.00, 5),
  ('Teclado Mecânico',    'Eletrônicos', 20,  450.00, 8),
  ('Mesa de Escritório',  'Móveis',       6,  650.00, 2),
  ('Mouse sem fio',       'Eletrônicos', 30,  180.00, 10),
  ('Headset USB',         'Eletrônicos',  3,  350.00, 5),
  ('Armário Arquivo',     'Móveis',       2, 1100.00, 1);

INSERT INTO pesquisas (titulo, status, respostas, data) VALUES
  ('Satisfação do Cliente Q1',    'concluida', 142, '2026-03-15'),
  ('Preferências de Produto',     'ativa',      67, '2026-05-01'),
  ('NPS Trimestral',              'ativa',      89, '2026-05-10'),
  ('Avaliação de Fornecedores',   'rascunho',    0, '2026-05-20');
