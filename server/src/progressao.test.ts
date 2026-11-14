// Testes das regras puras de progressão (npm run server:test).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcularOfensiva,
  definirNivelInicial,
  diasEsperados,
  diasNoPeriodo,
  estaNoPeriodo,
  recomendacoesParaFamilia,
  serieDiaria,
  situacaoDoAluno,
  deveAvancar,
  diaNoFuso,
  escolherProximaAtividade,
  frequenciaRecente,
  identificarDificuldades,
  somarDias,
  JANELA_PROGRESSAO,
  statusDaTrilha,
  taxaDeAcerto,
} from "./progressao.ts";

const trilha = [
  { idNivel: 1, ordem: 1, criterioAcerto: 0.8 },
  { idNivel: 2, ordem: 2, criterioAcerto: 0.8 },
  { idNivel: 3, ordem: 3, criterioAcerto: 0.8 },
];

const respostas = (padrao: boolean[], idAtividade = 1) => padrao.map((correta) => ({ idAtividade, correta }));

describe("taxaDeAcerto", () => {
  it("sem respostas é 0", () => assert.equal(taxaDeAcerto([]), 0));
  it("conta a fração de acertos", () => assert.equal(taxaDeAcerto(respostas([true, false, true, true])), 0.75));
});

describe("definirNivelInicial", () => {
  // 2 perguntas por nível (um par), em ordem crescente; o aluno para no primeiro erro.
  const perguntas = [{ idNivel: 1 }, { idNivel: 1 }, { idNivel: 2 }, { idNivel: 2 }, { idNivel: 3 }, { idNivel: 3 }];

  it("acerta tudo: último nível", () => {
    assert.equal(definirNivelInicial(perguntas, [true, true, true, true, true, true], trilha).idNivel, 3);
  });
  it("erra a primeira: começa na primeira etapa", () => {
    assert.equal(definirNivelInicial(perguntas, [false], trilha).idNivel, 1);
  });
  it("erra a 2ª do par: fica no nível do par (não domina)", () => {
    assert.equal(definirNivelInicial(perguntas, [true, false], trilha).idNivel, 1);
    assert.equal(definirNivelInicial(perguntas, [true, true, true, false], trilha).idNivel, 2);
  });
  it("acerta o par e erra a 1ª do próximo: começa no próximo nível", () => {
    assert.equal(definirNivelInicial(perguntas, [true, true, false], trilha).idNivel, 2);
    assert.equal(definirNivelInicial(perguntas, [true, true, true, true, false], trilha).idNivel, 3);
  });
  it("ignora acertos depois do primeiro erro", () => {
    assert.equal(definirNivelInicial(perguntas, [true, false, true, true], trilha).idNivel, 1);
  });
  it("parou no meio sem errar: nível da última pergunta respondida", () => {
    assert.equal(definirNivelInicial(perguntas, [true, true, true], trilha).idNivel, 2);
  });
  it("sem perguntas: primeira etapa", () => {
    assert.equal(definirNivelInicial([], [], trilha).idNivel, 1);
  });
});

describe("deveAvancar", () => {
  const nivel = trilha[0];

  it(`menos de ${JANELA_PROGRESSAO} respostas: não avança`, () => {
    assert.equal(deveAvancar(nivel, respostas([true, true, true, true])), false);
  });
  it("exatamente no critério (4 de 5 = 0,8): avança", () => {
    assert.equal(deveAvancar(nivel, respostas([true, false, true, true, true])), true);
  });
  it("abaixo do critério (3 de 5): não avança", () => {
    assert.equal(deveAvancar(nivel, respostas([true, false, true, false, true])), false);
  });
  it("só as últimas 5 contam (erros antigos não seguram o aluno)", () => {
    assert.equal(deveAvancar(nivel, respostas([false, false, false, true, true, true, true, true])), true);
  });
});

