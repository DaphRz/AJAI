-- ajai: sem-chaves-estrangeiras
-- AJAI · 005 · Modelo de contas revisado (Passo 3.1)
-- - Perfis novos: RESPONSAVEL e INSTITUICAO. ALUNO, PROFESSOR, RESPONSAVEL e INSTITUICAO criam a
--   própria conta; ADMINISTRADOR continua só por seed/script.
-- - ALUNO entra com nome de usuário, e-mail OU telefone (pelo menos um). Os demais usam e-mail/telefone
--   e não têm nome de usuário.
-- - Instituicao: se inscreve sozinha e fica PENDENTE até o administrador aprovar; ao aprovar, ganha
--   o código (6 caracteres) que o professor informa no cadastro.
-- - Professor: pertence a uma instituição e fica PENDENTE até ela aprovar.
-- - Vinculo: acompanhante (professor ou responsável) ↔ aluno. Substitui Aluno.idCriador.
-- EXTRAS em relação ao diagrama de classes: Responsavel, Instituicao, Vinculo e as colunas novas de Professor.
-- Usuario é recriada (o CHECK muda); a 1ª linha desliga as chaves estrangeiras durante a troca.

DROP VIEW vw_aluno;

CREATE TABLE Usuario_novo (
  idUsuario      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,            -- INSTITUICAO: nome da instituição
  nomeUsuario    TEXT    UNIQUE,              -- só aluno; minúsculas (ex.: maria.silva)
  email          TEXT    UNIQUE,              -- minúsculas
  telefone       TEXT    UNIQUE,              -- dígitos com DDD
  senhaHash      TEXT    NOT NULL,
  perfil         TEXT    NOT NULL CHECK (perfil IN ('ALUNO', 'PROFESSOR', 'RESPONSAVEL', 'INSTITUICAO', 'ADMINISTRADOR')),
  dataNascimento TEXT,
  ativo          INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criadoEm       TEXT    NOT NULL,
  atualizadoEm   TEXT    NOT NULL,
  CHECK (
    (perfil = 'ALUNO' AND (nomeUsuario IS NOT NULL OR email IS NOT NULL OR telefone IS NOT NULL))
    OR (perfil <> 'ALUNO' AND nomeUsuario IS NULL AND (email IS NOT NULL OR telefone IS NOT NULL))
  )
);

INSERT INTO Usuario_novo (idUsuario, nome, nomeUsuario, email, telefone, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm)
SELECT idUsuario, nome, nomeUsuario, email, telefone, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm
  FROM Usuario;

DROP TABLE Usuario;
ALTER TABLE Usuario_novo RENAME TO Usuario;

-- Especializações novas ------------------------------------------------------------------------

CREATE TABLE Responsavel (
  idUsuario INTEGER PRIMARY KEY REFERENCES Usuario (idUsuario) ON DELETE CASCADE
);

CREATE TABLE Instituicao (
  idUsuario       INTEGER PRIMARY KEY REFERENCES Usuario (idUsuario) ON DELETE CASCADE,
  cnpj            TEXT    NOT NULL UNIQUE,     -- só os 14 dígitos
  nomeResponsavel TEXT    NOT NULL,            -- pessoa que responde pela instituição
  codigo          TEXT    UNIQUE,              -- gerado ao APROVAR; NULL antes disso
  status          TEXT    NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADA', 'RECUSADA')),
  motivoRecusa    TEXT,
  decididoPor     INTEGER REFERENCES Administrador (idUsuario),
  decididoEm      TEXT,
  CHECK (status <> 'APROVADA' OR codigo IS NOT NULL)
);

-- Professor pertence a uma instituição, que aprova ou recusa.
ALTER TABLE Professor ADD COLUMN idInstituicao INTEGER REFERENCES Instituicao (idUsuario);
ALTER TABLE Professor ADD COLUMN statusVinculo TEXT NOT NULL DEFAULT 'PENDENTE'
  CHECK (statusVinculo IN ('PENDENTE', 'APROVADO', 'RECUSADO'));
