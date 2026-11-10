# Próximos passos do AJAI (04/11 → entrega 17/11)

Roteiro do que falta até a entrega, **na ordem em que deve ser feito**. Cada passo tem prazo, dependências, critério de pronto e um **prompt pronto para colar** num assistente de IA (Claude, Copilot, Cursor...) aberto na pasta do projeto.

> Como usar os prompts
> 1. Abra o assistente **na raiz do repositório** (para ele ler `AGENTS.md`, `README.md` e o código).
> 2. Cole o prompt do passo inteiro. Os trechos entre `<...>` você preenche antes.
> 3. Revise o que ele fizer, rode `npx expo lint` e `npx tsc --noEmit`, teste no celular e só então faça commit.
> 4. Ao terminar, marque o passo aqui ✅ e atualize a seção **Pendências** do README.
>
> **Todos desenvolvem.** Os papéis da documentação (gerente, UX/UI, testes...) são formais; aqui os passos não têm dono fixo. Combine no grupo quem pega cada um e mova o cartão no Kanban.
>
> **Já decidido** ([ADR-001](decisoes/ADR-001-stack.md)): banco = **SQLite em arquivo dentro do projeto** (`server/data/ajai.db`, criado com `npm run db:reset`) e voz = o app só usa a interface **`ProvedorVoz`**; o padrão será o **Piper** (áudios gerados no servidor) e o `expo-speech` fica implementado como alternativa e reserva, com troca em uma linha.

## Regras que valem para TODO prompt

O `CLAUDE.md` da raiz carrega automaticamente `AGENTS.md`, o ADR-001 e este arquivo a cada sessão do Claude Code. Por isso, em qualquer passo:

1. **Identifique o passo** em que a tarefa se encaixa e siga o critério "Pronto quando". Se a tarefa contrariar uma decisão do ADR-001 (SQLite, Fastify, `ProvedorVoz`, Piper), pare e avise antes de mudar.
2. **Cobertura do app inteiro:** a tarefa vale para aluno **e** professor **e** administrador, quando se aplicar. Confira a tabela "Telas do Figma × código" do README para não esquecer nenhuma tela.
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
| 1 | Decisões de stack (SQLite, Fastify, Piper) — feito | 05/11 | — |
| 2 | Criar o servidor (API) sobre o banco SQLite — feito | 07/11 | 1 |
| 3 | Cadastro e login de verdade — feito | 08/11 | 2 |
| 4 | Atividades e níveis vindos da API — feito | 09/11 | 2 |
| 5 | Respostas, progressão e histórico no servidor | 10/11 | 3, 4 |
| 6 | Narração por voz e preferências de acessibilidade | 10/11 | 1 |
| 7 | Conteúdo pedagógico completo | 10/11 | 4 |
| 8 | Telas e recursos visuais que faltam no Figma | 11/11 | — (começar já) |
| 9 | Home do aluno: ofensiva, frequência e tela de progresso | 12/11 | 5, 8 |
| 10 | Área do professor completa | 13/11 | 5, 8 |
| 11 | Cadastro de atividades e níveis (administrador) | 13/11 | 2 |
| 12 | Testes automatizados | 13/11 | 5 |
| 13 | Segurança e privacidade (LGPD) | 13/11 | 3 |
| 14 | Testes integrados e de usabilidade | 15/11 | 9, 10 |
| 15 | Correção de bugs e polimento | 16/11 | 14 |
| 16 | Documentação final (PDF, APF, README) | 16/11 | 15 |
| 17 | Preparar a apresentação e a demo | 17/11 | 16 |

Sprints da documentação: **Sprint 3** vai até 10/11 (passos 0–7), **Sprint 4** de 10/11 a 17/11 (passos 8–17). Os passos 0 a 2 estavam atrasados em relação ao cronograma original (eram da Sprint 1) e foram concluídos em 05/11.

---

## ✅ Passo 0 — Instalar e validar o esqueleto

**Feito em 05/11.** `npm install`, `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor` e `db:reset`/`db:query` passam, e o fluxo de aluno e professor foi testado no Expo Go. Foram corrigidos 3 erros de lint (`Date.now()` no render do React Compiler em `aluno/atividade/[id].tsx` e `aluno/nivelamento/index.tsx`; ícone sem nome em `professor/_layout.tsx`) e adicionados `eslint` e `eslint-config-expo` (devDependencies) com o `eslint.config.js`. O `tsc` e o `expo-doctor` já passavam. Observação: o `db:*` exige Node 22.18+ (em 22.14 use `NODE_OPTIONS=--experimental-strip-types`).

