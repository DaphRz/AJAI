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
> **Stack:** banco = **SQLite em arquivo dentro do projeto** (`server/data/ajai.db`, criado com `npm run db:reset`) e voz = o app só usa a interface **`ProvedorVoz`**; a API de voz é a **Azure AI Speech** (passo 10, gerada no servidor; antes era o Piper) e o `expo-speech` fica como alternativa e reserva, com troca em uma linha.

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
| 6 | Conteúdo pedagógico completo — feito | 14/11 | 4 |
| 7 | Home do aluno: ofensiva, frequência e tela de progresso — feito | 15/11 | 5 |
| 8 | Área do professor e do responsável — feito | 15/11 | 5, 3.1 |
| 9 | Cadastro de atividades (administrador e professor) e níveis (administrador) — feito | 15/11 | 2, 3.1 |
| 10 | Narração por voz (Azure) e preferências — feito | 15/11 | 1 |
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

**Feito em 05/11.** Banco = SQLite em arquivo; API = **Fastify** (Node.js + TypeScript); voz = interface `ProvedorVoz` com `expo-speech` como alternativa e reserva (a API de voz foi definida no passo 10: Azure AI Speech, depois de testar o Piper).

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

## ✅ Passo 6 — Conteúdo pedagógico completo (RF04–RF11)

**Feito em 14/11.** O banco tem **35 atividades, 7 por nível**, todas do cotidiano adulto (ônibus, remédio, conta de luz, mercado, placa, documento, receita, mensagem), aprovadas pela equipe sem correções. Tabelas, critérios, nivelamento e lista de imagens: [`docs/conteudo-pedagogico.md`](conteudo-pedagogico.md).
- **`mock.ts`:** as atividades são criadas pelo helper `atividade()`. Ele numera as alternativas, tira o gabarito das opções e **faz o seed parar** se uma múltipla escolha não tiver exatamente 1 correta, se as peças de PALAVRA não formarem a palavra ou se uma ESCRITA vier sem resposta. Os ids 1 a 7 continuam os mesmos, mas a 1 virou "Banco" (era "Bola") e a 3 virou "BONÉ" (era "BOLA").
- **`conteudo` padronizado:** "Letra B", "Sílaba BO", "Palavra CASA" / "Escrita PÃO", "Frase: horário" e "Texto: achar informação" / "entender o objetivo" / "tirar conclusão".
- **RF05 e RF11:** **sem tipo novo**. Letra-som = LETRA ("começa com o som da letra P", com as opções narradas), e cotidiano = tema de todos os tipos. Nada muda no diagrama nem na APF; falta só explicar isso no PDF (passo 15).
- **Nivelamento (RF03):** 10 perguntas, 2 por nível (ids 12, 1, 13, 3, 4, 21, 5, 25, 7, 34). **Regra nova** em `definirNivelInicial` (`server/src/progressao.ts`): o aluno para no primeiro erro e só passa de nível acertando as 2 perguntas do par. O nível inicial é o primeiro que ele não domina (o da pergunta errada); acertou tudo = nível 5. A regra antiga (nível da última pergunta acertada) saiu. O app não mudou.
- **Testes:** `progressao.test.ts` ganhou os casos da regra nova (pares, erro na 1ª e na 2ª do par, parar no meio), e `rotas/progresso.test.ts` foi ajustado ao seed novo. `npm test` (65), lint, typecheck e `db:seed` passam, e o fluxo foi testado no app.

**Observações:**
- as figuras ainda são ícones provisórios (`Alternativa.ilustracao`). As imagens finais (25 arquivos obrigatórios e 5 opcionais, listados no documento) entram no passo 11;
- depois de `git pull`, rode `npm run db:seed` (ou `db:reset`) para carregar as atividades novas.

---

## ✅ Passo 7 — Home do aluno: ofensiva, frequência e progresso (RF15, RF18, RF19)

