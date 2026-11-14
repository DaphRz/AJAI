-- AJAI · 006 · Quem criou a atividade (passo 9, cadastro de atividades)
-- O administrador e o PROFESSOR aprovado incluem, editam e inativam atividades. O professor só mexe
-- nas que ELE criou; o administrador mexe em todas.
-- NULL = atividade do conteúdo pedagógico (seed): sem criador, só o administrador mexe.
-- EXTRA em relação ao diagrama de classes: Atividade.idCriador (0..1 → Usuario).

ALTER TABLE Atividade ADD COLUMN idCriador INTEGER REFERENCES Usuario (idUsuario);

CREATE INDEX idx_atividade_criador ON Atividade (idCriador);