describe("identificarDificuldades", () => {
  const atividades = [
    { idAtividade: 1, conteudo: "Letra B" },
    { idAtividade: 2, conteudo: "Letra A" },
    { idAtividade: 3, conteudo: "Letra B" },
  ];

  it("sem respostas: lista vazia", () => assert.deepEqual(identificarDificuldades([], atividades), []));

  it("agrupa por conteúdo e ordena da menor taxa para a maior", () => {
    const lista = [
      ...respostas([true, true], 2),
      ...respostas([false, true], 1),
      ...respostas([false], 3),
      ...respostas([true], 99), // atividade desconhecida: ignorada
    ];
    assert.deepEqual(identificarDificuldades(lista, atividades), [
      { conteudo: "Letra B", tentativas: 3, erros: 2, taxaAcerto: 1 / 3 },
      { conteudo: "Letra A", tentativas: 2, erros: 0, taxaAcerto: 1 },
    ]);
  });
});

describe("escolherProximaAtividade", () => {
  const etapa = [{ idAtividade: 10 }, { idAtividade: 11 }, { idAtividade: 12 }];

  it("etapa vazia: nenhuma", () => assert.equal(escolherProximaAtividade([], []), undefined));

  it("primeiro as que ainda não acertou, na ordem", () => {
    const r = [{ idAtividade: 10, correta: true }, { idAtividade: 11, correta: false }];
    assert.equal(escolherProximaAtividade(etapa, r), 11);
  });

  it("não repete a que acabou de fazer, se houver outra", () => {
    assert.equal(escolherProximaAtividade(etapa, [], 10), 11);
  });

  it("acertou todas: a que faz mais tempo que não responde", () => {
    const r = [
      { idAtividade: 10, correta: true, dataHora: "2026-11-09T10:00:00Z" },
      { idAtividade: 11, correta: true, dataHora: "2026-11-09T08:00:00Z" },
      { idAtividade: 12, correta: true, dataHora: "2026-11-09T09:00:00Z" },
    ];
    assert.equal(escolherProximaAtividade(etapa, r), 11);
    assert.equal(escolherProximaAtividade(etapa, r, 11), 12);
  });

  it("etapa com uma atividade só: repete ela", () => {
    assert.equal(escolherProximaAtividade([{ idAtividade: 10 }], [{ idAtividade: 10, correta: true }], 10), 10);
  });
});

describe("statusDaTrilha", () => {
  it("marca concluídas, atual e bloqueadas", () => {
    assert.deepEqual(
      statusDaTrilha(trilha, 2).map((n) => n.status),
      ["CONCLUIDA", "ATUAL", "BLOQUEADA"],
    );
  });
  it("sem nível: tudo bloqueado", () => {
    assert.deepEqual(
      statusDaTrilha(trilha, undefined).map((n) => n.status),
      ["BLOQUEADA", "BLOQUEADA", "BLOQUEADA"],
    );
  });
});

// Ofensiva (RF15, passo 7). Brasília é UTC-3 (sem horário de verão desde 2019):
// 12h de Brasília = 15h UTC; 23h de Brasília = 02h UTC do dia seguinte.
const meioDia = (dia: string) => `${dia}T15:00:00.000Z`;

describe("diaNoFuso e somarDias", () => {
  it("usa o dia de Brasília, não o dia UTC", () => {
    assert.equal(diaNoFuso("2026-11-15T02:30:00.000Z"), "2026-11-14"); // 23h30 do dia 14 em Brasília
    assert.equal(diaNoFuso("2026-11-15T03:00:00.000Z"), "2026-11-15"); // meia-noite do dia 15
  });
  it("soma dias atravessando mês e ano", () => {
    assert.equal(somarDias("2026-03-01", -1), "2026-02-28");
    assert.equal(somarDias("2026-12-31", 1), "2027-01-01");
  });
});

