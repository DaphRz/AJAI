# Próximos passos do AJAI (04/11 → entrega 17/11)

Roteiro do que falta até a entrega. **A ordem de execução é a da tabela "Visão geral"** (as seções abaixo seguem a mesma ordem); os números dos passos são citados no README, no AGENTS.md e em TODOs do código; se renumerar, atualize todos. Cada passo tem prazo, dependências, critério de pronto e um **prompt pronto para colar** num assistente de IA (Claude, Copilot, Cursor...) aberto na pasta do projeto.

> Como usar os prompts
> 1. Abra o assistente **na raiz do repositório** (para ele ler `AGENTS.md`, `README.md` e o código).
> 2. Cole o prompt do passo inteiro. Os trechos entre `<...>` você preenche antes.
> 3. Revise o que ele fizer, rode `npx expo lint` e `npx tsc --noEmit`, teste no celular e só então faça commit.
> 4. Ao terminar, marque o passo aqui ✅ e atualize a seção **Pendências** do README.
>
> **Todos desenvolvem.** Os papéis da documentação (gerente, UX/UI, testes...) são formais; aqui os passos não têm dono fixo. Combine no grupo quem pega cada um e mova o cartão no Kanban.
>
> **Stack:** banco = **SQLite em arquivo dentro do projeto** (`server/data/ajai.db`, criado com `npm run db:reset`) e voz = o app só usa a interface **`ProvedorVoz`**; a **API de voz ainda não foi definida** e o `expo-speech` fica implementado como alternativa e reserva, com troca em uma linha.

## Regras que valem para TODO prompt

O `CLAUDE.md` da raiz carrega automaticamente `AGENTS.md` e este arquivo a cada sessão do Claude Code. Por isso, em qualquer passo:

1. **Identifique o passo** em que a tarefa se encaixa e siga o critério "Pronto quando". Se a tarefa contrariar a stack (SQLite, Fastify, `ProvedorVoz`), pare e avise antes de mudar.
2. **Cobertura do app inteiro:** a tarefa vale para aluno, professor, responsável, instituição **e** administrador, quando se aplicar. Confira a tabela "Telas do Figma × código" do README para não esquecer nenhuma tela.
3. **Regras de acessibilidade do AGENTS.md** em toda tela nova ou alterada (botão de áudio, texto nos botões, fonte e toque mínimos, mensagens positivas).
4. **Banco:** mudou estrutura → migração nova (`npm run db:migrate`); mudou dados de exemplo → `src/data/mock.ts` + `npm run db:seed`; atualize `src/domain/modelos.ts`.
5. **Ao terminar:** rode `npx expo lint`, `npx tsc --noEmit`, os testes que existirem e, se mexeu em banco, `npm run db:reset`; marque o passo neste arquivo (⬜ → 🟡 → ✅) e atualize "Pendências" no README.
7. **Como registrar o andamento de um passo neste arquivo:**
   - **Concluído (✅):** **apague o prompt** (o bloco `text`, "Pronto quando" e "Prazo") e deixe só um parágrafo "**Feito em DD/MM.**" explicando o que foi feito, o que mudou e qualquer observação importante, como o Passo 1.
   - **Parcial (🟡):** mantenha o passo e acrescente **"O que falta / o que fazer"** (lista objetiva, dizendo o que a pessoa precisa fazer) e, se necessário, **troque o prompt por um novo** só com o que falta. Remova do prompt o que já foi feito.
6. Dependências: `npx expo install` no app; no servidor, liste os pacotes para instalar na máquina de quem vai rodar (nunca copie `node_modules` entre sistemas).

Legenda: ⬜ a fazer · 🟡 em andamento · ✅ feito

## Visão geral

| # | Passo | Prazo | Depende de |
|---|---|---|---|
| 0 | Instalar e validar o esqueleto | 05/11 | — |
| 1 | Decisões de stack (SQLite, Fastify, `ProvedorVoz`) — feito | 05/11 | — |
| 2 | Criar o servidor (API) sobre o banco SQLite — feito | 07/11 | 1 |
| 3 | Cadastro e login de verdade — feito | 08/11 | 2 |
| 3.1 | Modelo de contas revisado (perfis, instituição, vínculos) — feito | 14/11 | 3 |
| 4 | Atividades e níveis vindos da API — feito | 09/11 | 2 |
| 5 | Respostas, progressão e histórico no servidor — feito | 10/11 | 3, 4 |
| 6 | Conteúdo pedagógico completo | 14/11 | 4 |
| 7 | Home do aluno: ofensiva, frequência e tela de progresso | 15/11 | 5 |
| 8 | Área do professor e do responsável | 15/11 | 5, 3.1 |
| 9 | Cadastro de atividades e níveis (administrador) | 15/11 | 2 |
| 10 | Narração por voz e preferências de acessibilidade | 15/11 | 1 |
| 11 | Ajuste ao Figma e recursos visuais | 16/11 | — |
| 12 | Testes automatizados | 16/11 | 5, 3.1 |
| 13 | Segurança e privacidade (LGPD) | 16/11 | 3.1 |
| 14 | Correção de bugs e polimento | 16/11 | 7, 8 |
| 15 | Documentação final (PDF, APF, README) | 16/11 | 14 |
| 16 | Preparar a apresentação e a demo | 17/11 | 15 |

Em 14/11 a ordem dos passos mudou e **os passos foram renumerados na ordem de execução** (a numeração antiga de 6 a 17 não vale mais; as referências no README, no AGENTS.md e nos comentários do código foram atualizadas). Os passos 7 e 8 (home do aluno e área do professor) usam as telas provisórias, e o ajuste ao Figma fica no passo 11. As telas que não têm frame no Figma não serão desenhadas: seguem o padrão das já desenhadas. O antigo passo de testes integrados e de usabilidade foi **retirado**; os casos manuais ficam no passo 12 e a correção de bugs no passo 14. Os prazos foram recalculados a partir de 14/11, mantendo a entrega em **17/11**; o dia 16/11 está cheio, então dividam os passos entre as pessoas (todos desenvolvem).

Sprints da documentação: **Sprint 3** vai até 10/11 (passos 0–6), **Sprint 4** de 10/11 a 17/11 (passos 7–16). Os passos 0 a 2 estavam atrasados em relação ao cronograma original (eram da Sprint 1) e foram concluídos em 05/11.

