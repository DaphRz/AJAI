# AGENTS.md – AJAI

Instruções para agentes de IA (Claude, Copilot, Cursor etc.) e para quem chega agora no código.
Leia também o [README](README.md), principalmente a seção **Pendências**.

## Contexto do produto

AJAI é um app mobile de alfabetização para **jovens, adultos e idosos** (público da EJA), muitos com pouca leitura e pouca familiaridade com celular. Tem duas áreas:

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
- Ainda **sem backend**: os serviços leem/gravam `src/data/mock.ts` em memória. O servidor previsto é Node.js (stack ainda não decidida).

## Arquitetura e onde colocar cada coisa

| Pasta | Responsabilidade |
|---|---|
| `src/app/` | **Só telas** e layouts. Toda lógica de regra vai para `services/`. Arquivos fora de rota não ficam aqui. |
| `src/components/` | Componentes visuais reutilizáveis (`Tela`, `Botao`, `BotaoAudio`, `Campo`, `AtividadeView`...). |
| `src/services/` | Regras de negócio e acesso a dados. Nomes seguem o diagrama/APF: `incluirResposta`, `corrigirAutomaticamente`, `visualizarPainel`... Quando o backend existir, **só esta pasta muda**. |
| `src/services/progressao.ts` | Funções **puras** (sem React, sem I/O) de nivelamento, progressão e dificuldades. Mantenha puras para testar fácil. |
| `src/domain/modelos.ts` | Tipos do diagrama de classes. Mudou o diagrama? Mude aqui também. |
| `src/data/mock.ts` | Dados de demonstração. Não importe direto nas telas; passe por `services/`. |
| `src/theme/tokens.ts` | Cores, fontes e tamanhos do Figma. **Não use cor ou tamanho "solto"** nas telas. |

## Regras obrigatórias de acessibilidade (o público depende disso)

- Toda tela do **aluno** tem um `BotaoAudio` ("Ouvir ajuda"/"Ouvir instrução") com o texto da tela (RNF04).
- Botões com **texto escrito**, nunca só ícone (RNF03). Área de toque ≥ `toqueMinimo` (64).
- Texto do aluno com no mínimo `fontes.corpo` (20). Títulos e enunciados maiores.
- Poucos elementos por tela, uma ação principal clara (RNF05, RNF07).
- Mensagens curtas, positivas e sem jargão: "Muito bem!", "Vamos tentar de novo?" (RNF06, RNF15). Nunca "Erro", "Inválido", "Falha".
- Use `accessibilityRole` e `accessibilityLabel` em elementos tocáveis.
- Interface, textos, nomes de variáveis de domínio e comentários em **português**.

## Regras de código

- React Compiler está ligado: **não mute objetos de estado** (ex.: `aluno.idNivelAtual = 2`). Crie um objeto novo e atualize via `entrar(...)` da sessão — veja `services/alunos.ts`.
- Navegação: `router`, `Link`, `Redirect`, `useLocalSearchParams` de `expo-router`. Rotas dinâmicas no formato objeto: `router.push({ pathname: "/aluno/atividade/[id]", params: { id } })`.
- Áreas protegidas: o `_layout.tsx` de `aluno/` e `professor/` redireciona quem não tem o perfil certo.
- Marque o que é provisório com `// TODO:` explicando o que falta.
- Nenhuma senha, token ou chave no código. Variáveis em `.env.local` (ignorado pelo git).

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
```

Antes de dizer que uma tarefa terminou: rode **lint e typecheck** e abra o fluxo afetado no app (login de demonstração: e-mail vazio).

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
5. Foi testada por outra pessoa da equipe (Giovanna/testes).
6. A seção **Pendências** do README foi atualizada.