**Feito em 14/11.** A home mostra a ofensiva real, a tela de progresso foi refeita e o aluno vê uma comemoração ao subir de etapa.
- **Servidor:** funções puras em `server/src/progressao.ts`: `calcularOfensiva` (dias seguidos com pelo menos 1 resposta, terminando **hoje ou ontem**, para quem ainda não treinou hoje não perder a sequência antes do dia acabar), `frequenciaRecente` (atividades e dias com atividade nos últimos 7 dias, hoje incluído), `diaNoFuso` e `somarDias`. O "dia" é o do calendário em **America/Sao_Paulo** (`FUSO_PADRAO`): 23h de Brasília ainda conta como o mesmo dia. Contam **todas** as respostas (nivelamento e treino). `GET /alunos/eu/progresso` ganhou `ofensiva { dias, praticouHoje }` e `ultimos7Dias { atividades, diasComAtividade }`. Nenhuma migração.
- **Home (`/aluno`):** cartão "Ofensiva" com ícone, o número de dias e a frequência da semana. Textos em `textoDaOfensiva`/`textoDaSemana` (`src/services/progresso.ts`), sempre positivos: zerou → "Que bom ter você de volta!"; sem treino hoje → "Faça uma atividade hoje para continuar a sequência." O "Ouvir ajuda" lê a ofensiva. As legendas da home subiram para `fontes.corpo` (20).
- **`/aluno/progresso`:** trilha com o nome e a situação de cada etapa em texto ("Concluída", "Você está aqui", "Próxima"), atividades feitas e taxa de acerto com barra, ofensiva e semana, e "Vale a pena treinar" (ou "Você está indo bem em tudo"). O "Ouvir ajuda" lê tudo isso.
- **Comemoração (`/aluno/comemoracao`):** quando `POST /respostas` devolve `subiuDeNivel`, a atividade abre esta tela no lugar do "Muito bem!": troféu, "Parabéns! Você passou para a etapa X", **narração automática ao abrir** (para ao sair), "Continuar →" (primeira atividade da etapa nova, mantendo a contagem da sessão), "Ver meu progresso" e "Voltar ao início".
- **Figma:** progresso e comemoração não têm frame; seguem o padrão das telas desenhadas (Home e Acerto).
- **Testes:** `npm test` roda 79 testes (14 novos): virada de dia em Brasília (23h59 × 00h01), dia sem uso quebrando a sequência, sequência até ontem, ordem das respostas, outro fuso, borda da janela de 7 dias e a rota devolvendo `ofensiva`/`ultimos7Dias`. Lint, typecheck (app e servidor) e `npx expo export -p web` passam, e o endpoint foi conferido com o servidor rodando.

**Observações:**
- **falta a equipe abrir as três telas no Expo Go** (home, progresso e comemoração; para ver a comemoração, entre como Ana ou Clara, que sobem de etapa no primeiro acerto);
- a home recarrega quando o nível muda ou ao voltar por `router.replace`; ao voltar com o botão "Voltar" do aparelho, a ofensiva pode ficar com o número de antes até reabrir a tela;
- depois de `git pull`, abra o `npx expo start` uma vez antes do `npx tsc` (gera o tipo da rota nova `/aluno/comemoracao`).

---

## ✅ Passo 8 — Área do professor e do responsável (RF17, RF20, RF21, APF 20–24, 35, 40–43)

**Feito em 14/11.** A área do professor e as recomendações do responsável vêm da API, e **nenhuma tela lê mais o `mock.ts`** (ele só alimenta o seed).