---

## ✅ Passo 0 — Instalar e validar o esqueleto

**Feito em 05/11.** `npm install`, `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor` e `db:reset`/`db:query` passam, e o fluxo de aluno e professor foi testado no Expo Go. Foram corrigidos 3 erros de lint (`Date.now()` no render do React Compiler em `aluno/atividade/[id].tsx` e `aluno/nivelamento/index.tsx`; ícone sem nome em `professor/_layout.tsx`) e adicionados `eslint` e `eslint-config-expo` (devDependencies) com o `eslint.config.js`. O `tsc` e o `expo-doctor` já passavam. Observação: o `db:*` exige Node 22.18+ (em 22.14 use `NODE_OPTIONS=--experimental-strip-types`).

---

## ✅ Passo 1 — Decisões de stack

**Feito em 05/11.** Banco = SQLite em arquivo; API = **Fastify** (Node.js + TypeScript); voz = interface `ProvedorVoz` com `expo-speech` como alternativa e reserva (a API de voz ainda não foi definida).

---

## ✅ Passo 2 — Criar o servidor (API) com Fastify sobre o banco SQLite

**Feito em 05/11.** API em `server/src/` com **Fastify 5** (`@fastify/cors`, `@fastify/rate-limit`; `@fastify/jwt` instalado para o passo 3). `banco.ts` abre o mesmo arquivo dos scripts `db:*` (`caminhoBanco` de `server/db/conectar.mjs`, variável `AJAI_DB`) com `node:sqlite`, `PRAGMA foreign_keys = ON`, e avisa para rodar `db:reset` se o arquivo não existir. `GET /health` confere o banco (503 com mensagem amigável se não abrir). Erros sempre `{ erro }` em português (`erros.ts`, classe `ErroApi`), inclusive 404, JSON inválido/validação (400) e limite de requisições (429). Scripts: `server:dev` (Node roda o `.ts` direto com `--watch`, sem `tsx`), `server:build` (`tsc` → `server/dist/`, fora do git), `server:start`, `server:typecheck`; `npm run typecheck` agora checa app + servidor. `server/.env.example` criado; README ganhou "Subir o servidor" e "Como o app encontra a API" (`EXPO_PUBLIC_API_URL`, IP da Wi-Fi no celular). Nenhuma migração nova; telas do app não mudaram. Observações: servidor só com TypeScript "apagável" (sem `enum`, imports com `.ts`). Testado no Node 22.14.

---

## ✅ Passo 3 — Cadastro e login de verdade (RF01, RF02)

> Modelo de contas revisado no Passo 3.1.

**Feito em 08/11.** Login, cadastro e senha passam pela API, com senha em **scrypt** (`server/db/senha.mjs`, sem módulo nativo) e token **JWT** de 30 dias guardado no `expo-secure-store` (no navegador, `localStorage`). A sessão é restaurada ao abrir o app, com a splash, e funciona sem internet usando a cópia guardada. O "modo demonstração" saiu e o seed grava o hash da senha `demo1234` para todos, incluindo um administrador (`admin@ajai.app`). Modelo de contas:
- só o **professor/responsável** se cadastra sozinho, em `/cadastro` (nome, e-mail, telefone, senha);
- o **aluno** é cadastrado **pelo professor** (`/professor/contas/nova`), entra na turma dele, **não tem e-mail nem telefone** e entra com **nome de usuário** (`maria.silva`);
- o aluno **não troca a própria senha**: só o professor que criou a conta (`Aluno.idCriador`) muda;
- o login tem **um campo só** (usuário, e-mail ou telefone), sem "Quem você é?", e login/cadastro **não têm "Ouvir ajuda"**.

**Servidor:**
- rotas: `POST /auth/cadastro` (professor), `POST /auth/login`, `GET /auth/eu`, `PATCH /auth/senha` (professor/admin), `GET`/`POST /professor/alunos`, `PATCH /professor/alunos/:id/senha` e `POST /admin/usuarios/:id/senha-provisoria` (não vale para aluno);
- `exigirLogin(...perfis)` em `server/src/autenticacao.ts`, mensagens por campo em `erros.ts` e limite de 10 tentativas/min nas rotas com senha;
- script `npm run usuario:senha` para professor/admin.

**Banco:** migrações **002** (`Usuario.telefone`, `email` opcional) e **003** (`Usuario.nomeUsuario`, `Aluno.idCriador`, com `CHECK` por perfil). O `migrar.mjs` ganhou o marcador `-- ajai: sem-chaves-estrangeiras` para recriar tabelas sem apagar em cascata.

**App:** `services/api.ts` (endereço por `EXPO_PUBLIC_API_URL` ou IP do Metro), `services/armazenamento.ts`, `services/contasAlunos.ts`; telas `/esqueci-senha`, `/aluno/conta`, `/professor/contas` (lista, cadastrar, mudar senha), `/professor/senha`, `/admin`. Os layouts protegidos mandam cada perfil para a sua área.

**Testes:** login e cadastro testados no Expo Go pela equipe. O modelo de contas de aluno foi testado pela API (`app.inject`), junto com lint e typecheck (app e servidor).

**Observações:**
- o painel de Acompanhamento ainda lê `mock.ts`, então o aluno novo só aparece em Conta › Contas dos alunos até o passo 8;
- o nível do aluno novo só vai para o servidor no passo 5;
- depois de trocar a senha, os tokens antigos continuam valendo até vencer (passo 13).

---

## ✅ Passo 3.1 — Modelo de contas revisado: perfis, instituição e vínculos (RF01, RF02)

**Feito em 14/11.** Revisa o modelo do Passo 3: agora **cada perfil cria a própria conta** e o professor deixa de cadastrar aluno.

