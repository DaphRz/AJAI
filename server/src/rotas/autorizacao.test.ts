// Testes de autorização e de gabarito que completam o passo 11 (item 6). Os demais casos estão em
// contas.test.ts (cadastro, login, aprovação, vínculos, senha), professor.test.ts (passo 8) e
// progresso.test.ts. Banco TEMPORÁRIO (AJAI_DB): o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-autorizacao-"));
process.env.AJAI_DB = join(pasta, "ajai.db");
process.env.LIMITE_LOGIN_POR_MINUTO = "1000";

const { abrirBanco } = await import("../../db/conectar.mjs");
const { semear, SENHA_DEMO } = await import("../../db/seed.mjs");
const { construirApp } = await import("../app.ts");
const { banco, fecharBanco } = await import("../banco.ts");

let app: FastifyInstance;
const tokens: Record<string, string> = {};
type Metodo = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function chamar(quem: string, method: Metodo, url: string, payload?: unknown) {
  return app.inject({ method, url, payload: payload as object, headers: { authorization: `Bearer ${tokens[quem]}` } });
}

async function entrar(identificador: string): Promise<string> {
  const r = await app.inject({ method: "POST", url: "/auth/login", payload: { identificador, senha: SENHA_DEMO } });
  assert.equal(r.statusCode, 200, r.body);
  return r.json().token;
}

/** Procura, em qualquer profundidade, um campo do gabarito. */
function camposDoGabarito(valor: unknown, caminho = "$"): string[] {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => camposDoGabarito(v, `${caminho}[${i}]`));
  if (valor && typeof valor === "object") {
    return Object.entries(valor).flatMap(([chave, v]) =>
      ["correta", "respostaCorreta"].includes(chave) ? [`${caminho}.${chave}`] : camposDoGabarito(v, `${caminho}.${chave}`),
    );
  }
  return [];
}

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
  tokens.maria = await entrar("maria.silva"); // aluna nova (id 1)
  tokens.ana = await entrar("ana.souza"); // id 2
  tokens.clara = await entrar("clara.santos"); // id 4
  tokens.rafael = await entrar("rafael@ajai.app"); // professor APROVADO dos 4 alunos
  tokens.joana = await entrar("joana@ajai.app"); // responsável do Bruno (id 3)
  tokens.escola = await entrar("instituicao@ajai.app");
  tokens.admin = await entrar("admin@ajai.app");
});

after(async () => {
  await app.close();
  fecharBanco();
  rmSync(pasta, { recursive: true, force: true });
});

describe("gabarito nunca sai antes de responder", () => {
  it("GET /niveis/:id/atividades, em todas as etapas, sem `correta` nem `respostaCorreta`", async () => {
    const niveis = (await chamar("ana", "GET", "/niveis")).json().niveis as { idNivel: number }[];
    assert.ok(niveis.length >= 5);
    for (const { idNivel } of niveis) {
      const r = await chamar("ana", "GET", `/niveis/${idNivel}/atividades`);
      assert.equal(r.statusCode, 200);
      assert.ok(r.json().atividades.length > 0);
      assert.deepEqual(camposDoGabarito(r.json()), [], `etapa ${idNivel}`);
    }
  });

  it("GET /atividades/:id sem gabarito, nem para a ESCRITA (texto da resposta não aparece)", async () => {
    const escritas = banco()
      .prepare("SELECT idAtividade, respostaCorreta FROM Atividade WHERE tipo = 'ESCRITA' AND status = 'ATIVA'")
      .all() as { idAtividade: number; respostaCorreta: string }[];
    assert.ok(escritas.length > 0);
    for (const { idAtividade, respostaCorreta } of escritas) {
      const r = await chamar("ana", "GET", `/atividades/${idAtividade}`);
      assert.equal(r.statusCode, 200);
      assert.deepEqual(camposDoGabarito(r.json()), []);
      assert.ok(!JSON.stringify(r.json().atividade.alternativas).includes(respostaCorreta));
    }
  });

  it("GET /nivelamento sem gabarito", async () => {
    const r = await chamar("maria", "GET", "/nivelamento");
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().perguntas.length, 10);
    assert.deepEqual(camposDoGabarito(r.json()), []);
  });

  it("GET /alunos/eu/progresso (próxima atividade) sem gabarito", async () => {
    const r = await chamar("ana", "GET", "/alunos/eu/progresso");
    assert.equal(r.statusCode, 200);
    assert.deepEqual(camposDoGabarito(r.json()), []);
  });

  it("o gabarito só aparece no cadastro de atividades (/gestao), que o aluno não acessa", async () => {
    assert.equal((await chamar("ana", "GET", "/gestao/atividades")).statusCode, 403);
    assert.equal((await chamar("joana", "GET", "/gestao/atividades/1")).statusCode, 403);
  });
});

