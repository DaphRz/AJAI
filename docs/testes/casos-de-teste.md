# Casos de teste manuais – AJAI

Casos dos fluxos principais, para executar pelas **telas do app** (Expo Go no Android e no iPhone, ou `w` para a web). Os resultados entram na coluna "Resultado obtido"; o que falhar vira a lista de problemas do passo 13 (com o ID do caso).

Os testes automáticos (`npm test`) cobrem as regras e a API, mas não substituem estes casos: aqui se confere o que o aluno vê, ouve e toca.

## Como preparar

1. `npm run db:reset` (banco limpo, com os dados de demonstração).
2. `npm run server:dev` (API em `http://localhost:3333`) e, em outro terminal, `npx expo start`.
3. Senha de todos os usuários de demonstração: `demo1234`.

| Usuário | Perfil | Situação no seed |
|---|---|---|
| `admin@ajai.app` | Administrador | — |
| `instituicao@ajai.app` | Instituição | APROVADA, código `EJAVV2` |
| `aprender@ajai.app` | Instituição | PENDENTE |
| `rafael@ajai.app` | Professor | APROVADO, acompanha os 4 alunos (turma "EJA – Noite") |
| `paula@ajai.app` | Professor | PENDENTE |
| `joana@ajai.app` | Responsável | acompanha o Bruno |
| `maria.silva` | Aluna | nova, ainda sem nivelamento |
| `ana.souza`, `clara.santos` | Alunas | etapa 1; sobem de etapa no primeiro acerto |
| `bruno.lima` | Aluno | etapa 2 |

As respostas certas de cada atividade estão em [`docs/conteudo-pedagogico.md`](../conteudo-pedagogico.md).

**Em toda tela do aluno, confira também:** botão "Ouvir ajuda" ou "Ouvir instrução" que fala o texto da tela; botões com texto escrito (não só ícone); letra grande; nenhuma mensagem com "Erro", "Inválido" ou "Falha". As telas de login e de cadastro **não** têm "Ouvir ajuda".

Preencha "Resultado obtido" com **OK** ou com o que aconteceu de diferente, o aparelho e a data (ex.: "Android 12, 19/11: o botão Aceitar não respondeu").

## 1. Instituição e administrador

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-01 | Banco recém-criado; fora da conta | 1) Na tela de login, tocar em "Ainda não tem conta? Crie a sua". 2) Em "Eu sou:", escolher Instituição. 3) Preencher nome, CNPJ `11.222.333/0001-81`, nome do responsável, e-mail novo, telefone com DDD e senha. 4) Tocar em "Inscrever instituição". | Conta criada e o app abre a tela de espera, dizendo que a inscrição aguarda aprovação, com "Verificar de novo" e "Sair". | |
| CT-02 | Tela de cadastro da instituição aberta | Preencher tudo com o CNPJ `11.222.333/0001-80` e tocar em "Inscrever instituição". | Não cria a conta; mostra uma mensagem curta pedindo para conferir o CNPJ. | |
| CT-03 | CT-01 feito | 1) Sair. 2) Entrar como `admin@ajai.app`. 3) Em "Instituições esperando aprovação", achar a instituição do CT-01 e tocar em "Aprovar". | A instituição sai da lista de espera, vai para "Instituições aprovadas" e mostra um **código** de 6 letras e números. | |
| CT-04 | Admin logado; `aprender@ajai.app` pendente | Tocar em "Recusar" no cartão do "Instituto Aprender Sempre", escrever um motivo e confirmar. Depois sair e entrar como `aprender@ajai.app`. | A instituição sai da lista. Ao entrar como ela, a tela de espera mostra que foi recusada, com o motivo escrito. | |
| CT-05 | CT-03 feito | Sair, entrar com o e-mail da instituição do CT-01 (ou, se ela ficou na tela de espera, tocar em "Verificar de novo"). | Abre a área da instituição com o "Código da instituição" igual ao que o admin viu. | |

