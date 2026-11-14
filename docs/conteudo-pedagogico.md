# Conteúdo pedagógico do AJAI (Passo 6)

Banco de atividades e nivelamento do AJAI, aprovados pela equipe em 14/11. O conteúdo está no `src/data/mock.ts` (fonte do seed) e no banco (`npm run db:seed`); as tabelas abaixo saíram do banco, então mostram exatamente o que o app exibe.

**Como mudar uma atividade:** edite o `mock.ts`, rode `npm run db:seed` e atualize a tabela aqui. O seed **para com mensagem** se uma atividade de múltipla escolha não tiver exatamente 1 opção correta, se as peças de PALAVRA não formarem a palavra ou se uma ESCRITA vier sem resposta. Pelo app, o administrador vai poder fazer isso no passo 9.

## Critérios usados

- **Público adulto:** só situações do dia a dia (ônibus, mercado, remédio, conta de luz, documento, placa, receita, mensagem no celular). Nada de bichinhos, brinquedos ou linguagem infantil.
- **Enunciado curto** (até 12 palavras), **3 opções** e só **1 correta** (PALAVRA: as opções são as peças, com 1 a mais para distrair; ESCRITA: sem opções).
- **Distratores plausíveis**, escolhidos pelo erro mais comum em cada etapa:
  - letras: letras que se confundem no som ou no desenho (B/P/V, M/N, C/G, T/D, O/U/A);
  - sílabas: a mesma consoante com outra vogal (BA/BO/BU) ou uma consoante parecida (CA/GA, DI/TI, RE/LE);
  - frases e textos: outros números ou lugares do próprio texto, ou o contrário do que o texto diz.
- **7 atividades por nível** (35 no total). Os ids 1 a 7 são os mesmos de antes, porque as respostas de exemplo e os testes dependem deles.
- **`conteudo` padronizado**, porque ele agrupa o relatório de dificuldades ("Vale a pena treinar..."):

| Nível | Padrão do `conteudo` | Exemplos |
|---|---|---|
| 1 | `Letra X` (a tela tira a letra grande daqui) | Letra B, Letra O |
| 2 | `Sílaba XY` (sem acento) | Sílaba BO, Sílaba ME |
| 3 | `Palavra X` (montar) e `Escrita X` (escrever) | Palavra CASA, Escrita PÃO |
| 4 | `Frase: <tema do dia a dia>` | Frase: horário, Frase: remédio |
| 5 | `Texto: <habilidade de leitura>` | Texto: achar informação, Texto: entender o objetivo, Texto: tirar conclusão |

No nível 5 o `conteudo` é a **habilidade** (e não o tema), porque é isso que o professor precisa saber para planejar a aula: o aluno acha a informação, mas não tira conclusão?

## As atividades

Coluna "Niv." = posição da pergunta no nivelamento (vazia = fora do nivelamento).

### Nível 1 · Aprendendo Letras

| id | Tipo | conteudo | Enunciado | Texto de apoio | Opções (correta em **negrito**) | Niv. |
|---|---|---|---|---|---|---|
| 1 | LETRA | Letra B | Qual figura começa com a letra B? | — | Pão · **Banco** · Vaca | 2 |
| 2 | LETRA | Letra M | Qual figura começa com a letra M? | — | Pé · **Mão** · Sol |  |
| 8 | LETRA | Letra P | Qual palavra começa com o som da letra P? | — | Mão · Banco · **Pão** |  |
| 9 | LETRA | Letra R | Qual figura começa com a letra R? | — | Arroz · **Remédio** · Lâmpada |  |
| 10 | LETRA | Letra C | Qual palavra começa com o som da letra C? | — | Garrafa · Sapato · **Café** |  |
| 11 | LETRA | Letra T | Qual figura começa com a letra T? | — | **Televisão** · Dinheiro · Chave |  |
| 12 | LETRA | Letra O | Qual figura começa com a letra O? | — | Água · **Ônibus** · Uva | 1 |

### Nível 2 · Formando Sílabas