describe("calcularOfensiva", () => {
  const agora = new Date(meioDia("2026-11-14"));

  it("sem respostas é 0", () => assert.deepEqual(calcularOfensiva([], agora), { dias: 0, praticouHoje: false }));

  it("conta os dias seguidos até hoje (várias respostas no mesmo dia contam 1)", () => {
    const datas = [meioDia("2026-11-12"), meioDia("2026-11-13"), meioDia("2026-11-14"), "2026-11-14T20:00:00.000Z"];
    assert.deepEqual(calcularOfensiva(datas, agora), { dias: 3, praticouHoje: true });
  });

  it("ainda não treinou hoje: a sequência até ontem continua valendo", () => {
    const datas = [meioDia("2026-11-12"), meioDia("2026-11-13")];
    assert.deepEqual(calcularOfensiva(datas, agora), { dias: 2, praticouHoje: false });
  });

  it("um dia sem uso quebra a sequência", () => {
    // treinou 10, 11 e 12; ficou sem usar no dia 13; hoje é 14 sem treino → zerou
    const datas = [meioDia("2026-11-10"), meioDia("2026-11-11"), meioDia("2026-11-12")];
    assert.equal(calcularOfensiva(datas, agora).dias, 0);
    // voltou hoje: recomeça em 1
    assert.deepEqual(calcularOfensiva([...datas, meioDia("2026-11-14")], agora), { dias: 1, praticouHoje: true });
  });

  it("a ordem das respostas não importa", () => {
    const datas = [meioDia("2026-11-14"), meioDia("2026-11-12"), meioDia("2026-11-13")];
    assert.equal(calcularOfensiva(datas, agora).dias, 3);
  });

  it("virada de dia: 23h de Brasília ainda é o mesmo dia (já é o dia seguinte em UTC)", () => {
    // respondeu às 23h de 13/11 (02h UTC de 14/11); agora são 10h de 14/11
    const datas = ["2026-11-14T02:00:00.000Z"];
    const r = calcularOfensiva(datas, new Date("2026-11-14T13:00:00.000Z"));
    assert.deepEqual(r, { dias: 1, praticouHoje: false });
  });

  it("virada de dia: depois da meia-noite de Brasília o 'hoje' muda", () => {
    const datas = [meioDia("2026-11-13")];
    // 23h59 de 13/11 em Brasília: treinou hoje
    assert.equal(calcularOfensiva(datas, new Date("2026-11-14T02:59:00.000Z")).praticouHoje, true);
    // 00h01 de 14/11 em Brasília: não treinou hoje, mas a ofensiva continua (foi ontem)
    assert.deepEqual(calcularOfensiva(datas, new Date("2026-11-14T03:01:00.000Z")), { dias: 1, praticouHoje: false });
    // 00h01 de 15/11: passou um dia inteiro sem treino → zerou
    assert.equal(calcularOfensiva(datas, new Date("2026-11-15T03:01:00.000Z")).dias, 0);
  });

  it("respeita outro fuso quando pedido", () => {
    const datas = ["2026-11-14T02:00:00.000Z"]; // 13/11 em Brasília, 14/11 em UTC
    assert.equal(calcularOfensiva(datas, new Date("2026-11-14T13:00:00.000Z"), "UTC").praticouHoje, true);
  });
});

describe("frequenciaRecente", () => {
  const agora = new Date(meioDia("2026-11-14"));

  it("conta atividades e dias dos últimos 7 dias, hoje incluído", () => {
    const datas = [
      meioDia("2026-11-07"), // 8 dias atrás contando hoje: fora
      meioDia("2026-11-08"), // 1º dia da janela
      meioDia("2026-11-10"),
      meioDia("2026-11-10"),
      meioDia("2026-11-14"),
    ];
    assert.deepEqual(frequenciaRecente(datas, agora), { atividades: 4, diasComAtividade: 3 });
  });

  it("sem respostas: zero", () => assert.deepEqual(frequenciaRecente([], agora), { atividades: 0, diasComAtividade: 0 }));

  it("usa o dia de Brasília na borda da janela", () => {
    // 23h de 07/11 em Brasília (02h UTC de 08/11): fora da janela que começa em 08/11
    assert.equal(frequenciaRecente(["2026-11-08T02:00:00.000Z"], agora).atividades, 0);
  });
});

