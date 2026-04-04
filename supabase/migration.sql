-- ============================================================
-- G-Loja — Schema completo para Supabase
-- Execute este SQL no SQL Editor do Supabase (uma única vez)
-- ============================================================

-- 1. LOJAS (admin accounts — Venerável Mestre)
CREATE TABLE IF NOT EXISTS lojas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj       TEXT UNIQUE NOT NULL,
  senha      TEXT NOT NULL,
  nome       TEXT NOT NULL,
  oriente    TEXT NOT NULL DEFAULT '',
  nome_admin TEXT NOT NULL DEFAULT 'Ven.·. Mestre',
  primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. USUARIOS (member accounts — CPF login)
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id    UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  cpf        TEXT NOT NULL,
  nome       TEXT NOT NULL,
  cargo      TEXT NOT NULL,
  senha      TEXT NOT NULL,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(loja_id, cpf)
);

-- 3. IRMAOS (members)
CREATE TABLE IF NOT EXISTS irmaos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  cim             TEXT NOT NULL,
  cpf             TEXT,
  email           TEXT,
  telefone        TEXT,
  grau            TEXT NOT NULL DEFAULT 'APRENDIZ',
  cargo           TEXT NOT NULL DEFAULT 'MEMBRO',
  status          TEXT NOT NULL DEFAULT 'ATIVO',
  data_nasc       TEXT,
  data_iniciacao  TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SESSOES (sessions)
CREATE TABLE IF NOT EXISTS sessoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id    UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'ORDINARIA',
  status     TEXT NOT NULL DEFAULT 'RASCUNHO',
  tema       TEXT,
  descricao  TEXT,
  pauta      TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PRESENCAS (attendance)
CREATE TABLE IF NOT EXISTS presencas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id      UUID NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  irmao_id       UUID NOT NULL REFERENCES irmaos(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  cim            TEXT NOT NULL,
  grau           TEXT NOT NULL,
  cargo          TEXT NOT NULL,
  presente       BOOLEAN NOT NULL DEFAULT FALSE,
  justificativa  TEXT
);

-- 6. TRANSACOES (financial)
CREATE TABLE IF NOT EXISTS transacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id     UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  valor       NUMERIC NOT NULL,
  vencimento  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PENDENTE',
  irmao       TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_loja ON usuarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_irmaos_loja ON irmaos(loja_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_loja ON sessoes(loja_id);
CREATE INDEX IF NOT EXISTS idx_presencas_sessao ON presencas(sessao_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_loja ON transacoes(loja_id);

-- ============================================================
-- Grants (ensure anon key can access)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- ============================================================
-- Seed: Demo Lodge
-- ============================================================
INSERT INTO lojas (cnpj, senha, nome, oriente, nome_admin, primeiro_acesso)
VALUES ('00.000.000/0001-00', 'gloja2026', 'Loja Estrela do Oriente nº 001', 'Oriente de São Paulo — GOB', 'Ven.·. Mestre', TRUE)
ON CONFLICT (cnpj) DO NOTHING;

-- Seed: Demo Members (linked to demo lodge)
WITH loja AS (SELECT id FROM lojas WHERE cnpj = '00.000.000/0001-00' LIMIT 1)
INSERT INTO irmaos (loja_id, nome, cim, cpf, email, telefone, grau, cargo, status, data_nasc, data_iniciacao)
SELECT loja.id, v.nome, v.cim, v.cpf, v.email, v.telefone, v.grau, v.cargo, v.status, v.data_nasc, v.data_iniciacao
FROM loja, (VALUES
  ('José Carlos Almeida','12.345','123.456.789-01','jose.almeida@email.com','(11) 98765-4321','MESTRE','VENERAVEL','ATIVO','1975-03-12','2001-08-15'),
  ('Ricardo Henrique Souza','12.346','234.567.890-12','ricardo.souza@email.com','(21) 97654-3210','COMPANHEIRO','PRIMEIRO_VIGILANTE','ATIVO','1982-07-22','2010-11-20'),
  ('Paulo Roberto Mendes','12.347',NULL,NULL,'(31) 98888-7766','APRENDIZ','MEMBRO','ADORMECIDO','1990-01-05','2018-04-10'),
  ('Antônio Augusto Ferreira','12.348','345.678.901-23','antonio.ferreira@email.com','(41) 99999-1122','MESTRE','SECRETARIO','ATIVO','1968-11-30','1995-02-28'),
  ('Marcos Vinícius Lima','12.349','456.789.012-34','marcos.lima@email.com','(51) 91234-5678','COMPANHEIRO','TESOUREIRO','PLACET','1988-09-14','2015-06-18'),
  ('Fernando Oliveira Costa','12.350',NULL,'fernando.costa@email.com',NULL,'MESTRE','ORADOR','IRREGULAR','1979-04-25','2005-09-09'),
  ('Eduardo Santos Ribeiro','12.351','567.890.123-45',NULL,'(61) 99876-5432','COMPANHEIRO','HOSPITALEIRO','ATIVO','1992-12-08','2019-03-22'),
  ('Felipe Andrade Nunes','12.352','678.901.234-56','felipe.nunes@email.com','(71) 98765-1234','APRENDIZ','MEMBRO','ATIVO','1995-06-17','2023-10-12'),
  ('Carlos Alberto Pereira','12.353',NULL,'carlos.pereira@email.com','(81) 99887-6543','MESTRE','CHANCELER','ATIVO','1970-08-20','1998-05-14'),
  ('Gustavo Martins Silva','12.354',NULL,NULL,'(91) 98765-9876','MESTRE','MESTRE_CERIMONIAS','ATIVO','1985-02-11','2008-09-30'),
  ('Luís Fernando Borges','12.355',NULL,'luis.borges@email.com',NULL,'COMPANHEIRO','MEMBRO','ATIVO','1993-11-03','2020-07-18'),
  ('Rafael Carvalho Dias','12.356',NULL,NULL,'(11) 91122-3344','APRENDIZ','MEMBRO','ATIVO','1998-04-29','2024-01-25')
) AS v(nome, cim, cpf, email, telefone, grau, cargo, status, data_nasc, data_iniciacao)
WHERE NOT EXISTS (SELECT 1 FROM irmaos WHERE irmaos.loja_id = loja.id LIMIT 1);
