# Próximos passos do AJAI (04/11 → entrega 17/11)

Roteiro do que falta até a entrega, **na ordem em que deve ser feito**. Cada passo tem responsável sugerido, prazo, dependências, critério de pronto e um **prompt pronto para colar** num assistente de IA (Claude, Copilot, Cursor...) aberto na pasta do projeto.

> Como usar os prompts
> 1. Abra o assistente **na raiz do repositório** (para ele ler `AGENTS.md`, `README.md` e o código).
> 2. Cole o prompt do passo inteiro. Os trechos entre `<...>` você preenche antes.
> 3. Revise o que ele fizer, rode `npx expo lint` e `npx tsc --noEmit`, teste no celular e só então faça commit.
> 4. Ao terminar, marque o passo aqui ✅ e atualize a seção **Pendências** do README.

Legenda: ⬜ a fazer · 🟡 em andamento · ✅ feito

## Visão geral

| # | Passo | Responsável sugerido | Prazo | Depende de |
|---|---|---|---|---|
| 0 | Instalar e validar o esqueleto | Daphne / Maria Carla | 05/11 | — |
| 1 | Decidir backend, banco e voz (registrar decisão) | Isabel + devs | 05/11 | — |
| 2 | Criar o servidor e o banco (13 tabelas + dados iniciais) | Daphne | 07/11 | 1 |
| 3 | Cadastro e login de verdade | Maria Carla | 08/11 | 2 |
| 4 | Atividades e níveis vindos da API | Daphne | 09/11 | 2 |
| 5 | Respostas, progressão e histórico no servidor | Daphne / Maria Carla | 10/11 | 3, 4 |
| 6 | Narração por voz e preferências de acessibilidade | Maria Carla | 10/11 | 1 |
| 7 | Conteúdo pedagógico completo | Isabel + Brenno | 10/11 | 4 |
| 8 | Telas e recursos visuais que faltam no Figma | Brenno | 11/11 | — (começar já) |
| 9 | Home do aluno: ofensiva, frequência e tela de progresso | Maria Carla | 12/11 | 5, 8 |
| 10 | Área do professor completa | Daphne | 13/11 | 5, 8 |
| 11 | Cadastro de atividades e níveis (administrador) | Isabel + devs | 13/11 | 2 |
| 12 | Testes automatizados | Giovanna + devs | 13/11 | 5 |
| 13 | Segurança e privacidade (LGPD) | Isabel | 13/11 | 3 |
| 14 | Testes integrados e de usabilidade | Giovanna | 15/11 | 9, 10 |
| 15 | Correção de bugs e polimento | Todos | 16/11 | 14 |
| 16 | Documentação final (PDF, APF, README) | Giovanna + Isabel | 16/11 | 15 |
| 17 | Preparar a apresentação e a demo | Todos | 17/11 | 16 |

Sprints da documentação: **Sprint 3** vai até 10/11 (passos 0–7), **Sprint 4** de 10/11 a 17/11 (passos 8–17). Os passos 0 a 2 estão atrasados em relação ao cronograma original (eram da Sprint 1) e são os mais urgentes.

---

## ⬜ Passo 0 — Instalar e validar o esqueleto

**Prazo:** 05/11 · **Responsável:** Daphne ou Maria Carla
**Pronto quando:** `npm install`, `npx expo lint` e `npx tsc --noEmit` passam sem erro e o fluxo de demonstração abre no celular (aluno: login → atividade → acerto; professor: dashboard → métricas).

```text
Leia AGENTS.md e README.md. O esqueleto em src/ foi escrito sem conseguir instalar
as dependências, então nunca foi compilado de verdade.

1. Rode `npm install`, depois `npx expo lint` e `npx tsc --noEmit`.
2. Corrija todos os erros de tipo e de lint SEM mudar o comportamento das telas.
   Atenção a: rotas tipadas do Expo Router (typedRoutes), props do Tabs
   (sceneStyle, href: null) e tipos de useLocalSearchParams. Confira na documentação
   do SDK 58 (https://docs.expo.dev/versions/v58.0.0/) antes de mudar qualquer API.
3. Rode `npx expo-doctor` e resolva o que ele apontar com `npx expo install --fix`.
4. Me diga como testar no Expo Go e liste qualquer coisa que você teve de mudar.
Não adicione bibliotecas novas neste passo.
```

