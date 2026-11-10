-- AJAI · 004 · Texto de apoio da atividade (passo 4, telas do Figma)
-- Alguns tipos de atividade mostram um texto separado do enunciado (a pergunta):
--   SILABA e PALAVRA  → a palavra em destaque (ex.: "BOLA", "CASA");
--   FRASE             → a frase a ler (ex.: "O ônibus passa às 7 horas.");
--   INTERPRETACAO     → o texto curto, de 2 a 4 linhas, que fica visível durante a pergunta.
-- NULL = a atividade não tem texto de apoio (LETRA, ESCRITA).
-- EXTRA em relação ao diagrama de classes: Atividade.textoApoio (0..1).

ALTER TABLE Atividade ADD COLUMN textoApoio TEXT;
