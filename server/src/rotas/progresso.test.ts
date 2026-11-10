// Testes de API das respostas, do nivelamento e do progresso (npm run server:test).
// Usam um banco TEMPORÁRIO (variável AJAI_DB), criado e semeado aqui: o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-"));
process.env.AJAI_DB = join(pasta, "ajai.db");

// Importados DEPOIS de definir AJAI_DB (o caminho do banco é lido ao importar).
const { abrirBanco } = await import("../../db/conectar.mjs");
const { semear, SENHA_DEMO } = await import("../../db/seed.mjs");
const { construirApp } = await import("../app.ts");
const { banco, fecharBanco } = await import("../banco.ts");

let app: FastifyInstance;
const tokens: Record<string, string> = {};

async function entrar(identificador: string): Promise<string> {
  const r = await app.inject({ method: "POST", url: "/auth/login", payload: { identificador, senha: SENHA_DEMO } });
  assert.equal(r.statusCode, 200, r.body);
  return r.json().token;
}

function chamar(quem: string, method: "GET" | "POST", url: string, payload?: unknown) {
  return app.inject({ method, url, payload: payload as object, headers: { authorization: `Bearer ${tokens[quem]}` } });
}

/** Nível atual direto do banco (a fonte da verdade). */
function nivelNoBanco(idAluno: number): number | null {
  return (banco().prepare("SELECT idNivelAtual FROM vw_aluno WHERE idUsuario = ?").get(idAluno) as { idNivelAtual: number | null })
    .idNivelAtual;
}

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
  tokens.maria = await entrar("maria.silva"); // aluna nova (id 1), sem nível
  tokens.ana = await entrar("ana.souza"); // aluna no nível 1 (id 2)
  tokens.professor = await entrar("rafael@ajai.app");
});

after(async () => {
  await app.close();
  fecharBanco();
  rmSync(pasta, { recursive: true, force: true });
});

describe("POST /respostas", () => {
  it("exige login de aluno", async () => {
    assert.equal((await app.inject({ method: "POST", url: "/respostas", payload: { idAtividade: 1, respostaDada: "x" } })).statusCode, 401);
    assert.equal((await chamar("professor", "POST", "/respostas", { idAtividade: 1, respostaDada: "x" })).statusCode, 403);
  });

  it("aluno sem nivelamento precisa fazer as perguntas do começo", async () => {
    const r = await chamar("maria", "POST", "/respostas", { idAtividade: 1, respostaDada: "Bola" });
    assert.equal(r.statusCode, 409);
  });

  it("atividade inexistente: 404", async () => {
    assert.equal((await chamar("ana", "POST", "/respostas", { idAtividade: 9999, respostaDada: "x" })).statusCode, 404);
  });

  it("corrige (acento/maiúscula), grava a Resposta e atualiza o DesempenhoConteudo", async () => {
    const db = banco();
    const antes = db.prepare("SELECT totalTentativas, totalAcertos FROM DesempenhoConteudo WHERE idAluno = 2 AND idNivel = 1 AND conteudo = (SELECT conteudo FROM Atividade WHERE idAtividade = 2)").get() as { totalTentativas: number; totalAcertos: number };
    const qtd = (db.prepare("SELECT COUNT(*) AS n FROM Resposta WHERE idAluno = 2").get() as { n: number }).n;

    const r = await chamar("ana", "POST", "/respostas", { idAtividade: 2, respostaDada: "  mao ", tempoRespostaSeg: 7 });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().correta, true);
    assert.equal(r.json().nivelAtual.idNivel, nivelNoBanco(2));

    const gravada = db.prepare("SELECT respostaDada, correta, tempoRespostaSeg FROM Resposta WHERE idAluno = 2 ORDER BY idResposta DESC LIMIT 1").get() as Record<string, unknown>;
    assert.deepEqual({ ...gravada }, { respostaDada: "  mao ", correta: 1, tempoRespostaSeg: 7 });
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM Resposta WHERE idAluno = 2").get() as { n: number }).n, qtd + 1);

    const depois = db.prepare("SELECT totalTentativas, totalAcertos, taxaAcerto FROM DesempenhoConteudo WHERE idAluno = 2 AND idNivel = 1 AND conteudo = (SELECT conteudo FROM Atividade WHERE idAtividade = 2)").get() as { totalTentativas: number; totalAcertos: number; taxaAcerto: number };
    assert.equal(depois.totalTentativas, antes.totalTentativas + 1);
    assert.equal(depois.totalAcertos, antes.totalAcertos + 1);
    assert.equal(depois.taxaAcerto, depois.totalAcertos / depois.totalTentativas);
  });

  it("não devolve o gabarito", async () => {
    const r = await chamar("ana", "POST", "/respostas", { idAtividade: 1, respostaDada: "Pato" });
    assert.equal(r.statusCode, 201);
    assert.equal(r.json().correta, false);
    assert.equal(r.json().subiuDeNivel, false);
    assert.doesNotMatch(r.body, /respostaCorreta|Bola/);
  });
});