---

## ⬜ Passo 1 — Decidir backend, banco e voz

**Prazo:** 05/11 · **Responsável:** Isabel (decide) com Daphne e Maria Carla
**Pronto quando:** existe `docs/decisoes/ADR-001-stack.md` com a escolha de servidor, banco, hospedagem e narração por voz, e a equipe concordou.

```text
Leia AGENTS.md, README.md (seção Pendências) e src/domain/modelos.ts.
Preciso decidir a stack de backend do AJAI. Restrições:
- entrega final em 17/11/2026, equipe de 2 devs com pouca experiência em backend;
- custo R$ 0 (planos gratuitos), a documentação prevê Node.js + TypeScript;
- 13 entidades do diagrama de classes (ver modelos.ts), autenticação com 2 perfis
  (aluno e professor) + administrador;
- o app é Expo SDK 58 e precisa funcionar no Expo Go para a demonstração.

Compare no máximo 3 opções realistas, por exemplo:
(a) Node.js + Fastify/Express + Prisma + PostgreSQL (Neon/Render/Railway grátis),
(b) Node.js + Prisma + SQLite local só para a demo,
(c) Supabase (Postgres + Auth prontos).
Para cada uma: tempo estimado até ter login + CRUD funcionando, risco, custo, e se
atende ao requisito de usar Node.js descrito na documentação.

Faça o mesmo para a narração por voz: expo-speech (voz do aparelho) versus API externa
de TTS com cache (ServicoTTS + AudioCache do diagrama). Lembre que a Análise de Pontos
de Função conta o ServicoTTS como AIE (5 PF) e o item 44 como SE; diga o que muda
na APF em cada opção.

Escreva a recomendação em docs/decisoes/ADR-001-stack.md (contexto, opções,
decisão, consequências). Deixe o campo "Decisão" com a sua recomendação marcada
como PROPOSTA para a equipe aprovar.
```

---

## ⬜ Passo 2 — Criar o servidor e o banco

**Prazo:** 07/11 · **Responsável:** Daphne · **Depende de:** passo 1
**Pronto quando:** o servidor sobe com um comando, as 13 tabelas existem, há dados iniciais (os mesmos de `src/data/mock.ts`) e o README explica como rodar app + servidor juntos.

```text
Leia AGENTS.md, docs/decisoes/ADR-001-stack.md, src/domain/modelos.ts,
src/data/mock.ts e docs/diagrama-classes.png.

Crie o backend do AJAI na pasta server/ (mesmo repositório), usando a stack decidida
no ADR-001: <colar aqui a decisão>.

1. Projeto Node.js + TypeScript com scripts `dev`, `build`, `start`, `db:migrate`, `db:seed`.
2. Esquema do banco com as 13 tabelas do diagrama (Usuario com perfil; Aluno,
   Professor e Administrador como especialização; Turma; Matricula como classe de
   associação; Nivel; Atividade; Alternativa e AudioCache em composição com Atividade;
   Resposta; DesempenhoConteudo; HistoricoNivel). Mantenha os nomes de campos do
   diagrama. Enums: Perfil, StatusAtividade, TipoAtividade.
3. Seed com exatamente os dados de src/data/mock.ts (níveis, atividades, alunos,
   professor, turma, matrículas, respostas de exemplo).
4. Rota GET /health e tratamento de erro padrão em JSON { erro: string }.
5. Arquivo server/.env.example e instrução no README, seção "Como executar",
   explicando como subir o servidor e como o app encontra a URL
   (EXPO_PUBLIC_API_URL; no celular físico usar o IP da máquina, não localhost).
Não mexa nas telas do app neste passo.
```

---

## ⬜ Passo 3 — Cadastro e login de verdade (RF01, RF02)

**Prazo:** 08/11 · **Responsável:** Maria Carla · **Depende de:** passo 2
**Pronto quando:** cadastrar aluno/professor grava no banco, login devolve token, a sessão sobrevive a fechar e abrir o app, senha nunca trafega nem fica salva em texto puro.

