# ADR-001 · Stack de dados, servidor e voz

Data: 05/11/2026 · Situação: **decidido** (banco, API com Fastify, arquitetura e provedor de voz, login e contas, ícones, atividades sem gabarito no app, respostas e progressão no servidor)

## Contexto

Entrega final em 17/11/2026. O app (Expo SDK 58) só tem dados de demonstração em memória (`src/data/mock.ts`). A documentação prevê Node.js. O público (EJA) depende de narração por voz. Custo alvo: R$ 0.

## Decisões tomadas

### 1. Banco de dados: SQLite em arquivo dentro do projeto — **DECIDIDO**

- Arquivo: `server/data/ajai.db`. **Não vai para o git**; cada pessoa gera o seu com `npm run db:reset`.
- O que vai para o git: o esquema (`server/db/migrations/*.sql`) e o seed (`server/db/seed.mjs`, que lê `src/data/mock.ts`).
- Acesso: módulo nativo `node:sqlite` (Node 22.18+), sem instalar nada e sem compilar nada. Se faltar recurso (ex.: desempenho), trocar por `better-sqlite3` mantém o mesmo SQL.
- Mudança de estrutura **sempre por migração nova** (`002_*.sql`...), nunca editando a anterior.
- Por quê: não precisa de conta, chave ou rede; um agente de IA (ou qualquer pessoa) consulta e altera o banco por `npm run db:query`; a demo roda no notebook da equipe.
- Consequências: o banco não é compartilhado entre integrantes (cada um tem o seu, com os mesmos dados iniciais); na demo o servidor roda em um notebook na mesma rede Wi-Fi dos celulares. Se a equipe quiser compartilhar dados no futuro, Turso (SQLite na nuvem) mantém o mesmo SQL.
- Extras em relação ao diagrama de classes (registrar na documentação final): `Atividade.ordemNivelamento`, `AudioCache.provedor` e, desde o passo 3, `Usuario.telefone`, `Usuario.email` opcional, `Usuario.nomeUsuario` e `Aluno.idCriador` (migrações 002 e 003, ver §4) e, desde o passo 4, `Atividade.textoApoio` (migração 004, ver §6).
- Migração que precisa **recriar** uma tabela começa com a linha `-- ajai: sem-chaves-estrangeiras`: o `migrar.mjs` desliga as chaves estrangeiras só durante ela e confere tudo (`PRAGMA foreign_key_check`) antes do COMMIT.

### 2. Voz: interface `ProvedorVoz`, padrão **Piper**, `expo-speech` também implementado — **DECIDIDO**

- Interface `ProvedorVoz` (VoiceProvider) em `src/services/voz/provedor.ts`; o app chama só `falar()`/`pararFala()` de `services/narracao.ts`.
- Trocar de `expo-speech` para uma API (ou o contrário) = mudar `PROVEDOR_PADRAO` em `src/services/voz/index.ts`.
- **Provedor padrão: Piper** (código aberto, grátis, sem conta nem chave), rodando no computador que serve a API. Os áudios das atividades são gerados uma vez e guardados; o app toca os arquivos pelo provedor `servidor`.
- **`expo-speech` também é implementado**, como alternativa selecionável e como **reserva**: se o servidor não responder (sem rede, sem áudio ainda), o app fala com a voz do aparelho. Para textos que mudam ("Olá, Maria!") também serve.
- Para trocar o padrão: mudar `PROVEDOR_PADRAO` em `src/services/voz/index.ts` (`"servidor"` ou `"expo-speech"`).
- Pontos a verificar na implementação: o repositório e a licença atuais do Piper (o projeto original foi migrado; confira o oficial) e a **licença da voz `pt_BR-faber-medium`**, antes de citar na apresentação.
- No servidor, a geração de áudio seguirá a mesma ideia: uma interface `SintetizadorVoz` (texto + voz + velocidade → arquivo de áudio) com um arquivo por serviço (Google, Polly, Piper...), e o resultado guardado em `AudioCache` (tabela) + `server/storage/audio/` (arquivos, fora do git).
- `AudioCache.provedor` evita misturar áudios de vozes diferentes ao trocar de serviço.

