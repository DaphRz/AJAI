# AGENTS.md – AJAI

Instruções para agentes de IA (Claude, Copilot, Cursor etc.) e para quem chega agora no código.
Leia também o [README](README.md), principalmente a seção **Pendências**, o roteiro [`docs/PROXIMOS_PASSOS.md`](docs/PROXIMOS_PASSOS.md) e as decisões em [`docs/decisoes/ADR-001-stack.md`](docs/decisoes/ADR-001-stack.md). O `CLAUDE.md` importa esses arquivos para o Claude Code a cada sessão.

## Contexto do produto

AJAI é um app mobile de alfabetização para **jovens, adultos e idosos** (público da EJA), muitos com pouca leitura e pouca familiaridade com celular. Tem duas áreas:

- **Contas:** só o **professor/responsável** se cadastra sozinho (nome, e-mail, telefone, senha). O **aluno é cadastrado pelo professor**, dentro da conta dele, e já entra na turma dele. O aluno **não tem e-mail nem telefone**: entra com **nome de usuário** (ex.: `maria.silva`) e senha, e **não troca a própria senha**; só o professor que criou a conta (`Aluno.idCriador`) muda. O login tem um campo só (usuário, e-mail ou telefone) e o perfil vem da conta.
- **Aluno:** nivelamento inicial → atividades graduais (letra, sílaba, palavra, frase, escrita, interpretação) → correção imediata → progressão de nível → histórico.
- **Professor/responsável:** acompanha frequência, taxa de acerto, nível e conteúdos de maior dificuldade dos alunos vinculados. O app **complementa** o professor, não o substitui.

Fontes de verdade, nesta ordem:
1. Requisitos RF01–RF22 e RNF01–RNF15 da documentação do projeto (PDF).
2. Diagrama de classes (`docs/diagrama-classes.png`), espelhado em `src/domain/modelos.ts`.
3. Protótipo no Figma: https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI (15 telas).
4. Planilha APF_AJAI.xlsx (nomes das funções no padrão Incluir/Editar/Excluir/Listar/Visualizar).

**Fora do escopo do MVP** (não implemente): gamificação complexa, recomendação avançada, IA para avaliar escrita, integração com sistemas do governo, diagnóstico clínico, versão desktop como prioridade.

## Stack