```text
Leia AGENTS.md, src/services/auth.ts, src/context/sessao.tsx, src/app/login.tsx,
src/app/cadastro/* e o código do servidor em server/.

No SERVIDOR:
- POST /auth/cadastro (aluno ou professor; senha com bcrypt/argon2 → senhaHash),
- POST /auth/login (e-mail + senha + perfil → token JWT com idUsuario e perfil),
- GET /auth/eu (dados do usuário do token),
- middleware que exige token e checa perfil.
Mensagens de erro curtas e amigáveis em português.

No APP:
- crie src/services/api.ts (fetch com EXPO_PUBLIC_API_URL, token no header,
  erros convertidos em mensagens simples);
- troque autenticar/cadastrarAluno/cadastrarProfessor para usar a API, mantendo as
  mesmas assinaturas para as telas não mudarem;
- guarde o token com expo-secure-store (instale com `npx expo install expo-secure-store`)
  e restaure a sessão ao abrir o app (mostre a splash enquanto carrega);
- remova o "modo demonstração com e-mail vazio" do login e da tela.
Siga as regras de acessibilidade do AGENTS.md nas mensagens de erro.
Ao final, atualize README (Pendências e "Entrar no app").
```

---

## ⬜ Passo 4 — Atividades e níveis vindos da API

**Prazo:** 09/11 · **Responsável:** Daphne · **Depende de:** passo 2

**Pronto quando:** a trilha de níveis, as atividades e o nivelamento vêm do banco e as telas continuam iguais.

```text
Leia AGENTS.md, src/services/atividades.ts, src/components/AtividadeView.tsx e server/.

No SERVIDOR: GET /niveis (trilha ordenada), GET /niveis/:id/atividades (só ATIVAS,
com alternativas ordenadas), GET /atividades/:id, GET /nivelamento (perguntas do
nivelamento, uma ou mais por nível, em ordem crescente). Todas exigem login.
Nunca envie o campo `correta` das alternativas nem `respostaCorreta` para o app:
a correção passa a ser no servidor (passo 5).

No APP: troque as funções de src/services/atividades.ts para a API (agora assíncronas)
e ajuste as telas para mostrar um estado de carregamento simples ("Carregando...")
e uma mensagem amigável se falhar ("Sem conexão. Toque para tentar de novo.").
Considere usar um hook pequeno useCarregar(fn) em src/hooks/ em vez de biblioteca nova.
Mantenha o mock só como seed do servidor.
```

---

## ⬜ Passo 5 — Respostas, progressão e histórico no servidor (RF12–RF19, RF22)

**Prazo:** 10/11 · **Responsável:** Daphne e Maria Carla · **Depende de:** passos 3 e 4

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

**Prazo:** 10/11 · **Responsável:** Maria Carla · **Depende de:** passo 1

**Pronto quando:** todo botão "Ouvir ajuda / Ouvir instrução" fala em português do Brasil, o aluno pode mudar a velocidade da voz e o tamanho da letra, e a preferência fica salva.

```text
Leia AGENTS.md, src/services/narracao.ts, src/components/BotaoAudio.tsx,
docs/decisoes/ADR-001-stack.md e src/domain/modelos.ts (Aluno.vozPreferida,
velocidadeVoz, tamanhoFonte).

Implemente falar() e pararFala() conforme a decisão do ADR-001:
<expo-speech | API de TTS com AudioCache>.
- Voz pt-BR; respeite Aluno.velocidadeVoz; tocar de novo interrompe a fala anterior;
  sair da tela para a fala.
- Mostre no BotaoAudio um estado "Falando..." enquanto toca (com texto, não só ícone).
- Nas telas de atividade, leia também as alternativas quando o aluno tocar e segurar
  uma delas (onLongPress), sem selecionar.
- Crie a tela /aluno/preferencias (Aluno.EditarPreferencias): velocidade da voz
  (lenta / normal / rápida) e tamanho da letra (normal / grande / muito grande), com
  botões grandes e um botão "Ouvir exemplo". Salve no servidor (PATCH /alunos/eu).
- Aplique tamanhoFonte nos componentes de texto (Titulo, Corpo, AtividadeView) por
  meio de um contexto, sem espalhar ifs pelas telas.
Adicione o acesso às preferências na home do aluno.
```

