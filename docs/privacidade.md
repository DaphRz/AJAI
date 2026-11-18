# Privacidade e segurança do AJAI

Este documento tem duas partes:

1. **Termo de uso e privacidade**, para quem usa o app. Linguagem muito simples, frases curtas, para quem está aprendendo a ler. É o mesmo texto da tela **/termo** do app (`src/services/termo.ts`), que tem um botão para ouvir cada parte. Mudou o termo? Mude aqui, em `src/services/termo.ts` (`TERMO` e `VERSAO_TERMO`) e em `server/src/rotas/auth.ts` (`VERSAO_TERMOS`).
2. **Revisão de segurança e privacidade** (passo 12), para a equipe: o que foi conferido, o que mudou e o que ficou pendente.

---

## Parte 1 — Termo de uso e privacidade

**Versão de 18/11/2026.**

### O que é o AJAI

- O AJAI ajuda você a ler e escrever.
- O AJAI é de graça.
- O AJAI ajuda o professor. Ele não toma o lugar do professor.

### O que guardamos

- Seu nome.
- O jeito de entrar: usuário, e-mail ou telefone.
- Sua senha, toda embaralhada. Ninguém consegue ler a senha. Nem a gente.
- Do aluno: as respostas, os acertos, a etapa e os dias de estudo. A voz e o tamanho da letra que você escolheu.
- Do professor: o e-mail, o telefone e a escola onde ele dá aula.
- Da escola: o CNPJ, o e-mail, o telefone e o nome de quem cuida da conta.
- Não pedimos CPF, endereço, foto nem data de nascimento.
- Não usamos a câmera, o microfone nem o lugar onde você está.

### Para que usamos

- Para você entrar no aplicativo.
- Para mostrar o seu progresso e escolher a próxima atividade.
- Para o professor e a família ajudarem você, se você deixar.
- Não vendemos seus dados. Não mostramos propaganda.

### Quem vê os seus dados

- Você vê tudo o que é seu.
- Um professor ou um familiar pode pedir para acompanhar você. Ele só vê se você aceitar.
- Quem você aceitar vê o seu nome, a sua etapa, os dias de estudo e os seus acertos.
- O professor também vê as suas respostas e pode corrigir.
- Ninguém vê o seu e-mail, o seu telefone ou a sua senha.
- Você pode desfazer quando quiser. Vá em Minha conta e toque em Quem me acompanha.
- A escola vê o nome, o e-mail e o telefone dos professores que pedem para entrar nela. Assim ela sabe se a pessoa trabalha lá.
- A equipe do AJAI vê os dados da escola, como o CNPJ, para saber se a escola existe.

### A voz do aplicativo

- Para ler em voz alta, o texto da tela vai para um serviço de voz da Microsoft.
- Pode ir o seu primeiro nome. Não vai e-mail, telefone nem senha.
- Se não der certo, a voz do próprio celular lê o texto.

### Segurança

- Não conte a sua senha para ninguém.
- Se você trocar a senha, os outros celulares saem da sua conta.
- Esqueceu a senha? A equipe do AJAI cria uma senha provisória. Ao entrar, você cria uma senha nova.

### Seus direitos

- Você pode pedir para ver, corrigir ou apagar os seus dados.
- Para apagar a sua conta, fale com o seu professor ou com a sua escola. Eles avisam a equipe do AJAI.
- Quando a conta é apagada, apagamos também as suas respostas.
- Se o termo mudar, o aplicativo avisa você.

---

## Parte 2 — Revisão de segurança e privacidade (passo 12, 18/11)

Base legal (LGPD, para o PDF do passo 14): o tratamento se apoia no **consentimento** ("Li e concordo" no cadastro, guardado com data e versão) e na **execução do serviço pedido** pela pessoa (entrar, estudar, ser acompanhada). O acompanhamento por professor ou familiar depende de um **segundo consentimento**, específico: o aluno aceita cada convite e pode desfazer. Requisitos: RNF11 (segurança) e RNF12 (privacidade).

### O que foi conferido