describe("aluno não acessa rotas de outros perfis", () => {
  const rotas: [Metodo, string][] = [
    ["GET", "/professor/painel"],
    ["GET", "/professor/alunos/2"],
    ["GET", "/professor/relatorios/frequencia"],
    ["GET", "/professor/relatorios/dificuldades"],
    ["GET", "/professor/turmas"],
    ["PATCH", "/respostas/1/correcao"],
    ["GET", "/responsavel/recomendacoes"],
    ["GET", "/instituicao/eu"],
    ["GET", "/instituicao/professores"],
    ["GET", "/admin/instituicoes"],
  ];
  for (const [metodo, url] of rotas) {
    it(`${metodo} ${url} = 403`, async () => {
      const corpo = metodo === "PATCH" ? { correta: true } : undefined;
      assert.equal((await chamar("ana", metodo, url, corpo)).statusCode, 403);
    });
  }

  it("aluno só vê o próprio progresso (não há rota de progresso de outro aluno)", async () => {
    assert.equal((await chamar("ana", "GET", "/alunos/1/progresso")).statusCode, 404);
  });

  it("responsável e instituição também não acessam as rotas do professor", async () => {
    for (const quem of ["joana", "escola"]) {
      assert.equal((await chamar(quem, "GET", "/professor/painel")).statusCode, 403);
      assert.equal((await chamar(quem, "GET", "/professor/relatorios/dificuldades")).statusCode, 403);
    }
  });
});

describe("vínculo desfeito: o professor perde o acesso em todas as rotas do passo 8", () => {
  let idResposta: number;

  before(async () => {
    idResposta = (banco().prepare("SELECT idResposta FROM Resposta WHERE idAluno = 4 LIMIT 1").get() as { idResposta: number })
      .idResposta;
    // Antes: o Rafael vê a Clara.
    assert.equal((await chamar("rafael", "GET", "/professor/alunos/4")).statusCode, 200);
    // A Clara desfaz o vínculo com o Rafael.
    const vinculo = (await chamar("clara", "GET", "/alunos/eu/vinculos")).json().vinculos.find(
      (v: { acompanhante: { nome: string } }) => v.acompanhante.nome === "Rafael Costa",
    );
    assert.equal((await chamar("clara", "DELETE", `/alunos/eu/vinculos/${vinculo.idVinculo}`)).statusCode, 200);
  });

  it("some do painel", async () => {
    const r = await chamar("rafael", "GET", "/professor/painel");
    assert.equal(r.statusCode, 200);
    assert.doesNotMatch(r.body, /Clara/);
  });

  it("métricas individuais = 404", async () => {
    assert.equal((await chamar("rafael", "GET", "/professor/alunos/4")).statusCode, 404);
  });

  it("some dos relatórios de frequência e de dificuldades", async () => {
    const freq = await chamar("rafael", "GET", "/professor/relatorios/frequencia");
    assert.equal(freq.statusCode, 200);
    assert.doesNotMatch(freq.body, /Clara/);
    assert.ok(!freq.json().porAluno.some((p: { aluno: { idUsuario: number } }) => p.aluno.idUsuario === 4));
    assert.equal((await chamar("rafael", "GET", "/professor/relatorios/dificuldades")).statusCode, 200);
  });

  it("não corrige resposta nem muda de turma (404)", async () => {
    assert.equal((await chamar("rafael", "PATCH", `/respostas/${idResposta}/correcao`, { correta: true })).statusCode, 404);
    assert.equal((await chamar("rafael", "PUT", "/professor/alunos/4/turma", { idTurma: 1 })).statusCode, 404);
  });

  it("um convite novo, ainda PENDENTE, não devolve o acesso", async () => {
    assert.equal((await chamar("rafael", "POST", "/vinculos", { aluno: "clara.santos" })).statusCode, 201);
    assert.equal((await chamar("rafael", "GET", "/professor/alunos/4")).statusCode, 404);
    assert.doesNotMatch((await chamar("rafael", "GET", "/professor/painel")).body, /Clara/);
  });
});

describe("responsável sem vínculo ACEITO", () => {
  it("convite PENDENTE: nem nome, nem recomendações", async () => {
    assert.equal((await chamar("joana", "POST", "/vinculos", { aluno: "ana.souza" })).statusCode, 201);
    const r = await chamar("joana", "GET", "/responsavel/recomendacoes");
    assert.equal(r.statusCode, 200);
    assert.doesNotMatch(r.body, /Ana/);
    assert.doesNotMatch((await chamar("joana", "GET", "/vinculos")).body, /Ana Souza/);
  });

  it("vínculo desfeito: as recomendações somem", async () => {
    const doBruno = (await chamar("joana", "GET", "/vinculos")).json().vinculos.find(
      (v: { aluno?: { idUsuario: number } }) => v.aluno?.idUsuario === 3,
    );
    assert.equal((await chamar("joana", "DELETE", `/vinculos/${doBruno.idVinculo}`)).statusCode, 200);
    const r = await chamar("joana", "GET", "/responsavel/recomendacoes");
    assert.deepEqual(r.json().pessoas, []);
  });
});