---

## ✅ Passo 1 — Decisões de stack

**Feito em 05/11.** Banco = SQLite em arquivo; API = **Fastify** (Node.js + TypeScript); voz = interface `ProvedorVoz` com **Piper como padrão** e `expo-speech` como alternativa e reserva. Tudo registrado em [`decisoes/ADR-001-stack.md`](decisoes/ADR-001-stack.md).

---

## ✅ Passo 2 — Criar o servidor (API) com Fastify sobre o banco SQLite

**Feito em 05/11.** API em `server/src/` com **Fastify 5** (`@fastify/cors`, `@fastify/rate-limit`; `@fastify/jwt` instalado para o passo 3). `banco.ts` abre o mesmo arquivo dos scripts `db:*` (`caminhoBanco` de `server/db/conectar.mjs`, variável `AJAI_DB`) com `node:sqlite`, `PRAGMA foreign_keys = ON`, e avisa para rodar `db:reset` se o arquivo não existir. `GET /health` confere o banco (503 com mensagem amigável se não abrir). Erros sempre `{ erro }` em português (`erros.ts`, classe `ErroApi`), inclusive 404, JSON inválido/validação (400) e limite de requisições (429). Scripts: `server:dev` (Node roda o `.ts` direto com `--watch`, sem `tsx`), `server:build` (`tsc` → `server/dist/`, fora do git), `server:start`, `server:typecheck`; `npm run typecheck` agora checa app + servidor. `server/.env.example` criado; README ganhou "Subir o servidor" e "Como o app encontra a API" (`EXPO_PUBLIC_API_URL`, IP da Wi-Fi no celular). Nenhuma migração nova; telas do app não mudaram. Observações: servidor só com TypeScript "apagável" (sem `enum`, imports com `.ts`); decisões no ADR-001 §3. Testado no Node 22.14.

---

## ✅ Passo 3 — Cadastro e login de verdade (RF01, RF02)

**Feito em 08/11.** Login, cadastro e senha passam pela API, com senha em **scrypt** (`server/db/senha.mjs`, sem módulo nativo) e token **JWT** de 30 dias guardado no `expo-secure-store` (no navegador, `localStorage`). A sessão é restaurada ao abrir o app, com a splash, e funciona sem internet usando a cópia guardada. O "modo demonstração" saiu e o seed grava o hash da senha `demo1234` para todos, incluindo um administrador (`admin@ajai.app`). Modelo de contas decidido pela equipe:
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

**Testes:** login e cadastro testados no Expo Go pela equipe. O modelo de contas de aluno foi testado pela API (`app.inject`), junto com lint e typecheck (app e servidor). Decisões no ADR-001 §4 e §5 (ícones).

**Observações:**
- o painel de Acompanhamento ainda lê `mock.ts`, então o aluno novo só aparece em Conta › Contas dos alunos até o passo 10;
- o nível do aluno novo só vai para o servidor no passo 5;
- depois de trocar a senha, os tokens antigos continuam valendo até vencer (passo 13).

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
- o painel do professor continua lendo o mock (passo 10).

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
- Ordem das atividades: primeiro as da etapa que o aluno ainda não acertou. Com poucas atividades por etapa (até o passo 7), as já acertadas se repetem, a mais antiga primeiro e nunca a mesma duas vezes seguidas.

**Testes:**
- fluxo testado no Expo Go pela equipe em 09/11: nivelamento, sequência de 5 atividades e volta para a home;
- rotas testadas com `app.inject`: 401 sem login, 404, gabarito ausente e correção com acento/maiúscula/espaço;
- lint, typecheck (app e servidor), `npx expo export -p web` e `npm run db:reset` passam.

**Observações:**
- na tela "Formar palavra", a **foto** da palavra (a casa) ainda não aparece: vem com as imagens do passo 8, usando `Atividade.urlImagem`, que já existe no banco;
- respostas e subida de nível ficam só na memória do app até o passo 5: ao reabrir o app, o aluno novo refaz o nivelamento;
- `POST /atividades/:id/corrigir` é provisória e sai no passo 5;
- PALAVRA usa as alternativas como peças (várias `correta`), o que muda a validação do passo 11 (ADR-001 §6).

---