**Servidor** (`server/src/rotas/professor.ts` e `responsavel.ts`; professor com `exigirContaLiberada("PROFESSOR")`, só alunos com vínculo ACEITO; aluno de outro professor ou sem vínculo = **404**, para não revelar que existe):
- `GET /professor/painel?inicio&fim`: por aluno, nível, turma, dias com atividade, atividades, acertos, taxa, maior dificuldade e situação;
- `GET /professor/alunos/:id?inicio&fim`: resumo, acertos por conteúdo, **série diária** (um ponto por dia, `null` sem atividade), histórico de níveis e as 30 respostas mais recentes com a resposta esperada (só o professor vê);
- `GET /professor/relatorios/frequencia` e `/dificuldades` (`?idTurma&inicio&fim`; sem `idTurma` = todos os alunos dele);
- turmas: `GET/POST /professor/turmas`, `PATCH/DELETE /professor/turmas/:id` (nome, período, encerrar/reabrir; apagar deixa os alunos sem turma) e `PUT /professor/alunos/:id/turma { idTurma | null }` (põe, move ou tira; um aluno fica em **uma turma de cada professor**; turma encerrada = 409). Desfazer o vínculo (pelo professor ou pelo aluno) tira o aluno das turmas daquele professor;
- `PATCH /respostas/:id/correcao { correta, observacao? }`: muda `correta`, grava `correcaoProfessor` (a observação ou um texto padrão) e **recalcula** o DesempenhoConteudo. **Não mexe na etapa** (HistoricoNivel);
- `GET /responsavel/recomendacoes`: para cada pessoa com vínculo ACEITO, até 3 frases (dias de treino nos últimos 7 dias, conteúdo para treinar junto, etapa atual);
- `PATCH /auth/eu { nome }`: qualquer perfil muda o próprio nome;
- **turmas da instituição** (`server/src/rotas/turmasInstituicao.ts`, instituição aprovada): `GET/POST /instituicao/turmas` e `PATCH/DELETE /instituicao/turmas/:id`. A instituição cria a turma e escolhe um professor **aprovado dela**; a turma aparece na aba Turmas desse professor, que põe os alunos. Ela vê só **quantos** alunos há (não os nomes). Trocar o professor tira os alunos da turma (eram acompanhados pelo professor antigo). Turma de professor de outra instituição = 404.

**Período:** dias "AAAA-MM-DD" no fuso America/Sao_Paulo, início e fim incluídos; sem eles, os últimos 7 dias; no máximo 1 ano. **Regra da situação** (`situacaoDoAluno` em `server/src/progressao.ts`): sem atividade no período → ATENÇÃO; taxa de acerto < 60% → REFORÇO; menos de 3 dias com atividade por semana (proporcional ao período, mínimo 1) → ATENÇÃO; senão EM DIA. Funções puras novas: `diasNoPeriodo`, `estaNoPeriodo`, `diasEsperados`, `situacaoDoAluno`, `serieDiaria`, `recomendacoesParaFamilia`. **Nenhuma migração** (Turma e Matricula já existiam).