**Modelo novo:**
- perfis **ALUNO**, **PROFESSOR**, **RESPONSAVEL** (novo), **INSTITUICAO** (novo) e **ADMINISTRADOR** (só por seed/script);
- **aluno** se cadastra com nome, senha e pelo menos um entre nome de usuário (sugerido a partir do nome), e-mail ou telefone, e entra por qualquer um deles. Professor, responsável e instituição: e-mail e telefone obrigatórios;
- **instituição** se inscreve (nome, CNPJ com dígitos validados, nome do responsável, e-mail, telefone, senha) e fica **PENDENTE**. O administrador aprova ou recusa no app (recusa com motivo). Ao aprovar, o servidor gera o **código** (6 caracteres maiúsculos, único, sem 0/O/1/I/L, com `crypto`);
- **professor** informa o código ao se cadastrar e fica **PENDENTE** até a instituição aprovar. Recusado, vê o motivo e pode informar outro código;
- conta pendente ou recusada entra no app, mas só vê a tela de espera (`/espera`, com "Verificar de novo"), e as rotas restritas devolvem **403** (`exigirContaLiberada` em `server/src/autenticacao.ts`);
- **vínculo** acompanhante ↔ aluno: o professor (aprovado) ou o responsável convida pelo usuário, e-mail ou telefone do aluno; o aluno aceita ou recusa. Só com vínculo **ACEITO** o acompanhante vê o nome do aluno (antes, só o que ele mesmo digitou). Aluno e acompanhante podem desfazer. **Responsável: no máximo 2** (PENDENTE + ACEITO), conferido no servidor dentro da transação (409 "Você já acompanha 2 pessoas."); professor sem limite;
- **todos trocam a própria senha**, inclusive o aluno. A senha provisória (rota do administrador e `npm run usuario:senha`) vale para todos os perfis, e o script aceita usuário, e-mail ou telefone.

**Banco:** migração **005** recria `Usuario` (perfis novos e `CHECK` novo) e cria `Responsavel`, `Instituicao` e `Vinculo`. `Professor` ganhou `idInstituicao`, `statusVinculo`, `motivoRecusa` e `decididoEm`. O antigo `Aluno.idCriador` virou `Vinculo` ACEITO e saiu (com o índice), e a `vw_aluno` foi recriada. Em banco que já tinha professor, a migração cria a instituição de demonstração (APROVADA, código `EJAVV2`) e liga os professores a ela como APROVADOS. Extra em relação ao prompt: `Vinculo.identificadorConvite` (o que o acompanhante digitou, mostrado até o aceite). Seed: admin; instituição APROVADA (`instituicao@ajai.app`, código `EJAVV2`) e PENDENTE (`aprender@ajai.app`); professor APROVADO (Rafael) e PENDENTE (Paula); responsável (Joana); os 4 alunos ligados ao Rafael e Bruno também à Joana.

**Servidor:**
- `POST /auth/cadastro/{aluno,professor,responsavel,instituicao}` (com `limiteSenha`); o antigo `POST /auth/cadastro` saiu;
- login e `/auth/eu` devolvem `usuario.situacao` (`{ status: PENDENTE|APROVADA|RECUSADA, motivo?, nomeInstituicao? }`);
- `GET /admin/instituicoes?status=`, `PATCH /admin/instituicoes/:id`;
- `GET /instituicao/eu`, `GET /instituicao/professores?status=`, `PATCH /instituicao/professores/:id` (só professores dela; outra = 404);
- `PATCH /professor/instituicao { codigo }`;
- `POST/GET/DELETE /vinculos`, `GET /alunos/eu/vinculos`, `PATCH`/`DELETE /alunos/eu/vinculos/:id`. `temVinculoAceito()` (em `rotas/vinculos.ts`) é o que o passo 8 deve usar antes de mostrar qualquer dado de aluno;
- saíram `rotas/professorAlunos.ts` (`/professor/alunos*`) e a regra "aluno não usa senha provisória".

**App:**
- `/cadastro` virou "Eu sou: Aluno / Professor / Responsável / Instituição", com uma tela por perfil (`/cadastro/aluno`, `/professor`, `/responsavel`, `/instituicao`, componente `FormularioCadastro`);
- `/espera`, `/instituicao` (código, professores pendentes com Aprovar/Recusar, aprovados), `/responsavel` (até 2 pessoas, convidar);
- `/admin` com as instituições pendentes (Aprovar/Recusar e o código gerado);
- professor: "Meus alunos" (`/professor/alunos`, componente `MeusAlunos`) no lugar de `professor/contas/*`;
- aluno: em Minha conta, "Trocar minha senha" (`/aluno/senha`) e "Quem me acompanha" (`/aluno/acompanhamento`: Aceitar/Recusar e Desfazer), e aviso de convite na home;
- `services/contasAlunos.ts` saiu (`sugerirNomeUsuario` foi para `services/auth.ts`); novos `services/instituicoes.ts`, `services/vinculos.ts` e `hooks/useAreaProtegida.ts` (layouts dos 5 perfis).

**Testes:** `npm test` roda 63 testes (29 novos em `server/src/rotas/contas.test.ts`): cadastro de cada perfil, login do aluno por usuário/e-mail/telefone, instituição PENDENTE sem acesso, admin aprova e gera código único, admin não é criável, código inválido, professor PENDENTE bloqueado e APROVADO liberado, instituição só decide os dela, 409 no 3º vínculo do responsável, professor sem limite, nada do aluno sem vínculo ACEITO, aluno troca a senha e senha provisória para aluno. Lint, typecheck (app e servidor), `db:reset` e `npx expo export -p web` passam. O fluxo instituição → admin → professor → instituição → aluno → convite → aceite foi conferido contra o servidor rodando; **falta a equipe repetir o fluxo pelas telas no Expo Go**.

**Observações:**
- o painel do professor (Acompanhamento e métricas) continua lendo o `mock.ts` até o passo 8;
- turmas e `Matricula` não mudaram; o aluno que se cadastra sozinho não entra em turma (passo 8);
- depois de `git pull`, rode `npm run db:migrate` (ou `db:reset`) e abra o `npx expo start` uma vez antes do `npx tsc` (gera os tipos das rotas novas).
---

## ✅ Passo 4 — Atividades e níveis vindos da API

**Feito em 09/11.** A trilha, as atividades e o nivelamento vêm do banco pela API, e o app **não recebe mais o gabarito**.

**Servidor** (`server/src/rotas/atividades.ts`, qualquer perfil logado):
- `GET /niveis`, `GET /niveis/:id/atividades` (só ATIVAS, alternativas em ordem), `GET /atividades/:id`, `GET /nivelamento` (por ordem do nível e `ordemNivelamento`);
- nenhuma resposta leva `respostaCorreta` nem `Alternativa.correta`;
- como o app ficou sem o gabarito, a correção já foi para o servidor: `POST /atividades/:id/corrigir` → `{ correta }` (`server/src/correcao.ts`, tolerante a maiúsculas, acentos e espaços). Ela só corrige, não grava. **Provisória:** sai quando o `POST /respostas` do passo 5 existir.

