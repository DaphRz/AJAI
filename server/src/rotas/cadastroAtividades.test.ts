// Testes do cadastro de atividades e níveis (passo 9; npm test): quem pode, o professor só mexe nas
// que criou, "excluir" só inativa, a validação do gabarito e o aluno continuando sem o gabarito.
// Banco TEMPORÁRIO (AJAI_DB): o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-cadastro-"));
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

async function entrar(identificador: string, senha = SENHA_DEMO): Promise<string> {
  const r = await app.inject({ method: "POST", url: "/auth/login", payload: { identificador, senha } });
  assert.equal(r.statusCode, 200, r.body);
  return r.json().token;
}

/** Atividade de múltipla escolha válida no nível 2. */
const novaSilaba = {
  idNivel: 2,
  tipo: "SILABA",
  conteudo: "Sílaba MA",
  enunciado: "Qual sílaba começa a palavra?",
  textoApoio: "MALA",
  alternativas: [
    { texto: "LA", correta: false },
    { texto: "MA", correta: true, ilustracao: "bag-suitcase" },
    { texto: "PA", correta: false },
  ],
};

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
  tokens.admin = await entrar("admin@ajai.app");
  tokens.rafael = await entrar("rafael@ajai.app"); // professor APROVADO
  tokens.paula = await entrar("paula@ajai.app"); // professor PENDENTE
  tokens.ana = await entrar("ana.souza");

  const r = await app.inject({
    method: "POST",
    url: "/auth/cadastro/professor",
    payload: { nome: "Lucas Prado", email: "lucas@teste.app", telefone: "11955554444", senha: "senha123", codigo: "EJAVV2", aceitouTermos: true },
  });
  assert.equal(r.statusCode, 201, r.body);
  banco().prepare("UPDATE Professor SET statusVinculo = 'APROVADO' WHERE idUsuario = ?").run(r.json().usuario.idUsuario);
  tokens.lucas = r.json().token;
});

after(async () => {
  await app.close();
  fecharBanco();
  rmSync(pasta, { recursive: true, force: true });
});

describe("quem pode usar o cadastro", () => {
  it("aluno e professor PENDENTE recebem 403", async () => {
    assert.equal((await chamar("ana", "GET", "/gestao/atividades")).statusCode, 403);
    assert.equal((await chamar("ana", "POST", "/gestao/atividades", novaSilaba)).statusCode, 403);
    assert.equal((await chamar("paula", "GET", "/gestao/atividades")).statusCode, 403);
    assert.equal((await chamar("paula", "POST", "/gestao/atividades", novaSilaba)).statusCode, 403);
  });

  it("sem login = 401", async () => {
    assert.equal((await app.inject({ method: "GET", url: "/gestao/niveis" })).statusCode, 401);
  });

  it("professor lista com o gabarito, mas não pode editar as do seed", async () => {
    const r = await chamar("rafael", "GET", "/gestao/atividades?idNivel=1");
    assert.equal(r.statusCode, 200);
    const [primeira] = r.json().atividades;
    assert.ok(primeira.respostaCorreta);
    assert.ok(primeira.alternativas.some((a: { correta: boolean }) => a.correta));
    assert.equal(primeira.podeEditar, false);
    assert.equal((await chamar("rafael", "PUT", `/gestao/atividades/${primeira.idAtividade}`, novaSilaba)).statusCode, 403);
    assert.equal((await chamar("rafael", "DELETE", `/gestao/atividades/${primeira.idAtividade}`)).statusCode, 403);
  });

  it("atividade que não existe = 404", async () => {
    assert.equal((await chamar("admin", "GET", "/gestao/atividades/9999")).statusCode, 404);
    assert.equal((await chamar("admin", "DELETE", "/gestao/atividades/9999")).statusCode, 404);
  });
});