| id | Tipo | conteudo | Enunciado | Texto de apoio | Opções (correta em **negrito**) | Niv. |
|---|---|---|---|---|---|---|
| 3 | SILABA | Sílaba BO | Qual sílaba começa a palavra BONÉ? | BONÉ | BA · **BO** · BU | 4 |
| 13 | SILABA | Sílaba CA | Qual sílaba começa a palavra CAFÉ? | CAFÉ | GA · **CA** · CO | 3 |
| 14 | SILABA | Sílaba PA | Qual sílaba começa a palavra PANELA? | PANELA | **PA** · BA · PO |  |
| 15 | SILABA | Sílaba ME | Qual sílaba começa a palavra MÉDICO? | MÉDICO | MA · NÉ · **MÉ** |  |
| 16 | SILABA | Sílaba TA | Qual sílaba termina a palavra CONTA? | CONTA | DA · **TA** · CA |  |
| 17 | SILABA | Sílaba DI | Qual sílaba começa a palavra DINHEIRO? | DINHEIRO | **DI** · TI · DE |  |
| 18 | SILABA | Sílaba RE | Qual sílaba começa a palavra REMÉDIO? | REMÉDIO | RA · LE · **RE** |  |

### Nível 3 · Formando Palavras

| id | Tipo | conteudo | Enunciado | Texto de apoio | Opções (correta em **negrito**) | Niv. |
|---|---|---|---|---|---|---|
| 4 | PALAVRA | Palavra CASA | Junte as sílabas | CASA | **SA** · BO · **CA** · LA | 5 |
| 6 | ESCRITA | Escrita PÃO | Escreva a palavra PÃO | — | escrever **PÃO** |  |
| 19 | PALAVRA | Palavra SAPATO | Junte as sílabas | SAPATO | **TO** · **SA** · BA · **PA** |  |
| 20 | PALAVRA | Palavra LEITE | Junte as sílabas | LEITE | **TE** · LE · **LEI** |  |
| 21 | PALAVRA | Palavra REMÉDIO | Junte as sílabas | REMÉDIO | **DIO** · **RE** · MA · **MÉ** | 6 |
| 22 | PALAVRA | Palavra ÔNIBUS | Junte as sílabas | ÔNIBUS | **NI** · **BUS** · NO · **Ô** |  |
| 23 | ESCRITA | Escrita LUZ | Escreva a palavra LUZ | — | escrever **LUZ** |  |

### Nível 4 · Lendo Frases

| id | Tipo | conteudo | Enunciado | Texto de apoio | Opções (correta em **negrito**) | Niv. |
|---|---|---|---|---|---|---|
| 5 | FRASE | Frase: horário | Que horas o ônibus passa? | O ônibus passa às 7 horas. | 5 horas · **7 horas** · 9 horas | 7 |
| 24 | FRASE | Frase: preço | Quanto custa o quilo do feijão? | O quilo do feijão custa 8 reais. | 6 reais · 18 reais · **8 reais** |  |
| 25 | FRASE | Frase: remédio | Quando tomar o remédio? | Tome 1 comprimido depois do almoço. | Antes do café · **Depois do almoço** · Antes de dormir | 8 |
| 26 | FRASE | Frase: mensagem | Para que dia mudou a reunião? | A reunião da escola mudou para sexta-feira. | **Sexta-feira** · Sábado · Segunda-feira |  |
| 27 | FRASE | Frase: placa | O que essa placa quer dizer? | Proibido estacionar. | Pode parar o carro aqui · Aqui é o ponto de ônibus · **Não pode parar o carro aqui** |  |
| 28 | FRASE | Frase: documento | O que precisa levar? | Leve o RG e o CPF para fazer o cadastro. | A conta de luz · **O RG e o CPF** · A carteira de trabalho |  |
| 29 | FRASE | Frase: conta | Quando vence a conta de luz? | A conta de luz vence no dia 10. | Dia 1 · Dia 20 · **Dia 10** |  |

### Nível 5 · Entendendo Textos

