# AJAI – Alfabetização para Jovens, Adultos e Idosos

Aplicativo mobile de apoio à alfabetização, complementar à EJA, com área de acompanhamento para professores.
Projeto da disciplina de Gestão de Projetos – Universidade de Vila Velha, 2026 (turma CC6M, equipe 4).

> **Situação em 05/11/2026 (Sprint 3 de 4):** existe um **esqueleto navegável** com as telas do Figma, regras de correção e progressão e dados de demonstração **em memória**. O **banco SQLite** (13 tabelas + dados iniciais) já existe em `server/`, mas o app ainda **não está ligado a ele**: falta a API e trocar o mock. Veja [Pendências](#pendências) e [Banco de dados](#banco-de-dados-sqlite).

- Protótipo no Figma: <https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI>
- Diagrama de classes: [`docs/diagrama-classes.png`](docs/diagrama-classes.png)
- Documentação do projeto (PDF) e Análise de Pontos de Função (planilha APF_AJAI.xlsx): com a equipe

---

## Como executar o projeto

### 1. Pré-requisitos

| O quê | Versão | Como conferir |
|---|---|---|
| [Node.js](https://nodejs.org) | **22.18 ou mais novo** (22 LTS). O banco usa o módulo `node:sqlite`, que só existe no Node 22+ | `node -v` |
| npm | vem com o Node | `npm -v` |
| Git | qualquer | `git --version` |
| Celular com **Expo Go** | versão compatível com o **SDK 58** | Play Store / App Store |

Opcional: emulador Android (Android Studio) ou simulador iOS (Xcode, só no macOS). Também dá para abrir no navegador.

### 2. Baixar o código

```bash
git clone https://github.com/DaphRz/AJAI.git
cd AJAI
```

> **Windows:** use o GitHub Desktop (ou `git clone` no Git Bash). Nunca envie para o GitHub as pastas geradas que estão no `.gitignore` (`node_modules/`, `.expo/`, `ios/`, `android/`).

### 3. Instalar as dependências

```bash
npm install
```

### 4. Criar o banco de dados

```bash
npm run db:reset
```

Cria o arquivo `server/data/ajai.db` com as 13 tabelas e os dados de demonstração (5 níveis, 6 atividades, 4 alunos, 1 professor). Não precisa instalar nada além do Node. **Cada pessoa gera o seu**: o arquivo não vai para o git. Detalhes e comandos: [Banco de dados](#banco-de-dados-sqlite).

### 5. Subir o servidor (API)

A API fica em `server/src/` (Node.js + TypeScript + **Fastify**). Em um terminal:

```bash
cp server/.env.example server/.env   # só na primeira vez (no Windows: copy server\.env.example server\.env)
npm run server:dev                   # sobe a API e reinicia sozinha ao salvar um arquivo
```

Confira abrindo <http://localhost:3333/health> no navegador. A resposta esperada é `{"status":"ok","banco":"ok",...}`. Se aparecer `"O banco de dados não abriu"`, rode `npm run db:reset`.

| Comando | Para quê |
|---|---|
| `npm run server:dev` | Desenvolvimento: roda os `.ts` direto no Node e reinicia ao salvar |
| `npm run server:build` | Gera o JavaScript em `server/dist/` (fora do git) |
| `npm run server:start` | Roda a versão gerada pelo `server:build` (use na demo) |
| `npm run server:typecheck` | Checagem de tipos só do servidor (`npm run typecheck` checa app + servidor) |

Configuração em `server/.env` (fora do git; modelo em [`server/.env.example`](server/.env.example)): `PORT` (padrão 3333), `HOST` (padrão `0.0.0.0`, para os celulares da rede acessarem), `CORS_ORIGEM`, `LIMITE_REQUISICOES_POR_MINUTO` e, a partir do passo 3, `JWT_SECRET`. Toda resposta de erro da API tem o formato `{ "erro": "mensagem curta em português" }`.

> **Node 22.14 a 22.17:** o `server:dev` funciona (o script já passa `--experimental-strip-types`), mas os scripts `db:*` não. Use `NODE_OPTIONS=--experimental-strip-types npm run db:reset`. O ideal é o 22.18+.

> **Por enquanto o app ainda não usa a API** (isso começa no passo 3). Para ver as telas hoje, só o `npx expo start` basta; o servidor já pode ficar rodando em paralelo.

### 6. Rodar o app

Em **outro** terminal (o servidor continua rodando no primeiro):

```bash
npx expo start
```

Vai aparecer um QR code no terminal. Depois:

| Onde abrir | O que fazer |
|---|---|
| Celular (recomendado) | Abra o **Expo Go** e leia o QR code (no iPhone, pela câmera). O celular e o computador precisam estar **na mesma rede Wi-Fi**. |
| Emulador Android | Tecle `a` no terminal |
| Simulador iOS (macOS) | Tecle `i` |
| Navegador | Tecle `w` |

Se a rede da faculdade bloquear a conexão, use `npx expo start --tunnel`.

#### Como o app encontra a API (`EXPO_PUBLIC_API_URL`)

O app lê o endereço da API da variável `EXPO_PUBLIC_API_URL`, num arquivo `.env.local` na **raiz** do projeto (fora do git). **Sem ela**, o app tenta o mesmo computador que roda o `npx expo start`, na porta 3333 (no Expo Go isso já costuma funcionar na mesma Wi-Fi). Para fixar o endereço:

```bash
# .env.local (raiz do projeto)
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333
```

| Onde o app roda | Endereço |
|---|---|
| **Celular físico (Expo Go)** | IP do computador **na Wi-Fi**, nunca `localhost` (no celular, `localhost` é o próprio celular). Celular e computador na mesma rede |
| Emulador Android | `http://10.0.2.2:3333` |
| Simulador iOS ou navegador no mesmo computador | `http://localhost:3333` |

Como descobrir o IP do computador: **macOS** `ipconfig getifaddr en0`; **Windows** `ipconfig` (linha "Endereço IPv4" da Wi-Fi); **Linux** `hostname -I`. O próprio `npm run server:dev` também mostra no terminal a linha `Server listening at http://192.168.x.x:3333`. Teste antes abrindo `http://<IP>:3333/health` no navegador do celular. Se não abrir: confira a mesma Wi-Fi e libere a porta 3333 no firewall (no Windows, aceite o aviso "Permitir acesso" do Node). Depois de mudar o `.env.local`, reinicie com `npx expo start -c`.

> `EXPO_PUBLIC_*` vai para dentro do aplicativo e é público: só endereço, **nunca** senha ou chave.

### 7. Entrar no app

O login é de verdade desde o passo 3: **o servidor precisa estar rodando** (passo 5) e o banco criado (`npm run db:reset`). Sem servidor, o app mostra "Não conseguimos falar com o servidor".

**Senha de todos os usuários de demonstração: `demo1234`** (gravada com hash pelo seed; nunca use em servidor de verdade). Na tela de login há **um campo só**: o aluno digita o **nome de usuário**; professor e administrador, o **e-mail ou o telefone**. O app descobre o perfil pela conta.

| Perfil | Entra com | Vai para |
|---|---|---|
| Aluno | `maria.silva` (também `ana.souza`, `bruno.lima`, `clara.santos`) | home do aluno |
| Professor/Responsável | `rafael@ajai.app` ou `11900000100` | Acompanhamento, com os 4 alunos (criados por ele) na turma "EJA – Noite" |
| Administrador | `admin@ajai.app` | área do administrador (por enquanto só conta) |

- **Professor novo:** no login, "Professor ou responsável? Crie sua conta" → nome, e-mail, telefone e senha. É o **único cadastro público**.
- **Aluno novo:** o professor cadastra, na conta dele: **Acompanhamento › Cadastrar aluno** ou **Conta › Contas dos alunos › Cadastrar aluno** → nome, nome de usuário (sugerido a partir do nome) e senha. O aluno entra na turma do professor. Anote e entregue usuário e senha ao aluno.
- **Senha do aluno:** o aluno **não troca** a própria senha. Só o professor que criou a conta: **Conta › Contas dos alunos › Mudar senha**.
- **Senha do professor/administrador:** Conta › Trocar minha senha (administrador: na tela inicial dele). Esqueceu? O administrador gera uma provisória (`POST /admin/usuarios/:id/senha-provisoria`), ou, no computador do servidor, `npm run usuario:senha -- rafael@ajai.app`.
- O login fica guardado no aparelho (`expo-secure-store`): fechar e abrir o app volta logado. Para sair: aluno em **Minha conta › Sair**; professor em **Conta › Sair**.

Rotas da API: `POST /auth/cadastro` (professor), `POST /auth/login`, `GET /auth/eu`, `PATCH /auth/senha` (professor/admin), `GET`/`POST /professor/alunos`, `PATCH /professor/alunos/:id/senha`, `POST /admin/usuarios/:id/senha-provisoria` (detalhes em [ADR-001 §4](docs/decisoes/ADR-001-stack.md)).

### Comandos úteis

```bash
npx expo start -c        # inicia limpando o cache (resolve muita coisa estranha)
npx expo install --fix   # corrige versões incompatíveis com o SDK
npx expo-doctor          # diagnostica problemas de configuração
npx expo lint            # lint
npx tsc --noEmit         # checagem de tipos
npx expo install <pacote>  # SEMPRE use isto para adicionar bibliotecas (não npm install <pacote>)

npm run db:reset         # recria o banco do zero com os dados de demonstração
npm run db:query         # lista as tabelas e quantas linhas cada uma tem
npm run server:dev       # sobe a API (http://localhost:3333/health)
npm run typecheck        # checagem de tipos do app e do servidor
npm run usuario:senha -- <e-mail ou telefone>   # senha provisória de professor/administrador
```

### Problemas comuns

- **"Project is incompatible with this version of Expo Go"** → atualize o Expo Go no celular.
- **QR code não conecta** → mesma Wi-Fi ou `--tunnel`.
- **Erro estranho depois de trocar de branch** → `npx expo start -c`; se não resolver, apague `node_modules` e rode `npm install` de novo.

---

## Banco de dados (SQLite)

Decisão registrada em [`docs/decisoes/ADR-001-stack.md`](docs/decisoes/ADR-001-stack.md): **SQLite em um arquivo dentro do projeto**, sem servidor de banco, sem conta e sem senha.

| O quê | Onde | Vai para o git? |
|---|---|---|
| Arquivo do banco | `server/data/ajai.db` | **Não** (cada pessoa gera o seu) |
| Esquema (tabelas) | `server/db/migrations/001_esquema_inicial.sql` e as próximas | Sim |
| Dados iniciais (seed) | `server/db/seed.mjs`, que lê [`src/data/mock.ts`](src/data/mock.ts) | Sim |
| Áudios gerados (futuro) | `server/storage/audio/` | Não |

### Carregar o banco (passo a passo)

1. Tenha o **Node 22.18+** (`node -v`). Se estiver abaixo, atualize em <https://nodejs.org>.
2. Na raiz do projeto: `npm install` (só na primeira vez).
3. Rode **`npm run db:reset`**. Resultado esperado:
   ```
   Banco recriado em .../AJAI/server/data/ajai.db
     5 níveis, 6 atividades, 4 alunos de demonstração.
   ```
4. Confira com **`npm run db:query`**: deve listar as 13 tabelas, a view `vw_aluno` e a tabela interna `_migracoes`.

Pronto. Se algum dia o banco estragar ou você quiser voltar aos dados iniciais, repita o `npm run db:reset` (ele apaga o arquivo e recria tudo).

### Comandos

| Comando | O que faz |
|---|---|
| `npm run db:reset` | **Apaga** o arquivo, recria o esquema e carrega os dados de demonstração |
| `npm run db:migrate` | Aplica as migrações novas (arquivos `.sql` ainda não aplicados), sem apagar dados |
| `npm run db:seed` | Apaga os **dados** (mantém as tabelas) e recarrega o seed |
| `npm run db:query` | Lista as tabelas e a contagem de linhas |
| `npm run db:query -- "SELECT * FROM Nivel"` | Consulta (só leitura) |
| `npm run db:query -- --json "SELECT ..."` | Mesma consulta, resultado em JSON |
| `npm run db:query -- --escrever "UPDATE ..."` | Permite `INSERT`/`UPDATE`/`DELETE` (use com cuidado) |

Exemplos úteis:

```bash
npm run db:query -- "SELECT idUsuario, nome, idNivelAtual FROM vw_aluno"
npm run db:query -- "SELECT conteudo, totalTentativas, taxaAcerto FROM DesempenhoConteudo WHERE idAluno = 2"
npm run db:query -- "SELECT a.enunciado, al.texto, al.correta FROM Atividade a JOIN Alternativa al USING (idAtividade) WHERE a.idAtividade = 1"
```

### Como mudar o banco

- **Mudar os dados de exemplo** (atividades, níveis, alunos): edite `src/data/mock.ts` e rode `npm run db:seed`.
- **Mudar a estrutura** (nova tabela ou coluna): crie um arquivo novo `server/db/migrations/002_descricao.sql` (depois `003_...`) e rode `npm run db:migrate`. **Nunca edite uma migração que já foi aplicada**; avise o grupo para cada um rodar `npm run db:migrate` depois do `git pull`.
- Quando mudar o esquema, atualize também `src/domain/modelos.ts` e o diagrama de classes.
- **Nunca** coloque o arquivo `.db` no git nem senhas reais nos dados de exemplo.

### Para ver o banco em uma tela

Qualquer programa que abra SQLite serve: [DB Browser for SQLite](https://sqlitebrowser.org) (grátis, Windows/Mac/Linux) ou a extensão *SQLite Viewer* do VS Code. Abra `server/data/ajai.db`. Para só olhar, prefira abrir como somente leitura.

### Como o esquema se liga ao diagrama de classes

Os nomes de tabelas e colunas são os do diagrama. Diferenças (registrar na documentação final):

- `Aluno.idNivelAtual` **não é coluna**: é o registro mais recente de `HistoricoNivel`. A view `vw_aluno` já devolve o aluno com esse campo calculado.
- Colunas extras: `Atividade.ordemNivelamento` (ordem das perguntas do nivelamento; vazio = fora do nivelamento) e `AudioCache.provedor` (qual serviço gerou o áudio).
- Booleanos são `0`/`1`; datas são texto ISO 8601; enums são texto com `CHECK`.

### Problemas comuns

- **`No such built-in module: node:sqlite`** ou **`ERR_UNKNOWN_FILE_EXTENSION ... .ts`** → Node antigo. Atualize para o 22.18+.
- **`FOREIGN KEY constraint failed`** → você apagou/inseriu uma linha que depende de outra (ex.: apagar um `Nivel` que tem `Atividade`). Apague os filhos antes, ou use `npm run db:reset`.
- **`disk I/O error`** → o SQLite não funciona bem em pasta sincronizada ou de rede (iCloud/Mesa, OneDrive, Dropbox, Google Drive). Guarde o banco numa pasta local: `AJAI_DB=$HOME/ajai.db npm run db:reset` (no Windows PowerShell: `$env:AJAI_DB="$HOME\ajai.db"; npm run db:reset`) e use a mesma variável nos demais comandos `db:*`. Se o projeto estiver numa pasta sincronizada, prefira mover o projeto para fora dela.
- **`database is locked`** → outro programa (DB Browser) está com o arquivo aberto para escrita. Feche-o.
- **Banco diferente do dos colegas** → normal: cada um tem o seu. Rode `npm run db:migrate` depois de cada `git pull` e `npm run db:reset` se quiser os dados iniciais de novo.

### Trabalhando com um agente de IA (Claude Code etc.)

O agente consulta e altera o banco pelos mesmos comandos (`npm run db:query -- --json "..."`), sem programa extra. Regras para ele estão no [`AGENTS.md`](AGENTS.md#banco-de-dados-sqlite).

---

## Narração por voz: `ProvedorVoz`

O app **não depende de nenhuma API de voz específica**. Telas e componentes chamam só `falar()` / `pararFala()` (`src/services/narracao.ts`), que repassam ao **provedor ativo** (`src/services/voz/`). Cada forma de falar é um provedor que segue a interface `ProvedorVoz`:

| Provedor | Situação | O que é |
|---|---|---|
| `console` | ✅ existe (padrão até o passo 6) | Só registra no console; para desenvolver sem áudio |
| `servidor` | ⬜ passo 6 — **será o padrão** | Toca o áudio gerado no servidor com o **Piper** (voz pt-BR, grátis, sem conta) e guardado em `AudioCache`; se o servidor falhar, cai para o `expo-speech` |
| `expo-speech` | ⬜ passo 6 — implementado como alternativa | Voz do próprio aparelho: grátis, sem conta, offline |

**Para trocar de voz:** crie o arquivo do provedor em `src/services/voz/`, registre-o em `src/services/voz/index.ts` e mude `PROVEDOR_PADRAO`. Nenhuma tela muda.

No servidor, a geração de áudio segue a mesma ideia (interface `SintetizadorVoz`, um arquivo por serviço: **Piper** é o primeiro; Google, Polly etc. entrariam como arquivos novos). O Piper só precisa estar instalado no computador que **gera** os áudios; depois de gerados, a API apenas serve os arquivos. Chaves de API ficam só em `server/.env`, **nunca no app**. Comparativo de opções e custos: [ADR-001](docs/decisoes/ADR-001-stack.md).

---

## Estrutura de pastas

```
src/
  app/                    Telas (cada arquivo é uma rota do Expo Router)
    index.tsx             Splash
    login.tsx             Login (aluno ou professor)
    cadastro/             Cadastro de aluno e de professor/responsável
    aluno/                Área do aluno (protegida)
      index.tsx           Home do aluno
      nivelamento/        Pergunta + resultado do nivelamento
      atividade/[id].tsx  Realizar uma atividade
      resultado.tsx       "Acerto" / "Tentar novamente"
      progresso.tsx       Histórico e evolução
    professor/            Área do professor (protegida, com abas)
      index.tsx           Dashboard de acompanhamento
      aluno/[id].tsx      Métricas de um aluno
      relatorios.tsx      (placeholder)
      conta.tsx           Conta / sair
  components/             Botão, BotaoAudio ("Ouvir ajuda"), Campo, Tela, AtividadeView...
  context/sessao.tsx      Usuário logado
  data/mock.ts            Dados de demonstração (níveis, atividades, alunos, respostas)
  domain/modelos.ts       Tipos espelhando o diagrama de classes
  services/               Regras e acesso a dados (hoje sobre o mock; amanhã sobre a API)
    narracao.ts           Fachada da voz (falar / pararFala)
    voz/                  ProvedorVoz: interface + provedores trocáveis
  theme/tokens.ts         Cores, fontes e tamanhos do Figma
server/
  src/                    API (Fastify + TypeScript)
    index.ts              Sobe o servidor (npm run server:dev)
    app.ts                Monta o Fastify: CORS, limite de requisições, erros, rotas
    banco.ts              Conexão node:sqlite (mesmo arquivo dos scripts db:*)
    config.ts             Lê server/.env
    erros.ts              Erro padrão { erro: "..." } em português (ErroApi)
    rotas/                Uma pasta de rotas por módulo (saude.ts = GET /health)
  .env.example            Modelo do server/.env (o .env fica fora do git)
  db/                     Banco SQLite: migrations/*.sql, seed.mjs, scripts db:*
  data/                   ajai.db (gerado, fora do git)
  storage/audio/          Áudios de narração gerados (fora do git)
docs/
  diagrama-classes.png
  PROXIMOS_PASSOS.md      Roteiro até a entrega, com prompts
  decisoes/ADR-001-stack.md  Decisões de banco, servidor e voz
```

### Telas do Figma × código

| Tela no Figma | Rota | Situação |
|---|---|---|
| Splash | `/` | esqueleto |
| Login | `/login` | ✅ pela API; **sem "Quem você é?" e sem "Ouvir ajuda"** (diferente do Figma: atualizar o frame) |
| Cadastro de aluno | `/professor/contas/nova` | ✅ dentro da conta do professor: nome, **nome de usuário**, senha (sem o telefone do professor do Figma) |
| Cadastro de professor ou responsável | `/cadastro` | ✅ campos do Figma (nome, e-mail, telefone, senha), sem "Ouvir ajuda" |
| Nivelamento · Pergunta | `/aluno/nivelamento` | esqueleto |
| Nivelamento · Resultado | `/aluno/nivelamento/resultado` | esqueleto |
| Home do aluno | `/aluno` | esqueleto ("Ofensiva" sem cálculo) |
| Reconhecimento / Sílabas / Formar palavra / Ler frase | `/aluno/atividade/[id]` | um componente para todos os tipos |
| Acerto / Tentar novamente | `/aluno/resultado` | esqueleto |
| Dashboard do professor | `/professor` | esqueleto (sem filtro de período) |
| Métricas de Ana Souza | `/professor/aluno/[id]` | esqueleto (sem gráfico) |
| *(sem tela no Figma)* | `/aluno/progresso`, `/professor/relatorios`, `/professor/conta` | provisórias |
| *(sem tela no Figma)* | `/esqueci-senha`, `/aluno/conta`, `/professor/contas` (lista e mudar senha), `/professor/senha`, `/admin`, `/admin/senha` | provisórias (passo 3) – desenhar no passo 8 |

---

## Próximos passos

O roteiro completo até a entrega, com prazo, critério de pronto e **um prompt pronto para cada passo**, está em [`docs/PROXIMOS_PASSOS.md`](docs/PROXIMOS_PASSOS.md). Resumo:

| # | Passo | Prazo |
|---|---|---|
| 0 | Instalar e validar o esqueleto | 05/11 |
| 1 | Decisões de stack (SQLite, Fastify, Piper) — ✅ | 05/11 |
| 2 | Criar o servidor (API) sobre o banco SQLite — ✅ | 07/11 |
| 3 | Cadastro e login de verdade — ✅ | 08/11 |
| 4 | Atividades e níveis vindos da API | 09/11 |
| 5 | Respostas, progressão e histórico no servidor | 10/11 |
| 6 | Narração por voz e preferências | 10/11 |
| 7 | Conteúdo pedagógico completo | 10/11 |
| 8 | Telas e recursos visuais que faltam no Figma | 11/11 |
| 9 | Home do aluno: ofensiva e progresso | 12/11 |
| 10 | Área do professor completa | 13/11 |
| 11 | Cadastro de atividades e níveis (admin) | 13/11 |
| 12 | Testes automatizados | 13/11 |
| 13 | Segurança e privacidade (LGPD) | 13/11 |
| 14 | Testes integrados e de usabilidade | 15/11 |
| 15 | Correção de bugs e polimento | 16/11 |
| 16 | Documentação final | 16/11 |
| 17 | Apresentação e demo | 17/11 |

## Pendências

Legenda: ✅ feito · 🟡 esqueleto/parcial (só no app, com dados em memória) · ⬜ não começado

### Por Sprint (cronograma da documentação, Tabela 5)

**Sprint 1 – Setup, Acesso e Nivelamento (20/10 – 27/10)** — *atrasada*
- ✅ Projeto Expo (React Native + TypeScript) criado e organizado
- ✅ Banco de dados configurado: SQLite com as 13 tabelas e seed (`npm run db:reset`) — falta ligar o app a ele pela API
- ✅ Cadastro e autenticação (RF01, RF02): pela API, senha com hash (scrypt), token JWT guardado no aparelho. Professor se cadastra sozinho; **aluno é cadastrado pelo professor** e entra com nome de usuário. Testado no Expo Go em 08/11 (a parte de contas de aluno criadas pelo professor foi testada só pela API)
- 🟡 Aluno novo: o nível do nivelamento ainda fica só na memória do app (vai para o servidor no passo 5); ao reabrir o app, o aluno novo refaz o nivelamento
- 🟡 Nivelamento inicial (RF03): fluxo e regra provisória (para no primeiro erro); faltam as perguntas definitivas validadas pela equipe/profissionais da EJA
- ⬜ Testes do fluxo de acesso
- ✅ Passo 0 (esqueleto): lint, tsc e expo-doctor passam, o banco recria e o fluxo foi validado no Expo Go. Node 22.18+ é necessário para `npm run db:*` (em 22.14 use `NODE_OPTIONS=--experimental-strip-types`)

**Sprint 2 – Atividades Básicas (27/10 – 03/11)** — *atrasada*
- 🟡 Atividades de letras e sílabas (RF04, RF06): só 3 atividades de exemplo
- ⬜ Associação letra-som (RF05): depende da narração por voz
- ✅ Correção automática (RF12) e feedback de acerto/erro (RF13) no app
- ⬜ Registro das respostas **no banco** (RF14) — hoje fica só na memória

**Sprint 3 – Atividades Avançadas e Progressão (03/11 – 10/11)** — *em andamento*
- 🟡 Palavras, leitura de frases e escrita (RF07, RF08, RF09): 1 exemplo de cada
- ⬜ Interpretação de textos simples (RF10) e atividades do cotidiano (RF11)
- 🟡 Progressão entre níveis (RF16): regra provisória = acertar ≥ `criterioAcerto` do nível nas últimas 5 respostas daquele nível ([`services/progressao.ts`](src/services/progressao.ts)). **A equipe precisa validar essa regra.**

**Sprint 4 – Métricas, Área do Professor e Finalização (10/11 – 17/11)**
- 🟡 Histórico e evolução do aluno (RF18, RF19): tela simples, **sem desenho no Figma**
- 🟡 Área do professor (RF20, RF21): dashboard e métricas por aluno; faltam filtro de período, gráfico de evolução, aba Relatórios
- 🟡 Identificação de dificuldades (RF17): calculada por conteúdo
- ⬜ Registro de frequência / "Ofensiva – dias seguidos" (RF15)
- ⬜ Continuidade do aprendizado entre sessões (RF22) — depende de persistência
- ⬜ Testes integrados e testes de usabilidade com o público-alvo
- ⬜ Correção de bugs residuais
- ⬜ Documentação final e preparação da apresentação (entrega **17/11**)

### Backend e dados (bloqueia quase tudo acima)
- ✅ **Banco decidido: SQLite em arquivo** (`server/data/ajai.db`), ver [ADR-001](docs/decisoes/ADR-001-stack.md)
- ✅ Tabelas do diagrama de classes criadas (Usuario, Aluno, Professor, Administrador, Turma, Matricula, Nivel, Atividade, Alternativa, AudioCache, Resposta, DesempenhoConteudo, HistoricoNivel) + dados iniciais
- ✅ **Servidor da API criado** com Fastify em `server/src/` (`npm run server:dev`, `GET /health`, erros padronizados em `{ erro }`, CORS e limite de requisições). `@fastify/jwt` já instalado, registrado no passo 3
- ⬜ API para as funções contadas na APF (Incluir/Editar/Excluir/Listar/Visualizar de cada módulo)
- ⬜ Trocar `src/data/mock.ts` pelas chamadas à API dentro de `src/services/` (as telas não precisam mudar)
- ✅ Guardar o token de login no aparelho (`expo-secure-store`; `localStorage` no navegador)
- ✅ API de autenticação (`/auth/*`), "middleware" `exigirLogin(perfil)` e cliente `src/services/api.ts`
- ✅ Migrações 002 e 003: `Usuario.telefone`, `Usuario.email` opcional, `Usuario.nomeUsuario` (login do aluno) e `Aluno.idCriador` (extras em relação ao diagrama: registrar na documentação)

### Funcionalidades previstas na APF sem tela no app nem no Figma
- ⬜ Administrador: incluir/editar/inativar atividades e níveis (APF itens 25–31) — definir se será tela no app, painel web ou carga direta no banco
- 🟡 Professor: ✅ cadastrar aluno (já entra na turma dele) e mudar a senha do aluno; ⬜ criar/editar turma, mover/excluir aluno da turma (APF 20–24)
- ⬜ O painel de Acompanhamento ainda lê `mock.ts`: aluno cadastrado pelo professor só aparece em Conta › Contas dos alunos até o passo 10
- ⬜ Professor: corrigir manualmente uma resposta (APF 35)
- ⬜ Aluno: editar preferências de voz, velocidade e tamanho da fonte (APF 17)
- 🟡 Trocar/recuperar senha (APF 18): ✅ professor/admin trocam a própria; ✅ senha do aluno só pelo professor que criou a conta; ✅ senha provisória de professor pelo administrador/script. Faltam as telas no Figma

### Acessibilidade e conteúdo
- 🟡 **Narração por voz (RNF04)** — a arquitetura trocável (`ProvedorVoz`) já existe, mas o único provedor é o `console` (o botão "Ouvir ajuda" só escreve no console). Decidido: **Piper como padrão** (áudios gerados no servidor e guardados em `AudioCache`) e **`expo-speech` implementado** como alternativa e reserva. Falta implementar os dois provedores e o gerador (passo 6).

  ⚠️ Conferir a licença da voz `pt_BR-faber-medium` e revisar na APF o `ServicoTTS`.
- ⬜ Banco real de atividades (letras, sílabas, palavras, frases, escrita, interpretação, cotidiano), validado com os profissionais da EJA
- ⬜ O enum `TipoAtividade` do diagrama não tem tipos para **letra-som** (RF05) nem **cotidiano** (RF11): incluir ou explicar no documento que entram como `conteudo` de outros tipos
- ⬜ Imagens das alternativas (o Figma usa fotos; o app usa emojis provisórios)
- ⬜ Trocar **todos os emojis** por ícones de `@expo/vector-icons` (regra no AGENTS.md; `react-icons` não roda em React Native) e carregar a fonte Inter (`expo-font`)
- ⬜ Ícone do app e splash com a identidade do AJAI (hoje são os do Expo)
- ⬜ Revisar com leitor de tela (TalkBack/VoiceOver) e tamanho de fonte do sistema aumentado

### Qualidade, segurança e privacidade
- ⬜ Testes automatizados (ex.: `jest-expo`), começando por `services/progressao.ts` e `services/respostas.ts`
- 🟡 Senha com hash no servidor (✅ scrypt) e comunicação só por HTTPS (⬜ RNF11; na demo é HTTP na rede local)
- ⬜ Invalidar tokens antigos depois de troca/redefinição de senha (hoje valem até vencer, 30 dias) — passo 13
- ⬜ Forçar troca da senha provisória do professor no primeiro login
- ⬜ Se o professor que criou o aluno sair do projeto, ninguém muda a senha desse aluno: definir como transferir (passo 10/13)
- ⬜ Coletar só o necessário e escrever termo de uso/privacidade (RNF12, LGPD)

### Design (UX/UI)
- ⬜ Telas que faltam no Figma: progresso do aluno, relatórios do professor, conta, gestão de turmas, telas do administrador, preferências de acessibilidade, recuperação de senha, estado "sem atividades/sem internet"

### Documentação
- ⬜ Atualizar a seção 15 (Prototipação) do PDF: ela diz que o protótipo tem 9 telas e que cadastro e nivelamento seriam feitos depois, mas o Figma já tem 15 telas, incluindo cadastro, nivelamento, formar palavra e ler frase
- ⬜ Registrar no documento as decisões de stack (SQLite, API com Fastify, voz com Piper + `expo-speech`) e as 2 colunas extras do esquema (`Atividade.ordemNivelamento`, `AudioCache.provedor`)
- ⬜ Manter o quadro Kanban (Trello) alinhado com esta lista

---

## Equipe

| Integrante | Função |
|---|---|
| Isabel Emília Sterim Saade | Gerente do projeto e analista de requisitos |
| Daphne Rocha Amigo | Desenvolvimento |
| Maria Carla dos Santos Bellote | Desenvolvimento |
| Brenno Gomes Breda | UX/UI Design |
| Giovanna Rocha Santana | Testes e documentação |

Os papéis acima são os formais da documentação do projeto; no desenvolvimento **todos contribuem** e as tarefas não têm dono fixo (veja [`docs/PROXIMOS_PASSOS.md`](docs/PROXIMOS_PASSOS.md)).

Orientadora: Susiléa Abreu dos Santos Lima. Metodologia: Scrum com Kanban (4 Sprints, quadro no Trello).
