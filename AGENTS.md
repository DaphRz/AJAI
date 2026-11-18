# AGENTS.md – AJAI

Instruções para agentes de IA (Claude, Copilot, Cursor etc.) e para quem chega agora no código.
Leia também o [README](README.md), principalmente a seção **Pendências** e o roteiro [`docs/PROXIMOS_PASSOS.md`](docs/PROXIMOS_PASSOS.md). O `CLAUDE.md` importa esses arquivos para o Claude Code a cada sessão.

## Contexto do produto

AJAI é um app mobile de alfabetização para **jovens, adultos e idosos** (público da EJA), muitos com pouca leitura e pouca familiaridade com celular. Tem duas áreas principais (aluno e acompanhamento), mais a instituição e o administrador:

- **Contas (Passo 3.1):** perfis `ALUNO`, `PROFESSOR`, `RESPONSAVEL`, `INSTITUICAO` e `ADMINISTRADOR`. Os quatro primeiros **criam a própria conta** (`/cadastro` → "Eu sou:"); o administrador só existe por seed/script. O login tem um campo só (usuário, e-mail ou telefone) e o perfil vem da conta. **Todos trocam a própria senha**; esqueceu, o administrador gera uma provisória (vale para todos).
  - **Aluno:** nome, senha e pelo menos um entre **nome de usuário** (sugerido a partir do nome, ex.: `maria.silva`), e-mail ou telefone. Entra por qualquer um deles.
  - **Instituição** (escola/ONG): nome, CNPJ (dígitos validados), nome do responsável, e-mail, telefone e senha. Fica **PENDENTE** até o administrador aprovar no app; ao aprovar, ganha um **código** de 6 caracteres.
  - **Professor:** e-mail, telefone e o **código da instituição**. Fica **PENDENTE** até a instituição aprovar; recusado, informa outro código.
  - **Responsável** (familiar): e-mail e telefone; sem código e sem turma; acompanha **no máximo 2** pessoas.
  - Conta pendente ou recusada entra, mas só vê `/espera`; as rotas restritas devolvem 403 (`exigirContaLiberada`). A situação vem em `usuario.situacao` (login e `/auth/eu`).
  - **Vínculo** (`Vinculo`): professor aprovado ou responsável convida o aluno pelo usuário, e-mail ou telefone; o aluno aceita ou recusa em "Quem me acompanha". **Só com vínculo ACEITO** o acompanhante vê dados do aluno (`temVinculoAceito`). Aluno e acompanhante podem desfazer.
- **Aluno:** nivelamento inicial → atividades graduais (letra, sílaba, palavra, frase, escrita, interpretação) → correção imediata → progressão de nível → histórico.
- **Professor:** acompanha frequência, taxa de acerto, nível e conteúdos de maior dificuldade dos alunos com vínculo aceito; turmas e métricas detalhadas (período, gráfico, relatórios por turma, correção manual) são só dele (passo 8, feito). Também **cadastra atividades** (incluir, editar e inativar as que ele criou; passo 9, feito: `/gestao/*` e Conta › Atividades; níveis continuam só do administrador). O app **complementa** o professor, não o substitui.
- **Responsável:** vê as (até 2) pessoas que acompanha e algumas recomendações (`GET /responsavel/recomendacoes`, passo 8; sem turma nem métricas detalhadas).
- **Instituição:** mostra o código e aprova ou recusa os professores dela. **Administrador:** aprova ou recusa instituições.

Fontes de verdade, nesta ordem:
1. Requisitos RF01–RF22 e RNF01–RNF15 da documentação do projeto (PDF).
2. Diagrama de classes (`docs/diagrama-classes.png`), espelhado em `src/domain/modelos.ts`.
3. Protótipo no Figma: https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI (15 telas).
4. Planilha APF_AJAI.xlsx (nomes das funções no padrão Incluir/Editar/Excluir/Listar/Visualizar).

**Fora do escopo do MVP** (não implemente): gamificação complexa, recomendação avançada, IA para avaliar escrita, integração com sistemas do governo, diagnóstico clínico, versão desktop como prioridade.

## Stack

