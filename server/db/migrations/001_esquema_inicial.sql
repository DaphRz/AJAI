-- AJAI · 001 · Esquema inicial (SQLite)
-- Espelha o diagrama de classes (docs/diagrama-classes.png) e src/domain/modelos.ts.
-- Convenções: nomes de tabela e coluna iguais aos do diagrama; booleano = INTEGER 0/1;
-- datas = TEXT em ISO 8601 (UTC); enums = TEXT com CHECK.
-- NUNCA edite este arquivo depois que alguém já tiver rodado: crie 002_*.sql, 003_*.sql...

-- Usuario + especializações (Aluno, Professor, Administrador) ------------------------------

CREATE TABLE Usuario (
  idUsuario      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,
  email          TEXT    NOT NULL UNIQUE,
  senhaHash      TEXT    NOT NULL,
  perfil         TEXT    NOT NULL CHECK (perfil IN ('ALUNO', 'PROFESSOR', 'ADMINISTRADOR')),
  dataNascimento TEXT,
  ativo          INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criadoEm       TEXT    NOT NULL,
  atualizadoEm   TEXT    NOT NULL
);

CREATE TABLE Nivel (
  idNivel        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL,
  descricao      TEXT    NOT NULL,
  ordem          INTEGER NOT NULL UNIQUE,
  -- taxa mínima de acerto (0 a 1) para avançar ao próximo nível
  criterioAcerto REAL    NOT NULL CHECK (criterioAcerto BETWEEN 0 AND 1)
);

CREATE TABLE Aluno (
  idUsuario      INTEGER PRIMARY KEY REFERENCES Usuario (idUsuario) ON DELETE CASCADE,
  vozPreferida   TEXT    NOT NULL DEFAULT 'pt-BR',
  velocidadeVoz  REAL    NOT NULL DEFAULT 1.0 CHECK (velocidadeVoz BETWEEN 0.5 AND 1.5),
  tamanhoFonte   INTEGER NOT NULL DEFAULT 20,
  idNivelInicial INTEGER REFERENCES Nivel (idNivel)
  -- idNivelAtual NÃO é coluna: é o HistoricoNivel mais recente (veja a view vw_aluno)
);

CREATE TABLE Professor (
  idUsuario INTEGER PRIMARY KEY REFERENCES Usuario (idUsuario) ON DELETE CASCADE
);

CREATE TABLE Administrador (
  idUsuario INTEGER PRIMARY KEY REFERENCES Usuario (idUsuario) ON DELETE CASCADE
);

-- Turmas -----------------------------------------------------------------------------------

CREATE TABLE Turma (
  idTurma     INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  periodo     TEXT    NOT NULL,
  ativa       INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0, 1)),
  idProfessor INTEGER NOT NULL REFERENCES Professor (idUsuario)   -- "leciona"
);

-- Classe de associação Aluno–Turma
CREATE TABLE Matricula (
  idAluno     INTEGER NOT NULL REFERENCES Aluno (idUsuario) ON DELETE CASCADE,
  idTurma     INTEGER NOT NULL REFERENCES Turma (idTurma)   ON DELETE CASCADE,
  dataVinculo TEXT    NOT NULL,
  PRIMARY KEY (idAluno, idTurma)
);

-- Conteúdo pedagógico ----------------------------------------------------------------------

CREATE TABLE Atividade (
  idAtividade     INTEGER PRIMARY KEY AUTOINCREMENT,
  idNivel         INTEGER NOT NULL REFERENCES Nivel (idNivel),    -- "classifica"
  tipo            TEXT    NOT NULL CHECK (tipo IN
                    ('LETRA', 'SILABA', 'PALAVRA', 'FRASE', 'ESCRITA', 'INTERPRETACAO')),
  conteudo        TEXT    NOT NULL,                               -- ex.: "Letra B"
  enunciado       TEXT    NOT NULL,
  urlImagem       TEXT,
  respostaCorreta TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA')),
  -- EXTRA (não está no diagrama): posição da atividade no nivelamento inicial
  -- (1, 2, 3...). NULL = não faz parte do nivelamento.
  ordemNivelamento INTEGER UNIQUE,
  criadoEm        TEXT    NOT NULL,
  atualizadoEm    TEXT    NOT NULL
);

