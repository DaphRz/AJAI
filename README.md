# AJAI – Alfabetização para Jovens, Adultos e Idosos

Aplicativo mobile de apoio à alfabetização, complementar à EJA, com área de acompanhamento para professores.
Projeto da disciplina de Gestão de Projetos – Universidade de Vila Velha, 2026 (turma CC6M, equipe 4).

> **Situação em 04/11/2026 (Sprint 3 de 4):** existe um **esqueleto navegável** com as telas do Figma, regras de correção e progressão e dados de demonstração **em memória**. Ainda **não há backend nem banco de dados**: tudo some ao recarregar o app. Veja [Pendências](#pendências).

- Protótipo no Figma: <https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI>
- Diagrama de classes: [`docs/diagrama-classes.png`](docs/diagrama-classes.png)
- Documentação do projeto (PDF) e Análise de Pontos de Função (planilha APF_AJAI.xlsx): com a equipe

---

## Como executar o projeto

### 1. Pré-requisitos

| O quê | Versão | Como conferir |
|---|---|---|
| [Node.js](https://nodejs.org) | 20 LTS ou mais novo (testado com 22) | `node -v` |
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

### 4. Rodar

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

### 5. Entrar no app (modo demonstração)

Não há servidor ainda, então o login aceita os usuários de teste de [`src/data/mock.ts`](src/data/mock.ts):

- **Aluno:** escolha "Aluno", deixe o e-mail **vazio** e toque em Entrar → entra como *Maria Silva*.
- **Professor:** escolha "Professor/ Responsável", deixe o e-mail **vazio** → entra como *Rafael Costa*, com Ana, Bruno e Clara vinculados.
- **Aluno novo:** "Não tem conta? Cadastre-se" → cadastro → nivelamento → home.

### Comandos úteis

```bash
npx expo start -c        # inicia limpando o cache (resolve muita coisa estranha)
npx expo install --fix   # corrige versões incompatíveis com o SDK
npx expo-doctor          # diagnostica problemas de configuração
npx expo lint            # lint
npx tsc --noEmit         # checagem de tipos
npx expo install <pacote>  # SEMPRE use isto para adicionar bibliotecas (não npm install <pacote>)
```

### Problemas comuns

- **"Project is incompatible with this version of Expo Go"** → atualize o Expo Go no celular.
- **QR code não conecta** → mesma Wi-Fi ou `--tunnel`.
- **Erro estranho depois de trocar de branch** → `npx expo start -c`; se não resolver, apague `node_modules` e rode `npm install` de novo.

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
  theme/tokens.ts         Cores, fontes e tamanhos do Figma
docs/diagrama-classes.png
```

### Telas do Figma × código

| Tela no Figma | Rota | Situação |
|---|---|---|
| Splash | `/` | esqueleto |
| Login | `/login` | esqueleto (login de demonstração) |
| Cadastro de aluno | `/cadastro/aluno` | esqueleto – conferir campos com o Figma |
| Cadastro de professor ou responsável | `/cadastro/professor` | esqueleto – conferir campos com o Figma |
| Nivelamento · Pergunta | `/aluno/nivelamento` | esqueleto |
| Nivelamento · Resultado | `/aluno/nivelamento/resultado` | esqueleto |
| Home do aluno | `/aluno` | esqueleto ("Ofensiva" sem cálculo) |
| Reconhecimento / Sílabas / Formar palavra / Ler frase | `/aluno/atividade/[id]` | um componente para todos os tipos |
| Acerto / Tentar novamente | `/aluno/resultado` | esqueleto |
| Dashboard do professor | `/professor` | esqueleto (sem filtro de período) |
| Métricas de Ana Souza | `/professor/aluno/[id]` | esqueleto (sem gráfico) |
| *(sem tela no Figma)* | `/aluno/progresso`, `/professor/relatorios`, `/professor/conta` | provisórias |

---

## Pendências

Legenda: ✅ feito · 🟡 esqueleto/parcial (só no app, com dados em memória) · ⬜ não começado

### Por Sprint (cronograma da documentação, Tabela 5)

**Sprint 1 – Setup, Acesso e Nivelamento (20/10 – 27/10)** — *atrasada*
- ✅ Projeto Expo (React Native + TypeScript) criado e organizado
- ⬜ Configurar o banco de dados
- 🟡 Cadastro e autenticação (RF01, RF02): telas prontas, mas sem servidor, sem senha com hash e sem guardar a sessão
- 🟡 Nivelamento inicial (RF03): fluxo e regra provisória (para no primeiro erro); faltam as perguntas definitivas validadas pela equipe/profissionais da EJA
- ⬜ Testes do fluxo de acesso

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
- ⬜ **Decidir a stack do servidor** (a documentação prevê Node.js) e o banco (ex.: PostgreSQL, SQLite ou um serviço como Supabase/Firebase)
- ⬜ Criar as tabelas do diagrama de classes: Usuario, Aluno, Professor, Administrador, Turma, Matricula, Nivel, Atividade, Alternativa, AudioCache, Resposta, DesempenhoConteudo, HistoricoNivel
- ⬜ API para as funções contadas na APF (Incluir/Editar/Excluir/Listar/Visualizar de cada módulo)
- ⬜ Trocar `src/data/mock.ts` pelas chamadas à API dentro de `src/services/` (as telas não precisam mudar)
- ⬜ Guardar o token de login no aparelho (`expo-secure-store`)

### Funcionalidades previstas na APF sem tela no app nem no Figma
- ⬜ Administrador: incluir/editar/inativar atividades e níveis (APF itens 25–31) — definir se será tela no app, painel web ou carga direta no banco
- ⬜ Professor: criar/editar turma, incluir/excluir aluno da turma (APF 20–24)
- ⬜ Professor: corrigir manualmente uma resposta (APF 35)
- ⬜ Aluno: editar preferências de voz, velocidade e tamanho da fonte (APF 17)
- ⬜ Trocar/recuperar senha (APF 18)

### Acessibilidade e conteúdo
- ⬜ **Narração por voz (RNF04)** — hoje o botão "Ouvir ajuda" só escreve no console. Decidir entre:
  - `expo-speech` (voz do aparelho, grátis e offline), ou
  - API externa de voz humanizada (o `ServicoTTS` do diagrama) com cache (`AudioCache`).
  
  ⚠️ Se a escolha for `expo-speech`, a APF precisa ser revista: o `ServicoTTS` deixa de ser um AIE (−5 PF) e o item 44 muda.
- ⬜ Banco real de atividades (letras, sílabas, palavras, frases, escrita, interpretação, cotidiano), validado com os profissionais da EJA
- ⬜ O enum `TipoAtividade` do diagrama não tem tipos para **letra-som** (RF05) nem **cotidiano** (RF11): incluir ou explicar no documento que entram como `conteudo` de outros tipos
- ⬜ Imagens das alternativas (o Figma usa fotos; o app usa emojis provisórios)
- ⬜ Ícones do Figma (alto-falante, livro, abas) e fonte Inter (`expo-font`)
- ⬜ Ícone do app e splash com a identidade do AJAI (hoje são os do Expo)
- ⬜ Revisar com leitor de tela (TalkBack/VoiceOver) e tamanho de fonte do sistema aumentado

### Qualidade, segurança e privacidade
- ⬜ Testes automatizados (ex.: `jest-expo`), começando por `services/progressao.ts` e `services/respostas.ts`
- ⬜ Senha com hash no servidor e comunicação só por HTTPS (RNF11)
- ⬜ Coletar só o necessário e escrever termo de uso/privacidade (RNF12, LGPD)

### Design (UX/UI)
- ⬜ Telas que faltam no Figma: progresso do aluno, relatórios do professor, conta, gestão de turmas, telas do administrador, preferências de acessibilidade, recuperação de senha, estado "sem atividades/sem internet"

### Documentação
- ⬜ Atualizar a seção 15 (Prototipação) do PDF: ela diz que o protótipo tem 9 telas e que cadastro e nivelamento seriam feitos depois, mas o Figma já tem 15 telas, incluindo cadastro, nivelamento, formar palavra e ler frase
- ⬜ Registrar no documento as decisões de stack (servidor, banco, voz) quando forem tomadas
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

Orientadora: Susiléa Abreu dos Santos Lima. Metodologia: Scrum com Kanban (4 Sprints, quadro no Trello).