- Expo **SDK 58**, React Native, React 19, TypeScript estrito, React Compiler ligado (`app.json › experiments.reactCompiler`).
- Expo Router (rotas por arquivo em `src/app/`), typed routes ligado.
- **Banco: SQLite em arquivo** (`server/data/ajai.db`), já criado com as 13 tabelas e seed (ver [Banco de dados](#banco-de-dados-sqlite)). Decisão em `docs/decisoes/ADR-001-stack.md`.
- **API:** Node.js + TypeScript com **Fastify** em `server/src/` (`npm run server:dev`). Validação de entrada com esquemas JSON em **toda** rota; erros sempre `{ erro: string }` em português (lance `ErroApi` de `server/src/erros.ts`). O app chama a API **só** por `src/services/api.ts` (`chamarApi`, token no cabeçalho, erros já em mensagem amigável); login, cadastro e senha vêm da API (passo 3); níveis, atividades e nivelamento também (passo 4, **sem gabarito**: a correção é do servidor); respostas, progressão e histórico também (passo 5: `POST /respostas`, `POST /nivelamento/concluir`, `GET /alunos/eu/progresso`). Só o painel do professor ainda lê `src/data/mock.ts` em memória até o passo 10. Tela que espera a API: `useCarregar` (`src/hooks/`) + componente `Carregando`. Rota que exige login: `preHandler: exigirLogin("PROFESSOR")` de `server/src/autenticacao.ts` (`req.user` = `{ idUsuario, perfil }`).
- O servidor roda `.ts` direto no Node (type stripping): **sem `enum`/`namespace`** e imports relativos **com `.ts`** (ex.: `import { banco } from "../banco.ts"`). Rota nova = arquivo em `server/src/rotas/` registrado em `server/src/app.ts`. Typecheck do servidor: `npm run server:typecheck` (`npm run typecheck` faz app + servidor).
- **Voz trocável**: o app usa a interface `ProvedorVoz` (`src/services/voz/`). Padrão previsto: **Piper** (áudio gerado no servidor); `expo-speech` como alternativa e reserva. Ver [Narração por voz](#narração-por-voz-provedorvoz).

## Arquitetura e onde colocar cada coisa

| Pasta | Responsabilidade |
|---|---|
| `src/app/` | **Só telas** e layouts. Toda lógica de regra vai para `services/`. Arquivos fora de rota não ficam aqui. |
| `src/components/` | Componentes visuais reutilizáveis (`Tela`, `Botao`, `BotaoAudio`, `Campo`, `AtividadeView`...). |
| `src/services/` | Regras de negócio e acesso a dados. Nomes seguem o diagrama/APF: `incluirResposta`, `corrigirAutomaticamente`, `visualizarPainel`... Quando o backend existir, **só esta pasta muda**. |
| `server/src/progressao.ts` | Funções **puras** (sem I/O, sem imports) de nivelamento, progressão, dificuldades e próxima atividade, com testes (`npm test`). Regra nova vai aqui. `src/services/progressao.ts` só reexporta para o painel do professor (mock) até o passo 10. |
| `src/domain/modelos.ts` | Tipos do diagrama de classes. Mudou o diagrama? Mude aqui também. |
| `src/data/mock.ts` | Dados de demonstração. Não importe direto nas telas; passe por `services/`. |
| `src/theme/tokens.ts` | Cores, fontes e tamanhos do Figma. **Não use cor ou tamanho "solto"** nas telas. |
| `src/services/narracao.ts` + `src/services/voz/` | Fachada de voz (`falar`/`pararFala`) e provedores (`ProvedorVoz`). **Telas nunca importam um provedor direto.** |
| `server/src/` | API Fastify: `app.ts` (plugins e rotas), `banco.ts` (conexão `node:sqlite`, use `banco()`), `config.ts` (`server/.env`), `erros.ts`, `rotas/*.ts`. |
| `server/db/` | Banco SQLite: `migrations/*.sql` (esquema), `seed.mjs` (dados iniciais, lê `src/data/mock.ts`), scripts `db:*`. |
| `server/data/` e `server/storage/` | Arquivo do banco e áudios gerados. **Ignorados pelo git**; nunca versionar. |

## Regras obrigatórias de acessibilidade (o público depende disso)

- Toda tela do **aluno** tem um `BotaoAudio` ("Ouvir ajuda"/"Ouvir instrução") com o texto da tela (RNF04). **Exceção:** as telas de login e cadastro **não** têm "Ouvir ajuda" (decisão da equipe, 08/11).
- Botões com **texto escrito**, nunca só ícone (RNF03). Área de toque ≥ `toqueMinimo` (64).
- **Não use emojis** na interface (nem como ícone, ilustração ou enfeite). Use ícones de biblioteca: **`@expo/vector-icons`** (padrão; instale com `npx expo install @expo/vector-icons`; Ionicons, MaterialIcons, Feather...) ou `lucide-react-native`. O `react-icons` **não serve**: é só para web (DOM) e não roda no React Native. Ícone decorativo ao lado de texto: `accessibilityElementsHidden` / `importantForAccessibility="no"`. Os emojis provisórios já saíram (09/11). As figuras das alternativas (`Alternativa.ilustracao`) guardam o **nome de um ícone do `MaterialCommunityIcons`** (ex.: `"home"`), nunca emoji, até as imagens do passo 8 (`urlImagem`).
- Texto do aluno com no mínimo `fontes.corpo` (20). Títulos e enunciados maiores.
- Poucos elementos por tela, uma ação principal clara (RNF05, RNF07).
- Mensagens curtas, positivas e sem jargão: "Muito bem!", "Vamos tentar de novo?" (RNF06, RNF15). Nunca "Erro", "Inválido", "Falha".
- Use `accessibilityRole` e `accessibilityLabel` em elementos tocáveis.
- Interface, textos, nomes de variáveis de domínio e comentários em **português**.

## Registro do andamento dos passos

Em `docs/PROXIMOS_PASSOS.md`: passo **concluído** (✅) = apagar o prompt, "Prazo" e "Pronto quando" e deixar um parágrafo "**Feito em DD/MM.**" com o que foi feito, o que mudou e observações (modelo: Passo 1). Passo **parcial** (🟡) = acrescentar "O que falta / o que fazer" e, se necessário, um prompt novo só com o que falta.

## Regras de código

- React Compiler está ligado: **não mute objetos de estado** (ex.: `aluno.idNivelAtual = 2`). Crie um objeto novo e atualize via `entrar(...)` da sessão — veja `services/alunos.ts`.
- Navegação: `router`, `Link`, `Redirect`, `useLocalSearchParams` de `expo-router`. Rotas dinâmicas no formato objeto: `router.push({ pathname: "/aluno/atividade/[id]", params: { id } })`.
- Áreas protegidas: o `_layout.tsx` de `aluno/` e `professor/` redireciona quem não tem o perfil certo.
- Marque o que é provisório com `// TODO:` explicando o que falta.
- Nenhuma senha, token ou chave no código. Variáveis em `.env.local` (ignorado pelo git).
- Senha: só o servidor vê, e guarda o hash (scrypt, `server/db/senha.mjs`). O app guarda só o token (`services/armazenamento.ts`, `expo-secure-store`). Nunca envie `senhaHash` para o app. Contas de aluno: `services/contasAlunos.ts` ↔ `server/src/rotas/professorAlunos.ts`.

## Banco de dados (SQLite)

Arquivo: `server/data/ajai.db`. Acesso por `node:sqlite` (Node 22.18+), **sem instalar nada**. Tudo se faz pelos scripts npm; não precisa do programa `sqlite3`.

| Para... | Comando |
|---|---|
| Criar/recriar o banco do zero com os dados de demonstração | `npm run db:reset` |
| Ver tabelas e contagem de linhas | `npm run db:query` |
| Consultar (use `--json` para ler a saída) | `npm run db:query -- --json "SELECT ..."` |
| Alterar dados (precisa de `--escrever`) | `npm run db:query -- --escrever "UPDATE ..."` |
| Aplicar migrações novas | `npm run db:migrate` |
| Recarregar só os dados | `npm run db:seed` |

Regras para agentes:
- **Mudou a estrutura?** Crie `server/db/migrations/00N_descricao.sql` e rode `npm run db:migrate`. **Nunca edite uma migração já aplicada** e nunca use `db:query` para `CREATE/ALTER/DROP` (o script recusa).
- **Mudou os dados de exemplo?** Edite `src/data/mock.ts` (é a fonte do seed) e rode `npm run db:seed`. Depois de mudar o esquema, atualize também `src/domain/modelos.ts`.
- Nomes de tabela e coluna são os do diagrama de classes (`Usuario`, `Atividade`, `HistoricoNivel`...). `Aluno.idNivelAtual` não é coluna: use a view `vw_aluno`.
- Antes de qualquer `UPDATE`/`DELETE` em massa, rode o `SELECT` equivalente e mostre o resultado. Em dúvida, `db:reset` é seguro: o banco é local e descartável.
- **Nunca** versione o `.db`, nem coloque segredo ou senha real no seed. Chaves de API ficam em `server/.env` (ignorado pelo git).
- Instale dependências (`npm install`) sempre na máquina de quem vai rodar o projeto; `node_modules` de outro sistema operacional quebra os módulos nativos.

## Narração por voz (`ProvedorVoz`)

O app **não pode depender de uma API de voz específica**. Regras:
- Telas e componentes só chamam `falar()` / `pararFala()` de `@/services/narracao`.
- Quem fala é o provedor ativo de `src/services/voz/index.ts` (`PROVEDOR_PADRAO`). Cada provedor implementa `ProvedorVoz` (`nome`, `falar`, `parar`) em um arquivo próprio (`provedorExpoSpeech.ts`, `provedorServidor.ts`...).
- **Trocar de voz = criar o provedor, registrá-lo em `index.ts` e mudar `PROVEDOR_PADRAO`.** Se uma troca exigir mexer em tela ou em `BotaoAudio`, a abstração foi violada: corrija o provedor, não a tela.
- Provedores do app: `servidor` (padrão: toca áudio gerado com Piper) e `expo-speech` (alternativa e reserva quando o servidor falha). O Piper só roda no servidor/geração, nunca no celular.
- No servidor, a mesma ideia: interface `SintetizadorVoz`, um arquivo por serviço (Piper primeiro; Google, Polly... se um dia forem necessários), escolhido por variável de ambiente; resultado em `AudioCache` (tabela, com a coluna `provedor`) e `server/storage/audio/`.
- Chaves de API só em `server/.env`, nunca no app (`EXPO_PUBLIC_*` vai para dentro do aplicativo e é público).

## Expo mudou — não confie na memória

O Expo muda APIs a cada SDK. Antes de usar uma API do Expo/React Native:

1. Veja a versão de `expo` no `package.json` (hoje 58).
2. Consulte a documentação daquela versão: `https://docs.expo.dev/versions/v58.0.0/`
3. Para o resto, use o índice `https://docs.expo.dev/llms.txt` e siga para a página específica.

## Comandos

```bash
npm install                 # instalar dependências
npx expo start              # rodar (a: Android, i: iOS, w: web)
npx expo start -c           # rodar limpando cache
npx expo install <pacote>   # SEMPRE use isto para adicionar bibliotecas
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnosticar configuração
npm run db:reset            # recriar o banco SQLite com os dados de demonstração
npm run db:query            # tabelas e contagens (aceita SQL: ver seção Banco de dados)
npm run server:dev          # sobe a API (GET http://localhost:3333/health)
npm run typecheck           # tipos do app + servidor
npm test                    # testes do servidor (node --test; banco temporário)
```

Antes de dizer que uma tarefa terminou: rode **lint, typecheck e `npm test`** (e `npm run db:reset` se mexeu em banco ou seed) e abra o fluxo afetado no app (usuários de demonstração no README, senha `demo1234`; o servidor precisa estar rodando).

## Regras do Expo

- `ios/` e `android/` são gerados (Continuous Native Generation). Não crie nem edite à mão; configure em `app.json`.
- O Expo Go só tem os módulos nativos dele. Biblioteca com código nativo fora do Expo Go exige development build (`npx expo run:android|ios` ou `eas build --profile development`).
- Prefira módulos oficiais do Expo (ex.: `expo-speech`, `expo-secure-store`, `expo-font`) a bibliotecas de terceiros.
- Build e publicação na nuvem com EAS: `npx eas-cli@latest build`. Docs: https://docs.expo.dev/eas/index.md

## Definição de pronto (Kanban: A Fazer → Em Desenvolvimento → Em Teste → Concluído)

Uma tarefa só vai para **Concluído** quando:
1. Atende ao RF/RNF correspondente (cite o número no PR).
2. Segue a tela do Figma (ou a tela nova foi aprovada pelo UX/UI).
3. Passa nas regras de acessibilidade acima.
4. Lint e typecheck sem erros.
5. Foi testada por outra pessoa da equipe (quem não escreveu o código).
6. A seção **Pendências** do README foi atualizada.
