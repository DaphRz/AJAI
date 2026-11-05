# ADR-001 · Stack de dados, servidor e voz

Data: 05/11/2026 · Situação: **quase decidido** (banco, arquitetura de voz e provedor de voz decididos; falta aprovar o framework da API)

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
- Extras em relação ao diagrama de classes (registrar na documentação final): `Atividade.ordemNivelamento` e `AudioCache.provedor`.

### 2. Voz: interface `ProvedorVoz`, padrão **Piper**, `expo-speech` também implementado — **DECIDIDO**

- Interface `ProvedorVoz` (VoiceProvider) em `src/services/voz/provedor.ts`; o app chama só `falar()`/`pararFala()` de `services/narracao.ts`.
- Trocar de `expo-speech` para uma API (ou o contrário) = mudar `PROVEDOR_PADRAO` em `src/services/voz/index.ts`.
- **Provedor padrão: Piper** (código aberto, grátis, sem conta nem chave), rodando no computador que serve a API. Os áudios das atividades são gerados uma vez e guardados; o app toca os arquivos pelo provedor `servidor`.
- **`expo-speech` também é implementado**, como alternativa selecionável e como **reserva**: se o servidor não responder (sem rede, sem áudio ainda), o app fala com a voz do aparelho. Para textos que mudam ("Olá, Maria!") também serve.
- Para trocar o padrão: mudar `PROVEDOR_PADRAO` em `src/services/voz/index.ts` (`"servidor"` ou `"expo-speech"`).
- Pontos a verificar na implementação: o repositório e a licença atuais do Piper (o projeto original foi migrado; confira o oficial) e a **licença da voz `pt_BR-faber-medium`**, antes de citar na apresentação.
- No servidor, a geração de áudio seguirá a mesma ideia: uma interface `SintetizadorVoz` (texto + voz + velocidade → arquivo de áudio) com um arquivo por serviço (Google, Polly, Piper...), e o resultado guardado em `AudioCache` (tabela) + `server/storage/audio/` (arquivos, fora do git).
- `AudioCache.provedor` evita misturar áudios de vozes diferentes ao trocar de serviço.

## Decisão em aberto (resolver no passo 1 do roteiro)

| Item | Opções | Situação |
|---|---|---|
| Framework da API | Fastify ou Express (TypeScript) | **PROPOSTA: Fastify** — validação de entrada embutida, TypeScript melhor, plugins oficiais de JWT/CORS/limite de requisições. Express só se a maioria já dominar e usar zod para validar |

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