## ⬜ Passo 5 — Respostas, progressão e histórico no servidor (RF12–RF19, RF22)

**Prazo:** 10/11 · **Depende de:** passos 3 e 4

**Pronto quando:** cada resposta fica no banco, a correção e a subida de nível acontecem no servidor, HistoricoNivel e DesempenhoConteudo são atualizados, e o aluno continua de onde parou ao reabrir o app.

```text
Leia AGENTS.md, src/services/progressao.ts, src/services/respostas.ts,
src/services/alunos.ts, src/app/aluno/** e server/.

1. Leve as funções puras de src/services/progressao.ts para o servidor (ou para uma
   pasta compartilhada) SEM mudar a lógica, e escreva testes para elas.
2. POST /respostas { idAtividade, respostaDada, tempoRespostaSeg }:
   corrige (normalizando acentos/maiúsculas), grava Resposta, atualiza
   DesempenhoConteudo (tentativas, acertos, taxa), verifica a regra de progressão
   (taxa nas últimas 5 respostas do nível >= criterioAcerto) e, se subir, grava
   HistoricoNivel. Responde { correta, subiuDeNivel, nivelAtual }.
3. POST /nivelamento/concluir { respostas[] } → define nível inicial, grava
   HistoricoNivel e devolve o nível.
4. GET /alunos/eu/progresso → nível atual, trilha com status, total de atividades,
   taxa de acerto, dificuldades (conteúdos com mais erros), próxima atividade (RF22).
5. No app, troque incluirResposta, definirNivelDoAluno e a lógica do botão CONTINUAR
   para usar esses endpoints. Não mute objetos (React Compiler, ver AGENTS.md).
Regra de progressão: <confirmar com a equipe; se mudar, documente no README>.
```

---

## ⬜ Passo 6 — Narração por voz e preferências (RNF04, APF 17)

**Prazo:** 10/11 · **Depende de:** passos 1 e 2

**Pronto quando:** todo botão "Ouvir ajuda / Ouvir instrução" fala em português do Brasil, com o **Piper como padrão** e o `expo-speech` funcionando como alternativa e como reserva; o aluno pode mudar a velocidade da voz e o tamanho da letra, a preferência fica salva, e **trocar o provedor é mudar uma linha** (`PROVEDOR_PADRAO` em `src/services/voz/index.ts`).

Arquitetura (a interface e o provedor `console` já existem; faltam os demais):

```
BotaoAudio / telas ──► services/narracao.ts ──► ProvedorVoz ativo (services/voz/index.ts)
                                                  ├─ servidor     (PADRÃO) toca o áudio do AudioCache;
                                                  │                se falhar ──► expo-speech
                                                  ├─ expo-speech  voz do aparelho (alternativa/reserva)
                                                  └─ console      (desenvolvimento)
Servidor: GET/POST /narracao { texto, voz, velocidade } ──► SintetizadorVoz ativo (VOZ_PROVEDOR)
                                                  └─ piper → grava o áudio em server/storage/audio + linha em AudioCache
```