describe("POST /nivelamento/concluir", () => {
  it("recusa respostas fora da ordem (pular para a pergunta mais difícil)", async () => {
    const r = await chamar("maria", "POST", "/nivelamento/concluir", { respostas: [{ idAtividade: 7, respostaDada: "O cartão do SUS" }] });
    assert.equal(r.statusCode, 400);
    assert.equal(nivelNoBanco(1), null);
  });

  it("corrige de novo no servidor, grava as respostas e define o nível inicial", async () => {
    // Perguntas do nivelamento no seed: 1 (etapa 1), 3 (etapa 2), 4 (etapa 3), 5, 7. Erra a 3ª.
    const r = await chamar("maria", "POST", "/nivelamento/concluir", {
      respostas: [
        { idAtividade: 1, respostaDada: "BOLA", tempoRespostaSeg: 5 },
        { idAtividade: 3, respostaDada: "bo", tempoRespostaSeg: 6 },
        { idAtividade: 4, respostaDada: "SACA", tempoRespostaSeg: 9 },
      ],
    });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().nivel.idNivel, 2);
    assert.equal(nivelNoBanco(1), 2);
    const db = banco();
    assert.equal((db.prepare("SELECT idNivelInicial FROM Aluno WHERE idUsuario = 1").get() as { idNivelInicial: number }).idNivelInicial, 2);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM Resposta WHERE idAluno = 1").get() as { n: number }).n, 3);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM HistoricoNivel WHERE idAluno = 1").get() as { n: number }).n, 1);

    // O login (GET /auth/eu) já devolve o nível: o aluno continua de onde parou ao reabrir o app.
    const eu = await chamar("maria", "GET", "/auth/eu");
    assert.equal(eu.json().usuario.idNivelAtual, 2);
    assert.equal(eu.json().usuario.idNivelInicial, 2);
  });

  it("não deixa refazer o nivelamento", async () => {
    const r = await chamar("maria", "POST", "/nivelamento/concluir", { respostas: [] });
    assert.equal(r.statusCode, 409);
  });
});

describe("GET /alunos/eu/progresso", () => {
  it("só para aluno", async () => {
    assert.equal((await chamar("professor", "GET", "/alunos/eu/progresso")).statusCode, 403);
  });

  it("devolve nível, trilha com status, totais, dificuldades e a próxima atividade", async () => {
    const r = await chamar("maria", "GET", "/alunos/eu/progresso");
    assert.equal(r.statusCode, 200, r.body);
    const p = r.json();
    assert.equal(p.nivelAtual.idNivel, 2);
    assert.deepEqual(p.trilha.map((n: { status: string }) => n.status), ["CONCLUIDA", "ATUAL", "BLOQUEADA", "BLOQUEADA", "BLOQUEADA"]);
    assert.equal(p.totalAtividades, 3);
    assert.equal(p.totalAcertos, 2);
    assert.equal(p.dificuldades.length, 1);
    assert.equal(p.dificuldades[0].erros, 1);
    // Etapa 2 só tem a atividade 3, que ela já acertou: repete (é a única).
    assert.equal(p.proximaAtividade, 3);
  });

  it("etapa com uma atividade só: repete ela mesmo sendo a anterior", async () => {
    const r = await chamar("maria", "GET", "/alunos/eu/progresso?anterior=3");
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().proximaAtividade, 3);
  });
});

describe("POST /atividades/:id/corrigir", () => {
  it("só corrige perguntas do nivelamento", async () => {
    assert.equal((await chamar("ana", "POST", "/atividades/1/corrigir", { respostaDada: "Bola" })).json().correta, true);
    assert.equal((await chamar("ana", "POST", "/atividades/2/corrigir", { respostaDada: "Mão" })).statusCode, 404);
  });
});

// Depende do estado deixado acima: Maria na etapa 2 (criterioAcerto 0,7), com 1 acerto nela
// (a pergunta 3 do nivelamento). A etapa 2 do seed só tem a atividade 3 ("BO").
describe("progressão de nível (RF16)", () => {
  it("sobe quando as últimas 5 respostas da etapa batem o critério, e grava o HistoricoNivel", async () => {
    const responder = async (respostaDada: string) => {
      const r = await chamar("maria", "POST", "/respostas", { idAtividade: 3, respostaDada });
      assert.equal(r.statusCode, 201, r.body);
      return r.json() as { correta: boolean; subiuDeNivel: boolean; nivelAtual: { idNivel: number } };
    };
    assert.equal((await responder("BA")).subiuDeNivel, false); // [C, E]
    assert.equal((await responder("BO")).subiuDeNivel, false); // [C, E, C]: menos de 5
    assert.equal((await responder("bo")).subiuDeNivel, false); // [C, E, C, C]
    const quinta = await responder("Bo"); // [C, E, C, C, C] = 4/5 = 0,8 >= 0,7
    assert.equal(quinta.subiuDeNivel, true);
    assert.equal(quinta.nivelAtual.idNivel, 3);
    assert.equal(nivelNoBanco(1), 3);
    const historico = banco().prepare("SELECT idNivel FROM HistoricoNivel WHERE idAluno = 1 ORDER BY idHistorico").all() as { idNivel: number }[];
    assert.deepEqual(historico.map((h) => h.idNivel), [2, 3]);
  });

  it("resposta de outra etapa conta no desempenho, mas não mexe no nível", async () => {
    const r = await chamar("maria", "POST", "/respostas", { idAtividade: 3, respostaDada: "BO" });
    assert.equal(r.json().subiuDeNivel, false);
    assert.equal(r.json().nivelAtual.idNivel, 3);
  });
});
