# Privacidade e segurança

A Parte 1 é o mesmo texto da tela `/termo` (`src/services/termo.ts`). Mudou o termo? Mude aqui, em `TERMO`/`VERSAO_TERMO` (`src/services/termo.ts`) e em `VERSAO_TERMOS` (`server/src/rotas/auth.ts`).

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

## Parte 2 — Segurança (RNF11, RNF12, LGPD)

Base legal: consentimento ("Li e concordo" no cadastro, com data e versão) e execução do serviço. O acompanhamento exige um segundo consentimento: o aluno aceita cada convite.

- **Senha:** hash scrypt; nenhuma rota devolve `senhaHash`.
- **Token:** JWT de 30 dias, só com id, perfil e versão. Trocar a senha sobe `Usuario.versaoToken` e derruba os outros aparelhos.
- **Senha provisória:** obriga a criar outra ao entrar (`/trocar-senha`); as outras rotas dão 403 até a troca.
- **Segredos:** só em `server/.env` (fora do git).
- **Acesso:** perfil e conta liberada em toda rota; aluno vê só o próprio; professor e responsável só com vínculo ACEITO; instituição só os dela (outra = 404).
- **Entrada:** esquema JSON em toda rota; 10 tentativas/min nas rotas com senha.
- **Quem vê contato:** CNPJ e contato da instituição, só o administrador; contato do professor, só a instituição dele; contato do aluno e do responsável, só o próprio.
- **Narração:** vai para a Azure; nunca narrar e-mail, telefone ou senha.

### Apagar uma conta (pedido LGPD)

```bash
npm run usuario:apagar -- maria.silva              # mostra o que vai sair
npm run usuario:apagar -- maria.silva --confirmar  # apaga
```