```text
Leia AGENTS.md, src/services/narracao.ts, src/services/voz/ (provedor.ts, index.ts,
provedorConsole.ts), src/components/BotaoAudio.tsx, docs/decisoes/ADR-001-stack.md,
server/db/migrations/001_esquema_inicial.sql (tabela AudioCache) e src/domain/modelos.ts.

Decisão: PIPER é o provedor padrão; expo-speech também deve ser implementado.
NÃO mude a interface ProvedorVoz nem as telas que chamam falar()/pararFala().

A) Servidor (Piper):
1. Instalação do Piper (repositório atual: https://github.com/OHF-Voice/piper1-gpl; o
   huggingface.js NÃO é o Piper e não deve ser usado). Documente no README, seção Voz:
   Python 3 + `pip install piper-tts`, e baixar a voz com
   `python3 -m piper.download_voices pt_BR-faber-medium --data-dir server/voz-modelos`
   (pasta fora do git; as vozes ficam em huggingface.co/rhasspy/piper-voices). Confirme
   o nome da voz ao rodar. Só o computador que GERA os áudios precisa disso.
2. server/src/voz/sintetizador.ts com a interface SintetizadorVoz
   { nome; sintetizar(texto, voz, velocidade): Promise<Buffer> } e
   server/src/voz/piper.ts, que chama o executável do Piper (child_process, sem shell,
   argumentos em lista) e devolve o áudio. Comando base:
   `python3 -m piper -m pt_BR-faber-medium --data-dir server/voz-modelos -f arquivo.wav -- 'texto'`.
   Velocidade: veja `python3 -m piper --help` e use o parâmetro de duração (length scale =
   1 / velocidade), confirmando o nome da flag. Guarde em .wav
   se isso evitar depender do ffmpeg.
3. Configuração em server/.env (PIPER_BIN, PIPER_MODELO, VOZ_PROVEDOR=piper) e em
   server/.env.example. Nunca colocar caminhos ou chaves no código.
4. Rota de narração: procura em AudioCache (textoOrigem + voz + velocidade + provedor);
   se não achar, sintetiza, grava o arquivo em server/storage/audio/ e insere a linha.
   Responde a URL do áudio. Valide o tamanho do texto (limite curto).
5. `npm run voz:preparar`: gera, uma vez, o áudio de todos os enunciados e alternativas
   das atividades ATIVAS do banco, nas velocidades 0.8, 1.0 e 1.2. Assim a demonstração
   NÃO precisa do Piper rodando: basta a API servir os arquivos.

B) App:
6. src/services/voz/provedorExpoSpeech.ts (`npx expo install expo-speech`; confira a API
   no SDK 58 em https://docs.expo.dev/versions/v58.0.0/): voz pt-BR, respeita
   `velocidade`, falar de novo interrompe a anterior, parar() interrompe, e a Promise de
   falar() resolve ao terminar.
7. src/services/voz/provedorServidor.ts (`npx expo install expo-audio`): pede a URL do
   áudio, toca, e se der erro, rede fora ou áudio inexistente, chama o provedor
   expo-speech como reserva.
8. Registre os dois em `provedores` e defina PROVEDOR_PADRAO = "servidor". Trocar o
   padrão para "expo-speech" deve ser só mudar essa constante.
9. Mostre no BotaoAudio o estado "Falando..." enquanto toca (com texto, não só ícone);
   sair da tela para a fala. Nas telas de atividade, leia a alternativa ao tocar e segurar
   (onLongPress), sem selecionar.
10. Crie /aluno/preferencias (Aluno.EditarPreferencias): velocidade da voz (lenta /
    normal / rápida), tamanho da letra (normal / grande / muito grande) e "Ouvir
    exemplo", com botões grandes. Salve no servidor (PATCH /alunos/eu) e aplique
    tamanhoFonte via contexto, sem espalhar ifs. Acesso pela home do aluno.
11. Teste: troque o provedor com usarProvedor("console") e confirme que falar() chega
    nele; teste o provedorServidor com a rede falhando e confirme que cai no expo-speech.
Atualize README (Pendências) e ADR-001 com o que foi feito.
```
---

## ⬜ Passo 7 — Conteúdo pedagógico completo (RF04–RF11)

**Prazo:** 10/11 · **Depende de:** passo 4

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

## ⬜ Passo 8 — Telas e recursos visuais que faltam (UX/UI)

**Prazo:** 11/11 · **Pode começar já**

**Pronto quando:** o Figma tem as telas que faltam, os ícones e imagens foram exportados para `assets/`, a fonte Inter está carregada e o ícone/splash do app são do AJAI.

Telas a desenhar no Figma: progresso do aluno, preferências de acessibilidade, relatórios do professor, conta do professor, **contas dos alunos** (lista, mudar senha, "aluno cadastrado" com usuário e senha), gestão de turma, correção manual de resposta, "esqueceu a senha?", "minha conta" do aluno, estados "carregando" / "sem internet" / "nível sem atividades" / "subiu de nível". Atualizar no Figma: **Login** sem "Quem você é?" e sem "Ouvir ajuda", campo "Seu usuário ou e-mail"; **Cadastro de aluno** passa a ser tela do professor (nome, nome de usuário, senha; sem telefone do professor); **Cadastro de professor** sem "Ouvir ajuda".

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
4. Substitua TODOS os emojis provisórios (alto-falante do BotaoAudio, livro do Logo e da
   splash, ícones das abas do professor, ilustrações das alternativas no mock.ts) por ícones
   de @expo/vector-icons (`npx expo install @expo/vector-icons`; NÃO use react-icons, que só
   roda na web) e pelas imagens exportadas em assets/ (<listar arquivos>). Procure com
   `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src` e não deixe nenhum emoji.
5. Configure ícone do app, ícone adaptativo do Android e splash em app.json com os
   arquivos <listar arquivos>.