**App:**
- `services/relatorios.ts` reescrito (API) e `services/turmas.ts` novo; saíram `services/progressao.ts` e `buscarAluno` (liam o mock);
- componentes novos: `SeletorPeriodo` (Últimos 7 dias / 30 dias / Escolher datas em dd/mm/aaaa), `GraficoBarras` (só `View`, sem biblioteca, com descrição para o leitor de tela) e `Opcao`; hook `useVersaoAoFocar` (recarrega ao voltar à aba, com `useFocusEffect`) e `useCarregar(..., { manterAnterior })` (não pisca "Carregando..." ao recarregar);
- **Dashboard** (`/professor`): período, alunos com vínculo aceito, turma no cartão, selo verde "Em dia";
- **Métricas** (`/professor/aluno/[id]`): situação, frequência, taxa de acerto/erro, gráfico da taxa de acerto por dia, histórico de etapas, acertos por conteúdo e respostas recentes com "Considerar certa/errada" (observação opcional);
- **Relatórios** (`/professor/relatorios`): filtro por turma, alunos que treinaram, atividades por dia (gráfico), dias por aluno (menos ativos primeiro) e conteúdos com mais dificuldade;
- **Navegação do professor refeita:** no SDK 58, tela escondida das abas (`href: null`) **redireciona para a 1ª aba**, então "Meus alunos: convidar", "Ver métricas" e "Trocar senha" voltavam para o dashboard. Agora `professor/_layout.tsx` é uma pilha (Stack) com a proteção de acesso; as abas ficam no grupo `professor/(abas)/` (Acompanhamento, **Turmas**, Relatórios, Conta) e as telas internas (`aluno/[id]`, `alunos`, `senha`) ficam fora das abas. As URLs não mudaram. Conferido no navegador (Playwright): convidar, métricas, turmas e senha abrem;
- **aba Turmas** (`/professor/turmas`): os alunos de cada turma com "Ver métricas" e "Mudar de turma"; "Opções da turma" (editar, encerrar/reabrir, apagar); "Criar turma nova"; alunos sem turma. O **dashboard** filtra por turma ("Todas as turmas", cada turma, "Sem turma");
- **Conta**: editar nome, "Meus alunos", trocar senha e sair;
- **Instituição › Turmas** (`/instituicao/turmas`, botão "Turmas" na área da instituição): criar turma escolhendo o professor, editar, trocar professor, encerrar/reabrir e apagar;
- **gráficos** com o número em cima de cada barra (taxa de acerto em % nas métricas, quantidade de atividades nos relatórios); com mais de 10 dias, as barras rolam para o lado e o gráfico abre nos dias mais recentes;
- **Responsável** (`/responsavel`): "Dicas para ajudar" embaixo de cada pessoa que aceitou (`MeusAlunos` ganhou `extraDoAluno`) e "Ouvir dicas";
- aviso "Os dados do aplicativo complementam a avaliação do professor" no dashboard, nas métricas e nos relatórios.

**Testes:** `npm test` roda 110 testes (31 novos): funções puras (período, fuso, situação, série, recomendações) e `rotas/professor.test.ts` (aluno/responsável/professor PENDENTE barrados, **outro professor não vê nem mexe em nada do Rafael**, convite PENDENTE não libera dados, responsável só recebe recomendações de quem aceitou, período inválido = 400, correção manual recalculando o desempenho, turmas e mover aluno, vínculo desfeito tirando da turma, editar nome, turmas da instituição: só professor aprovado dela, total sem nomes de alunos, trocar professor tira os alunos, outra instituição = 404). Lint, typecheck (app e servidor), `db:reset` e `npx expo export -p web` passam, e as rotas foram conferidas com o servidor rodando.

**Observações:**
- **falta a equipe abrir as telas no Expo Go** (no navegador já foram conferidas; dashboard, métricas, relatórios, conta, turmas, área do responsável e turmas da instituição; Rafael `rafael@ajai.app`, Joana `joana@ajai.app` e instituição `instituicao@ajai.app`, senha `demo1234`);
- pelos dados de exemplo, nos últimos 7 dias Ana, Bruno e Clara ficam "Em dia" (Ana está no limite, 60%) e Maria "Atenção" (não fez o nivelamento). Para mostrar um aluno em REFORÇO na demo, faça algumas respostas erradas com a Ana antes;
- a regra da situação e as frases do responsável são **provisórias**: a equipe precisa validar (mude em `server/src/progressao.ts` e nos testes);
- depois de `git pull`, abra o `npx expo start` uma vez antes do `npx tsc` (gera os tipos das rotas novas `/professor/turmas` e `/instituicao/turmas`).
- a turma não guarda quem a criou (instituição ou professor): o professor pode editar ou apagar uma turma criada pela instituição. Se a equipe quiser travar isso, precisa de uma migração (`Turma.idInstituicao`/criador).

---

## ✅ Passo 9 — Cadastro de atividades (administrador e professor) e de níveis (administrador) (APF 25–31)

**Feito em 14/11.** Foi feita a **opção B** (telas no app), com as rotas da opção A e o `server/admin.http` de bônus. O administrador e o **professor aprovado** incluem, editam e inativam atividades sem mexer no código; níveis (etapas) só o administrador.

