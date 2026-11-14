# AJAI – Alfabetização para Jovens, Adultos e Idosos

Aplicativo mobile de apoio à alfabetização, complementar à EJA, com área de acompanhamento para professores.
Projeto da disciplina de Gestão de Projetos – Universidade de Vila Velha, 2026 (turma CC6M, equipe 4).

> **Situação em 14/11/2026 (Sprint 4 de 4):** o app já usa a **API** (Fastify sobre o banco SQLite) para login, contas, níveis, atividades, nivelamento, **respostas, progressão e histórico** (passo 5). No **Passo 3.1** o modelo de contas mudou: aluno, professor, responsável e instituição criam a própria conta, a instituição é aprovada pelo administrador, o professor pela instituição, e o acompanhamento é por **vínculo** que o aluno aceita. Ainda fica **em memória** no app só o painel do professor (passo 8). Veja [Pendências](#pendências) e [Banco de dados](#banco-de-dados-sqlite).

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

Cria o arquivo `server/data/ajai.db` com as 16 tabelas e os dados de demonstração (5 níveis, 7 atividades, 4 alunos, 2 professores, 1 responsável, 2 instituições, 1 administrador). Não precisa instalar nada além do Node. **Cada pessoa gera o seu**: o arquivo não vai para o git. Detalhes e comandos: [Banco de dados](#banco-de-dados-sqlite).

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

O login é de verdade: **o servidor precisa estar rodando** (passo 5) e o banco criado (`npm run db:reset`). Sem servidor, o app mostra "Não conseguimos falar com o servidor".

**Senha de todos os usuários de demonstração: `demo1234`** (gravada com hash pelo seed; nunca use em servidor de verdade). Na tela de login há **um campo só**: usuário, e-mail ou telefone. O app descobre o perfil pela conta.

| Perfil | Entra com | Vai para |
|---|---|---|
| Aluno | `maria.silva` (aluna nova: cai no **nivelamento**; `ana.souza`, `bruno.lima`, `clara.santos` já têm nível) | nivelamento / home do aluno |
| Professor (aprovado) | `rafael@ajai.app` ou `11900000100` | Acompanhamento, com os 4 alunos (vínculo aceito) na turma "EJA – Noite" |
| Professor (pendente) | `paula@ajai.app` | tela de espera ("Aguardando a instituição aprovar") |
| Responsável | `joana@ajai.app` | área do responsável (acompanha Bruno) |
| Instituição (aprovada) | `instituicao@ajai.app` | área da instituição: código **`EJAVV2`** e a Paula esperando aprovação |
| Instituição (pendente) | `aprender@ajai.app` | tela de espera ("Aguardando aprovação") |
| Administrador | `admin@ajai.app` | aprovação de instituições |

Modelo de contas (Passo 3.1):
- **Criar conta:** no login, "Ainda não tem conta? Crie a sua" → **Eu sou: Aluno / Professor / Responsável / Instituição**. O administrador não é criável pelo app.
- **Aluno:** nome, senha e pelo menos um entre nome de usuário (sugerido a partir do nome), e-mail ou telefone. Entra com qualquer um deles.
- **Instituição:** nome, CNPJ, nome do responsável, e-mail, telefone e senha. Fica esperando o **administrador** aprovar (em `/admin`); ao aprovar, ganha o **código** que passa aos professores.
- **Professor:** nome, e-mail, telefone, senha e o **código da instituição** (no seed, `EJAVV2`). Fica esperando a **instituição** aprovar (em `/instituicao`). Recusado, vê o motivo e pode mandar outro código.
- **Responsável:** nome, e-mail, telefone e senha. Acompanha no máximo 2 pessoas, sem turma.
- **Acompanhar um aluno:** professor (Conta › Meus alunos, ou "Meus alunos: convidar" no Acompanhamento) ou responsável convida pelo usuário, e-mail ou telefone do aluno; o aluno aceita em **Minha conta › Quem me acompanha** (a home avisa quando há convite). Só depois do aceite o acompanhante vê o nome do aluno.
- **Senha:** todo mundo troca a própria (aluno em Minha conta; os outros em Conta / na tela inicial). Esqueceu? O administrador gera uma provisória (`POST /admin/usuarios/:id/senha-provisoria`) ou, no computador do servidor, `npm run usuario:senha -- maria.silva` (usuário, e-mail ou telefone).
- O login fica guardado no aparelho (`expo-secure-store`): fechar e abrir o app volta logado.
- Fluxo completo para testar: crie uma instituição → entre como `admin@ajai.app` e aprove (anote o código) → crie um professor com o código → entre como a instituição e aprove o professor → crie um aluno → entre como o professor e convide o aluno → entre como o aluno e aceite.

Rotas da API:
- **Contas:** `POST /auth/cadastro/aluno`, `/auth/cadastro/professor`, `/auth/cadastro/responsavel`, `/auth/cadastro/instituicao`, `POST /auth/login`, `GET /auth/eu` (com `usuario.situacao`), `PATCH /auth/senha` (todos), `POST /admin/usuarios/:id/senha-provisoria`.
- **Aprovações:** `GET /admin/instituicoes?status=`, `PATCH /admin/instituicoes/:id` (administrador); `GET /instituicao/eu`, `GET /instituicao/professores?status=`, `PATCH /instituicao/professores/:id` (instituição aprovada); `PATCH /professor/instituicao` (professor não aprovado troca o código).
- **Vínculos:** `POST`/`GET /vinculos`, `DELETE /vinculos/:id` (professor aprovado ou responsável); `GET /alunos/eu/vinculos`, `PATCH`/`DELETE /alunos/eu/vinculos/:id` (aluno).
- **Atividades** (passo 4, qualquer perfil logado): `GET /niveis`, `GET /niveis/:id/atividades`, `GET /atividades/:id`, `GET /nivelamento` (sem o gabarito) e `POST /atividades/:id/corrigir` (só perguntas do nivelamento).
- **Respostas e progresso** (passo 5, só aluno, sobre ele mesmo): `POST /respostas`, `POST /nivelamento/concluir` e `GET /alunos/eu/progresso`.

**Testes do servidor:** `npm test` (ou `npm run server:test`) roda os testes com o executor nativo do Node (`node --test`, sem instalar nada): regras de progressão (`server/src/progressao.test.ts`), rotas de respostas/nivelamento/progresso (`server/src/rotas/progresso.test.ts`) e contas, aprovações e vínculos (`server/src/rotas/contas.test.ts`), num banco temporário: o seu `ajai.db` não é tocado.

> **Depois de `git pull` com rotas novas no app:** rode `npx expo start` uma vez antes do `npx tsc --noEmit`. É ele que gera os tipos das rotas (`.expo/types/router.d.ts`); sem isso o `tsc` reclama das rotas novas.

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
npm run usuario:senha -- <usuário, e-mail ou telefone>   # senha provisória (qualquer perfil)
```

### Problemas comuns

- **"Project is incompatible with this version of Expo Go"** → atualize o Expo Go no celular.
- **QR code não conecta** → mesma Wi-Fi ou `--tunnel`.
- **Erro estranho depois de trocar de branch** → `npx expo start -c`; se não resolver, apague `node_modules` e rode `npm install` de novo.

---

## Banco de dados (SQLite)

**SQLite em um arquivo dentro do projeto**, sem servidor de banco, sem conta e sem senha.

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
     5 níveis, 7 atividades, 4 alunos de demonstração.
     Senha de todos os usuários de demonstração: demo1234
     Código da instituição de demonstração (cadastro de professor): EJAVV2
   ```
4. Confira com **`npm run db:query`**: deve listar as 16 tabelas, a view `vw_aluno` e a tabela interna `_migracoes`.

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
- Colunas extras: `Atividade.ordemNivelamento` (ordem das perguntas do nivelamento; vazio = fora do nivelamento), `Atividade.textoApoio`, `AudioCache.provedor` (qual serviço gerou o áudio), `Usuario.telefone` e `Usuario.nomeUsuario`.
- Tabelas extras (Passo 3.1, migração 005): `Responsavel`, `Instituicao` (CNPJ, código, status da aprovação) e `Vinculo` (acompanhante ↔ aluno, com `identificadorConvite`); `Professor` ganhou `idInstituicao`, `statusVinculo`, `motivoRecusa` e `decididoEm`. O antigo `Aluno.idCriador` saiu (virou `Vinculo` ACEITO).
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
| `console` | ✅ existe (padrão até o passo 10) | Só registra no console; para desenvolver sem áudio |
| `servidor` | ⬜ passo 10 — depende da API de voz escolhida | Tocaria o áudio gerado no servidor pela API de voz escolhida (**ainda não definida**) e guardado em `AudioCache`; se o servidor falhar, cai para o `expo-speech` |
| `expo-speech` | ⬜ passo 10 — implementado como alternativa | Voz do próprio aparelho: grátis, sem conta, offline |

**Para trocar de voz:** crie o arquivo do provedor em `src/services/voz/`, registre-o em `src/services/voz/index.ts` e mude `PROVEDOR_PADRAO`. Nenhuma tela muda.

Se a API de voz escolhida gerar áudio no servidor, a geração segue a mesma ideia (interface `SintetizadorVoz`, um arquivo por serviço). A **API de voz ainda não foi definida**; depois de gerados, os áudios ficam guardados e a API do AJAI apenas serve os arquivos. Chaves de API ficam só em `server/.env`, **nunca no app**.

---

## Estrutura de pastas

```
src/
  app/                    Telas (cada arquivo é uma rota do Expo Router)
    index.tsx             Splash
    login.tsx             Login (um campo: usuário, e-mail ou telefone)
    cadastro/             "Eu sou:" + cadastro de aluno, professor, responsável e instituição
    espera.tsx            Conta esperando aprovação ou recusada (professor, instituição)
    aluno/                Área do aluno (protegida)
      index.tsx           Home do aluno
      nivelamento/        Pergunta + resultado do nivelamento
      atividade/[id].tsx  Realizar uma atividade
      resultado.tsx       "Acerto" / "Tentar novamente"
      progresso.tsx       Histórico e evolução
      conta.tsx, senha.tsx, acompanhamento.tsx   Minha conta, trocar senha, quem me acompanha
    professor/            Área do professor (protegida, com abas)
      index.tsx           Dashboard de acompanhamento
      aluno/[id].tsx      Métricas de um aluno
      alunos.tsx          Meus alunos (convites e vínculos)
      relatorios.tsx      (placeholder)
      conta.tsx           Conta / sair
    responsavel/          Área do responsável (até 2 pessoas)
    instituicao/          Área da instituição (código, aprovar professores)
    admin/                Área do administrador (aprovar instituições)
  components/             Botão, BotaoAudio ("Ouvir ajuda"), Campo, Tela, AtividadeView, FormularioCadastro, MeusAlunos...
  context/sessao.tsx      Usuário logado
  data/mock.ts            Dados de demonstração (níveis, atividades, alunos, respostas)
  domain/modelos.ts       Tipos espelhando o diagrama de classes
  hooks/useCarregar.ts    Carrega dados da API numa tela ("Carregando..." / "Sem conexão. Toque para tentar de novo.")
  services/               Regras e acesso a dados (API; respostas e painel ainda no mock até os passos 5 e 8)
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
```

### Telas do Figma × código

| Tela no Figma | Rota | Situação |
|---|---|---|
| Splash | `/` | esqueleto |
| Login | `/login` | ✅ pela API; **sem "Quem você é?" e sem "Ouvir ajuda"** (diferente do Figma: atualizar o frame) |
| Cadastro de aluno | `/cadastro/aluno` | ✅ o aluno cria a própria conta (Passo 3.1): nome, **nome de usuário** sugerido, e-mail e telefone opcionais, senha; sem "Ouvir ajuda" |
| Cadastro de professor ou responsável | `/cadastro/professor`, `/cadastro/responsavel` | ✅ campos do Figma (nome, e-mail, telefone, senha); o professor ganhou **código da instituição**; sem "Ouvir ajuda" |
| *(sem tela no Figma)* | `/cadastro` ("Eu sou:"), `/cadastro/instituicao`, `/espera` | ✅ Passo 3.1 – desenhar no passo 11 |
| Nivelamento · Pergunta | `/aluno/nivelamento` | esqueleto |
| Nivelamento · Resultado | `/aluno/nivelamento/resultado` | esqueleto |
| Home do aluno | `/aluno` | esqueleto ("Ofensiva" sem cálculo) |
| Reconhecimento / Sílabas / Formar palavra / Ler frase | `/aluno/atividade/[id]` | um componente para todos os tipos |
| Acerto / Tentar novamente | `/aluno/resultado` | esqueleto |
| Dashboard do professor | `/professor` | esqueleto (sem filtro de período) |
| Métricas de Ana Souza | `/professor/aluno/[id]` | esqueleto (sem gráfico) |
| *(sem tela no Figma)* | `/aluno/progresso`, `/professor/relatorios`, `/professor/conta` | provisórias |
| *(sem tela no Figma)* | `/esqueci-senha`, `/aluno/conta`, `/aluno/senha`, `/aluno/acompanhamento`, `/professor/alunos`, `/professor/senha`, `/responsavel`, `/responsavel/senha`, `/instituicao`, `/instituicao/senha`, `/admin`, `/admin/senha` | provisórias (passos 3 e 3.1) – desenhar no passo 11 |

---

## Próximos passos

O roteiro completo até a entrega, com prazo, critério de pronto e **um prompt pronto para cada passo**, está em [`docs/PROXIMOS_PASSOS.md`](docs/PROXIMOS_PASSOS.md). Resumo:

| # | Passo | Prazo |
|---|---|---|
| 0 | Instalar e validar o esqueleto | 05/11 |
| 1 | Decisões de stack (SQLite, Fastify, `ProvedorVoz`) — ✅ | 05/11 |
| 2 | Criar o servidor (API) sobre o banco SQLite — ✅ | 07/11 |
| 3 | Cadastro e login de verdade — ✅ | 08/11 |
| 3.1 | Modelo de contas revisado (perfis, instituição, vínculos) — ✅ | 14/11 |
| 4 | Atividades e níveis vindos da API — ✅ | 09/11 |
| 5 | Respostas, progressão e histórico no servidor — ✅ | 10/11 |
| 6 | Conteúdo pedagógico completo — ✅ | 14/11 |
| 7 | Home do aluno: ofensiva e progresso | 15/11 |
| 8 | Área do professor e do responsável | 15/11 |
| 9 | Cadastro de atividades e níveis (admin) | 15/11 |
| 10 | Narração por voz e preferências | 15/11 |
| 11 | Ajuste ao Figma e recursos visuais | 16/11 |
| 12 | Testes automatizados | 16/11 |
| 13 | Segurança e privacidade (LGPD) | 16/11 |
| 14 | Correção de bugs e polimento | 16/11 |
| 15 | Documentação final | 16/11 |
| 16 | Apresentação e demo | 17/11 |

A ordem de execução é a da tabela (em 14/11 os passos foram renumerados na ordem de execução e o antigo passo de testes de usabilidade saiu).

## Pendências

Legenda: ✅ feito · 🟡 esqueleto/parcial (só no app, com dados em memória) · ⬜ não começado

### Por Sprint (cronograma da documentação, Tabela 5)

**Sprint 1 – Setup, Acesso e Nivelamento (20/10 – 27/10)** — *atrasada*
- ✅ Projeto Expo (React Native + TypeScript) criado e organizado
- ✅ Banco de dados configurado: SQLite com as 13 tabelas do diagrama (16 com as do Passo 3.1) e seed (`npm run db:reset`), ligado ao app pela API
- ✅ Cadastro e autenticação (RF01, RF02): pela API, senha com hash (scrypt), token JWT guardado no aparelho. Desde o **Passo 3.1 (14/11)** aluno, professor, responsável e instituição criam a própria conta; instituição aprovada pelo administrador, professor pela instituição; acompanhamento por vínculo que o aluno aceita. Testado pelos testes de API (`contas.test.ts`) e contra o servidor rodando; **falta a equipe repetir o fluxo completo pelas telas no Expo Go**
- ✅ Aluno novo: o nivelamento é gravado no servidor (`POST /nivelamento/concluir`: respostas, nível inicial e HistoricoNivel); ao reabrir o app, o aluno continua na etapa dele
- ✅ Nivelamento inicial (RF03): 10 perguntas da API (`GET /nivelamento`, duas por nível), com barra de progresso; o aluno para no primeiro erro e o servidor decide o nível (corrige de novo e só aceita as perguntas na ordem, sem pular). Regra definida no passo 6: só passa de nível acertando **as 2 perguntas do par**, e começa no primeiro nível que não domina ([`docs/conteudo-pedagogico.md`](docs/conteudo-pedagogico.md))
- ⬜ Testes do fluxo de acesso
- ✅ Passo 0 (esqueleto): lint, tsc e expo-doctor passam, o banco recria e o fluxo foi validado no Expo Go. Node 22.18+ é necessário para `npm run db:*` (em 22.14 use `NODE_OPTIONS=--experimental-strip-types`)

**Sprint 2 – Atividades Básicas (27/10 – 03/11)** — *atrasada*
- ✅ Atividades de letras e sílabas (RF04, RF06): telas vindas da API (passo 4) e 7 atividades por nível do cotidiano adulto (passo 6, 14/11; [`docs/conteudo-pedagogico.md`](docs/conteudo-pedagogico.md)). Faltam só as imagens finais (passo 11)
- 🟡 Associação letra-som (RF05): atividades LETRA "começa com o som da letra..." (passo 6), com as opções lidas no "Ouvir instrução"; falta a voz de verdade (passo 10)
- ✅ Correção automática (RF12) **no servidor** desde o passo 4 (o app não recebe o gabarito) e feedback de acerto/erro (RF13)
- ✅ Registro das respostas **no banco** (RF14): `POST /respostas` grava a Resposta e atualiza o DesempenhoConteudo (passo 5, testado no Expo Go em 09/11)

**Sprint 3 – Atividades Avançadas e Progressão (03/11 – 10/11)** — *em andamento*
- ✅ Palavras, leitura de frases e escrita (RF07, RF08, RF09): telas de cada tipo (montar palavra com sílabas e "Apagar", frase em destaque com "Ouvir frase", escrita tolerante a acentos), com 7 atividades no nível 3 e 7 no nível 4 (passo 6)
- ✅ Interpretação de textos simples (RF10) e cotidiano (RF11): tela com o texto visível e "Ouvir texto", 7 textos do cotidiano (consulta, receita, aviso de falta de água, mensagem da farmácia, ônibus, mercado; passo 6). O cotidiano é o tema de todas as atividades
- 🟡 Progressão entre níveis (RF16): **no servidor** desde o passo 5, com HistoricoNivel (testado no Expo Go em 09/11). Regra provisória = taxa de acerto ≥ `criterioAcerto` do nível nas últimas 5 respostas daquele nível, conferida só depois de um acerto numa atividade da etapa atual ([`server/src/progressao.ts`](server/src/progressao.ts), com testes). **A equipe precisa validar essa regra.** Atenção na demo: pelos dados de exemplo, Ana e Clara sobem de etapa logo no primeiro acerto

**Sprint 4 – Métricas, Área do Professor e Finalização (10/11 – 17/11)**
- 🟡 Histórico e evolução do aluno (RF18, RF19): dados reais de `GET /alunos/eu/progresso` (trilha, atividades feitas, acertos, "Vale a pena treinar"); tela simples, **sem desenho no Figma**
- 🟡 Área do professor (RF20, RF21): dashboard e métricas por aluno; faltam filtro de período, gráfico de evolução, aba Relatórios
- 🟡 Identificação de dificuldades (RF17): calculada por conteúdo
- ⬜ Registro de frequência / "Ofensiva – dias seguidos" (RF15)
- 🟡 Continuidade do aprendizado (RF22): o CONTINUAR abre uma **sessão de 5 atividades** seguidas (acertos); depois de um acerto vai direto para a próxima, e só no fim do bloco oferece "Voltar ao início" ou "Continuar treinando" (`services/sessaoDeEstudo.ts`, `ATIVIDADES_POR_SESSAO`). A próxima atividade vem do servidor (`GET /alunos/eu/progresso`), então continua certa entre aberturas do app
- ⬜ Testes integrados (casos manuais do passo 12) em Android e iPhone/web
- ⬜ Correção de bugs residuais
- ⬜ Documentação final e preparação da apresentação (entrega **17/11**)

### Backend e dados (bloqueia quase tudo acima)
- ✅ **Banco decidido: SQLite em arquivo** (`server/data/ajai.db`)
- ✅ Tabelas do diagrama de classes criadas (Usuario, Aluno, Professor, Administrador, Turma, Matricula, Nivel, Atividade, Alternativa, AudioCache, Resposta, DesempenhoConteudo, HistoricoNivel) + as extras do Passo 3.1 (Responsavel, Instituicao, Vinculo) + dados iniciais
- ✅ **Servidor da API criado** com Fastify em `server/src/` (`npm run server:dev`, `GET /health`, erros padronizados em `{ erro }`, CORS e limite de requisições). `@fastify/jwt` já instalado, registrado no passo 3
- ⬜ API para as funções contadas na APF (Incluir/Editar/Excluir/Listar/Visualizar de cada módulo)
- 🟡 Trocar `src/data/mock.ts` pelas chamadas à API dentro de `src/services/`: ✅ contas (passo 3); ✅ níveis, atividades e nivelamento (passo 4, telas com "Carregando..." e "Sem conexão"); ✅ respostas, progressão e histórico (passo 5); ⬜ painel do professor (passo 8; ele e `professor/aluno/[id]` ainda leem as respostas do mock, então respostas novas não aparecem lá)
- ✅ Migração 004: `Atividade.textoApoio` (palavra, frase ou texto mostrado à parte do enunciado; extra em relação ao diagrama)
- ✅ Guardar o token de login no aparelho (`expo-secure-store`; `localStorage` no navegador)
- ✅ API de autenticação (`/auth/*`), "middleware" `exigirLogin(perfil)` e cliente `src/services/api.ts`
- ✅ Migrações 002 e 003: `Usuario.telefone`, `Usuario.email` opcional, `Usuario.nomeUsuario` (login do aluno)
- ✅ Migração 005 (Passo 3.1): perfis `RESPONSAVEL` e `INSTITUICAO`, tabelas `Responsavel`, `Instituicao` e `Vinculo`, colunas novas em `Professor`; `Aluno.idCriador` saiu (virou `Vinculo`). Extras em relação ao diagrama: registrar na documentação

### Funcionalidades previstas na APF sem tela no app nem no Figma
- ⬜ Administrador: incluir/editar/inativar atividades e níveis (APF itens 25–31) — definir se será tela no app, painel web ou carga direta no banco
- 🟡 Professor: ✅ convidar aluno e desfazer vínculo ("Meus alunos", Passo 3.1); ⬜ criar/editar turma, pôr/mover/tirar aluno da turma (APF 20–24, passo 8, só alunos com vínculo aceito)
- ⬜ O painel de Acompanhamento ainda lê `mock.ts`: aluno novo (vínculo aceito) só aparece em Conta › Meus alunos até o passo 8. O aluno que se cadastra sozinho não entra em turma
- ⬜ Responsável: recomendações sobre as pessoas acompanhadas (passo 8; sem turma nem métricas detalhadas)
- ✅ Instituição e administrador: inscrição, aprovação com código e aprovação de professores (Passo 3.1). ⬜ Revogar aprovação ou tirar professor da instituição (não previsto)
- ⬜ Professor: corrigir manualmente uma resposta (APF 35)
- ⬜ Aluno: editar preferências de voz, velocidade e tamanho da fonte (APF 17)
- 🟡 Trocar/recuperar senha (APF 18): ✅ todos os perfis trocam a própria (inclusive o aluno, desde o Passo 3.1); ✅ senha provisória para qualquer perfil pelo administrador/script. Faltam as telas no Figma

### Acessibilidade e conteúdo
- 🟡 **Narração por voz (RNF04)** — a arquitetura trocável (`ProvedorVoz`) já existe, mas o único provedor é o `console` (o botão "Ouvir ajuda" só escreve no console). **A API de voz ainda NÃO foi definida**; o `expo-speech` será implementado como alternativa e reserva. Falta a equipe escolher a API e implementar os provedores (passo 10).

  ⚠️ Ao escolher a API, conferir custo e licença da voz e revisar na APF o `ServicoTTS`.
- ✅ Banco real de atividades (letras, sílabas, palavras, frases, escrita, interpretação, cotidiano): 35 atividades, 7 por nível (passo 6, 14/11)
- 🟡 O enum `TipoAtividade` do diagrama não tem tipos para **letra-som** (RF05) nem **cotidiano** (RF11). Decidido no passo 6: **não criar tipos**; RF05 = LETRA e RF11 = tema/`conteudo` de todos os tipos, sem impacto no diagrama nem na APF (ver [`docs/conteudo-pedagogico.md`](docs/conteudo-pedagogico.md)). Falta explicar isso no PDF (passo 15)
- ⬜ Imagens das alternativas e da palavra em destaque (o Figma usa fotos, ex.: a casa em "Formar palavra"; o app usa ícones provisórios do `MaterialCommunityIcons` e ainda não mostra a imagem da palavra)
- ✅ Emojis trocados por ícones de `@expo/vector-icons` (09/11)
- ⬜ Carregar a fonte Inter (`expo-font`)
- ⬜ Ícone do app e splash com a identidade do AJAI (hoje são os do Expo)
- ⬜ Revisar com leitor de tela (TalkBack/VoiceOver) e tamanho de fonte do sistema aumentado

### Qualidade, segurança e privacidade
- 🟡 Testes automatizados: ✅ servidor com `node --test` (`npm test`, 63 testes: regras de progressão, rotas do passo 5 e contas/aprovações/vínculos do Passo 3.1); ⬜ testes de tela no app (`jest-expo`) no passo 12
- 🟡 Senha com hash no servidor (✅ scrypt) e comunicação só por HTTPS (⬜ RNF11; na demo é HTTP na rede local)
- ⬜ Invalidar tokens antigos depois de troca/redefinição de senha (hoje valem até vencer, 30 dias) — passo 13
- ⬜ Forçar troca da senha provisória no primeiro login (passo 13)
- ✅ Problema "professor que criou o aluno saiu" resolvido no Passo 3.1: o aluno tem conta própria e troca a própria senha
- ⬜ Coletar só o necessário e escrever termo de uso/privacidade (RNF12, LGPD)

### Design (UX/UI)
- ⬜ Telas que faltam no Figma: progresso do aluno, relatórios do professor, conta, gestão de turmas, telas do administrador, preferências de acessibilidade, recuperação de senha, estado "sem atividades/sem internet"; do Passo 3.1: escolha de perfil, 4 cadastros, espera/recusa, área da instituição, área do responsável, aprovação no admin, "Meus alunos" e convites do aluno (lista completa no passo 11)

### Documentação
- ⬜ Atualizar a seção 15 (Prototipação) do PDF: ela diz que o protótipo tem 9 telas e que cadastro e nivelamento seriam feitos depois, mas o Figma já tem 15 telas, incluindo cadastro, nivelamento, formar palavra e ler frase
- ⬜ Registrar no documento as decisões de stack (SQLite, API com Fastify, voz com `ProvedorVoz` + `expo-speech`; API de voz a definir) e as colunas/tabelas extras do esquema (`Atividade.ordemNivelamento`, `Atividade.textoApoio`, `AudioCache.provedor`, `Usuario.telefone`, `Usuario.nomeUsuario`, `Responsavel`, `Instituicao`, `Vinculo` e as colunas novas de `Professor`), e os perfis novos no diagrama de classes e na APF (RESPONSAVEL, INSTITUICAO; funções de aprovação e de vínculo)
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