6. Implemente as telas novas desenhadas: <listar frames/links>.
Mantenha as regras de acessibilidade do AGENTS.md.
```

---

## ⬜ Passo 9 — Home do aluno: ofensiva, frequência e progresso (RF15, RF18, RF19)

**Prazo:** 12/11 · **Depende de:** passos 5 e 8

**Pronto quando:** o cartão "Ofensiva – X dias seguidos" mostra o número real, a tela de progresso segue o Figma e o aluno vê uma comemoração ao subir de nível.

```text
Leia AGENTS.md, src/app/aluno/index.tsx, src/app/aluno/progresso.tsx,
src/app/aluno/resultado.tsx e o endpoint GET /alunos/eu/progresso.

1. No servidor, calcule a ofensiva: quantos dias seguidos (até hoje ou ontem) o aluno
   respondeu pelo menos 1 atividade, no fuso America/Sao_Paulo. Inclua em
   /alunos/eu/progresso junto com atividades nos últimos 7 dias.
2. Na home, mostre a ofensiva real com texto encorajador (nunca culpar quem parou:
   se zerou, "Que bom ter você de volta!").
3. Refaça /aluno/progresso conforme o frame do Figma <link>, com a trilha de níveis,
   atividades feitas, taxa de acerto e "Vale a pena treinar" (dificuldades).
4. Quando o servidor responder subiuDeNivel, mostre a tela de comemoração
   <link do Figma> com narração.
