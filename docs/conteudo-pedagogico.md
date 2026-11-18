# Conteúdo pedagógico

35 atividades (7 por nível) do cotidiano adulto, definidas em `src/data/mock.ts` (fonte do seed). Para mudar: edite o `mock.ts` e rode `npm run db:seed`.

## Critérios

- Situações do dia a dia (ônibus, mercado, remédio, conta, documento), sem linguagem infantil.
- Enunciado curto, 3 opções e 1 correta; distratores pelo erro mais comum (B/P/V, BA/BO, CA/GA, números do próprio texto).
- `conteudo` padronizado (agrupa as dificuldades): `Letra X`, `Sílaba XY`, `Palavra X` / `Escrita X`, `Frase: <tema>`, `Texto: <habilidade>`.
- RF05 (letra e som) usa o tipo LETRA; RF11 (cotidiano) é o tema de todas as atividades. Nenhum tipo novo.

## As atividades

Coluna "Niv." = posição no nivelamento.

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

## Nivelamento

10 perguntas, 2 por nível. O aluno para no primeiro erro e só passa de nível acertando as 2 do par; o nível inicial é o do par em que errou (acertou tudo = nível 5). Regra em `definirNivelInicial` (`server/src/progressao.ts`).

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

## Imagens

As figuras hoje são ícones (`Alternativa.ilustracao`). Para usar imagem, preencha `urlImagem` no `mock.ts` (PNG/WebP 512 × 512, desenho realista, um objeto). Necessárias: pão, banco, vaca, pé, mão, sol, arroz, remédio, lâmpada, garrafa, sapato, café, televisão, dinheiro, chave, água, ônibus, uva, boné, panela, médico, conta de luz, casa, leite, luz.