**Servidor** (`server/src/rotas/cadastroAtividades.ts`; prefixo `/gestao`, separado das rotas do aluno porque **traz o gabarito**):
- atividades (`exigirContaLiberada("ADMINISTRADOR", "PROFESSOR")`): `GET /gestao/niveis` (com total de ativas/inativas), `GET /gestao/atividades?idNivel&status&minhas`, `GET /gestao/atividades/:id`, `POST`, `PUT /gestao/atividades/:id` (troca tudo, inclusive as alternativas), `DELETE` (**só inativa**, nunca apaga) e `PATCH /gestao/atividades/:id/status` (reativar). Cada atividade vem com `podeEditar` e `nomeCriador`;
- o professor vê todas, mas só edita/inativa as que **ele** criou; as do seed (sem criador) e as de outro professor = **403**. O administrador mexe em todas;
- níveis (`exigirLogin("ADMINISTRADOR")`): `POST /gestao/niveis` e `PATCH /gestao/niveis/:id` (nome, descrição, ordem, `criterioAcerto` de 0,1 a 1). Ordem repetida = 409;
- **validação** em função pura (`server/src/validarAtividade.ts`), a mesma para os dois perfis e com as regras do helper do `mock.ts`: múltipla escolha = 2 a 4 alternativas diferentes e **exatamente 1 certa**; PALAVRA = as peças marcadas formam a palavra do `textoApoio` em alguma ordem (testa as combinações, aceita acento); ESCRITA = sem alternativas e com `respostaCorreta`; LETRA = conteúdo "Letra X" (a letra grande sai daí); SILABA, PALAVRA, FRASE e INTERPRETACAO exigem `textoApoio`. Mensagens curtas para quem cadastra;
- **travas** para não quebrar a trilha (409): pergunta do nivelamento não é inativada nem muda de etapa; a última atividade ativa de uma etapa não é inativada nem muda de etapa. Em `POST /respostas` (`rotas/progresso.ts`), etapa **sem atividade ativa** conta como fim da trilha: o aluno não sobe para uma etapa nova vazia;
- ao editar, as imagens das alternativas (`urlImagem`, passo 11) com o mesmo texto são mantidas, e o ícone provisório (`ilustracao`) vai e volta pelo formulário.

**Banco:** migração **006** (`Atividade.idCriador` → Usuario, com índice; NULL = conteúdo do seed). `modelos.ts`: `Atividade.idCriador` e os métodos do diagrama documentados em `Professor` e `Administrador`.

**App:** `services/cadastroAtividades.ts` e componente `GestaoAtividades` (`ListaAtividades` e `FormularioAtividade`, os mesmos para os dois perfis):
- **administrador:** botões "Atividades" (`/admin/atividades`, por etapa) e "Etapas" (`/admin/niveis`: incluir e editar, critério em %, aviso de etapa sem atividades) na tela inicial;
- **professor:** Conta › "Atividades" (`/professor/atividades`): "Minhas atividades" ou "Todas por etapa" (as dos outros só para consulta);
- **formulário** (`/admin/atividade` e `/professor/atividade`, `?id=` para editar): etapa, tipo, conteúdo, enunciado, texto de apoio com rótulo e exemplo por tipo, 3 alternativas (até 4) com "É a certa", peças com "Faz parte da palavra" (até 8) ou "Resposta certa" na escrita. O servidor dá a palavra final.

**Testes:** `npm test` roda **136 testes** (26 novos): `validarAtividade.test.ts` (regras de cada tipo, peças fora de ordem, repetidas, LETRA) e `rotas/cadastroAtividades.test.ts` (aluno e professor PENDENTE = 403; professor não edita as do seed; **outro professor não edita nem inativa = 403** e o administrador pode; a atividade nova aparece para o aluno **sem gabarito** e é corrigida pelo gabarito novo; editar troca as alternativas; inativar não apaga, a resposta continua e a atividade some da trilha; reativar; travas do nivelamento e da última ativa; níveis só do administrador, ordem repetida = 409). Lint, typecheck (app e servidor), `db:reset` e `npx expo export -p web` passam. As telas foram percorridas no navegador (Playwright): professor inclui (com o aviso "Marque exatamente uma alternativa certa."), lista, inativa, edita; administrador vê as etapas e as atividades.