**Banco:** migração **004** criou `Atividade.textoApoio` (a palavra em destaque, a frase ou o texto de interpretação, separado do enunciado). No `mock.ts`:
- SILABA ganhou "BOLA";
- PALAVRA passou a ser montada com as peças CA, SA, BO e LA;
- FRASE separou a frase da pergunta;
- entrou uma atividade INTERPRETACAO no nível 5 (consulta de Dona Rosa), que também está no nivelamento (5 perguntas).

**App:**
- `services/atividades.ts` agora é assíncrono e guarda a trilha na memória;
- tipo `AtividadeDoAluno` (sem gabarito) em `modelos.ts`;
- hook `useCarregar` (`src/hooks/`) e componente `Carregando`: "Carregando..." e "Sem conexão. Toque para tentar de novo.", com "Ouvir ajuda" nas telas do aluno;
- telas ligadas à API: home, atividade, nivelamento (com barra de progresso, como no Figma), resultado do nivelamento e progresso;
- o painel do professor continua lendo o mock (passo 8).

**`AtividadeView` tem um layout por tipo:**
- LETRA: letra grande + alternativas com imagem;
- SILABA: palavra em destaque + sílabas grandes;
- PALAVRA: palavra em destaque, espaços para montar, peças de sílaba, "Apagar" e "Confirmar" (Figma "Formar palavra");
- FRASE: frase num cartão com "Ouvir frase" + múltipla escolha;
- INTERPRETACAO: texto visível com "Ouvir texto" + múltipla escolha;
- ESCRITA: campo de texto.

O "Ouvir instrução" também lê as opções. Enquanto o servidor corrige, a tela trava os toques e mostra "Conferindo sua resposta...".

**Ajustes pedidos no primeiro teste:**
- `maria.silva` agora é aluna nova no seed (sem nível), para o login levar ao nivelamento. Os outros alunos de demonstração continuam com nível.
- **Sessão de 5 atividades** (`src/services/sessaoDeEstudo.ts`, constante `ATIVIDADES_POR_SESSAO`):
  - o CONTINUAR da home começa a sessão, e a tela mostra "Atividade X de 5";
  - depois de um acerto, "Continuar →" vai direto para a próxima atividade;
  - erro → "Tentar novamente" a mesma atividade (só os acertos contam);
  - na 5ª atividade acertada: "Voltar ao início" ou "Continuar treinando" (a próxima parada é na 10ª).
- Ordem das atividades: primeiro as da etapa que o aluno ainda não acertou. Com poucas atividades por etapa (até o passo 6), as já acertadas se repetem, a mais antiga primeiro e nunca a mesma duas vezes seguidas.

**Testes:**
- fluxo testado no Expo Go pela equipe em 09/11: nivelamento, sequência de 5 atividades e volta para a home;
- rotas testadas com `app.inject`: 401 sem login, 404, gabarito ausente e correção com acento/maiúscula/espaço;
- lint, typecheck (app e servidor), `npx expo export -p web` e `npm run db:reset` passam.

**Observações:**
- na tela "Formar palavra", a **foto** da palavra (a casa) ainda não aparece: vem com as imagens do passo 11, usando `Atividade.urlImagem`, que já existe no banco;
- respostas e subida de nível ficam só na memória do app até o passo 5: ao reabrir o app, o aluno novo refaz o nivelamento;
- `POST /atividades/:id/corrigir` é provisória e sai no passo 5;
- PALAVRA usa as alternativas como peças (várias `correta`), o que muda a validação do passo 9.

---

## ✅ Passo 5 — Respostas, progressão e histórico no servidor (RF12–RF19, RF22)

**Feito em 09/11.** Cada resposta vai para o banco, e a correção e a subida de nível acontecem no servidor. HistoricoNivel e DesempenhoConteudo são atualizados, e o aluno continua de onde parou ao reabrir o app.

**Servidor** (`server/src/rotas/progresso.ts` + `server/src/desempenho.ts`; só perfil ALUNO, sempre sobre ele mesmo):
- `POST /respostas` → `{ correta, subiuDeNivel, nivelAtual }`. Corrige, grava Resposta, atualiza DesempenhoConteudo e, se subir, grava HistoricoNivel, tudo numa transação;
- `POST /nivelamento/concluir { respostas[] }` → `{ nivel }`. Corrige de novo e só aceita as perguntas na ordem, sem pular. Grava as respostas, `idNivelInicial` e HistoricoNivel, e só pode ser feito uma vez;
- `GET /alunos/eu/progresso?anterior=` → nível, trilha com status, totais, taxa, até 3 dificuldades e a próxima atividade;
- `POST /atividades/:id/corrigir` ficou **só para perguntas do nivelamento**. O nivelamento ainda precisa dela para parar no primeiro erro.

**Regras:** as funções puras foram de `src/services/progressao.ts` para `server/src/progressao.ts` **sem mudar a lógica**. A escolha da próxima atividade, que estava em `sessaoDeEstudo.ts`, também foi para lá. O app só reexporta essas funções para o painel do professor, que usa o mock até o passo 10.

**App:**
- `incluirResposta`/`responderAtividade` chamam `POST /respostas`;
- `definirNivelDoAluno` virou `concluirNivelamento` (`services/alunos.ts`) + `comNivel`, que cria um objeto novo sem mutar e não grava no mock;
- o CONTINUAR e o "Continuar →" pedem a próxima atividade ao servidor (`services/progresso.ts`);
- home e `/aluno/progresso` leem `GET /alunos/eu/progresso`;
- `entrar(...)` da sessão também atualiza a cópia guardada do usuário.

**Testes:**
- fluxo testado no Expo Go pela equipe em 09/11;
- `npm test` (`node --test`, sem dependências) roda 34 testes: funções puras e rotas com `app.inject` num banco temporário (401/403/404/409, gabarito ausente, Resposta e DesempenhoConteudo gravados, nivelamento fora de ordem recusado, subida de nível com HistoricoNivel, `/auth/eu` devolvendo o nível gravado);
- lint, typecheck (app e servidor), `npx expo export -p web` e `npm run db:reset` passam.

