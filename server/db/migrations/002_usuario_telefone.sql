-- ajai: sem-chaves-estrangeiras
-- AJAI · 002 · Telefone no usuário e e-mail opcional (passo 3, telas do Figma)
-- O Figma pede telefone (professor e aluno) e o login aceita "e-mail ou telefone";
-- o cadastro de aluno não exige e-mail. Todo usuário precisa de pelo menos um dos dois.
-- EXTRA em relação ao diagrama de classes: Usuario.telefone (e email passa a ser 0..1).
-- O SQLite não muda NOT NULL com ALTER: a tabela é recriada (a 1ª linha acima desliga as
-- chaves estrangeiras durante a troca, para não apagar Aluno/Professor em cascata).

DROP VIEW vw_aluno;

CREATE TABLE Usuario_novo (
  idUsuario      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,
  email          TEXT    UNIQUE,              -- sempre em minúsculas
  telefone       TEXT    UNIQUE,              -- só dígitos, com DDD (ex.: 11987654321)
  senhaHash      TEXT    NOT NULL,
  perfil         TEXT    NOT NULL CHECK (perfil IN ('ALUNO', 'PROFESSOR', 'ADMINISTRADOR')),
  dataNascimento TEXT,
  ativo          INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criadoEm       TEXT    NOT NULL,
  atualizadoEm   TEXT    NOT NULL,
  CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);

INSERT INTO Usuario_novo (idUsuario, nome, email, telefone, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm)
SELECT idUsuario, nome, lower(email), NULL, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm
  FROM Usuario;

DROP TABLE Usuario;
ALTER TABLE Usuario_novo RENAME TO Usuario;

-- Mantém o contador do AUTOINCREMENT (a cópia já ajustou sqlite_sequence de Usuario_novo,
-- que o RENAME leva junto).

CREATE VIEW vw_aluno AS
SELECT u.idUsuario, u.nome, u.email, u.telefone, u.ativo, u.criadoEm, u.atualizadoEm,
       a.vozPreferida, a.velocidadeVoz, a.tamanhoFonte, a.idNivelInicial,
       (SELECT h.idNivel
          FROM HistoricoNivel h
         WHERE h.idAluno = u.idUsuario
         ORDER BY h.dataMudanca DESC, h.idHistorico DESC
         LIMIT 1) AS idNivelAtual
  FROM Usuario u
  JOIN Aluno a ON a.idUsuario = u.idUsuario;
