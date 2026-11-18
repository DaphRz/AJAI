# AJAI – Alfabetização para Jovens, Adultos e Idosos

Aplicativo mobile de apoio à alfabetização, complementar à EJA, com área de acompanhamento para professores.
Projeto da disciplina de Gestão de Projetos – Universidade de Vila Velha, 2026 (turma CC6M, equipe 4).

- Protótipo no Figma: <https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI>
- Diagrama de classes: [`docs/diagrama-classes.png`](docs/diagrama-classes.png)
- Conteúdo pedagógico (atividades e nivelamento): [`docs/conteudo-pedagogico.md`](docs/conteudo-pedagogico.md)
- Termo de uso e segurança: [`docs/privacidade.md`](docs/privacidade.md)
- Casos de teste manuais: [`docs/testes/casos-de-teste.md`](docs/testes/casos-de-teste.md)
- EAP do Projeto e Análise de Pontos de Função

**Stack:** Expo SDK 58 (React Native + TypeScript), API Fastify, banco SQLite em arquivo, voz Azure AI Speech (com `expo-speech` de reserva).

---

## Como executar

Pré-requisitos: **Node.js 22.18+** e o app **Expo Go** (SDK 58) no celular.

```bash
git clone https://github.com/DaphRz/AJAI.git
cd AJAI
npm install
npm run db:reset                     # cria o banco com os dados de demonstração
cp server/.env.example server/.env   # só na primeira vez (Windows: copy server\.env.example server\.env)
npm run server:dev                   # sobe a API em http://localhost:3333/health
```

Em **outro** terminal:

```bash
npx expo start
```

### Usuários de demonstração (senha `demo1234`)

| Perfil | Entra com |
|---|---|
| Aluno | `maria.silva` (vai ao nivelamento), `ana.souza`, `bruno.lima`, `clara.santos` |
| Professor | `rafael@ajai.app` (aprovado), `paula@ajai.app` (pendente) |
| Responsável | `joana@ajai.app` |
| Instituição | `instituicao@ajai.app` (código `EJAVV2`), `aprender@ajai.app` (pendente) |
| Administrador | `admin@ajai.app` |

### Comandos

```bash
npx expo start -c         # inicia limpando o cache
npx expo lint             # lint
npm run typecheck         # tipos do app e do servidor
npm run db:reset          # recria o banco do zero
npm run db:migrate        # aplica migrações novas
npm run db:seed           # recarrega os dados de src/data/mock.ts
npm run db:query          # tabelas e contagens (aceita SQL)
npm run usuario:senha -- <login>    # senha provisória
npm run usuario:apagar -- <login>   # apaga uma conta (LGPD)
npm run voz:preparar      # gera os áudios (precisa da chave da Azure em server/.env)
```

### Testes

```bash
npm test                  # todos (servidor + voz + telas)
npm run server:test       # só o servidor (node --test, banco temporário)
npm run app:test          # só o app (voz + telas)
npm run app:test:voz      # só a voz do app
npm run app:test:telas    # só as telas (jest-expo)
```

Casos manuais: [`docs/testes/casos-de-teste.md`](docs/testes/casos-de-teste.md).

Depois de `git pull` com rotas novas, rode `npx expo start` uma vez antes do `tsc`.

---

## Estrutura

```
src/app/          Telas (Expo Router): aluno, professor, responsavel, instituicao, admin, cadastro
src/components/   Componentes reutilizáveis
src/services/     Regras e acesso à API; voz/ = ProvedorVoz
src/domain/       Tipos do diagrama de classes
src/theme/        Tokens do Figma
src/data/mock.ts  Dados do seed
server/src/       API Fastify (rotas/, voz/, progressao.ts)
server/db/        Migrações, seed e scripts do banco
server/storage/   Áudios da narração (MP3, versionados)
docs/             Diagrama, conteúdo pedagógico, privacidade, casos de teste
```

---

## Etapas realizadas

| # | Etapa | Resumo |
|---|---|---|
| 0 | Esqueleto | Projeto Expo instalado e validado (lint, tipos, banco). |
| 1 | Stack | SQLite, Fastify e voz pela interface `ProvedorVoz`. |
| 2 | Servidor | API Fastify sobre o SQLite, com erros padronizados em português. |
| 3 | Login e cadastro | Senha com scrypt, token JWT guardado no aparelho, login por usuário, e-mail ou telefone. |
| 3.1 | Modelo de contas | Perfis aluno, professor, responsável, instituição e administrador; aprovações e vínculo aceito pelo aluno. |
| 4 | Atividades pela API | Trilha, atividades e nivelamento vindos do banco, sem gabarito no app. |
| 5 | Progressão | Respostas, correção, subida de nível e histórico gravados no servidor. |
| 6 | Conteúdo | 35 atividades do cotidiano adulto (7 por nível) e nivelamento de 10 perguntas. |
| 7 | Home do aluno | Ofensiva, frequência semanal, tela de progresso e comemoração ao subir de etapa. |
| 8 | Professor e responsável | Painel, métricas com gráfico, relatórios, turmas, correção manual e dicas ao responsável. |
| 9 | Cadastro de atividades | Administrador e professor incluem, editam e inativam atividades; administrador gerencia etapas. |
| 10 | Voz e preferências | Narração com a Azure (MP3 em cache) e ajuste de velocidade da voz e tamanho da letra. |
| 11 | Testes | Testes do servidor, da voz e de telas, mais 54 casos manuais. |
| 12 | Segurança e privacidade | Termo de uso com aceite, troca obrigatória de senha provisória, tokens revogados e exclusão de conta. |
| 13 | Correção | Bugs corrigidos. |