## 2. Professor e aprovação pela instituição

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-06 | Código da instituição do CT-05 anotado; fora da conta | 1) "Ainda não tem conta? Crie a sua" → Professor. 2) Preencher nome, e-mail novo, telefone, o código e senha. 3) Tocar em "Criar conta". | Conta criada; tela de espera dizendo que aguarda a aprovação da instituição (com o nome dela). | |
| CT-07 | Tela de cadastro do professor aberta | Informar o código `ZZZZZZ` e tocar em "Criar conta". | Não cria a conta; mensagem curta dizendo que o código não foi encontrado. | |
| CT-08 | CT-06 feito | 1) Sair e entrar como a instituição do CT-05. 2) Em "Professores esperando aprovação", tocar em "Aprovar" no professor do CT-06. | O professor passa para "Professores aprovados". | |
| CT-09 | CT-08 feito | Entrar como o professor do CT-06 (ou tocar em "Verificar de novo" na tela de espera). | Abre a área do professor (aba Acompanhamento), sem alunos ainda. | |
| CT-10 | Fora da conta | Entrar como `paula@ajai.app` (professora PENDENTE). | Só a tela de espera; não chega ao Acompanhamento. | |
| CT-11 | Instituição aprovada logada; Paula pendente | Tocar em "Recusar" na Paula com um motivo. Entrar como `paula@ajai.app`, informar o código `EJAVV2` em "Código da instituição" e tocar em "Enviar código novo". | Ela vê o motivo da recusa; depois de enviar o código, volta a aguardar aprovação. | |

## 3. Aluno: cadastro, login e convite

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-12 | Fora da conta | 1) "Ainda não tem conta? Crie a sua" → Aluno. 2) Escrever o nome "Teste Aluno". 3) Conferir o "Nome de usuário" sugerido. 4) Deixar e-mail e telefone em branco, criar uma senha e tocar em "Criar conta". | O nome de usuário é sugerido a partir do nome (ex.: `teste.aluno`). A conta é criada e o aluno vai direto para o nivelamento. | |
| CT-13 | Tela de cadastro do aluno aberta | Apagar o nome de usuário, deixar e-mail e telefone vazios e tocar em "Criar conta". | Não cria; mensagem pedindo pelo menos um entre usuário, e-mail ou telefone. | |
| CT-14 | CT-12 feito | Sair e entrar escrevendo o **nome de usuário** do CT-12 em "Seu usuário ou e-mail" e a senha. | Entra na área do aluno (sem perguntar o perfil). | |
| CT-15 | Aluno criado só com e-mail ou só com telefone | Entrar usando o e-mail (ou o telefone com DDD) no mesmo campo. | Entra na área do aluno. | |
| CT-16 | Fora da conta | Entrar com `maria.silva` e a senha `errada1`. | Não entra; mensagem curta e gentil (sem "Erro"). | |
| CT-17 | Professor do CT-09 logado; aluno do CT-12 existe | 1) Na aba Acompanhamento, tocar em "Meus alunos: convidar". 2) Em "Usuário, e-mail ou telefone do aluno", escrever o usuário do CT-12. 3) Tocar em "Enviar convite". | O convite aparece como pendente, mostrando **só o que foi digitado** (não o nome do aluno), com "Cancelar convite". O aluno ainda **não** aparece no Acompanhamento. | |
| CT-18 | `joana@ajai.app` logada (já acompanha o Bruno) | Convidar `ana.souza`. Depois tentar convidar `clara.santos`. | O 1º convite é enviado. O 2º é recusado com uma mensagem dizendo que ela já acompanha 2 pessoas. | |
| CT-19 | CT-17 feito | 1) Entrar como o aluno do CT-12. 2) Na home, tocar em "Ver convite" (ou Minha conta → Quem me acompanha). 3) Tocar em "Aceitar". | O professor sai de "Convites" e vai para "Acompanham você". A tela avisa que quem o aluno aceitar pode ver o progresso. | |
| CT-20 | CT-19 feito | Entrar como o professor do CT-09 e abrir o Acompanhamento. | O aluno aparece com o **nome**, "sem turma", e "Ver métricas ›" abre os dados dele. | |
| CT-21 | `ana.souza` logada com o convite da Joana (CT-18) | Em "Quem me acompanha", tocar em "Recusar" no convite da Joana. Entrar como Joana. | O convite some para a Ana. A Joana não vê o nome da Ana e pode convidar outra pessoa. | |
| CT-22 | CT-19 feito | Como aluno, em "Quem me acompanha", tocar em "Desfazer" no professor. Entrar como o professor. | O aluno some do Acompanhamento, dos Relatórios e das Turmas do professor. | |