### 3. API: Node.js + TypeScript com **Fastify** — **DECIDIDO** (implementado no passo 2, 05/11)

- Por quê: validação de entrada embutida (esquemas JSON por rota), TypeScript melhor que o Express, plugins oficiais de JWT/CORS/limite de requisições.
- Versões instaladas (05/11/2026, compatíveis com Node 20+): `fastify` 5.12, `@fastify/cors` 11.4, `@fastify/rate-limit` 11.2, `@fastify/jwt` 10.2 (registrado no passo 3). Todos são JavaScript puro, sem compilação nativa. `@types/node` 22 (devDependency).
- **Sem `tsx`/`ts-node`/`nodemon`:** em desenvolvimento o próprio Node roda os `.ts` (type stripping, nativo no 22.18+; os scripts passam `--experimental-strip-types` para funcionar também no 22.14+) e reinicia com `--watch`. Consequência: no servidor só se usa TypeScript "apagável" (sem `enum`, sem `namespace`, imports com extensão `.ts`), o que o `server/tsconfig.json` (`erasableSyntaxOnly`) confere. `npm run server:build` gera `server/dist/` com o `tsc`.
- `server/package.json` existe só para marcar a pasta como ES modules; as dependências ficam no `package.json` da raiz. O `tsconfig.json` do app exclui `server/` (o servidor tem o seu).
- Ajv configurado com `removeAdditional: "all"`: campos fora do esquema da rota são descartados.
- Erros sempre em `{ erro: string }`, curtos e em português (`server/src/erros.ts`); mensagens próprias só via `ErroApi`, o resto vira mensagem padrão por código HTTP (não vaza detalhe interno).
- `.env` lido com `process.loadEnvFile` (nativo), sem `dotenv`.

### 4. Login, contas e senha — **DECIDIDO** (passo 3, 08/11/2026)

- **Quem se cadastra:** só o **professor/responsável**, pela tela pública (campos do Figma: nome, e-mail, telefone, senha). O **aluno é cadastrado pelo professor**, dentro da conta dele (Conta › Contas dos alunos, ou "Cadastrar aluno" no Acompanhamento), e já entra na turma ativa do professor (criada na hora se ele não tiver). O cadastro de aluno do Figma perdeu o campo "Telefone do Professor/Responsável": quem cadastra já é o professor.
- **Aluno não tem e-mail nem telefone.** Entra com **nome de usuário** (ex.: `maria.silva`; o app sugere a partir do nome, só letras sem acento, números e ponto; repetido → o servidor sugere `maria.silva2`). Professor e administrador entram com e-mail ou telefone.
- **Login com um campo só** ("Seu usuário ou e-mail"): tem `@` → e-mail; só números → telefone; senão → nome de usuário. O **perfil vem da conta**, por isso a tela de login **não tem mais "Quem você é?"** (diferença do Figma). Login e cadastro também **não têm "Ouvir ajuda"** (decisão da equipe).
- **Senha do aluno:** o aluno **não troca** a própria senha. Só o **professor que criou a conta** (`Aluno.idCriador`) define a senha no cadastro e muda depois (`PATCH /professor/alunos/:id/senha`). Nem o administrador muda a senha de aluno. Professor/administrador trocam a própria senha (`PATCH /auth/senha`).
- **Esqueceu a senha (sem serviço de e-mail):** aluno → pede ao professor; professor → pede ao administrador (`POST /admin/usuarios/:id/senha-provisoria`, 6 números) ou a quem tem o servidor (`npm run usuario:senha -- <e-mail ou telefone>`). Por quê: o público muitas vezes não usa e-mail, o professor já é o ponto de apoio do aluno, e não há serviço externo nem custo.
- **Banco:** migração 002 criou `Usuario.telefone` e deixou `email` opcional; migração 003 criou `Usuario.nomeUsuario` (único; obrigatório para aluno, proibido para os outros, com `email`/`telefone` proibidos para aluno, tudo por `CHECK`) e `Aluno.idCriador` (FK para Professor). **Extras em relação ao diagrama de classes e mudança na APF** (aluno passa a ser incluído pelo professor): registrar na documentação final.
- **Hash de senha com scrypt** (`node:crypto`, parâmetros da OWASP: N = 2^17, r = 8, p = 1, sal aleatório) em vez de bcrypt/argon2: é nativo do Node, sem módulo para compilar (mesma razão do `node:sqlite`). Código em `server/db/senha.mjs`. Senha mínima: 6 caracteres.
- **Token JWT** (`@fastify/jwt`) com `{ idUsuario, perfil }`, validade `JWT_VALIDADE` (padrão 30 dias, porque entrar de novo é difícil para o público). `JWT_SECRET` obrigatório em produção; em desenvolvimento, se faltar, é gerado e guardado em `server/data/jwt-segredo.local` (fora do git). A cada requisição o servidor confere no banco se o usuário existe, está ativo e qual é o perfil. Limitação: depois de mudar a senha, tokens antigos valem até vencer (rever no passo 13).
- No app, o token fica no `expo-secure-store` (no navegador, `localStorage`, pois o SecureStore não existe na web) com uma cópia do usuário, para abrir logado mesmo sem internet.
- Limite de 10 tentativas por minuto por IP nas rotas que recebem senha (`LIMITE_LOGIN_POR_MINUTO`).