**Observações:**
- a **regra de progressão continua provisória** e precisa ser confirmada pela equipe: últimas 5 respostas da etapa ≥ `criterioAcerto`, conferida só depois de um acerto numa atividade da etapa atual. Se mudar, mude `server/src/progressao.ts`, os testes e o README;
- pelos dados de exemplo, Ana e Clara sobem de etapa logo no primeiro acerto (bom para a demo);
- o painel do professor e a tela de métricas do aluno ainda leem as respostas do mock, então as respostas novas só aparecem lá no passo 8.

---

## ⬜ Passo 6 — Conteúdo pedagógico completo (RF04–RF11)

**Prazo:** 14/11 · **Depende de:** passo 4

**Pronto quando:** cada um dos 5 níveis tem pelo menos 6 atividades revisadas pela equipe (idealmente por um dos profissionais da EJA da pesquisa), cobrindo letra-som, cotidiano e interpretação de texto, e o `mock.ts` foi atualizado e `npm run db:seed` roda sem erro.

```text
Leia AGENTS.md, src/domain/modelos.ts (TipoAtividade), src/data/mock.ts e server/db/seed.mjs
(o seed lê o mock.ts: é nele que se escrevem as atividades; depois rode `npm run db:seed`).

Preciso do banco de atividades do AJAI para jovens, adultos e idosos em alfabetização
(EJA). Público adulto: NADA infantilizado; use situações do cotidiano (ônibus, mercado,
remédio, conta de luz, documento, placa de rua, receita, mensagem no celular).

Gere, no formato de src/data/mock.ts (tipo Atividade), pelo menos 6 atividades por nível:
1 Aprendendo Letras (reconhecer letra; associar letra e som – RF05)
2 Formando Sílabas
3 Formando Palavras (montar palavra com sílabas; escrita curta – RF09)
4 Lendo Frases (frases do dia a dia – RF08, RF11)
5 Entendendo Textos (texto de 2 a 4 linhas + pergunta – RF10)
Regras: enunciado curto (até 12 palavras), 3 alternativas, só uma correta,
distratores plausíveis, campo `conteudo` padronizado (ex.: "Letra B", "Sílaba BO")
porque ele alimenta o relatório de dificuldades.
Para RF05 (letra-som) e RF11 (cotidiano), proponha se viram novos valores de
TipoAtividade ou só `conteudo` de tipos existentes, e explique o impacto no diagrama
de classes e na APF. Liste no final as imagens que precisaremos (nome do arquivo +
descrição) para a equipe de design produzir.
Gere também as perguntas definitivas do NIVELAMENTO (RF03): uma ou duas por nível, em ordem
crescente de dificuldade (campo ordemNivelamento), e proponha a regra para definir o nível
inicial (hoje provisória: para no primeiro erro) para a equipe validar com os
profissionais da EJA.
Depois de revisado pela equipe: <colar aqui as correções>, atualize o mock.ts e rode
`npm run db:seed` para conferir que o banco carrega sem erro.
```

---

## ⬜ Passo 7 — Home do aluno: ofensiva, frequência e progresso (RF15, RF18, RF19)

**Prazo:** 15/11 · **Depende de:** passo 5 (usa as telas provisórias; o ajuste ao Figma fica no passo 11)

**Pronto quando:** o cartão "Ofensiva – X dias seguidos" mostra o número real, a tela de progresso segue o Figma e o aluno vê uma comemoração ao subir de nível.

```text
Leia AGENTS.md, src/app/aluno/index.tsx, src/app/aluno/progresso.tsx,
src/app/aluno/resultado.tsx e o endpoint GET /alunos/eu/progresso.

1. No servidor, calcule a ofensiva: quantos dias seguidos (até hoje ou ontem) o aluno
   respondeu pelo menos 1 atividade, no fuso America/Sao_Paulo. Inclua em
   /alunos/eu/progresso junto com atividades nos últimos 7 dias.
2. Na home, mostre a ofensiva real com texto encorajador (nunca culpar quem parou:
   se zerou, "Que bom ter você de volta!").
3. Refaça /aluno/progresso (frame do Figma se já existir: <link>), com a trilha de níveis,
   atividades feitas, taxa de acerto e "Vale a pena treinar" (dificuldades).
4. Quando o servidor responder subiuDeNivel, mostre uma tela de comemoração
   (frame do Figma se já existir) com narração.
Escreva testes para o cálculo da ofensiva (virada de dia, dias sem uso, fuso).
```

---

## ⬜ Passo 8 — Área do professor e do responsável (RF20, RF21, APF 20–24, 35, 40–43)

**Prazo:** 15/11 · **Depende de:** passos 5 e 3.1 

**Pronto quando:** o professor vê só os alunos com **vínculo ACEITO** com ele, filtra por período, abre métricas com gráfico de evolução, consulta relatórios da turma, cria turma, põe/tira alunos vinculados das turmas e corrige manualmente uma resposta; o responsável vê algumas recomendações sobre as (até 2) pessoas que acompanha.

**A fazer depois (definido no Passo 3.1, não implementado ainda):**
- turmas (criar/editar, mover aluno entre turmas, `Matricula`) e métricas detalhadas do aluno: **só PROFESSOR**, e só de alunos com vínculo ACEITO;
- **responsável**: sem turma e sem métricas detalhadas; só algumas recomendações (ex.: "Maria treinou 3 dias esta semana", "Vale a pena treinar a letra B com ela");
- toda rota que mostrar dado de aluno chama `temVinculoAceito(idAcompanhante, idAluno)` (`server/src/rotas/vinculos.ts`);
- o aluno que se cadastra sozinho não está em turma: o professor coloca na turma depois de o aluno aceitar o convite.