## 4. Nivelamento, atividades e progressão

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-23 | `maria.silva` (sem nivelamento) | Entrar e tocar em "Ouvir ajuda" na primeira tela; depois em "Começar". | O app vai direto para o nivelamento (não para a home). A voz lê a explicação. Aparece a 1ª pergunta com barra de progresso. | |
| CT-24 | CT-23 em andamento | Acertar as 2 perguntas da etapa 1 e errar a 1ª da etapa 2. | O nivelamento para no erro e mostra "Pronto!" com "Sua etapa inicial" = etapa 2 (Formando Sílabas). "Começar" leva à home. | |
| CT-25 | Aluno novo sem nivelamento (`npm run db:reset` ou um aluno do CT-12) | Errar a 1ª pergunta do nivelamento. | Etapa inicial = 1 (Aprendendo Letras). | |
| CT-26 | Aluno novo sem nivelamento | Acertar as 10 perguntas. | Etapa inicial = 5 (Entendendo Textos). | |
| CT-27 | CT-24 feito | Fechar o app por completo, abrir de novo e entrar como `maria.silva`. | Vai para a home (não refaz o nivelamento), na etapa 2. | |
| CT-28 | `bruno.lima` logado (não sobe de etapa no 1º acerto) | 1) Na home, tocar em "CONTINUAR". 2) Tocar em "Ouvir instrução". 3) Tocar na alternativa certa. | Mostra "Atividade 1 de 5". A voz lê o enunciado e as opções. Depois de tocar: "Conferindo sua resposta..." e a tela **"Muito bem!"** com "Você acertou." e "Continuar". | |
| CT-29 | Atividade aberta (CT-28) | Tocar numa alternativa errada. | Tela "Quase lá!" com "Vamos tentar de novo? Errar faz parte de aprender." e "Tentar novamente", que volta à mesma atividade. | |
| CT-30 | Atividade aberta | Tocar e **segurar** uma opção. | A voz lê só aquela opção; a resposta não é enviada. | |
| CT-31 | Atividade do tipo PALAVRA ou ESCRITA (etapa 3) | Montar a palavra com as peças (e testar "Apagar") ou escrever a resposta **sem acento e em minúsculas** (ex.: `pao`). Tocar em "Confirmar". | A resposta sem acento e em minúsculas é aceita: "Muito bem!". | |
| CT-32 | Sessão em andamento | Acertar 5 atividades seguidas, tocando em "Continuar" depois de cada acerto. | A contagem vai de "Atividade 1 de 5" a "5 de 5". Na 5ª: "Você já fez 5 atividades..." com "Voltar ao início" e "Continuar treinando". | |
| CT-33 | `ana.souza` ou `clara.santos` (sobem no 1º acerto) | Tocar em "CONTINUAR" e acertar a atividade. | Abre a comemoração: "Parabéns! Você passou para a etapa 2", **com a voz falando sozinha**, e os botões "Continuar", "Ver meu progresso" e "Voltar ao início". | |
| CT-34 | CT-33 feito | Tocar em "Ver meu progresso". | A trilha mostra a etapa 1 "Concluída" e a 2 "Você está aqui"; atividades feitas, taxa de acerto, ofensiva e "Vale a pena treinar". | |
| CT-35 | Aluno que respondeu hoje | Voltar para a home. | O cartão "Ofensiva" mostra pelo menos 1 dia e a frequência da semana, com texto positivo. | |
| CT-36 | Servidor parado (`Ctrl+C` no `server:dev`) | Abrir a home ou uma atividade. | "Sem conexão. Toque para tentar de novo." (sem tela vermelha). Subindo o servidor e tocando, a tela carrega. | |

