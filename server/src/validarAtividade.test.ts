// Testes da validação do cadastro de atividades (passo 9; npm test). Função pura: sem banco.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pecasFormamPalavra, validarAtividade, type AtividadeEnviada } from "./validarAtividade.ts";

const opcoes = (...textos: string[]) => textos.map((texto, i) => ({ texto, correta: i === 0 }));

function falha(dados: AtividadeEnviada): string {
  const r = validarAtividade(dados);
  assert.equal(r.ok, false, "deveria recusar");
  return r.ok ? "" : r.mensagem;
}

describe("validarAtividade: múltipla escolha", () => {
  const base: AtividadeEnviada = {
    tipo: "SILABA",
    conteudo: "Sílaba MA",
    enunciado: "Qual sílaba começa a palavra?",
    textoApoio: "MALA",
    alternativas: opcoes("MA", "LA", "PA"),
  };

  it("aceita 3 alternativas com 1 certa e usa o texto da certa como gabarito", () => {
    const r = validarAtividade(base);
    assert.ok(r.ok);
    assert.equal(r.atividade.respostaCorreta, "MA");
    assert.deepEqual(r.atividade.alternativas.map((a) => a.ordem), [1, 2, 3]);
  });

  it("recusa nenhuma ou duas certas", () => {
    assert.match(falha({ ...base, alternativas: base.alternativas!.map((a) => ({ ...a, correta: false })) }), /exatamente uma/);
    assert.match(falha({ ...base, alternativas: base.alternativas!.map((a, i) => ({ ...a, correta: i < 2 })) }), /exatamente uma/);
  });

  it("recusa alternativas repetidas (sem diferença de acento e maiúscula)", () => {
    assert.match(falha({ ...base, alternativas: [{ texto: "Pão", correta: true }, { texto: "pao" }] }), /diferentes/);
  });

  it("recusa menos de 2 ou mais de 4 alternativas (as vazias não contam)", () => {
    assert.match(falha({ ...base, alternativas: [{ texto: "MA", correta: true }, { texto: "  " }] }), /de 2 a 4/);
    assert.match(falha({ ...base, alternativas: opcoes("A", "B", "C", "D", "E") }), /de 2 a 4/);
  });

  it("FRASE e INTERPRETACAO precisam do texto de apoio", () => {
    assert.match(falha({ ...base, tipo: "FRASE", textoApoio: "" }), /frase/);
    assert.match(falha({ ...base, tipo: "INTERPRETACAO", textoApoio: undefined }), /texto/);
  });

  it("LETRA: o conteúdo é 'Letra X' e sai padronizado", () => {
    const r = validarAtividade({ ...base, tipo: "LETRA", conteudo: "letra  d", textoApoio: undefined });
    assert.ok(r.ok);
    assert.equal(r.atividade.conteudo, "Letra D");
    assert.match(falha({ ...base, tipo: "LETRA", conteudo: "Letra BO" }), /Letra B/);
  });
});

describe("validarAtividade: PALAVRA e ESCRITA", () => {
  const palavra: AtividadeEnviada = {
    tipo: "PALAVRA",
    conteudo: "Palavra SAPATO",
    enunciado: "Toque nas sílabas",
    textoApoio: "SAPATO",
    alternativas: [
      { texto: "TO", correta: true },
      { texto: "SA", correta: true },
      { texto: "BA" },
      { texto: "PA", correta: true },
    ],
  };

  it("aceita peças fora de ordem e com acento; o gabarito é a palavra", () => {
    const r = validarAtividade(palavra);
    assert.ok(r.ok);
    assert.equal(r.atividade.respostaCorreta, "SAPATO");
    assert.ok(validarAtividade({ ...palavra, textoApoio: "REMÉDIO", alternativas: [{ texto: "DIO", correta: true }, { texto: "RE", correta: true }, { texto: "MÉ", correta: true }] }).ok);
  });

  it("recusa peças que não formam a palavra", () => {
    assert.match(falha({ ...palavra, alternativas: palavra.alternativas!.map((a) => (a.texto === "PA" ? { texto: "PA" } : a)) }), /formam a palavra/);
    // Tamanho certo, letras erradas
    assert.match(falha({ ...palavra, alternativas: [{ texto: "SA", correta: true }, { texto: "TA", correta: true }, { texto: "PO", correta: true }] }), /formam/);
  });

  it("pecasFormamPalavra testa as combinações (não basta 'cada peça aparece na palavra')", () => {
    assert.equal(pecasFormamPalavra(["BA", "NA", "NA"], "BANANA"), true);
    assert.equal(pecasFormamPalavra(["NA", "NA", "NA"], "BANANA"), false);
    assert.equal(pecasFormamPalavra([], "CASA"), false);
  });

  it("ESCRITA: sem alternativas e com resposta", () => {
    const escrita: AtividadeEnviada = { tipo: "ESCRITA", conteudo: "Escrita SOL", enunciado: "Escreva SOL", respostaCorreta: " sol " };
    const r = validarAtividade(escrita);
    assert.ok(r.ok);
    assert.equal(r.atividade.respostaCorreta, "sol");
    assert.match(falha({ ...escrita, respostaCorreta: "" }), /resposta certa/);
    assert.match(falha({ ...escrita, alternativas: opcoes("SOL", "SAL") }), /não tem alternativas/);
  });
});