```text
Leia AGENTS.md, src/services/relatorios.ts, src/app/professor/**, src/app/responsavel/**,
server/src/rotas/vinculos.ts e server/.
Frames do Figma: Dashboard do professor, Métricas de Ana Souza (telas sem frame seguem o padrão visual das desenhadas).

No SERVIDOR (professor: exigirContaLiberada("PROFESSOR"); só retornam alunos com Vinculo ACEITO
com ele, conferido com temVinculoAceito):
- GET /professor/painel?inicio&fim → resumo por aluno (frequência em dias, total de
  atividades, taxa de acerto/erro, nível, maior dificuldade, situação EM_DIA /
  ATENCAO / REFORCO com regra documentada);
- GET /professor/alunos/:id?inicio&fim → relatório individual + série diária de taxa
  de acerto + histórico de níveis;
- GET /professor/relatorios/frequencia e /professor/relatorios/dificuldades (por turma);
- CRUD de turma e pôr/tirar/mover aluno entre as turmas DO PRÓPRIO professor (só alunos com
  vínculo ACEITO; o aluno cria a própria conta e aceita o convite em /aluno/acompanhamento);
- RESPONSÁVEL: GET /responsavel/recomendacoes → para cada aluno com vínculo ACEITO, 1 a 3 frases
  curtas (dias de treino na semana, conteúdo para treinar). Sem turma e sem métricas detalhadas.
- PATCH /respostas/:id/correcao (correção manual: muda `correta`, grava
  correcaoProfessor e recalcula DesempenhoConteudo).

No APP: seletor de período (Últimos 7 dias / 30 dias / personalizado), gráfico de
evolução simples (barras com View, sem biblioteca, ou react-native-svg via
`npx expo install` se necessário), aba Relatórios, gestão de turma na aba Conta,
correção manual na tela de métricas. Recarregue os dados ao focar a aba
(useFocusEffect). Mostre o aviso "Os dados complementam a avaliação do professor".
A aba Conta mostra os dados do professor (editar nome), trocar senha (passo 3) e sair.
Em /responsavel, mostre as recomendações embaixo de cada pessoa acompanhada.
Cobertura: confira que TODA tela do professor e do responsável da tabela do README existe e
funciona com dados reais (dashboard, métricas do aluno, relatórios, conta, meus alunos, gestão
de turma, área do responsável). O dashboard deve listar os alunos com vínculo ACEITO (hoje lê o mock).
```

---

## ⬜ Passo 9 — Cadastro de atividades e níveis (administrador, APF 25–31)

**Prazo:** 15/11 · **Depende de:** passo 2

**Pronto quando:** existe um jeito documentado de incluir, editar e inativar atividades e níveis sem mexer no código. Se não houver tempo para telas, um script/rotas protegidas bastam, e a APF/documentação deve dizer isso.

```text
Leia AGENTS.md, src/domain/modelos.ts e server/.
O diagrama e a APF preveem o Administrador com IncluirAtividade, EditarAtividade,
ExcluirAtividade (inativar), ListarAtividades, IncluirNivel e EditarNivel.
Temos até 13/11. Implemente a opção <A ou B>:
A) Rotas REST protegidas por perfil ADMINISTRADOR (o admin do seed já existe) +
   instruções no README para cadastrar via um cliente HTTP (arquivo
   server/admin.http com exemplos prontos).
B) Telas simples no próprio app em /admin (lista de atividades por nível, formulário
   com enunciado, tipo, conteúdo, 3 alternativas e qual é a correta, inativar).
"Excluir" nunca apaga: muda status para INATIVA. Valide que toda atividade de múltipla
escolha tem exatamente uma alternativa correta (PALAVRA usa as alternativas como peças
e ESCRITA não tem alternativas). Inclua o campo textoApoio no formulário.
Inclua também IncluirNivel/EditarNivel (nome, descrição, ordem, criterioAcerto) e a
listagem de atividades por nível. O administrador entra pelo login (passo 3) e só ele
acessa essas rotas/telas.
```

---

## ⬜ Passo 10 — Narração por voz e preferências (RNF04, APF 17)

**Prazo:** 15/11 · **Depende de:** passos 1 e 2 · **Ordem:** depois do 9, antes do 11 e do 12

**Pronto quando:** todo botão "Ouvir ajuda / Ouvir instrução" fala em português do Brasil com a **API de voz escolhida pela equipe** (ainda não definida) e o `expo-speech` funcionando como alternativa e como reserva; o aluno pode mudar a velocidade da voz e o tamanho da letra, a preferência fica salva, e **trocar o provedor é mudar uma linha** (`PROVEDOR_PADRAO` em `src/services/voz/index.ts`).

Arquitetura (a interface e o provedor `console` já existem; faltam os demais):

```
BotaoAudio / telas ──► services/narracao.ts ──► ProvedorVoz ativo (services/voz/index.ts)
                                                  ├─ servidor     (PADRÃO) toca o áudio do AudioCache;
                                                  │                se falhar ──► expo-speech
                                                  ├─ expo-speech  voz do aparelho (alternativa/reserva)
                                                  └─ console      (desenvolvimento)
Servidor: GET/POST /narracao { texto, voz, velocidade } ──► SintetizadorVoz ativo (VOZ_PROVEDOR)
                                                  └─ <API escolhida> → grava o áudio em server/storage/audio + linha em AudioCache
```

