# CLAUDE.md – AJAI

Este arquivo é lido pelo Claude Code a cada sessão. Os arquivos abaixo são **importados automaticamente** (sintaxe `@caminho`), então o contexto do projeto, as decisões de stack e o roteiro de passos estão sempre carregados:

@AGENTS.md
@docs/decisoes/ADR-001-stack.md
@docs/PROXIMOS_PASSOS.md

## Como trabalhar neste repositório

- Antes de começar, descubra em qual **passo** de `docs/PROXIMOS_PASSOS.md` a tarefa se encaixa e siga o "Pronto quando" e as "Regras que valem para TODO prompt".
- Respeite o ADR-001 (SQLite, Fastify, `ProvedorVoz` com Piper padrão). Se a tarefa pedir o contrário, pare e pergunte.
- Ao terminar: marque o passo (⬜ → 🟡 → ✅) em `docs/PROXIMOS_PASSOS.md`, atualize "Pendências" no `README.md` e registre no ADR qualquer decisão nova.
- Para detalhes de execução e do banco, consulte o `README.md` (não é importado por ser longo).