### 5. Ícones: biblioteca, nunca emoji — **DECIDIDO** (08/11/2026)

- A interface não usa emojis. Ícones vêm de **`@expo/vector-icons`** (padrão, mantido pelo Expo) ou `lucide-react-native`. O `react-icons` foi descartado: só funciona na web (gera elementos do navegador) e não roda no React Native. Os emojis provisórios foram trocados em 09/11: Ionicons na interface (alto-falante, livro, abas, trilha, acerto/erro) e, nas alternativas, `Alternativa.ilustracao` passou a guardar o nome de um ícone do `MaterialCommunityIcons` (mesma coluna, sem migração), até as imagens do passo 8.

### 6. Atividades vêm da API, sem gabarito; correção no servidor — **DECIDIDO** (passo 4, 09/11/2026)

- Rotas (qualquer perfil logado, `server/src/rotas/atividades.ts`): `GET /niveis`, `GET /niveis/:id/atividades` (só ATIVAS, alternativas em ordem), `GET /atividades/:id`, `GET /nivelamento` (ordem do nível, depois `ordemNivelamento`).
- **O app nunca recebe `respostaCorreta` nem `Alternativa.correta`**: as consultas não leem essas colunas e os esquemas de resposta não as têm. No app, o tipo é `AtividadeDoAluno` (`src/domain/modelos.ts`).
- Por isso a correção passou para o servidor já no passo 4: `POST /atividades/:id/corrigir { respostaDada } → { correta }` (só corrige, não grava; `server/src/correcao.ts`, tolerante a maiúsculas, acentos e espaços). Desde o passo 5 ela **só aceita perguntas do nivelamento** (ver §7).
- **`Atividade.textoApoio`** (migração 004, opcional): o texto mostrado à parte do enunciado. SILABA/PALAVRA = a palavra em destaque ("CASA"); FRASE = a frase; INTERPRETACAO = o texto de 2 a 4 linhas. Assim o enunciado fica só com a pergunta, como no Figma ("Ler frase").
- **PALAVRA (montar palavra):** as alternativas são as **peças** (sílabas, com distratoras); `correta` marca as peças que fazem parte da palavra, e a resposta é a junção das peças tocadas, comparada com `respostaCorreta`. Consequência para o passo 11: a regra "exatamente uma alternativa correta" vale para os tipos de múltipla escolha, não para PALAVRA (nem para ESCRITA, que não tem alternativas).
- No app, telas que dependem da API usam `useCarregar` (`src/hooks/`, sem biblioteca) e o componente `Carregando` ("Carregando..." / "Sem conexão. Toque para tentar de novo."). A trilha de níveis fica guardada na memória depois da primeira leitura.

### 7. Respostas, progressão e histórico no servidor — **DECIDIDO** (passo 5, 09/11/2026)