ALTER TABLE Professor ADD COLUMN motivoRecusa TEXT;
ALTER TABLE Professor ADD COLUMN decididoEm TEXT;
CREATE INDEX idx_professor_instituicao ON Professor (idInstituicao, statusVinculo);

-- Bancos que já tinham professor: cria a instituição de demonstração (APROVADA, código fixo) e
-- liga os professores a ela como APROVADOS. A senha dela fica inutilizável ("!"): para entrar,
-- gere uma provisória com `npm run usuario:senha -- instituicao@ajai.app` (ou rode `npm run db:reset`).
INSERT INTO Usuario (nome, email, senhaHash, perfil, ativo, criadoEm, atualizadoEm)
SELECT 'Escola EJA Centro (demonstração)', 'instituicao@ajai.app', '!', 'INSTITUICAO', 1,
       strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE EXISTS (SELECT 1 FROM Professor)
   AND NOT EXISTS (SELECT 1 FROM Usuario WHERE email = 'instituicao@ajai.app');

INSERT INTO Instituicao (idUsuario, cnpj, nomeResponsavel, codigo, status, decididoEm)
SELECT idUsuario, '11222333000181', 'Helena Martins', 'EJAVV2', 'APROVADA', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  FROM Usuario
 WHERE email = 'instituicao@ajai.app' AND perfil = 'INSTITUICAO';

UPDATE Professor
   SET idInstituicao = (SELECT idUsuario FROM Instituicao WHERE codigo = 'EJAVV2'),
       statusVinculo = 'APROVADO',
       decididoEm    = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE EXISTS (SELECT 1 FROM Instituicao WHERE codigo = 'EJAVV2');

-- Vínculo acompanhante ↔ aluno --------------------------------------------------------------------

CREATE TABLE Vinculo (
  idVinculo           INTEGER PRIMARY KEY AUTOINCREMENT,
  idAluno             INTEGER NOT NULL REFERENCES Aluno (idUsuario) ON DELETE CASCADE,
  idAcompanhante      INTEGER NOT NULL REFERENCES Usuario (idUsuario) ON DELETE CASCADE, -- professor ou responsável
  status              TEXT    NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ACEITO', 'RECUSADO')),
  -- EXTRA: o que o acompanhante digitou para convidar (usuário, e-mail ou telefone). É o que ele vê
  -- enquanto o aluno não aceita, para não revelar o nome nem outros dados do aluno antes do aceite.
  identificadorConvite TEXT,
  criadoEm            TEXT    NOT NULL,
  decididoEm          TEXT,
  UNIQUE (idAluno, idAcompanhante)
);
CREATE INDEX idx_vinculo_acompanhante ON Vinculo (idAcompanhante, status);

-- O antigo "professor que criou o aluno" vira um vínculo já ACEITO.
INSERT INTO Vinculo (idAluno, idAcompanhante, status, identificadorConvite, criadoEm, decididoEm)
SELECT a.idUsuario, a.idCriador, 'ACEITO', u.nomeUsuario, u.criadoEm, u.criadoEm
  FROM Aluno a JOIN Usuario u ON u.idUsuario = a.idUsuario
 WHERE a.idCriador IS NOT NULL;

DROP INDEX idx_aluno_criador;
ALTER TABLE Aluno DROP COLUMN idCriador;

CREATE VIEW vw_aluno AS
SELECT u.idUsuario, u.nome, u.nomeUsuario, u.email, u.telefone, u.ativo, u.criadoEm, u.atualizadoEm,
       a.vozPreferida, a.velocidadeVoz, a.tamanhoFonte, a.idNivelInicial,
       (SELECT h.idNivel
          FROM HistoricoNivel h
         WHERE h.idAluno = u.idUsuario
         ORDER BY h.dataMudanca DESC, h.idHistorico DESC
         LIMIT 1) AS idNivelAtual
  FROM Usuario u
  JOIN Aluno a ON a.idUsuario = u.idUsuario;
