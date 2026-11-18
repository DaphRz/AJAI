// Testes da correção automática (RF12; passo 11, item 1): acentos, maiúsculas e espaços.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { corrigirAutomaticamente, normalizarResposta } from "./correcao.ts";

describe("corrigirAutomaticamente", () => {
  it("resposta igual ao gabarito: certa", () => assert.equal(corrigirAutomaticamente("CASA", "CASA"), true));

  it("tolera maiúsculas e minúsculas", () => {
    assert.equal(corrigirAutomaticamente("CASA", "casa"), true);
    assert.equal(corrigirAutomaticamente("Banco", "bAnCo"), true);
  });

  it("tolera acentos (o aluno pode não saber digitar)", () => {
    assert.equal(corrigirAutomaticamente("PÃO", "pao"), true);
    assert.equal(corrigirAutomaticamente("Mão", "MAO"), true);
    assert.equal(corrigirAutomaticamente("ÔNIBUS", "onibus"), true);
    assert.equal(corrigirAutomaticamente("Remédio", "remedio"), true);
    assert.equal(corrigirAutomaticamente("CAFE", "café"), true);
    assert.equal(corrigirAutomaticamente("Coração", "coracao"), true);
  });

  it("tolera espaços no começo, no fim e repetidos no meio", () => {
    assert.equal(corrigirAutomaticamente("CASA", "  casa  "), true);
    assert.equal(corrigirAutomaticamente("O cartão do SUS", "o   cartao  do sus"), true);
    assert.equal(corrigirAutomaticamente("BOM DIA", "bom\tdia\n"), true);
  });

  it("palavra diferente continua errada", () => {
    assert.equal(corrigirAutomaticamente("CASA", "CASAS"), false);
    assert.equal(corrigirAutomaticamente("PÃO", "PAU"), false);
    assert.equal(corrigirAutomaticamente("BOLA", "BOL A"), false);
    assert.equal(corrigirAutomaticamente("CASA", ""), false);
  });

  it("ç vira c: não confunde com outra letra", () => {
    assert.equal(corrigirAutomaticamente("Açúcar", "acucar"), true);
    assert.equal(corrigirAutomaticamente("Açúcar", "asucar"), false);
  });
});

describe("normalizarResposta", () => {
  it("tira acento, espaços sobrando e deixa em maiúsculas", () => {
    assert.equal(normalizarResposta("  São   Paulo "), "SAO PAULO");
  });
});