| id | Tipo | conteudo | Enunciado | Texto de apoio | Opções (correta em **negrito**) | Niv. |
|---|---|---|---|---|---|---|
| 7 | INTERPRETACAO | Texto: achar informação | O que Dona Rosa precisa levar? | A consulta de Dona Rosa é na quinta-feira, às 9 horas. Ela precisa levar o cartão do SUS e chegar meia hora antes. | A conta de luz · **O cartão do SUS** · O título de eleitor | 9 |
| 30 | INTERPRETACAO | Texto: achar informação | Quanto tempo o bolo fica no forno? | Bolo de fubá: misture 2 ovos, 1 copo de leite e 2 copos de fubá. Leve ao forno por 40 minutos. | 2 minutos · **40 minutos** · 1 hora |  |
| 31 | INTERPRETACAO | Texto: achar informação | Por quantos dias tomar o remédio? | Receita: tome 1 comprimido a cada 8 horas, durante 5 dias. Se a dor não passar, volte ao posto. | 1 dia · 8 dias · **5 dias** |  |
| 32 | INTERPRETACAO | Texto: entender o objetivo | Para que serve esse aviso? | Aviso: na terça-feira, vai faltar água no bairro das 8 às 14 horas, para conserto. Guarde água. | Cobrar a conta de água · **Avisar que vai faltar água** · Chamar para uma reunião |  |
| 33 | INTERPRETACAO | Texto: entender o objetivo | Por que a farmácia mandou essa mensagem? | Oi, Seu João! Aqui é da Farmácia Popular. O seu remédio chegou. Pode buscar até sábado. | Para marcar uma consulta · Para cobrar uma dívida · **Para avisar que o remédio chegou** |  |
| 34 | INTERPRETACAO | Texto: tirar conclusão | Que horas passa o próximo ônibus? | O ônibus 210 passa de meia em meia hora. O último ônibus passou às 8 horas. | 8 horas · **8 e meia** · 9 horas | 10 |
| 35 | INTERPRETACAO | Texto: tirar conclusão | Em qual mercado o arroz está mais barato? | No Mercado Bom Preço, o pacote de arroz de 5 quilos custa 25 reais. No Mercado Economia, custa 22 reais. | No Bom Preço · **No Economia** · O preço é igual |  |

## RF05 (letra e som) e RF11 (cotidiano): tipo novo ou só `conteudo`?

**Proposta: nenhum valor novo em `TipoAtividade`.** Os dois viram uso dos tipos que já existem.

- **RF05, associar letra e som:** é uma atividade `LETRA` com `conteudo: "Letra X"`. O que muda é o enunciado ("Qual palavra começa com **o som** da letra P?") e a narração: o "Ouvir instrução" lê as opções em voz alta ("Mão, Banco ou Pão"), então o aluno associa o som da palavra à letra grande da tela. As atividades 8 e 10 são desse jeito. A tela, a correção e o relatório são os mesmos do reconhecimento de letra.
- **RF11, situações do cotidiano:** não é um formato de atividade, é o **tema** de todas elas. Ele aparece em todos os níveis (ÔNIBUS, REMÉDIO, conta de luz, placa, receita) e, nos níveis 4 e 5, no próprio `conteudo` ("Frase: remédio", "Frase: placa").

**Impacto:**
- **Diagrama de classes:** nenhum. O enum `TipoAtividade` continua com LETRA, SILABA, PALAVRA, FRASE, ESCRITA e INTERPRETACAO, e nenhum campo novo foi criado. (O `textoApoio` e o `ordemNivelamento` já existiam como extras.)
- **APF:** nenhuma função nova nem alterada. O ALI Atividade continua com os mesmos campos, e Incluir/Editar/Listar Atividade (passo 9) já cobrem o conteúdo novo. A documentação só precisa dizer que RF05 e RF11 são atendidos pelos tipos LETRA e FRASE/INTERPRETACAO, com o tema no `conteudo`.
- **Se a equipe quiser separar no relatório** "reconhecer a letra" de "letra e som", basta usar `conteudo: "Som da letra P"`. Mas então a letra grande deixa de aparecer na tela (ela sai do padrão "Letra X"), e seria preciso ajustar o `AtividadeView`. Por isso a proposta é não separar.
- **Para depois do MVP:** um campo `tema` (ônibus, saúde, dinheiro...) permitiria filtrar atividades por situação. Fica fora do escopo.

## Nivelamento (RF03)

**Perguntas (2 por nível, da mais fácil para a mais difícil):**

| Ordem | Nível | id | Pergunta | Por que esta |
|---|---|---|---|---|
| 1 | 1 | 12 | Qual figura começa com a letra O? (Ônibus) | vogal, palavra muito conhecida |
| 2 | 1 | 1 | Qual figura começa com a letra B? (Banco) | consoante, com distrator B/P/V |
| 3 | 2 | 13 | Qual sílaba começa a palavra CAFÉ? | sílaba simples, distrator C/G |
| 4 | 2 | 3 | Qual sílaba começa a palavra BONÉ? | mesma consoante, vogal diferente |
| 5 | 3 | 4 | Junte as sílabas: CASA | 2 sílabas |
| 6 | 3 | 21 | Junte as sílabas: REMÉDIO | 3 sílabas, com acento |
| 7 | 4 | 5 | Que horas o ônibus passa? | frase curta, achar um número |
| 8 | 4 | 25 | Quando tomar o remédio? | frase com "depois de" |
| 9 | 5 | 7 | O que Dona Rosa precisa levar? | achar informação num texto |
| 10 | 5 | 34 | Que horas passa o próximo ônibus? | tirar conclusão (8h + meia hora) |

