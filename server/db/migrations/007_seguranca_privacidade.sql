-- AJAI · 007 · Segurança e privacidade (passo 12, RNF11, RNF12, LGPD)
-- EXTRAS em relação ao diagrama de classes (só no Usuario):
--   versaoToken     sobe a cada troca de senha (ou senha provisória). O token de login leva a versão
--                   de quando foi gerado; versão diferente = token antigo, o servidor recusa (401).
--   senhaProvisoria 1 = a senha foi gerada pelo administrador (ou pelo script usuario:senha).
--                   A pessoa entra, mas precisa trocar a senha antes de usar o resto do app.
--   termosAceitosEm quando a pessoa marcou "Li e concordo" no cadastro (data e hora ISO).
--   versaoTermos    qual versão do termo ela aceitou (ex.: "2026-11-18"; ver docs/privacidade.md).
-- Contas antigas (seed e quem se cadastrou antes) ficam com termosAceitosEm NULL.

ALTER TABLE Usuario ADD COLUMN versaoToken INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Usuario ADD COLUMN senhaProvisoria INTEGER NOT NULL DEFAULT 0 CHECK (senhaProvisoria IN (0, 1));
ALTER TABLE Usuario ADD COLUMN termosAceitosEm TEXT;
ALTER TABLE Usuario ADD COLUMN versaoTermos TEXT;