describe("professor inclui, edita e inativa as próprias atividades", () => {
  let idAtividade: number;

  it("inclui: 201, fica ATIVA, com ele como criador", async () => {
    const r = await chamar("rafael", "POST", "/gestao/atividades", novaSilaba);
    assert.equal(r.statusCode, 201, r.body);
    const a = r.json().atividade;
    idAtividade = a.idAtividade;
    assert.equal(a.status, "ATIVA");
    assert.equal(a.respostaCorreta, "MA");
    assert.equal(a.podeEditar, true);
    assert.match(a.nomeCriador, /Rafael/);
    assert.equal(a.alternativas[1].ilustracao, "bag-suitcase");
    const minhas = (await chamar("rafael", "GET", "/gestao/atividades?minhas=true")).json().atividades;
    assert.deepEqual(minhas.map((x: { idAtividade: number }) => x.idAtividade), [idAtividade]);
  });

  it("entra na trilha do aluno SEM o gabarito", async () => {
    const r = await chamar("ana", "GET", "/niveis/2/atividades");
    const nova = r.json().atividades.find((x: { idAtividade: number }) => x.idAtividade === idAtividade);
    assert.ok(nova, "a atividade nova aparece para o aluno");
    assert.equal(nova.respostaCorreta, undefined);
    assert.ok(nova.alternativas.every((alt: Record<string, unknown>) => !("correta" in alt)));
    assert.doesNotMatch(r.body, /"correta"|respostaCorreta/);
  });

  it("o aluno responde e o servidor corrige pelo gabarito novo", async () => {
    const r = await chamar("ana", "POST", "/respostas", { idAtividade, respostaDada: "ma", tempoRespostaSeg: 5 });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().correta, true);
  });

  it("recusa gabarito inválido com mensagem clara (400)", async () => {
    const duasCertas = { ...novaSilaba, alternativas: novaSilaba.alternativas.map((a) => ({ ...a, correta: true })) };
    const r = await chamar("rafael", "POST", "/gestao/atividades", duasCertas);
    assert.equal(r.statusCode, 400);
    assert.match(r.json().erro, /exatamente uma/);
    assert.equal((await chamar("rafael", "POST", "/gestao/atividades", { ...novaSilaba, idNivel: 99 })).statusCode, 400);
  });

  it("outro professor NÃO edita nem inativa (403); o administrador pode", async () => {
    assert.equal((await chamar("lucas", "PUT", `/gestao/atividades/${idAtividade}`, novaSilaba)).statusCode, 403);
    assert.equal((await chamar("lucas", "DELETE", `/gestao/atividades/${idAtividade}`)).statusCode, 403);
    assert.equal(
      (await chamar("lucas", "PATCH", `/gestao/atividades/${idAtividade}/status`, { status: "INATIVA" })).statusCode,
      403,
    );
    const lista = (await chamar("lucas", "GET", "/gestao/atividades?idNivel=2")).json().atividades;
    assert.equal(lista.find((x: { idAtividade: number }) => x.idAtividade === idAtividade).podeEditar, false);

    const admin = await chamar("admin", "PUT", `/gestao/atividades/${idAtividade}`, { ...novaSilaba, enunciado: "Qual sílaba começa MALA?" });
    assert.equal(admin.statusCode, 200, admin.body);
    assert.equal(admin.json().atividade.podeEditar, true);
  });

  it("edita: troca as alternativas e o gabarito", async () => {
    const r = await chamar("rafael", "PUT", `/gestao/atividades/${idAtividade}`, {
      ...novaSilaba,
      textoApoio: "PATO",
      alternativas: [{ texto: "PA", correta: true }, { texto: "BA" }],
    });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(r.json().atividade.respostaCorreta, "PA");
    assert.equal(r.json().atividade.alternativas.length, 2);
    const { total } = banco().prepare("SELECT COUNT(*) AS total FROM Alternativa WHERE idAtividade = ?").get(idAtividade) as { total: number };
    assert.equal(total, 2);
  });

  it("'excluir' inativa (não apaga): some da trilha e pode ser reativada", async () => {
    const r = await chamar("rafael", "DELETE", `/gestao/atividades/${idAtividade}`);
    assert.equal(r.statusCode, 200, r.body);
    const linha = banco().prepare("SELECT status FROM Atividade WHERE idAtividade = ?").get(idAtividade) as { status: string };
    assert.equal(linha.status, "INATIVA");
    const respostas = banco().prepare("SELECT COUNT(*) AS total FROM Resposta WHERE idAtividade = ?").get(idAtividade) as { total: number };
    assert.equal(respostas.total, 1, "a resposta da Ana continua guardada");
    assert.equal((await chamar("ana", "GET", `/atividades/${idAtividade}`)).statusCode, 404);

    const volta = await chamar("rafael", "PATCH", `/gestao/atividades/${idAtividade}/status`, { status: "ATIVA" });
    assert.equal(volta.statusCode, 200);
    assert.equal((await chamar("ana", "GET", `/atividades/${idAtividade}`)).statusCode, 200);
  });
});