```text
Leia AGENTS.md, src/services/narracao.ts, src/services/voz/ (provedor.ts, index.ts,
provedorConsole.ts), src/components/BotaoAudio.tsx,
server/db/migrations/001_esquema_inicial.sql (tabela AudioCache) e src/domain/modelos.ts.

API de voz escolhida pela equipe: <preencher>.
expo-speech também deve ser implementado.
NÃO mude a interface ProvedorVoz nem as telas que chamam falar()/pararFala().

A) Servidor (só se a API escolhida gerar áudio no servidor):
1. Documente no README, seção Voz, como configurar a API escolhida (conta, chave ou
   programa a instalar) e o nome da voz pt-BR usada. Só o computador que GERA os
   áudios precisa disso.
2. server/src/voz/sintetizador.ts com a interface SintetizadorVoz
   { nome; sintetizar(texto, voz, velocidade): Promise<Buffer> } e um arquivo
   server/src/voz/<api>.ts que implementa a API escolhida e devolve o áudio. Prefira
   um formato que não dependa do ffmpeg.
3. Configuração em server/.env (VOZ_PROVEDOR e o que a API exigir) e em
   server/.env.example. Nunca colocar caminhos ou chaves no código.
4. Rota de narração: procura em AudioCache (textoOrigem + voz + velocidade + provedor);
   se não achar, sintetiza, grava o arquivo em server/storage/audio/ e insere a linha.
   Responde a URL do áudio. Valide o tamanho do texto (limite curto).
5. `npm run voz:preparar`: gera, uma vez, o áudio de todos os enunciados e alternativas
   das atividades ATIVAS do banco, nas velocidades 0.8, 1.0 e 1.2. Assim a demonstração
   NÃO depende da API de voz na hora: basta a API do AJAI servir os arquivos.

B) App:
6. src/services/voz/provedorExpoSpeech.ts (`npx expo install expo-speech`; confira a API
   no SDK 58 em https://docs.expo.dev/versions/v58.0.0/): voz pt-BR, respeita
   `velocidade`, falar de novo interrompe a anterior, parar() interrompe, e a Promise de
   falar() resolve ao terminar.
7. src/services/voz/provedorServidor.ts (`npx expo install expo-audio`): pede a URL do
   áudio, toca, e se der erro, rede fora ou áudio inexistente, chama o provedor
   expo-speech como reserva.
8. Registre os dois em `provedores` e defina PROVEDOR_PADRAO conforme a API escolhida
   ("servidor" ou "expo-speech"). Trocar o padrão deve ser só mudar essa constante.
9. Mostre no BotaoAudio o estado "Falando..." enquanto toca (com texto, não só ícone);
   sair da tela para a fala. Nas telas de atividade, leia a alternativa ao tocar e segurar
   (onLongPress), sem selecionar.
10. Crie /aluno/preferencias (Aluno.EditarPreferencias): velocidade da voz (lenta /
    normal / rápida), tamanho da letra (normal / grande / muito grande) e "Ouvir
    exemplo", com botões grandes. Salve no servidor (PATCH /alunos/eu) e aplique
    tamanhoFonte via contexto, sem espalhar ifs. Acesso pela home do aluno.
11. Teste: troque o provedor com usarProvedor("console") e confirme que falar() chega
    nele; teste o provedorServidor com a rede falhando e confirme que cai no expo-speech.
Atualize README (Pendências) com o que foi feito.
```
---

## 🟡 Passo 11 — Recursos visuais (UX/UI)

**Prazo:** 16/11 · **Ordem:** depois do 10, antes do 12

**Pronto quando:** as telas seguem o mesmo padrão visual, os ícones e imagens foram exportados para `assets/`, a fonte Inter está carregada e o ícone/splash do app são do AJAI.

**Feito em 09/11 (parcial):** todos os emojis de `src/` foram trocados por ícones de `@expo/vector-icons` (instalado): alto-falante do `BotaoAudio`, livro do `Logo` e da splash, abas do professor, trilha em `/aluno/progresso` e acerto/erro em `/aluno/resultado` (Ionicons). As figuras das alternativas do `mock.ts` viraram nomes de ícones do `MaterialCommunityIcons` na mesma coluna `Alternativa.ilustracao` (sem migração).

**O que falta / o que fazer:** itens 1, 2, 3 e 5 do prompt abaixo; no item 4, só as imagens finais das alternativas e da palavra em destaque (`urlImagem`).

As telas que ainda não têm frame no Figma (progresso, preferências, relatórios, conta, turmas, cadastros por perfil, espera, área da instituição e do responsável, "Meus alunos", convites etc.) **não serão desenhadas**: seguem o padrão visual das telas já desenhadas (tokens, componentes e layout das telas existentes).

```text
Leia AGENTS.md, src/theme/tokens.ts, src/components/** e as telas em src/app/.
Arquivo do Figma: https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI

1. Compare cada tela implementada com o frame correspondente do Figma (a tabela
   "Telas do Figma × código" está no README) e liste as diferenças de layout, texto,
   cor e espaçamento. Corrija as diferenças.
2. Atualize src/theme/tokens.ts com as cores e tamanhos exatos das variáveis/estilos
   do Figma.
3. Carregue a fonte Inter com expo-font (`npx expo install expo-font @expo-google-fonts/inter`)
   e aplique nos componentes de texto.
4. Os emojis já foram trocados por ícones de @expo/vector-icons (09/11). Troque os ícones
   provisórios das alternativas (Alternativa.ilustracao, nomes do MaterialCommunityIcons)
   pelas imagens exportadas em assets/ (<listar arquivos>), usando urlImagem, e mostre a
   imagem da palavra em destaque em "Formar palavra".
5. Configure ícone do app, ícone adaptativo do Android e splash em app.json com os
   arquivos <listar arquivos>.
Telas sem frame no Figma NÃO se desenham: siga o padrão das telas já desenhadas.
Mantenha as regras de acessibilidade do AGENTS.md.
```

---

## ⬜ Passo 12 — Testes automatizados

**Prazo:** 16/11 · **Depende de:** passos 5 e 3.1

**Pronto quando:** `npm test` roda no app e no servidor, cobrindo correção, nivelamento, progressão, ofensiva, dificuldades e autorização (perfis, aprovação e vínculos).

```text
Leia AGENTS.md, src/services/** e server/.
Configure testes:
- no app: jest-expo (`npx expo install jest-expo jest @types/jest -- --save-dev`) e
  @testing-library/react-native; script `npm test`;
- no servidor: já existe `node --test` (npm test, 63 testes em 14/11); complete os casos abaixo
  que faltarem (ver server/src/rotas/contas.test.ts e progresso.test.ts).
Escreva testes para:
1. corrigirAutomaticamente (acentos, maiúsculas, espaços);
2. definirNivelInicial (acerta tudo, erra a primeira, erra no meio);
3. deveAvancar (menos de 5 respostas, exatamente no critério, abaixo);
4. identificarDificuldades (ordenação, sem respostas);
5. ofensiva (dias seguidos, quebra, fuso);
6. API: acompanhante NÃO vê aluno sem vínculo ACEITO (inclusive nas rotas do passo 8);
   aluno não acessa rotas de professor; aluno troca a própria senha; login por nome de
   usuário, e-mail e telefone; cadastro público cria aluno/professor/responsável/instituição
   mas NUNCA administrador; professor e instituição PENDENTES recebem 403; responsável recebe
   409 no 3º vínculo; resposta não expõe a alternativa correta antes de responder;
7. um teste de tela: tocar na alternativa certa leva à tela "Muito bem!".
Gere também docs/testes/casos-de-teste.md com os casos manuais dos fluxos principais
(instituição se inscreve, admin aprova, professor se cadastra com o código, instituição aprova,
aluno cria a conta, professor/responsável convida, aluno aceita, login do aluno por usuário,
nivelamento, atividade, progressão, área do professor e do responsável) no formato
ID | pré-condição | passos | resultado esperado | resultado obtido.
```

