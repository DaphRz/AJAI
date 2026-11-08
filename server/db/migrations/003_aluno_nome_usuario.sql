-- ajai: sem-chaves-estrangeiras
-- AJAI · 003 · Aluno entra com NOME DE USUÁRIO e é criado pelo professor (passo 3, decisão de 08/11)
-- - Usuario.nomeUsuario (ex.: maria.silva): obrigatório para ALUNO, que NÃO tem e-mail nem telefone.
--   Professor e administrador continuam com e-mail e/ou telefone, sem nome de usuário.
-- - Aluno.idCriador: professor que criou a conta. Só ele cadastra e muda a senha desse aluno.
-- EXTRAS em relação ao diagrama de classes: Usuario.nomeUsuario e Aluno.idCriador.
-- Usuario é recriada (o CHECK muda); a 1ª linha desliga as chaves estrangeiras durante a troca.

DROP VIEW vw_aluno;

CREATE TABLE Usuario_novo (
  idUsuario      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,
  nomeUsuario    TEXT    UNIQUE,              -- só aluno; minúsculas (ex.: maria.silva)
  email          TEXT    UNIQUE,              -- só professor/administrador; minúsculas
  telefone       TEXT    UNIQUE,              -- só professor/administrador; dígitos com DDD
  senhaHash      TEXT    NOT NULL,
  perfil         TEXT    NOT NULL CHECK (perfil IN ('ALUNO', 'PROFESSOR', 'ADMINISTRADOR')),
  dataNascimento TEXT,
  ativo          INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criadoEm       TEXT    NOT NULL,
  atualizadoEm   TEXT    NOT NULL,
  CHECK (
    (perfil = 'ALUNO' AND nomeUsuario IS NOT NULL AND email IS NULL AND telefone IS NULL)
    OR (perfil <> 'ALUNO' AND nomeUsuario IS NULL AND (email IS NOT NULL OR telefone IS NOT NULL))
  )
);

-- Alunos que já existiam: o nome de usuário vem da parte do e-mail antes do "@"
-- (ou "aluno<id>" se não houver e-mail); repetido ganha o id no fim. E-mail e telefone são apagados.
WITH base AS (
  SELECT idUsuario,
         CASE
           WHEN email IS NULL THEN 'aluno' || idUsuario
           WHEN lower(substr(email, 1, instr(email, '@') - 1)) GLOB '*[a-z]*'
             THEN lower(substr(email, 1, instr(email, '@') - 1))
           ELSE 'aluno' || lower(substr(email, 1, instr(email, '@') - 1))
         END AS sugestao
    FROM Usuario
   WHERE perfil = 'ALUNO'
)
INSERT INTO Usuario_novo (idUsuario, nome, nomeUsuario, email, telefone, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm)
SELECT u.idUsuario, u.nome,
       CASE WHEN u.perfil = 'ALUNO' THEN
         b.sugestao || CASE WHEN EXISTS (SELECT 1 FROM base o WHERE o.sugestao = b.sugestao AND o.idUsuario < b.idUsuario)
                            THEN u.idUsuario ELSE '' END
       END,
       CASE WHEN u.perfil = 'ALUNO' THEN NULL ELSE u.email END,
       CASE WHEN u.perfil = 'ALUNO' THEN NULL ELSE u.telefone END,
       u.senhaHash, u.perfil, u.dataNascimento, u.ativo, u.criadoEm, u.atualizadoEm
  FROM Usuario u
  LEFT JOIN base b ON b.idUsuario = u.idUsuario;

DROP TABLE Usuario;
ALTER TABLE Usuario_novo RENAME TO Usuario;

-- Quem criou a conta do aluno. Alunos antigos: o professor da primeira turma em que entraram.
ALTER TABLE Aluno ADD COLUMN idCriador INTEGER REFERENCES Professor (idUsuario);
UPDATE Aluno
   SET idCriador = (SELECT t.idProfessor
                      FROM Matricula m JOIN Turma t ON t.idTurma = m.idTurma
                     WHERE m.idAluno = Aluno.idUsuario
                     ORDER BY m.dataVinculo, m.idTurma
                     LIMIT 1);
CREATE INDEX idx_aluno_criador ON Aluno (idCriador);

CREATE VIEW vw_aluno AS
SELECT u.idUsuario, u.nome, u.nomeUsuario, u.ativo, u.criadoEm, u.atualizadoEm,
       a.vozPreferida, a.velocidadeVoz, a.tamanhoFonte, a.idNivelInicial, a.idCriador,
       (SELECT h.idNivel
          FROM HistoricoNivel h
         WHERE h.idAluno = u.idUsuario
         ORDER BY h.dataMudanca DESC, h.idHistorico DESC
         LIMIT 1) AS idNivelAtual
  FROM Usuario u
  JOIN Aluno a ON a.idUsuario = u.idUsuario;