CREATE TABLE Alternativa (
  idAlternativa INTEGER PRIMARY KEY AUTOINCREMENT,
  idAtividade   INTEGER NOT NULL REFERENCES Atividade (idAtividade) ON DELETE CASCADE,
  texto         TEXT    NOT NULL,
  ordem         INTEGER NOT NULL,
  correta       INTEGER NOT NULL DEFAULT 0 CHECK (correta IN (0, 1)),
  urlImagem     TEXT,
  -- PROVISÓRIO: emoji no lugar da imagem (igual a modelos.ts)
  ilustracao    TEXT,
  UNIQUE (idAtividade, ordem)
);

-- Áudios já gerados (cache da narração). Uma linha = um arquivo em server/storage/audio/.
CREATE TABLE AudioCache (
  idAudio        INTEGER PRIMARY KEY AUTOINCREMENT,
  textoOrigem    TEXT NOT NULL,
  voz            TEXT NOT NULL,
  velocidade     REAL NOT NULL,
  caminhoArquivo TEXT NOT NULL,
  -- EXTRA (não está no diagrama): qual provedor gerou (ex.: 'google', 'piper'),
  -- para trocar de provedor sem misturar áudios de vozes diferentes.
  provedor       TEXT NOT NULL DEFAULT 'indefinido',
  UNIQUE (textoOrigem, voz, velocidade, provedor)
);

-- Desempenho ---------------------------------------------------------------------------------

CREATE TABLE Resposta (
  idResposta        INTEGER PRIMARY KEY AUTOINCREMENT,
  idAluno           INTEGER NOT NULL REFERENCES Aluno (idUsuario),       -- "realiza"
  idAtividade       INTEGER NOT NULL REFERENCES Atividade (idAtividade), -- "recebe"
  respostaDada      TEXT    NOT NULL,
  correta           INTEGER NOT NULL CHECK (correta IN (0, 1)),
  dataHora          TEXT    NOT NULL,
  tempoRespostaSeg  INTEGER NOT NULL DEFAULT 0,
  correcaoProfessor TEXT                                                 -- "corrige"
);

CREATE TABLE DesempenhoConteudo (
  idDesempenho    INTEGER PRIMARY KEY AUTOINCREMENT,
  idAluno         INTEGER NOT NULL REFERENCES Aluno (idUsuario),         -- "possui"
  idNivel         INTEGER NOT NULL REFERENCES Nivel (idNivel),
  conteudo        TEXT    NOT NULL,
  totalTentativas INTEGER NOT NULL DEFAULT 0,
  totalAcertos    INTEGER NOT NULL DEFAULT 0,
  taxaAcerto      REAL    NOT NULL DEFAULT 0 CHECK (taxaAcerto BETWEEN 0 AND 1),
  atualizadoEm    TEXT    NOT NULL,
  UNIQUE (idAluno, idNivel, conteudo)
);

CREATE TABLE HistoricoNivel (
  idHistorico INTEGER PRIMARY KEY AUTOINCREMENT,
  idAluno     INTEGER NOT NULL REFERENCES Aluno (idUsuario),             -- "registra"
  idNivel     INTEGER NOT NULL REFERENCES Nivel (idNivel),
  dataMudanca TEXT    NOT NULL
);

-- Índices e views ------------------------------------------------------------------------------

CREATE INDEX idx_atividade_nivel    ON Atividade (idNivel, status);
CREATE INDEX idx_resposta_aluno     ON Resposta (idAluno, dataHora);
CREATE INDEX idx_resposta_atividade ON Resposta (idAtividade);
CREATE INDEX idx_matricula_turma    ON Matricula (idTurma);
CREATE INDEX idx_historico_aluno    ON HistoricoNivel (idAluno, dataMudanca);

-- Aluno completo, com o nível atual calculado (igual ao tipo Aluno de modelos.ts).
CREATE VIEW vw_aluno AS
SELECT u.idUsuario, u.nome, u.email, u.ativo, u.criadoEm, u.atualizadoEm,
       a.vozPreferida, a.velocidadeVoz, a.tamanhoFonte, a.idNivelInicial,
       (SELECT h.idNivel
          FROM HistoricoNivel h
         WHERE h.idAluno = u.idUsuario
         ORDER BY h.dataMudanca DESC, h.idHistorico DESC
         LIMIT 1) AS idNivelAtual
  FROM Usuario u
  JOIN Aluno a ON a.idUsuario = u.idUsuario;