**Observações:**
- **decisão pendente da equipe:** a atividade do professor vale para **todos** os alunos (como ficou) ou só para os que ele acompanha? Se for "só os dele", o filtro entra em `idsAtividadesDoNivel`/`GET /niveis/:id/atividades`;
- o formulário não envia imagem (`urlImagem`): as imagens das atividades cadastradas ficam para o passo 11;
- mudar o `conteudo` ou a etapa de uma atividade que já tem respostas não refaz o DesempenhoConteudo antigo (as respostas novas já entram no conteúdo novo);
- **falta a equipe abrir as telas no Expo Go** (`admin@ajai.app` e `rafael@ajai.app`, senha `demo1234`); depois de `git pull`, rode `npm run db:migrate` e abra o `npx expo start` uma vez antes do `npx tsc` (gera os tipos das rotas novas).

---

## ✅ Passo 10 — Narração por voz e preferências (RNF04, APF 17)

**Feito em 18/11.** A equipe configurou a chave da Azure e ouviu a voz no celular e na web. A primeira versão usou o **Piper** (local, sem conta), mas a voz ficou ruim; no mesmo dia a equipe trocou para a **Azure AI Speech** (voz neural **`pt-BR-FranciscaNeural`**), só criando `server/src/voz/azure.ts` e mudando `VOZ_PROVEDOR` (a rota, o app e as telas não mudaram). O servidor gera o MP3 uma vez e guarda em `AudioCache`; o app toca com o `expo-audio` e usa o `expo-speech` (voz do aparelho) quando a rede ou a Azure falham. `PROVEDOR_PADRAO = "servidor"`; trocar para só a voz do aparelho é mudar para `"expo-speech"`. A interface `ProvedorVoz` e as telas que chamam `falar()`/`pararFala()` não mudaram.

**Servidor:**
- `server/src/voz/`: `sintetizador.ts` (interface `SintetizadorVoz`: `nome`, `vozPadrao`, `formato`, `sintetizar(texto, voz, velocidade)`), **`azure.ts`** (padrão: `POST https://<região>.tts.speech.microsoft.com/cognitiveservices/v1`, chave no cabeçalho `Ocp-Apim-Subscription-Key`, SSML com `<prosody rate="-20%">` para a velocidade, saída `audio-24khz-96kbitrate-mono-mp3`; no 429 espera o `Retry-After` e tenta de novo, porque o plano gratuito F0 só aceita 20 pedidos por minuto), `piper.ts` (alternativa local), `index.ts` (escolhe por `VOZ_PROVEDOR`; `usarSintetizador` para testes) e `narracao.ts` (cache por texto + voz + velocidade + provedor; pedidos iguais ao mesmo tempo geram um arquivo só);
- `POST /narracao { texto, velocidade? }` (qualquer perfil logado; até 800 caracteres) → `{ url }` relativa à API; 503 se a narração estiver desligada ou a Azure falhar. `GET /narracao/audio/:arquivo` serve o MP3 sem login (nome = hash de 160 bits), com `Range` (iPhone);
- `PATCH /alunos/eu { velocidadeVoz?, tamanhoFonte? }` (só ALUNO, sobre ele mesmo) → `{ usuario }`;
- `server/.env` / `.env.example`: `VOZ_PROVEDOR=azure`, `AZURE_SPEECH_KEY` (segredo), `AZURE_SPEECH_REGION`, `AZURE_VOZ`, `VOZ_TEMPO_LIMITE_MS`, `VOZ_PASTA_AUDIO` (opcional); as do Piper ficaram comentadas;
- `npm run voz:preparar` (`server/scripts/voz-preparar.mjs`): todas as atividades ATIVAS + frases fixas em 0.8, 1.0 e 1.2 (138 textos × 3 = 414 áudios; uns 20 min no F0). Cada áudio pode esperar até 2 min; para depois de 5 falhas seguidas sem nenhum sucesso (chave errada, sem internet).