Escreva testes para o cálculo da ofensiva (virada de dia, dias sem uso, fuso).
```

---

## ⬜ Passo 10 — Área do professor completa (RF20, RF21, APF 20–24, 35, 40–43)

**Prazo:** 13/11 · **Depende de:** passos 5 e 8

**Pronto quando:** o professor vê só os próprios alunos, filtra por período, abre métricas com gráfico de evolução, consulta relatórios da turma, cria turma, vincula/desvincula alunos e corrige manualmente uma resposta.

```text
Leia AGENTS.md, src/services/relatorios.ts, src/app/professor/** e server/.
Frames do Figma: Dashboard do professor, Métricas de Ana Souza, <novos frames do passo 8>.

No SERVIDOR (todas exigem perfil PROFESSOR e só retornam alunos das turmas dele):
- GET /professor/painel?inicio&fim → resumo por aluno (frequência em dias, total de
  atividades, taxa de acerto/erro, nível, maior dificuldade, situação EM_DIA /
  ATENCAO / REFORCO com regra documentada);
- GET /professor/alunos/:id?inicio&fim → relatório individual + série diária de taxa
  de acerto + histórico de níveis;
- GET /professor/relatorios/frequencia e /professor/relatorios/dificuldades (por turma);
- CRUD de turma e mover aluno entre as turmas DO PRÓPRIO professor (o aluno já é criado pelo
  professor em POST /professor/alunos e entra na turma ativa dele; o aluno não tem e-mail);
- PATCH /respostas/:id/correcao (correção manual: muda `correta`, grava
  correcaoProfessor e recalcula DesempenhoConteudo).

No APP: seletor de período (Últimos 7 dias / 30 dias / personalizado), gráfico de
evolução simples (barras com View, sem biblioteca, ou react-native-svg via
`npx expo install` se necessário), aba Relatórios, gestão de turma na aba Conta,
correção manual na tela de métricas. Recarregue os dados ao focar a aba
(useFocusEffect). Mostre o aviso "Os dados complementam a avaliação do professor".
A aba Conta mostra os dados do professor (editar nome), trocar senha (passo 3) e sair.
Cobertura: confira que TODA tela do professor da tabela do README existe e funciona
com dados reais (dashboard, métricas do aluno, relatórios, conta, contas dos alunos, gestão
de turma). O dashboard deve listar também os alunos cadastrados pelo professor (hoje lê o mock).
```

---

## ⬜ Passo 11 — Cadastro de atividades e níveis (administrador, APF 25–31)

**Prazo:** 13/11 · **Depende de:** passo 2

**Pronto quando:** existe um jeito documentado de incluir, editar e inativar atividades e níveis sem mexer no código. Se não houver tempo para telas, um script/rotas protegidas bastam, e a APF/documentação deve dizer isso.

```text
Leia AGENTS.md, src/domain/modelos.ts e server/.
O diagrama e a APF preveem o Administrador com IncluirAtividade, EditarAtividade,
ExcluirAtividade (inativar), ListarAtividades, IncluirNivel e EditarNivel.
Temos até 13/11. Implemente a opção <A ou B>:
A) Rotas REST protegidas por perfil ADMINISTRADOR + um usuário admin no seed +
   instruções no README para cadastrar via um cliente HTTP (arquivo
   server/admin.http com exemplos prontos).
B) Telas simples no próprio app em /admin (lista de atividades por nível, formulário
   com enunciado, tipo, conteúdo, 3 alternativas e qual é a correta, inativar).
"Excluir" nunca apaga: muda status para INATIVA. Valide que toda atividade de múltipla
escolha tem exatamente uma alternativa correta (PALAVRA usa as alternativas como peças
e ESCRITA não tem alternativas: ver ADR-001 §6). Inclua o campo textoApoio no formulário.
Inclua também IncluirNivel/EditarNivel (nome, descrição, ordem, criterioAcerto) e a
listagem de atividades por nível. O administrador entra pelo login (passo 3) e só ele
acessa essas rotas/telas.
```

---

## ⬜ Passo 12 — Testes automatizados

**Prazo:** 13/11 · **Depende de:** passo 5

**Pronto quando:** `npm test` roda no app e no servidor, cobrindo correção, nivelamento, progressão, ofensiva, dificuldades e autorização do professor.

```text
Leia AGENTS.md, src/services/** e server/.
Configure testes:
- no app: jest-expo (`npx expo install jest-expo jest @types/jest -- --save-dev`) e
  @testing-library/react-native; script `npm test`;
- no servidor: o runner adequado à stack (vitest ou jest) e testes de API.
Escreva testes para:
1. corrigirAutomaticamente (acentos, maiúsculas, espaços);
2. definirNivelInicial (acerta tudo, erra a primeira, erra no meio);
3. deveAvancar (menos de 5 respostas, exatamente no critério, abaixo);
4. identificarDificuldades (ordenação, sem respostas);
5. ofensiva (dias seguidos, quebra, fuso);
6. API: professor NÃO vê aluno de outra turma; aluno não acessa rotas de professor;
   aluno NÃO troca a própria senha; professor só muda a senha de aluno que ELE criou;
   login por nome de usuário, e-mail e telefone; cadastro público só cria professor;
   resposta não expõe a alternativa correta antes de responder;
7. um teste de tela: tocar na alternativa certa leva à tela "Muito bem!".
Gere também docs/testes/casos-de-teste.md com os casos manuais dos fluxos principais
(cadastro de professor, professor cadastra aluno, login do aluno por usuário, nivelamento,
atividade, progressão, área do professor) no formato
ID | pré-condição | passos | resultado esperado | resultado obtido.
```

---

## ⬜ Passo 13 — Segurança e privacidade (RNF11, RNF12, LGPD)

**Prazo:** 13/11 · **Depende de:** passo 3

**Pronto quando:** há termo de uso e privacidade em linguagem simples (com áudio), o app pede só os dados necessários e o checklist abaixo foi revisado.

```text
Leia AGENTS.md, src/domain/modelos.ts, src/app/cadastro/* e server/.
Faça uma revisão de segurança e privacidade do AJAI e corrija o que for simples:
- senhas só com hash; JWT com expiração; segredo em variável de ambiente; invalidar tokens
  antigos quando a senha muda; o que fazer com a senha do aluno se o professor que o criou sair;
- nenhuma chave/segredo no repositório (procure no histórico do git também);
- todas as rotas checam perfil e posse do dado (aluno só vê o próprio; professor só
  os alunos das suas turmas);
- validação de entrada no servidor; limite de tentativas de login;
- dados coletados: confirme que cada campo é necessário (ex.: dataNascimento é
  usado para quê?). Proponha remover o que não for.
Escreva docs/privacidade.md: termo de uso e privacidade em linguagem MUITO simples
(frases curtas, para quem está aprendendo a ler), dizendo que dados coletamos, por
quê, quem vê (o professor vinculado) e como pedir para apagar. Adicione um aceite
"Li e concordo" no cadastro do professor e, para o aluno, um termo que o professor
confirma ter lido com ele ao cadastrá-lo (com botão de ouvir o termo na primeira entrada).
Liste o que ficou pendente.
```

---

## ⬜ Passo 14 — Testes integrados e de usabilidade

**Prazo:** 15/11 · **Depende de:** passos 9 e 10

**Pronto quando:** todos os casos de `docs/testes/casos-de-teste.md` foram executados em pelo menos 1 Android e 1 iPhone (ou web), e pelo menos 3 pessoas do público-alvo (ou próximas a ele) usaram o app com o roteiro, com problemas registrados.

```text
Leia README.md, docs/testes/casos-de-teste.md e os requisitos RNF01–RNF15.
Monte o kit de teste de usabilidade do AJAI em docs/testes/usabilidade.md:
1. Perfil dos participantes (idade, escolaridade, uso de celular) e termo de
   consentimento curto.
2. Roteiro com 5 tarefas (ex.: "Entre no aplicativo", "Faça a primeira atividade",
   "Ouça a instrução", "Veja quanto você já avançou"; para professor: "Descubra qual
   aluno precisa de reforço e em quê"). Para cada tarefa: o que dizer ao
   participante (sem ensinar o caminho), o que observar, critério de sucesso.
3. Planilha de registro: tarefa, concluiu sim/não/com ajuda, tempo, erros,
   comentários, gravidade do problema (crítico / alto / médio / baixo).
4. Questionário final de 5 perguntas com respostas por carinhas (😀🙂😐🙁),
   lido em voz alta.
Depois que eu colar os resultados aqui: <colar resultados>, gere o resumo com os
problemas priorizados e as correções sugeridas, ligando cada um a um RNF.
```

---

## ⬜ Passo 15 — Correção de bugs e polimento

**Prazo:** 16/11 · **Depende de:** passo 14

**Pronto quando:** não há bug crítico ou alto aberto, `lint`, `tsc` e `npm test` passam, e o app roda do zero seguindo só o README.

```text
Leia AGENTS.md e a lista de problemas abaixo (testes integrados + usabilidade):
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

## ⬜ Passo 16 — Documentação final

**Prazo:** 16/11 · **Depende de:** passo 15

**Pronto quando:** PDF, planilha APF, diagrama de classes e README contam a mesma história do que foi entregue.

```text
Leia README.md, AGENTS.md, docs/** e o código. Compare com a documentação do projeto
(PDF) e a planilha APF_AJAI.xlsx que vou anexar.
Liste todas as diferenças entre o que está documentado e o que foi implementado:
- seção 15 (Prototipação): o PDF diz 9 telas; atualizar com a lista real do Figma;
- stack e arquitetura definidas (ADR-001), incluindo a escolha da voz;
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

## ⬜ Passo 17 — Apresentação e demonstração

**Prazo:** 17/11

**Pronto quando:** há slides, um roteiro de demo ensaiado de no máximo 5 minutos, o app instalado em pelo menos 2 celulares com dados preparados, e um vídeo de backup gravado.

```text
Leia README.md, docs/** e a documentação final.
Prepare a apresentação final do AJAI (<N> minutos no total, 5 integrantes):
1. Estrutura dos slides: problema (dados IBGE), pesquisa com profissionais da EJA e o
   que ela mudou no produto, solução, demonstração, métricas para o professor,
   gestão do projeto (Scrum + Kanban, APF, custos, riscos), resultados dos testes de
   usabilidade, limitações e próximos passos. Indique quem fala cada parte.
2. Roteiro da demo ao vivo (máx. 5 min): professor cadastra um aluno novo (usuário e
   senha) → aluno entra com o usuário → nivelamento →
   atividade com áudio → erro e "tentar de novo" → acerto → sobe de nível;
   professor → dashboard → aluno com dificuldade → métricas.
   Liste os dados que precisam estar preparados no banco antes.
3. Plano B e preparação técnica: como rodar a demo SEM internet da faculdade (servidor
   no notebook + celulares no mesmo Wi-Fi/ponto de acesso do celular; app via Expo Go
   ou build de desenvolvimento com EAS), checklist do dia (db:reset com dados de demo,
   áudios do Piper já gerados com `npm run voz:preparar`, EXPO_PUBLIC_API_URL com o IP
   certo, celular carregado, vídeo gravado de backup).
4. Prováveis perguntas da banca e respostas curtas.
```

---

## Depois da entrega (trabalhos futuros)

Fora do escopo do MVP pela documentação, mas bons próximos passos se o projeto continuar: gamificação simples, recomendação de atividades por dificuldade, modo offline com sincronização, publicação nas lojas com EAS, versão web para o professor, validação pedagógica com uma turma real da EJA.