## 5. Área do professor

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-37 | `rafael@ajai.app` logado | Abrir a aba Acompanhamento. Trocar o período para "Últimos 30 dias". | Os 4 alunos com etapa, turma, frequência, acertos/erros, maior dificuldade e situação (Em dia / Atenção / Reforço). Os números mudam com o período. Aparece o aviso de que o app complementa a avaliação do professor. | |
| CT-38 | CT-37 | Tocar em "Ver métricas ›" na Ana. | Situação, frequência, taxa de acerto/erro, gráfico "Evolução: taxa de acerto por dia" com o número em cima das barras, "Histórico de etapas", "Acertos por conteúdo (pior primeiro)" e "Respostas recentes". | |
| CT-39 | CT-38 | Numa resposta recente, tocar em "Considerar certa" (ou "Considerar errada"), escrever uma observação e confirmar. | A resposta muda de situação e mostra a observação; a taxa de acerto por conteúdo é recalculada. A etapa da aluna **não** muda. | |
| CT-40 | CT-37 | Aba Turmas: "Criar turma nova", depois "Mudar de turma" num aluno para a turma nova. Voltar ao Acompanhamento e filtrar por essa turma. | A turma aparece com o aluno; o filtro mostra só ele. | |
| CT-41 | CT-37 | Aba Relatórios: escolher a turma "EJA – Noite". | Alunos que treinaram, gráfico de atividades por dia, dias por aluno (menos ativos primeiro) e conteúdos com mais dificuldade. | |
| CT-42 | Professor do CT-09 (outro professor, sem a Ana) logado | Procurar a Ana no Acompanhamento e nos Relatórios. | A Ana **não aparece** em lugar nenhum. | |
| CT-43 | `rafael@ajai.app` logado | Conta → Atividades → incluir uma atividade de múltipla escolha marcando **duas** alternativas como "É a certa". Depois corrigir para uma só e salvar. Entrar como aluno da mesma etapa. | Com duas certas: mensagem pedindo para marcar exatamente uma. Com uma: salva. A atividade aparece para o aluno, e ele é corrigido pelo gabarito novo. | |

## 6. Área do responsável

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-44 | `joana@ajai.app` logada | Abrir a área do responsável. | Mostra o Bruno com até 3 "Dicas para ajudar" (dias de treino, conteúdo para treinar junto, etapa). Nenhuma turma nem gráfico. | |
| CT-45 | CT-44 | Tocar em "Ouvir dicas". | A voz lê as dicas do Bruno. | |
| CT-46 | Joana com convite PENDENTE para outra pessoa (CT-18) | Olhar a lista. | O convite pendente mostra só o que ela digitou, sem nome nem dicas. | |
| CT-47 | Bruno desfez o vínculo com a Joana (Minha conta → Quem me acompanha → "Desfazer") | Entrar como Joana. | O Bruno e as dicas dele somem. | |

## 7. Senha

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-48 | Aluno logado | Minha conta → "Trocar minha senha": senha atual, senha nova; confirmar. Sair e entrar com a nova. | Entra com a senha nova; a antiga não funciona mais. | |
| CT-49 | Aluno esqueceu a senha (o app ainda não tem botão para isso: é pelo servidor) | No computador do servidor, rodar `npm run usuario:senha -- maria.silva`. Entrar como `maria.silva` com a senha mostrada. | Entra com a senha provisória e cai em **"Crie sua senha"** (sem "Voltar"). Depois de salvar a senha nova, vai para a área do aluno (passo 12). | |
| CT-50 | Aluno logado em **dois** aparelhos (ou celular e navegador) | No aparelho 1, Minha conta → "Trocar minha senha". No aparelho 2, abrir qualquer tela. | O aparelho 1 continua logado; o aparelho 2 volta para o login ("Entre de novo"). | |

## 8. Termo de uso e privacidade (passo 12)

| ID | Pré-condição | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| CT-51 | Sem login | Cadastro de aluno: preencher tudo **sem** marcar "Li e concordo" e tocar em "Criar conta". | Aviso "Leia o termo de uso e toque em Li e concordo."; a conta não é criada. | |
| CT-52 | Sem login | Cadastro de aluno: tocar em "Ouvir o termo"; depois em "Ler o termo de uso". | Ouve o resumo do termo; a tela do termo abre com as partes e um "Ouvir" em cada uma; "Voltar" volta ao cadastro com os campos preenchidos. | |
| CT-53 | Sem login | Repetir o cadastro de professor, responsável e instituição marcando "Li e concordo". | As 3 contas são criadas (professor e instituição ficam esperando aprovação). | |
| CT-54 | Professor convidou `maria.silva` | Entrar como `maria.silva`, abrir o convite em "Quem me acompanha" e tocar em "Ouvir ajuda". | A tela e o áudio explicam que quem ela aceitar vê o nome, a etapa, os dias de estudo e os acertos, e que ninguém vê e-mail, telefone ou senha. | |