| Item | Situação | Onde |
|---|---|---|
| Senha só com hash | ✅ scrypt (N = 2^17, sal por senha), comparação em tempo constante; login de usuário inexistente leva o mesmo tempo (hash falso). Nenhuma rota devolve `senhaHash` | `server/db/senha.mjs`, `rotas/auth.ts` |
| JWT com expiração | ✅ 30 dias (`JWT_VALIDADE`). O token leva só id, perfil e versão (nada de nome, e-mail ou telefone) | `autenticacao.ts`, `config.ts` |
| Segredo em variável de ambiente | ✅ `JWT_SECRET` em `server/.env` (obrigatório em produção, mínimo 32 caracteres). Em desenvolvimento, gerado em `server/data/jwt-segredo.local` (fora do git). Chave da Azure só em `server/.env` | `config.ts` |
| **Invalidar tokens antigos quando a senha muda** | ✅ **novo.** `Usuario.versaoToken` sobe a cada troca de senha ou senha provisória; o token leva a versão e o servidor recusa versão diferente (401, "Entre de novo"). Quem troca recebe um token novo e continua logado no aparelho dele | migração 007, `autenticacao.ts`, `PATCH /auth/senha` |
| **Forçar a troca da senha provisória** | ✅ **novo.** A senha provisória (rota do administrador ou `npm run usuario:senha`) marca `Usuario.senhaProvisoria = 1`. Ao entrar, o app abre **"Crie sua senha"** (`/trocar-senha`) antes de qualquer tela, em todos os perfis; o servidor recusa as outras rotas com 403 até a troca (só `GET /auth/eu`, `PATCH /auth/senha` e a narração passam) | `exigirLoginComSenhaProvisoria`, `src/app/trocar-senha.tsx` |
| Senha nova igual à atual | ✅ **novo:** recusada ("A senha nova precisa ser diferente da senha de hoje.") | `PATCH /auth/senha` |
| Nenhum segredo no repositório | ✅ Procurado no histórico inteiro do git (`git log --all -p`): `server/.env` nunca foi versionado; só o `server/.env.example`, com `AZURE_SPEECH_KEY` vazia. Nenhuma chave, token ou senha real. A senha `demo1234` do seed é pública de propósito (dados de demonstração) | `.gitignore` |
| Perfil em todas as rotas | ✅ Toda rota tem `exigirLogin(...)` ou `exigirContaLiberada(...)`, menos as públicas de propósito: cadastro, login, `GET /health` e `GET /narracao/audio/:arquivo` (nome = hash de 160 bits, com padrão que impede `../`) | `server/src/rotas/*.ts` |
| Conta liberada | ✅ Professor e instituição pendentes ou recusados recebem 403 nas rotas restritas (`exigirContaLiberada`) | `autorizacao.test.ts`, `contas.test.ts` |
| Posse do dado | ✅ Aluno só vê o próprio (rotas `/alunos/eu/*` usam o id do token). Professor e responsável só alunos com `Vinculo` ACEITO (`temVinculoAceito`; sem vínculo = 404, para não revelar que o aluno existe). Instituição só os professores e turmas dela (outra = 404). Testado também com vínculo desfeito e convite pendente | `autorizacao.test.ts`, `professor.test.ts` |
| Validação de entrada | ✅ Esquema JSON em toda rota (campos fora do esquema são descartados), corpo de no máximo 100 KB, mensagens em português sem detalhes internos | `app.ts`, `erros.ts` |
| Limite de tentativas | ✅ 10 por minuto por IP nas rotas com senha, código de instituição ou convite (`limiteSenha`); 300 por minuto no geral | `config.ts`, `rotas/auth.ts` |
| Logs | ✅ Os logs do servidor registram só ids e decisões (ex.: "instituição decidida"), nunca senha, e-mail ou telefone; o corpo das requisições não é registrado | `req.log.*` |

### Quem vê CNPJ, e-mail e telefone (e por quê)

| Dado | Quem vê | Por quê |
|---|---|---|
| CNPJ, e-mail, telefone e nome do responsável da **instituição** | Administrador (`GET /admin/instituicoes`) e a própria instituição (`GET /instituicao/eu`) | O administrador confere se a escola existe antes de aprovar e precisa de um contato para falar com ela. Ninguém mais: o professor vê só o **nome** da instituição; o aluno vê o nome da instituição do professor que convidou |
| E-mail e telefone do **professor** | A instituição dele (`GET /instituicao/professores`), só dos professores que informaram o código **dela** | Para reconhecer quem trabalha lá antes de aprovar. O aluno vê só nome, perfil e instituição de quem convida; o professor não vê o contato de outros professores |
| E-mail e telefone do **aluno** | Só o próprio aluno | O acompanhante convida digitando o usuário, e-mail ou telefone, e só vê **o que ele mesmo digitou** até o aceite; depois, só o **nome** e o progresso |
| E-mail e telefone do **responsável** | Só o próprio responsável | O aluno vê só o nome e "Responsável" |

### Dados coletados: cada campo é necessário?

| Campo | Para quê | Decisão |
|---|---|---|
| `Usuario.nome` | Mostrar na conta e para quem acompanha | Necessário |
| `nomeUsuario` / `email` / `telefone` do aluno | Entrar (pelo menos um) | Necessário só um; os outros são opcionais ("se tiver") |
| `email` e `telefone` de professor, responsável e instituição | Entrar e contato (aprovação) | Necessários hoje. **Proposta:** a equipe pode tornar o telefone opcional para o responsável (ele não passa por aprovação) |
| `Usuario.dataNascimento` | **Nenhum.** Está no diagrama, mas nenhuma tela pede e nenhuma regra usa | **Saiu da resposta da API** (passo 12). **Proposta:** tirar do diagrama de classes no passo 14 e apagar a coluna numa migração depois da entrega |
| `Instituicao.cnpj` e `nomeResponsavel` | Conferir que a escola existe; saber com quem falar | Necessários |
| `Vinculo.identificadorConvite` | Mostrar ao acompanhante qual convite está esperando (sem revelar o nome do aluno) | Necessário; pode ser um e-mail ou telefone do aluno digitado por quem convidou. Fica guardado depois da decisão (pendência abaixo) |
| Respostas, desempenho, histórico de etapas | O próprio serviço (progresso, próxima atividade, relatórios) | Necessários |
| `Aluno.vozPreferida`, `velocidadeVoz`, `tamanhoFonte` | Acessibilidade | Necessários (não identificam a pessoa) |
| `Usuario.termosAceitosEm`, `versaoTermos` | Provar o consentimento (LGPD) | **Novos** (migração 007) |