describe("travas para não quebrar a trilha", () => {
  it("pergunta do nivelamento não é inativada nem muda de etapa (409)", async () => {
    // A atividade 1 está no nivelamento (passo 6).
    assert.equal((await chamar("admin", "DELETE", "/gestao/atividades/1")).statusCode, 409);
    const atual = (await chamar("admin", "GET", "/gestao/atividades/1")).json().atividade;
    const corpo = {
      idNivel: 2,
      tipo: atual.tipo,
      conteudo: atual.conteudo,
      enunciado: atual.enunciado,
      alternativas: atual.alternativas.map((a: { texto: string; correta: boolean }) => ({ texto: a.texto, correta: a.correta })),
    };
    assert.equal((await chamar("admin", "PUT", "/gestao/atividades/1", corpo)).statusCode, 409);
    assert.equal((await chamar("admin", "PUT", "/gestao/atividades/1", { ...corpo, idNivel: 1 })).statusCode, 200);
  });
});

describe("níveis (só o administrador)", () => {
  const nivel = { nome: "Lendo Avisos", descricao: "Ler avisos e bilhetes.", ordem: 6, criterioAcerto: 0.8 };
  let idNivel: number;

  it("professor e aluno não incluem nem editam nível (403)", async () => {
    assert.equal((await chamar("rafael", "POST", "/gestao/niveis", nivel)).statusCode, 403);
    assert.equal((await chamar("rafael", "PATCH", "/gestao/niveis/1", { nome: "Outro" })).statusCode, 403);
    assert.equal((await chamar("ana", "POST", "/gestao/niveis", nivel)).statusCode, 403);
  });

  it("ordem repetida = 409", async () => {
    assert.equal((await chamar("admin", "POST", "/gestao/niveis", { ...nivel, ordem: 1 })).statusCode, 409);
    assert.equal((await chamar("admin", "PATCH", "/gestao/niveis/2", { ordem: 1 })).statusCode, 409);
  });

  it("inclui e edita", async () => {
    const r = await chamar("admin", "POST", "/gestao/niveis", nivel);
    assert.equal(r.statusCode, 201, r.body);
    idNivel = r.json().nivel.idNivel;
    assert.equal(r.json().nivel.totalAtivas, 0);
    const e = await chamar("admin", "PATCH", `/gestao/niveis/${idNivel}`, { criterioAcerto: 0.75, nome: "Lendo Avisos e Bilhetes" });
    assert.equal(e.statusCode, 200, e.body);
    assert.equal(e.json().nivel.criterioAcerto, 0.75);
    assert.equal(e.json().nivel.ordem, 6);
    assert.equal((await chamar("admin", "PATCH", "/gestao/niveis/999", { nome: "Nada" })).statusCode, 404);
    assert.equal((await chamar("admin", "POST", "/gestao/niveis", { ...nivel, ordem: 7, criterioAcerto: 2 })).statusCode, 400);
  });

  it("professor inclui atividade no nível novo, mas não inativa a última ativa (409)", async () => {
    const r = await chamar("rafael", "POST", "/gestao/atividades", { ...novaSilaba, idNivel });
    assert.equal(r.statusCode, 201, r.body);
    const id = r.json().atividade.idAtividade;
    assert.equal((await chamar("rafael", "DELETE", `/gestao/atividades/${id}`)).statusCode, 409);
    const niveis = (await chamar("rafael", "GET", "/gestao/niveis")).json().niveis;
    assert.equal(niveis.at(-1).totalAtivas, 1);
  });
});