**Regra do nível inicial** (definida no passo 6, em `definirNivelInicial`, `server/src/progressao.ts`):
1. As perguntas vêm em pares, um par por nível, do nível 1 ao 5.
2. O aluno passa de nível quando acerta **as 2** perguntas do par. Errou uma, o nivelamento para (no máximo 1 erro: menos frustração).
3. O nível inicial é o **primeiro nível que ele ainda não domina**, ou seja, o do par em que errou. Acertou todas = nível 5.

Por quê:
- **Menos chute:** com 3 opções, acertar 1 pergunta no chute é 1 em 3; acertar as 2 do par é 1 em 9.
- **Não repetir o que ele já sabe:** quem acerta letras e sílabas começa nas palavras, e não de novo nas letras, o que é desmotivador para o adulto.
- **Conservadora no topo:** quem erra no nível 5 começa no 5, e não é "aprovado" sem treinar.

Exemplos:
- errou a 1ª pergunta → **nível 1**;
- acertou 12 e 1, e errou a 13 (CAFÉ) → **nível 2**;
- acertou 12, 1 e 13, e errou a 3 (BONÉ) → **nível 2** (acertou só metade do par);
- acertou 12, 1, 13 e 3, e errou a 4 (CASA) → **nível 3**;
- acertou as 10 → **nível 5**.

A regra antiga (nível da última pergunta acertada) deixava o aluno uma etapa abaixo e aceitava um nível com 1 acerto só. O app não mudou: ele continua parando no primeiro erro, e quem decide o nível é o servidor.

## Imagens para a equipe de design (passo 11)

Hoje as figuras são ícones provisórios (`Alternativa.ilustracao`). As imagens finais vão em `assets/images/atividades/` e entram por `urlImagem`. Formato sugerido: PNG quadrado 512 × 512, fundo transparente, desenho simples e realista (nada de estilo infantil), um objeto por imagem.

**Figuras das opções (nível 1):**

| Arquivo | Descrição | Usada em |
|---|---|---|
| `pao.png` | pão francês | 1, 8 |
| `banco.png` | fachada de agência bancária | 1, 8 |
| `vaca.png` | vaca | 1 |
| `pe.png` | pé de adulto | 2 |
| `mao.png` | mão aberta de adulto | 2, 8 |
| `sol.png` | sol | 2 |
| `arroz.png` | pacote de arroz | 9 |
| `remedio.png` | caixa de remédio com cartela de comprimidos | 9 |
| `lampada.png` | lâmpada acesa | 9 |
| `garrafa.png` | garrafa | 10 |
| `sapato.png` | sapato social | 10 |
| `cafe.png` | xícara de café | 10 |
| `televisao.png` | televisão | 11 |
| `dinheiro.png` | notas de real | 11 |
| `chave.png` | chave de casa | 11 |
| `agua.png` | copo de água | 12 |
| `onibus.png` | ônibus urbano | 12 |
| `uva.png` | cacho de uva | 12 |

**Figura da palavra em destaque (níveis 2 e 3, acima da palavra):**

| Arquivo | Palavra | Usada em |
|---|---|---|
| `bone.png` | BONÉ | 3 |
| `cafe.png` | CAFÉ (reaproveita a do nível 1) | 13 |
| `panela.png` | PANELA | 14 |
| `medico.png` | MÉDICO (profissional de jaleco) | 15 |
| `conta-de-luz.png` | CONTA (conta de luz em papel) | 16, 29 |
| `dinheiro.png` | DINHEIRO (reaproveita) | 17 |
| `remedio.png` | REMÉDIO (reaproveita) | 18, 21 |
| `casa.png` | CASA | 4 |
| `sapato.png` | SAPATO (reaproveita) | 19 |
| `leite.png` | caixa de leite | 20 |
| `onibus.png` | ÔNIBUS (reaproveita) | 22 |
| `pao.png` | PÃO, na escrita (reaproveita) | 6 |
| `luz.png` | interruptor ou lâmpada acesa | 23 |

**Opcionais (frases e textos, para dar contexto):** `placa-proibido-estacionar.png` (27), `mensagem-celular.png` (26, 33), `receita-medica.png` (25, 31), `aviso-falta-agua.png` (32), `ponto-de-onibus.png` (5, 34).

Ao todo: 25 arquivos obrigatórios (alguns servem a mais de uma atividade) e 5 opcionais.

## Correções da revisão

Revisão da equipe em 14/11: **conteúdo aprovado sem correções**, com a regra de nivelamento acima. O fluxo foi testado no app.