---

## ⬜ Passo 7 — Conteúdo pedagógico completo (RF04–RF11)

**Prazo:** 10/11 · **Responsável:** Isabel (conteúdo) + Brenno (imagens) · **Depende de:** passo 4

**Pronto quando:** cada um dos 5 níveis tem pelo menos 6 atividades revisadas pela equipe (idealmente por um dos profissionais da EJA da pesquisa), cobrindo letra-som, cotidiano e interpretação de texto, e o seed do servidor foi atualizado.

```text
Leia AGENTS.md, src/domain/modelos.ts (TipoAtividade) e o seed do servidor.

Preciso do banco de atividades do AJAI para jovens, adultos e idosos em alfabetização
(EJA). Público adulto: NADA infantilizado; use situações do cotidiano (ônibus, mercado,
remédio, conta de luz, documento, placa de rua, receita, mensagem no celular).

Gere, em formato do seed do servidor, pelo menos 6 atividades por nível:
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
descrição) para o Brenno produzir.
Depois de revisado pela equipe: <colar aqui as correções> e atualize o seed.
```

---

## ⬜ Passo 8 — Telas e recursos visuais que faltam (UX/UI)

**Prazo:** 11/11 · **Responsável:** Brenno · **Pode começar já**

**Pronto quando:** o Figma tem as telas que faltam, os ícones e imagens foram exportados para `assets/`, a fonte Inter está carregada e o ícone/splash do app são do AJAI.

Telas a desenhar no Figma: progresso do aluno, preferências de acessibilidade, relatórios do professor, conta do professor, gestão de turma (criar turma, vincular aluno), correção manual de resposta, recuperação de senha, estados "carregando" / "sem internet" / "nível sem atividades" / "subiu de nível".

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
4. Substitua os emojis provisórios (🔊, 📖, ícones das abas, ilustrações das
   alternativas) pelos ícones/imagens exportados em assets/ (<listar arquivos>).
5. Configure ícone do app, ícone adaptativo do Android e splash em app.json com os
   arquivos <listar arquivos>.
6. Implemente as telas novas desenhadas: <listar frames/links>.
Mantenha as regras de acessibilidade do AGENTS.md.
```

---

## ⬜ Passo 9 — Home do aluno: ofensiva, frequência e progresso (RF15, RF18, RF19)

**Prazo:** 12/11 · **Responsável:** Maria Carla · **Depende de:** passos 5 e 8

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

**Prazo:** 13/11 · **Responsável:** Daphne · **Depende de:** passos 5 e 8

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
- CRUD de turma e POST/DELETE de matrícula (vincular aluno por e-mail ou código);
- PATCH /respostas/:id/correcao (correção manual: muda `correta`, grava
  correcaoProfessor e recalcula DesempenhoConteudo).

No APP: seletor de período (Últimos 7 dias / 30 dias / personalizado), gráfico de
evolução simples (barras com View, sem biblioteca, ou react-native-svg via
`npx expo install` se necessário), aba Relatórios, gestão de turma na aba Conta,
correção manual na tela de métricas. Recarregue os dados ao focar a aba
(useFocusEffect). Mostre o aviso "Os dados complementam a avaliação do professor".
```

---

## ⬜ Passo 11 — Cadastro de atividades e níveis (administrador, APF 25–31)

**Prazo:** 13/11 · **Responsável:** Isabel decide o formato, devs implementam · **Depende de:** passo 2

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
"Excluir" nunca apaga: muda status para INATIVA. Valide que toda atividade tem
exatamente uma alternativa correta.
```

---

## ⬜ Passo 12 — Testes automatizados

**Prazo:** 13/11 · **Responsável:** Giovanna com apoio dos devs · **Depende de:** passo 5

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
   resposta não expõe a alternativa correta antes de responder;
7. um teste de tela: tocar na alternativa certa leva à tela "Muito bem!".
Gere também docs/testes/casos-de-teste.md com os casos manuais dos fluxos principais
(cadastro, login, nivelamento, atividade, progressão, área do professor) no formato
ID | pré-condição | passos | resultado esperado | resultado obtido.
```