**App:**
- `provedorExpoSpeech.ts` e `provedorServidor.ts` (espera o servidor até 8 s, toca, cai no expo-speech se a rede falhar, der 503 ou o áudio não carregar);
- **`modoAudio.ts`** (correção de 18/11): os dois provedores ligam `playsInSilentMode` antes de falar. No iPhone com a chave do silencioso ligada, a voz do aparelho ficava muda, porque só o áudio do servidor ligava esse modo;
- `src/services/textosNarrados.ts`: texto do "Ouvir instrução", o mesmo usado pelo `voz:preparar`;
- `BotaoAudio` com "Falando..." / "Toque para parar" e parada ao sair da tela; toque longo nas opções e sílabas lê o texto sem escolher;
- `/aluno/preferencias` ("Voz e letra", na home e em Minha conta): velocidade Lenta 0.8 / Normal 1.0 / Rápida 1.2 com "Ouvir exemplo" e letra Normal 20 / Grande 24 / Muito grande 28, salvas no servidor e aplicadas pelo `PreferenciasProvider` (`useEstilos`/`useFontes` nas telas do aluno e nos componentes compartilhados).

**Banco:** nenhuma migração. No `mock.ts`, a velocidade dos alunos de demonstração foi de 0.9 para **1** (Normal).

**Testes:** `npm test` roda o servidor (155; 19 em `rotas/narracao.test.ts` com uma Azure e um Piper **de mentira** por HTTP: chave, SSML, formato MP3, espera no 429, cache, velocidades, pedidos simultâneos, 400/401/503, troca de sintetizador, `Range`, preferências) e a voz do app (12 em `src/services/voz/voz.test.ts`: provedor `console`, rede falhando/503/áudio quebrado caindo no `expo-speech`, interrupções e o modo silencioso antes da voz do aparelho). Lint e typecheck passam. Com o Piper de verdade, o fluxo completo foi conferido no navegador; com a Azure de verdade, a equipe gerou os áudios e ouviu no celular e na web (18/11).

**Observações:**
- a chave da Azure fica só em `server/.env` (fora do git). Para gerar áudio de conteúdo novo: recurso **Speech** (Free F0) no portal da Azure, Chave 1 e região no `server/.env`, `npm run voz:preparar` (uns 20 min no F0) e commit dos MP3 novos (README › Narração por voz). Outra voz: troque `AZURE_VOZ` e rode o `voz:preparar` de novo;
- os MP3 de `server/storage/audio/` são **versionados** (~20 MB em 18/11): quem clona ouve a voz sem a chave, porque o servidor acha o arquivo pelo nome e o registra no `AudioCache` (teste em `narracao.test.ts`; conferido com banco novo e sem chave: 414 de 414 encontrados). `db:reset`/`db:seed` apagam as linhas, não os arquivos;
- texto novo sem áudio gerado (ex.: atividade cadastrada pelo professor, saudação com o nome do aluno) é gerado na hora se o servidor tiver a chave; sem a chave, toca com a voz do aparelho;
- passo 15: revisar o `ServicoTTS` na APF (Azure, custo zero no F0) e citar a troca do Piper.

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
- no servidor: já existe `node --test` (npm test, 155 testes em 18/11, incluindo as rotas do passo 8 em professor.test.ts, as do passo 9 em cadastroAtividades.test.ts e as do passo 10 em narracao.test.ts;
  os 12 testes da voz do app em src/services/voz/voz.test.ts rodam no Node com módulos do Expo de mentira e podem ir para o jest-expo); complete os casos abaixo
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
   áudios já gerados com `npm run voz:preparar` (com a chave da Azure; depois disso a demo não precisa de internet para a voz), código da instituição
   de demonstração anotado (EJAVV2), EXPO_PUBLIC_API_URL com o IP
   certo, celular carregado, vídeo gravado de backup).
4. Prováveis perguntas da banca e respostas curtas.
```