describe("área do professor (passo 8)", () => {
  it("diasNoPeriodo conta início e fim, atravessando mês e ano", () => {
    assert.equal(diasNoPeriodo("2026-11-08", "2026-11-14"), 7);
    assert.equal(diasNoPeriodo("2026-12-30", "2027-01-02"), 4);
    assert.equal(diasNoPeriodo("2026-11-14", "2026-11-14"), 1);
  });

  it("estaNoPeriodo usa o dia de Brasília", () => {
    // 01h UTC de 15/11 = 22h de 14/11 em Brasília.
    assert.equal(estaNoPeriodo("2026-11-15T01:00:00.000Z", "2026-11-08", "2026-11-14"), true);
    assert.equal(estaNoPeriodo("2026-11-15T03:30:00.000Z", "2026-11-08", "2026-11-14"), false);
  });

  it("diasEsperados: 3 por semana, proporcional, mínimo 1", () => {
    assert.equal(diasEsperados(7), 3);
    assert.equal(diasEsperados(30), 13);
    assert.equal(diasEsperados(1), 1);
  });

  it("situacaoDoAluno segue a regra documentada", () => {
    const base = { diasNoPeriodo: 7, diasAtivos: 4, totalAtividades: 10, taxaAcerto: 0.8 };
    assert.equal(situacaoDoAluno(base), "EM_DIA");
    assert.equal(situacaoDoAluno({ ...base, totalAtividades: 0, taxaAcerto: 0 }), "ATENCAO");
    assert.equal(situacaoDoAluno({ ...base, taxaAcerto: 0.59 }), "REFORCO");
    assert.equal(situacaoDoAluno({ ...base, taxaAcerto: 0.6, diasAtivos: 3 }), "EM_DIA");
    assert.equal(situacaoDoAluno({ ...base, diasAtivos: 2 }), "ATENCAO");
    // Reforço tem prioridade sobre pouca frequência.
    assert.equal(situacaoDoAluno({ ...base, diasAtivos: 1, taxaAcerto: 0.3 }), "REFORCO");
  });

  it("serieDiaria tem um ponto por dia, com null nos dias sem atividade", () => {
    const serie = serieDiaria(
      [
        { dataHora: "2026-11-12T15:00:00.000Z", correta: true },
        { dataHora: "2026-11-12T16:00:00.000Z", correta: false },
        { dataHora: "2026-11-14T12:00:00.000Z", correta: true },
        { dataHora: "2026-10-01T12:00:00.000Z", correta: true }, // fora do período
      ],
      "2026-11-12",
      "2026-11-14",
    );
    assert.deepEqual(serie, [
      { dia: "2026-11-12", atividades: 2, acertos: 1, taxaAcerto: 0.5 },
      { dia: "2026-11-13", atividades: 0, acertos: 0, taxaAcerto: null },
      { dia: "2026-11-14", atividades: 1, acertos: 1, taxaAcerto: 1 },
    ]);
  });

  it("recomendacoesParaFamilia: até 3 frases positivas", () => {
    assert.deepEqual(recomendacoesParaFamilia({ primeiroNome: "Maria", diasNaSemana: 0 }), [
      "Maria ainda não começou. Ajude a fazer as primeiras perguntas no aplicativo.",
    ]);
    const frases = recomendacoesParaFamilia({ primeiroNome: "Bruno", diasNaSemana: 3, nomeEtapa: "Sílabas", conteudoParaTreinar: "Sílaba BO" });
    assert.deepEqual(frases, [
      "Bruno treinou 3 dias nos últimos 7 dias. Treinar um pouco todo dia ajuda.",
      "Vale a pena treinar junto: Sílaba BO.",
      "Bruno está na etapa Sílabas.",
    ]);
    assert.match(recomendacoesParaFamilia({ primeiroNome: "Ana", diasNaSemana: 5, nomeEtapa: "Letras" })[0], /Muito bem!/);
    for (const f of frases) assert.doesNotMatch(f, /erro|falha|inválid/i);
  });
});