---

## ⬜ Passo 13 — Segurança e privacidade (RNF11, RNF12, LGPD)

**Prazo:** 16/11 · **Depende de:** passos 3 e 3.1

**Pronto quando:** há termo de uso e privacidade em linguagem simples (com áudio), o app pede só os dados necessários e o checklist abaixo foi revisado.

```text
Leia AGENTS.md, src/domain/modelos.ts, src/app/cadastro/* e server/.
Faça uma revisão de segurança e privacidade do AJAI e corrija o que for simples:
- senhas só com hash; JWT com expiração; segredo em variável de ambiente; invalidar tokens
  antigos quando a senha muda; forçar a troca da senha provisória no primeiro login;
- nenhuma chave/segredo no repositório (procure no histórico do git também);
- todas as rotas checam perfil, conta liberada (professor/instituição aprovados) e posse do dado
  (aluno só vê o próprio; professor e responsável só alunos com Vinculo ACEITO; instituição só
  os professores dela);
- CNPJ, e-mail e telefone da instituição e do professor: quem vê (admin e a instituição) e por quê;
- validação de entrada no servidor; limite de tentativas de login;
- dados coletados: confirme que cada campo é necessário (ex.: dataNascimento é
  usado para quê?). Proponha remover o que não for.
Escreva docs/privacidade.md: termo de uso e privacidade em linguagem MUITO simples
(frases curtas, para quem está aprendendo a ler), dizendo que dados coletamos, por
quê, quem vê (o professor vinculado) e como pedir para apagar. Adicione um aceite
"Li e concordo" nos 4 cadastros (aluno, professor, responsável, instituição); no do aluno,
com botão de ouvir o termo, e o convite de acompanhamento explica que quem aceitar vê o progresso.
Liste o que ficou pendente.
```

---

## ⬜ Passo 14 — Correção de bugs e polimento

**Prazo:** 16/11 · **Depende de:** passos 7 e 8

**Pronto quando:** não há bug crítico ou alto aberto, `lint`, `tsc` e `npm test` passam, e o app roda do zero seguindo só o README.

```text
Leia AGENTS.md e a lista de problemas abaixo (achados ao executar os casos de docs/testes/casos-de-teste.md, do passo 12, em pelo menos 1 Android e 1 iPhone ou web):
<colar lista priorizada>
Corrija na ordem de gravidade, um commit por problema, citando o ID do problema.
Não adicione funcionalidades novas. Depois:
- rode lint, typecheck e testes;
- siga o README do zero numa pasta limpa (clone → install → servidor → app) e
  corrija qualquer passo que não funcione;
- auditoria de acessibilidade em TODAS as telas (aluno, professor, administrador): leitor
  de tela (TalkBack e VoiceOver) lendo todos os botões com o rótulo certo, fonte do sistema
  aumentada sem cortar texto, contraste das cores, alvo de toque >= 64, botão de áudio em
  toda tela do aluno; liste o que encontrou e corrija;
- teste em um Android simples/antigo (a persona usa celular modesto): tempo de abertura
  e de resposta aceitáveis, sem travar ao narrar;
- procure TODOs no código (`grep -rn TODO src server`) e, para cada um, resolva ou
  mova para a seção "Trabalhos futuros" do README.
```

---

## ⬜ Passo 15 — Documentação final

**Prazo:** 16/11 · **Depende de:** passo 14

**Pronto quando:** PDF, planilha APF, diagrama de classes e README contam a mesma história do que foi entregue.

```text
Leia README.md, AGENTS.md, docs/** e o código. Compare com a documentação do projeto
(PDF) e a planilha APF_AJAI.xlsx que vou anexar.
Liste todas as diferenças entre o que está documentado e o que foi implementado:
- seção 15 (Prototipação): o PDF diz 9 telas; atualizar com a lista real do Figma;
- stack e arquitetura definidas, incluindo a escolha da voz;
- requisitos RF01–RF22 e RNF01–RNF15: atendido / parcial / não atendido, com a tela
  ou o arquivo que comprova;
- diagrama de classes: campos/enums que mudaram (ex.: TipoAtividade);
- APF: funções que mudaram, foram cortadas ou adicionadas, e o novo total de PF
  (atenção ao ServicoTTS como AIE e ao Administrador);
- cronograma planejado × realizado por Sprint, e riscos que se concretizaram.
Escreva o texto das seções atualizadas pronto para colar no PDF (português formal,
ABNT) e atualize README (Pendências → "Entregue" e "Trabalhos futuros").
```

---

## ⬜ Passo 16 — Apresentação e demonstração

**Prazo:** 17/11

**Pronto quando:** há slides, um roteiro de demo ensaiado de no máximo 5 minutos, o app instalado em pelo menos 2 celulares com dados preparados, e um vídeo de backup gravado.

```text
Leia README.md, docs/** e a documentação final.
Prepare a apresentação final do AJAI (<N> minutos no total, 5 integrantes):
1. Estrutura dos slides: problema (dados IBGE), pesquisa com profissionais da EJA e o
   que ela mudou no produto, solução, demonstração, métricas para o professor,
   gestão do projeto (Scrum + Kanban, APF, custos, riscos), limitações e próximos passos. Indique quem fala cada parte.
2. Roteiro da demo ao vivo (máx. 5 min): instituição se inscreve → admin aprova (código) →
   professor cria a conta com o código → instituição aprova o professor → aluno cria a conta
   → professor convida → aluno aceita → nivelamento → atividade com áudio → erro e "tentar de
   novo" → acerto → sobe de nível; professor → dashboard → aluno com dificuldade → métricas.
   Se o tempo apertar, use as contas do seed (código EJAVV2, professora Paula pendente).
   Liste os dados que precisam estar preparados no banco antes.
3. Plano B e preparação técnica: como rodar a demo SEM internet da faculdade (servidor
   no notebook + celulares no mesmo Wi-Fi/ponto de acesso do celular; app via Expo Go
   ou build de desenvolvimento com EAS), checklist do dia (db:reset com dados de demo,
   áudios já gerados com `npm run voz:preparar`, se a voz vier do servidor, código da instituição
   de demonstração anotado (EJAVV2), EXPO_PUBLIC_API_URL com o IP
   certo, celular carregado, vídeo gravado de backup).
4. Prováveis perguntas da banca e respostas curtas.
```