---

## ⬜ Passo 13 — Segurança e privacidade (RNF11, RNF12, LGPD)

**Prazo:** 13/11 · **Responsável:** Isabel (texto) + devs (revisão) · **Depende de:** passo 3

**Pronto quando:** há termo de uso e privacidade em linguagem simples (com áudio), o app pede só os dados necessários e o checklist abaixo foi revisado.

```text
Leia AGENTS.md, src/domain/modelos.ts, src/app/cadastro/* e server/.
Faça uma revisão de segurança e privacidade do AJAI e corrija o que for simples:
- senhas só com hash; JWT com expiração; segredo em variável de ambiente;
- nenhuma chave/segredo no repositório (procure no histórico do git também);
- todas as rotas checam perfil e posse do dado (aluno só vê o próprio; professor só
  os alunos das suas turmas);
- validação de entrada no servidor; limite de tentativas de login;
- dados coletados: confirme que cada campo é necessário (ex.: dataNascimento é
  usado para quê?). Proponha remover o que não for.
Escreva docs/privacidade.md: termo de uso e privacidade em linguagem MUITO simples
(frases curtas, para quem está aprendendo a ler), dizendo que dados coletamos, por
quê, quem vê (o professor vinculado) e como pedir para apagar. Adicione no cadastro
um aceite "Li e concordo" com botão de ouvir o termo.
Liste o que ficou pendente.
```

---

## ⬜ Passo 14 — Testes integrados e de usabilidade

**Prazo:** 15/11 · **Responsável:** Giovanna (conduz), Brenno (observa a interface) · **Depende de:** passos 9 e 10

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

**Prazo:** 16/11 · **Responsável:** todos · **Depende de:** passo 14

**Pronto quando:** não há bug crítico ou alto aberto, `lint`, `tsc` e `npm test` passam, e o app roda do zero seguindo só o README.

```text
Leia AGENTS.md e a lista de problemas abaixo (testes integrados + usabilidade):
<colar lista priorizada>
Corrija na ordem de gravidade, um commit por problema, citando o ID do problema.
Não adicione funcionalidades novas. Depois:
- rode lint, typecheck e testes;
- siga o README do zero numa pasta limpa (clone → install → servidor → app) e
  corrija qualquer passo que não funcione;
- procure TODOs no código (`grep -rn TODO src server`) e, para cada um, resolva ou
  mova para a seção "Trabalhos futuros" do README.
```

---

## ⬜ Passo 16 — Documentação final

**Prazo:** 16/11 · **Responsável:** Giovanna + Isabel · **Depende de:** passo 15

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

**Prazo:** 17/11 · **Responsável:** todos

**Pronto quando:** há slides, um roteiro de demo ensaiado de no máximo 5 minutos, o app instalado em pelo menos 2 celulares com dados preparados, e um vídeo de backup gravado.

```text
Leia README.md, docs/** e a documentação final.
Prepare a apresentação final do AJAI (<N> minutos no total, 5 integrantes):
1. Estrutura dos slides: problema (dados IBGE), pesquisa com profissionais da EJA e o
   que ela mudou no produto, solução, demonstração, métricas para o professor,
   gestão do projeto (Scrum + Kanban, APF, custos, riscos), resultados dos testes de
   usabilidade, limitações e próximos passos. Indique quem fala cada parte.
2. Roteiro da demo ao vivo (máx. 5 min): aluno novo → cadastro → nivelamento →
   atividade com áudio → erro e "tentar de novo" → acerto → sobe de nível;
   professor → dashboard → aluno com dificuldade → métricas.
   Liste os dados que precisam estar preparados no banco antes.
3. Plano B: o que fazer se a internet cair (vídeo gravado, servidor local).
4. Prováveis perguntas da banca e respostas curtas.
```

---

## Depois da entrega (trabalhos futuros)

Fora do escopo do MVP pela documentação, mas bons próximos passos se o projeto continuar: gamificação simples, recomendação de atividades por dificuldade, modo offline com sincronização, publicação nas lojas com EAS, versão web para o professor, validação pedagógica com uma turma real da EJA.
