// Testes das regras puras de progressão (npm run server:test).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  definirNivelInicial,
  deveAvancar,
  escolherProximaAtividade,
  identificarDificuldades,
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