- Rotas (só perfil ALUNO; o aluno é sempre o do token, nunca um id do corpo), em `server/src/rotas/progresso.ts`:
  - `POST /respostas { idAtividade, respostaDada, tempoRespostaSeg }` → `201 { correta, subiuDeNivel, nivelAtual }`: corrige, grava `Resposta`, atualiza `DesempenhoConteudo` (tentativas, acertos e taxa por aluno + nível + conteúdo) e, se subir, grava `HistoricoNivel`, tudo numa transação. Aluno sem nivelamento → 409.
  - `POST /nivelamento/concluir { respostas[] }` → `201 { nivel }`: o servidor **corrige de novo** (não confia no app), exige que as respostas sejam as primeiras perguntas do nivelamento **na ordem, sem pular** (senão daria para responder só a mais difícil), grava as respostas, `Aluno.idNivelInicial` e `HistoricoNivel`. Só uma vez por aluno (409 depois).
  - `GET /alunos/eu/progresso?anterior=<id>` → nível atual, trilha com status (`CONCLUIDA`/`ATUAL`/`BLOQUEADA`), total de atividades, acertos, taxa, até 3 dificuldades (conteúdos com erro, pior primeiro) e a **próxima atividade** (RF22).
- O nivelamento continua usando `POST /atividades/:id/corrigir` pergunta a pergunta, porque precisa parar no primeiro erro; essa rota agora só aceita perguntas do nivelamento (`ordemNivelamento` preenchido), para não virar um jeito de conferir respostas das atividades sem gravar.
- **Funções puras** (nivelamento, progressão, dificuldades, próxima atividade) mudaram de `src/services/progressao.ts` para `server/src/progressao.ts`, **sem mudar a lógica**, e o arquivo não importa nada (tipos mínimos estruturais). O app reexporta esse arquivo só para o painel do professor, que calcula em cima do mock até o passo 10.
- **Regra de progressão (provisória, a equipe precisa confirmar):** sobe quando a taxa de acerto das **últimas 5 respostas do nível** é ≥ `Nivel.criterioAcerto`, e só é conferida **depois de um acerto numa atividade da etapa atual** (subir logo após um erro confundiria o aluno; atividade de outra etapa conta no desempenho, mas não mexe no nível). As respostas do nivelamento entram na conta da etapa delas. Na última etapa não há para onde subir.
- **Testes do servidor com `node --test`** (nativo, sem instalar nada, mesma razão do `node:sqlite`): `npm test`. Os testes de rota usam um banco temporário (`AJAI_DB`) semeado pelo `seed.mjs`. O passo 12 pode trocar por vitest/jest se a equipe preferir; os testes usam só `node:assert`.
- No app, a sessão (`entrar`) também atualiza a cópia guardada do usuário, para o app reabrir já na etapa nova mesmo sem internet.

### Comparativo de voz (preços consultados nas páginas oficiais em 05/11/2026; confira antes de assinar)

| Opção | Custo | Conta/chave | Observações |
|---|---|---|---|
| `expo-speech` (voz do aparelho) | Grátis | Não | Alternativa e reserva offline. Qualidade depende da voz pt-BR instalada no celular |
| **Piper (padrão)** | Grátis | Não | Código aberto, roda no servidor. Existe voz pt-BR (`pt_BR-faber-medium`). Gera os áudios uma vez; **ouvir a qualidade e conferir a licença da voz** antes de fechar |
| Google Cloud TTS | Standard/WaveNet: 4 mi caracteres grátis/mês, depois US$ 4 por 1 mi | Sim (cartão) | Confirmar vozes pt-BR na lista oficial |
| Amazon Polly | Standard: 5 mi caracteres grátis/mês, depois US$ 4 por 1 mi | Sim (cartão) | Permite guardar e reutilizar o áudio gerado |
| ElevenLabs | Grátis ≈ 10 mil caracteres; pago a partir de US$ 6/mês | Sim | Voz muito natural; cota grátis pequena |

## Consequências para a documentação

- Registrar no PDF: SQLite local como banco, arquitetura `ProvedorVoz`, e o provedor final escolhido.
- APF: como a geração de áudio no servidor (Piper) continua existindo como serviço de síntese, a equipe deve decidir se `ServicoTTS` segue contado como AIE; só sairia se o app usasse apenas `expo-speech`.