### O que mudou no app

- **"Li e concordo"** nos 4 cadastros (aluno, professor, responsável, instituição), com **"Ler o termo de uso"** (tela `/termo`, uma parte por cartão, cada uma com "Ouvir"). No cadastro do aluno há também **"Ouvir o termo"** (resumo de até 800 letras, o limite da narração). Sem o aceite, o app não envia o cadastro e o servidor recusa (400, "Leia o termo de uso e toque em Li e concordo.").
- **Convite de acompanhamento:** "Quem me acompanha" explica o que a pessoa passa a ver se o aluno aceitar (nome, etapa, dias de estudo e acertos; o professor também vê as respostas; ninguém vê e-mail, telefone ou senha; dá para desfazer). A home e o cartão de cada convite também dizem isso, e o "Convidar aluno" do professor e do responsável avisa que só vê depois do aceite.
- **Narração de "Minha conta":** dizia o nome completo e o e-mail ou telefone do aluno. Esse texto vai para a Azure e fica no `AudioCache` do servidor. Agora diz só o primeiro nome e o usuário (o e-mail e o telefone continuam escritos na tela).
- **Apagar conta a pedido:** `npm run usuario:apagar -- <usuário, e-mail ou telefone>` mostra o que vai sair; com `--confirmar` no fim, apaga numa transação (aluno: respostas, desempenho, histórico, vínculos, matrículas e a conta; professor: turmas e vínculos, as atividades dele ficam sem criador; instituição: os professores dela voltam a pendentes, sem instituição; administrador não é apagado).

### Como atender um pedido para apagar a conta

1. A pessoa pede ao professor ou à escola (como diz o termo), que avisa a equipe do AJAI.
2. No computador do servidor: `npm run usuario:apagar -- maria.silva` e confira o que vai sair.
3. `npm run usuario:apagar -- maria.silva --confirmar`.
4. Avise a pessoa. Se houver cópias de segurança do banco, elas também precisam ser apagadas ou vencer.

### O que ficou pendente

- ⬜ **HTTPS (RNF11):** na demo a API roda em HTTP na rede local. Em produção, servir por HTTPS (proxy reverso com certificado) e definir `CORS_ORIGEM` (hoje `*`).
- ⬜ **`/esqueci-senha` diz "E-mail enviado" sem enviar nada** (TODO antigo do MVP, segue o Figma). Contradiz o termo ("A equipe do AJAI cria uma senha provisória") e confunde quem esqueceu a senha. Sugestão para o passo 13: trocar o texto por "Peça uma senha provisória ao seu professor ou à sua escola" até existir envio de e-mail.
- ⬜ **Contato para pedidos da LGPD:** o termo manda falar com o professor ou a escola. Falta a equipe definir um **e-mail de contato do AJAI** (encarregado de dados) e acrescentar no termo e no PDF.
- ⬜ **Apagar pelo app:** hoje só pelo script. Uma rota "Apagar minha conta" (com confirmação e áudio) fica para depois da entrega.
- ⬜ **Narrações com o primeiro nome** (saudação da home, comemoração): vão para a Azure e o MP3 fica em `server/storage/audio/`, que é **versionado**. Antes de cada commit dos áudios, confira que só entram os gerados pelo `npm run voz:preparar` (em 18/11 havia 419 MP3 no git para 414 preparados: confira os 5 a mais) ou separe as narrações pessoais numa pasta fora do git.
- ⬜ **`Vinculo.identificadorConvite`** continua guardado depois do aceite ou da recusa. Proposta: limpar ao decidir (o acompanhante passa a ver o nome, ou "Convite recusado").
- ⬜ **Contas antigas** (seed e cadastros de antes de 18/11) estão com `termosAceitosEm` vazio. Proposta: pedir o aceite no próximo login (ou deixar assim, por serem de demonstração).
- ⬜ **`dataNascimento`:** tirar do diagrama de classes (passo 14) e do banco (migração depois da entrega).
- ⬜ **Token no navegador:** na versão web o token fica no `localStorage` (no celular, no `expo-secure-store`). A web não é prioridade do MVP; se virar, usar cookie `HttpOnly`.
- ⬜ **Revogar a aprovação** de professor ou instituição (não previsto no MVP).
- ⬜ Equipe: abrir no Expo Go os cadastros com o "Li e concordo", a tela `/termo` e a "Crie sua senha" (gere uma senha provisória com `npm run usuario:senha -- ana.souza`).