- Expo **SDK 58**, React Native, React 19, TypeScript estrito, React Compiler ligado (`app.json › experiments.reactCompiler`).
- Expo Router (rotas por arquivo em `src/app/`), typed routes ligado.
- **Banco: SQLite em arquivo** (`server/data/ajai.db`), já criado com as 16 tabelas e seed (ver [Banco de dados](#banco-de-dados-sqlite)).
- **API:** Node.js + TypeScript com **Fastify** em `server/src/` (`npm run server:dev`). Validação de entrada com esquemas JSON em **toda** rota; erros sempre `{ erro: string }` em português (lance `ErroApi` de `server/src/erros.ts`). O app chama a API **só** por `src/services/api.ts` (`chamarApi`, token no cabeçalho, erros já em mensagem amigável); login, cadastro, senha, instituições e vínculos vêm da API (passos 3 e 3.1); níveis, atividades e nivelamento também (passo 4, **sem gabarito**: a correção é do servidor); respostas, progressão e histórico também (passo 5: `POST /respostas`, `POST /nivelamento/concluir`, `GET /alunos/eu/progresso`). Área do professor e do responsável também (passo 8: `/professor/*`, `/respostas/:id/correcao`, `/responsavel/recomendacoes`); cadastro de atividades e níveis também (passo 9: `/gestao/*`, **com gabarito**, só administrador e professor aprovado; regras do gabarito em `server/src/validarAtividade.ts`); **nenhuma tela lê mais o `src/data/mock.ts`** (ele só alimenta o seed). Tela que recarrega ao voltar à aba: `useVersaoAoFocar` + `useCarregar(..., chave, { manterAnterior: true })`. Tela que espera a API: `useCarregar` (`src/hooks/`) + componente `Carregando`. Rota que exige login: `preHandler: exigirLogin("ALUNO")` de `server/src/autenticacao.ts` (`req.user` = `{ idUsuario, perfil }`); rota de professor ou instituição usa `exigirContaLiberada(...)` (também exige a conta aprovada). Rota que mostra dado de aluno a um acompanhante confere `temVinculoAceito` (`server/src/rotas/vinculos.ts`).
- O servidor roda `.ts` direto no Node (type stripping): **sem `enum`/`namespace`** e imports relativos **com `.ts`** (ex.: `import { banco } from "../banco.ts"`). Rota nova = arquivo em `server/src/rotas/` registrado em `server/src/app.ts`. Typecheck do servidor: `npm run server:typecheck` (`npm run typecheck` faz app + servidor).
- **Voz trocável**: o app usa a interface `ProvedorVoz` (`src/services/voz/`). A API de voz é a **Azure AI Speech** (passo 10, desde 18/11: voz neural `pt-BR-FranciscaNeural`, gerada no servidor com chave em `server/.env`); `expo-speech` como alternativa e reserva. O Piper ficou só como alternativa local (`VOZ_PROVEDOR=piper`). Ver [Narração por voz](#narração-por-voz-provedorvoz).

## Arquitetura e onde colocar cada coisa

| Pasta | Responsabilidade |
|---|---|
| `src/app/` | **Só telas** e layouts. Toda lógica de regra vai para `services/`. Arquivos fora de rota não ficam aqui. |
| `src/components/` | Componentes visuais reutilizáveis (`Tela`, `Botao`, `BotaoAudio`, `Campo`, `AtividadeView`...). |
| `src/services/` | Regras de negócio e acesso a dados. Nomes seguem o diagrama/APF: `incluirResposta`, `corrigirAutomaticamente`, `visualizarPainel`... Quando o backend existir, **só esta pasta muda**. |
| `server/src/progressao.ts` | Funções **puras** (sem I/O, sem imports) de nivelamento, progressão, dificuldades e próxima atividade, com testes (`npm test`). Regra nova vai aqui (inclusive a situação EM_DIA/ATENCAO/REFORCO e as recomendações do responsável, passo 8). |
| `src/domain/modelos.ts` | Tipos do diagrama de classes. Mudou o diagrama? Mude aqui também. |
| `src/data/mock.ts` | Dados de demonstração: **só o seed** (`server/db/seed.mjs`) lê. O app não importa mais. |
| `src/theme/tokens.ts` | Cores, fontes (`familias` = Inter), tamanhos, cantos e margens do Figma. **Não use cor ou tamanho "solto"** nas telas. |
| `src/services/narracao.ts` + `src/services/voz/` | Fachada de voz (`falar`/`pararFala`) e provedores (`ProvedorVoz`). **Telas nunca importam um provedor direto.** |
| `server/src/` | API Fastify: `app.ts` (plugins e rotas), `banco.ts` (conexão `node:sqlite`, use `banco()`), `config.ts` (`server/.env`), `erros.ts`, `rotas/*.ts`. |
| `server/db/` | Banco SQLite: `migrations/*.sql` (esquema), `seed.mjs` (dados iniciais, lê `src/data/mock.ts`), scripts `db:*`. |
| `server/data/` | Arquivo do banco. **Ignorado pelo git**; nunca versionar. |
| `assets/fonte/` | Vetor do símbolo do AJAI (Figma) e o script que gera ícone, ícone adaptativo, splash, favicon e `simbolo.png` (`python3 assets/fonte/gerar-icones.py assets/images`). |
| `server/storage/audio/` | MP3 da narração (Azure). **Versionados** desde 18/11, para quem clona ouvir a voz sem a chave: o servidor acha o arquivo pelo nome (hash do texto + voz + velocidade + provedor). Gerou áudio novo com `npm run voz:preparar`? Faça commit dos MP3. |

## Regras obrigatórias de acessibilidade (o público depende disso)

- Toda tela do **aluno** tem um `BotaoAudio` ("Ouvir ajuda"/"Ouvir instrução") com o texto da tela (RNF04). **Exceção:** as telas de login e cadastro **não** têm "Ouvir ajuda".
- Botões com **texto escrito**, nunca só ícone (RNF03). Área de toque ≥ `toqueMinimo` (64).
- **Não use emojis** na interface (nem como ícone, ilustração ou enfeite). Use ícones de biblioteca: **`@expo/vector-icons`** (padrão; instale com `npx expo install @expo/vector-icons`; Ionicons, MaterialIcons, Feather...) ou `lucide-react-native`. O `react-icons` **não serve**: é só para web (DOM) e não roda no React Native. Ícone decorativo ao lado de texto: `accessibilityElementsHidden` / `importantForAccessibility="no"`. Os emojis provisórios já saíram (09/11). Figuras das atividades: `urlImagem` (endereço completo da imagem) tem prioridade; sem ela, `Alternativa.ilustracao` guarda o **nome de um ícone do `MaterialCommunityIcons`** (ex.: `"home"`), nunca emoji.
- **Fonte Inter**: cada peso é uma família. Em estilo de texto use `fontFamily: familias.regular | seminegrito | negrito | extranegrito | preto` (de `src/theme/tokens.ts`), **nunca `fontWeight`** (no Android ele não escolhe o arquivo da fonte e o texto sai na fonte do sistema). Estilo que só muda cor/tamanho por cima de outro não leva `fontFamily`, senão anula o peso do estilo de base.
- Texto do aluno com no mínimo `fontes.corpo` (20). Títulos e enunciados maiores. O aluno pode aumentar a letra (passo 10): em tela do aluno e componente compartilhado, estilos com fonte usam `const criarEstilos = (fontes: Fontes) => StyleSheet.create({...})` + `const styles = useEstilos(criarEstilos)` (`src/context/preferencias.tsx`), nunca `fontes.*` direto num `StyleSheet` fixo.
- Poucos elementos por tela, uma ação principal clara (RNF05, RNF07).
- Mensagens curtas, positivas e sem jargão: "Muito bem!", "Vamos tentar de novo?" (RNF06, RNF15). Nunca "Erro", "Inválido", "Falha".
- Use `accessibilityRole` e `accessibilityLabel` em elementos tocáveis.
- Interface, textos, nomes de variáveis de domínio e comentários em **português**.

## Registro do andamento dos passos

Em `docs/PROXIMOS_PASSOS.md`: passo **concluído** (✅) = apagar o prompt, "Prazo" e "Pronto quando" e deixar um parágrafo "**Feito em DD/MM.**" com o que foi feito, o que mudou e observações (modelo: Passo 1). Passo **parcial** (🟡) = acrescentar "O que falta / o que fazer" e, se necessário, um prompt novo só com o que falta.

## Regras de código

- React Compiler está ligado: **não mute objetos de estado** (ex.: `aluno.idNivelAtual = 2`). Crie um objeto novo e atualize via `entrar(...)` da sessão — veja `services/alunos.ts`.
- Navegação: `router`, `Link`, `Redirect`, `useLocalSearchParams` de `expo-router`. Rotas dinâmicas no formato objeto: `router.push({ pathname: "/aluno/atividade/[id]", params: { id } })`.
- **Abas (SDK 58):** tela escondida das abas com `href: null` **redireciona para a primeira aba**. Não use isso: tela que não é aba fica fora do grupo de abas. Modelo: `professor/_layout.tsx` (Stack + proteção) com as abas em `professor/(abas)/_layout.tsx` e as telas internas (`aluno/[id]`, `alunos`, `senha`) em `professor/`.
- Áreas protegidas: o `_layout.tsx` de `aluno/`, `professor/`, `responsavel/`, `instituicao/` e `admin/` usa `useAreaProtegida(perfil)` (`src/hooks/`), que manda quem não tem o perfil certo para a área dele e quem ainda não foi aprovado para `/espera`.
- Marque o que é provisório com `// TODO:` explicando o que falta.
- Nenhuma senha, token ou chave no código. Variáveis em `.env.local` (ignorado pelo git).
- Senha: só o servidor vê, e guarda o hash (scrypt, `server/db/senha.mjs`). O app guarda só o token (`services/armazenamento.ts`, `expo-secure-store`). Nunca envie `senhaHash` para o app. Cadastro e login: `services/auth.ts` ↔ `server/src/rotas/auth.ts`; instituições: `services/instituicoes.ts` ↔ `rotas/instituicoes.ts`; vínculos: `services/vinculos.ts` ↔ `rotas/vinculos.ts`.
- Segurança e privacidade (passo 12, [`docs/privacidade.md`](docs/privacidade.md)): o token leva `versao` (= `Usuario.versaoToken`); **toda troca de senha sobe `versaoToken`** (derruba os outros aparelhos) e devolve um token novo. Senha provisória marca `Usuario.senhaProvisoria`: o app manda para `/trocar-senha` e o `exigirLogin` recusa (403) as rotas que não usam `exigirLoginComSenhaProvisoria`. Cadastro novo exige `aceitouTermos: true`; mudou o termo? Mude `docs/privacidade.md`, `src/services/termo.ts` (`TERMO`, `VERSAO_TERMO`) e `VERSAO_TERMOS` em `rotas/auth.ts`. Texto narrado vai para a Azure e fica no `AudioCache`: **nunca narre e-mail, telefone ou senha**. Pedido para apagar conta: `npm run usuario:apagar`.
- Segurança das contas (Passo 3.1): rotas com senha, código de instituição ou convite usam `limiteSenha`; o cadastro **nunca** cria `ADMINISTRADOR`; antes do aceite, o acompanhante só vê o que ele mesmo digitou (nada do aluno); "aluno não encontrado" e "não é aluno" têm a mesma resposta; a instituição só decide professores dela (outra = 404).

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
- Provedores do app: `servidor` (**padrão**: `POST /narracao` e toca o MP3 gerado pela Azure com o `expo-audio`). Os dois que tocam som chamam `prepararModoAudio()` (`modoAudio.ts`) antes de falar, para tocar com o silencioso do iPhone ligado, `expo-speech` (alternativa e reserva quando o servidor falha) e `console` (desenvolvimento).
- A velocidade do aluno entra pela fachada (`definirPreferenciasFala`, chamada pelo `PreferenciasProvider`): telas chamam só `falar(texto)`. O texto narrado das atividades fica em `src/services/textosNarrados.ts`, usado também pelo `npm run voz:preparar` (precisa ser o mesmo texto para achar o áudio pronto).
- No servidor, a mesma ideia: interface `SintetizadorVoz` (`server/src/voz/`), um arquivo por serviço (`azure.ts`, padrão; `piper.ts`), escolhido por `VOZ_PROVEDOR`; resultado em `AudioCache` (tabela, com a coluna `provedor`) e `server/storage/audio/`. Sem a chave da Azure, `POST /narracao` dá 503 e o app usa a voz do aparelho. `db:reset`/`db:seed` apagam as linhas do `AudioCache`, mas os arquivos continuam valendo (o servidor os acha pelo nome).
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
npm test                    # tudo: servidor (node --test; banco temporário), voz do app (node --test) e telas (jest-expo)
npm run app:test:telas      # só os testes de tela (jest-expo; src/testes/*.test.tsx)
npm run voz:preparar        # gera os áudios das atividades (precisa da chave da Azure; ver README › Narração por voz)
```

Testes de tela: arquivo `src/testes/*.test.tsx` (nunca em `src/app/`, que é só de rotas), com `renderRouter` de `expo-router/testing-library` e a API de mentira por `jest.mock("@/services/api")` (modelo: `src/testes/telaAtividade.test.tsx`). No Testing Library 14, `render` e `fireEvent` são assíncronos: sempre `await fireEvent.press(...)`. Comece o arquivo com `/// <reference types="jest" />` (o TypeScript 6 não carrega `@types/*` sozinho). Casos manuais: `docs/testes/casos-de-teste.md`.

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
