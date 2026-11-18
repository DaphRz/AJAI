// Testes da área do professor e do responsável (passo 8; npm test): painel, relatório individual,
// relatórios por turma, turmas, correção manual, recomendações e, principalmente, que NINGUÉM vê
// dado de aluno sem vínculo ACEITO. Banco TEMPORÁRIO (AJAI_DB): o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-professor-"));
process.env.AJAI_DB = join(pasta, "ajai.db");
process.env.LIMITE_LOGIN_POR_MINUTO = "1000";

const { abrirBanco } = await import("../../db/conectar.mjs");
const { semear, SENHA_DEMO } = await import("../../db/seed.mjs");
const { construirApp } = await import("../app.ts");
const { banco, fecharBanco } = await import("../banco.ts");
const { diaNoFuso, somarDias } = await import("../progressao.ts");

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

const hoje = diaNoFuso(new Date());

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
  tokens.rafael = await entrar("rafael@ajai.app"); // professor APROVADO, 4 alunos ACEITOS (turma 1)
  tokens.paula = await entrar("paula@ajai.app"); // professor PENDENTE
  tokens.joana = await entrar("joana@ajai.app"); // responsável, acompanha o Bruno (id 3)
  tokens.ana = await entrar("ana.souza");
  tokens.escola = await entrar("instituicao@ajai.app"); // instituição APROVADA do Rafael e da Paula
  tokens.aprender = await entrar("aprender@ajai.app"); // instituição PENDENTE

  // Um segundo professor APROVADO, sem nenhum aluno: não pode ver os alunos do Rafael.
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

describe("autorização (só vínculo ACEITO)", () => {
  it("aluno e responsável não acessam rotas de professor", async () => {
    assert.equal((await chamar("ana", "GET", "/professor/painel")).statusCode, 403);
    assert.equal((await chamar("joana", "GET", "/professor/alunos/3")).statusCode, 403);
  });

  it("professor PENDENTE recebe 403", async () => {
    assert.equal((await chamar("paula", "GET", "/professor/painel")).statusCode, 403);
  });

  it("outro professor não vê os alunos do Rafael (lista vazia e 404 no relatório)", async () => {
    const painel = await chamar("lucas", "GET", "/professor/painel");
    assert.equal(painel.statusCode, 200);
    assert.deepEqual(painel.json().alunos, []);
    assert.equal((await chamar("lucas", "GET", "/professor/alunos/2")).statusCode, 404);
    assert.equal((await chamar("lucas", "PUT", "/professor/alunos/2/turma", { idTurma: null })).statusCode, 404);
    assert.equal((await chamar("lucas", "GET", "/professor/relatorios/frequencia?idTurma=1")).statusCode, 404);
    const idResposta = (banco().prepare("SELECT idResposta FROM Resposta WHERE idAluno = 2 LIMIT 1").get() as { idResposta: number }).idResposta;
    assert.equal((await chamar("lucas", "PATCH", `/respostas/${idResposta}/correcao`, { correta: true })).statusCode, 404);
  });

  it("convite PENDENTE não libera os dados do aluno", async () => {
    const r = await chamar("lucas", "POST", "/vinculos", { aluno: "ana.souza" });
    assert.equal(r.statusCode, 201, r.body);
    assert.deepEqual((await chamar("lucas", "GET", "/professor/painel")).json().alunos, []);
    assert.equal((await chamar("lucas", "GET", "/professor/alunos/2")).statusCode, 404);
  });

  it("responsável só recebe recomendações de quem aceitou", async () => {
    const r = await chamar("joana", "GET", "/responsavel/recomendacoes");
    assert.equal(r.statusCode, 200);
    assert.deepEqual(r.json().pessoas.map((p: { aluno: { idUsuario: number } }) => p.aluno.idUsuario), [3]);
    assert.equal((await chamar("rafael", "GET", "/responsavel/recomendacoes")).statusCode, 403);
  });
});

describe("GET /professor/painel", () => {
  it("lista os alunos com vínculo ACEITO, com resumo e situação (padrão: últimos 7 dias)", async () => {
    const r = await chamar("rafael", "GET", "/professor/painel");
    assert.equal(r.statusCode, 200, r.body);
    const { periodo, alunos } = r.json();
    assert.deepEqual(periodo, { inicio: somarDias(hoje, -6), fim: hoje, dias: 7 });
    assert.deepEqual(alunos.map((a: { aluno: { nome: string } }) => a.aluno.nome), ["Ana Souza", "Bruno Lima", "Clara Santos", "Maria Silva"]);
    const maria = alunos.find((a: { aluno: { idUsuario: number } }) => a.aluno.idUsuario === 1);
    assert.equal(maria.totalAtividades, 0);
    assert.equal(maria.situacao, "ATENCAO");
    assert.equal(maria.nivel, undefined);
    const ana = alunos.find((a: { aluno: { idUsuario: number } }) => a.aluno.idUsuario === 2);
    assert.ok(ana.totalAtividades > 0);
    assert.equal(ana.turma.idTurma, 1);
    assert.ok(["EM_DIA", "ATENCAO", "REFORCO"].includes(ana.situacao));
    assert.doesNotMatch(r.body, /senhaHash|email|telefone/);
  });

  it("período sem atividade: tudo zerado", async () => {
    const r = await chamar("rafael", "GET", "/professor/painel?inicio=2020-01-01&fim=2020-01-31");
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().periodo.dias, 31);
    assert.ok(r.json().alunos.every((a: { totalAtividades: number }) => a.totalAtividades === 0));
  });

  it("recusa período invertido, data inexistente e mais de 1 ano", async () => {
    assert.equal((await chamar("rafael", "GET", "/professor/painel?inicio=2026-11-10&fim=2026-11-01")).statusCode, 400);
    assert.equal((await chamar("rafael", "GET", "/professor/painel?inicio=2026-02-30&fim=2026-03-05")).statusCode, 400);
    assert.equal((await chamar("rafael", "GET", "/professor/painel?inicio=2024-01-01&fim=2026-01-01")).statusCode, 400);
    assert.equal((await chamar("rafael", "GET", "/professor/painel?inicio=ontem")).statusCode, 400);
  });
});

describe("GET /professor/alunos/:id", () => {
  it("relatório individual com série diária, histórico de níveis e respostas", async () => {
    const r = await chamar("rafael", "GET", "/professor/alunos/2");
    assert.equal(r.statusCode, 200, r.body);
    const d = r.json();
    assert.equal(d.aluno.nome, "Ana Souza");
    assert.equal(d.serie.length, 7);
    assert.equal(d.serie.at(-1).dia, hoje);
    assert.equal(
      d.serie.reduce((s: number, p: { atividades: number }) => s + p.atividades, 0),
      d.resumo.totalAtividades,
    );
    assert.ok(d.historicoNiveis.length >= 1);
    assert.ok(d.respostas.length > 0);
    assert.ok(d.respostas[0].respostaEsperada);
  });
});

describe("PATCH /respostas/:id/correcao", () => {
  it("muda o certo/errado, grava a observação e recalcula o DesempenhoConteudo", async () => {
    const db = banco();
    const alvo = db
      .prepare(
        `SELECT r.idResposta, a.idNivel, a.conteudo FROM Resposta r JOIN Atividade a ON a.idAtividade = r.idAtividade
          WHERE r.idAluno = 2 AND r.correta = 0 LIMIT 1`,
      )
      .get() as { idResposta: number; idNivel: number; conteudo: string };
    const desempenho = () =>
      db
        .prepare("SELECT totalTentativas, totalAcertos, taxaAcerto FROM DesempenhoConteudo WHERE idAluno = 2 AND idNivel = ? AND conteudo = ?")
        .get(alvo.idNivel, alvo.conteudo) as { totalTentativas: number; totalAcertos: number; taxaAcerto: number };
    const antes = desempenho();

    const r = await chamar("rafael", "PATCH", `/respostas/${alvo.idResposta}/correcao`, { correta: true, observacao: "Escreveu certo, só faltou o acento." });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(r.json().resposta.correta, true);

    const gravada = db.prepare("SELECT correta, correcaoProfessor FROM Resposta WHERE idResposta = ?").get(alvo.idResposta) as { correta: number; correcaoProfessor: string };
    assert.equal(gravada.correta, 1);
    assert.equal(gravada.correcaoProfessor, "Escreveu certo, só faltou o acento.");
    const depois = desempenho();
    assert.equal(depois.totalTentativas, antes.totalTentativas);
    assert.equal(depois.totalAcertos, antes.totalAcertos + 1);
    assert.equal(depois.taxaAcerto, depois.totalAcertos / depois.totalTentativas);
  });

  it("sem observação, grava um texto padrão; resposta inexistente = 404", async () => {
    const id = (banco().prepare("SELECT idResposta FROM Resposta WHERE idAluno = 3 LIMIT 1").get() as { idResposta: number }).idResposta;
    const r = await chamar("rafael", "PATCH", `/respostas/${id}/correcao`, { correta: false });
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().resposta.correcaoProfessor, "O professor considerou errada.");
    assert.equal((await chamar("rafael", "PATCH", "/respostas/999999/correcao", { correta: true })).statusCode, 404);
  });
});

describe("turmas", () => {
  let idTurma: number;

  it("cria, renomeia e lista a turma nova", async () => {
    const r = await chamar("rafael", "POST", "/professor/turmas", { nome: "  EJA   Manhã ", periodo: "2026/2" });
    assert.equal(r.statusCode, 201, r.body);
    idTurma = r.json().turma.idTurma;
    assert.equal(r.json().turma.nome, "EJA Manhã");
    assert.equal((await chamar("rafael", "PATCH", `/professor/turmas/${idTurma}`, { nome: "EJA Manhã A" })).statusCode, 200);
    const lista = (await chamar("rafael", "GET", "/professor/turmas")).json();
    assert.ok(lista.turmas.some((t: { idTurma: number; nome: string }) => t.idTurma === idTurma && t.nome === "EJA Manhã A"));
  });

  it("move o aluno de turma (sai da antiga), tira da turma e não mexe em turma de outro professor", async () => {
    assert.equal((await chamar("rafael", "PUT", "/professor/alunos/4/turma", { idTurma })).statusCode, 200);
    let lista = (await chamar("rafael", "GET", "/professor/turmas")).json();
    const nova = lista.turmas.find((t: { idTurma: number }) => t.idTurma === idTurma);
    const antiga = lista.turmas.find((t: { idTurma: number }) => t.idTurma === 1);
    assert.deepEqual(nova.alunos.map((a: { idUsuario: number }) => a.idUsuario), [4]);
    assert.ok(!antiga.alunos.some((a: { idUsuario: number }) => a.idUsuario === 4));

    const freq = (await chamar("rafael", "GET", `/professor/relatorios/frequencia?idTurma=${idTurma}`)).json();
    assert.equal(freq.totalAlunos, 1);
    assert.equal(freq.porDia.length, 7);

    assert.equal((await chamar("rafael", "PUT", "/professor/alunos/4/turma", { idTurma: null })).statusCode, 200);
    lista = (await chamar("rafael", "GET", "/professor/turmas")).json();
    assert.ok(lista.semTurma.some((a: { idUsuario: number }) => a.idUsuario === 4));

    // Lucas não mexe na turma do Rafael.
    assert.equal((await chamar("lucas", "PATCH", `/professor/turmas/${idTurma}`, { nome: "Outra" })).statusCode, 404);
    assert.equal((await chamar("lucas", "DELETE", `/professor/turmas/${idTurma}`)).statusCode, 404);
  });

  it("não põe aluno em turma encerrada", async () => {
    await chamar("rafael", "PATCH", `/professor/turmas/${idTurma}`, { ativa: false });
    assert.equal((await chamar("rafael", "PUT", "/professor/alunos/4/turma", { idTurma })).statusCode, 409);
  });

  it("apagar a turma deixa os alunos sem turma", async () => {
    assert.equal((await chamar("rafael", "DELETE", `/professor/turmas/${idTurma}`)).statusCode, 200);
    assert.equal(banco().prepare("SELECT 1 FROM Turma WHERE idTurma = ?").get(idTurma), undefined);
  });

  it("relatório de dificuldades por turma, pior primeiro", async () => {
    const r = await chamar("rafael", "GET", "/professor/relatorios/dificuldades?idTurma=1&inicio=" + somarDias(hoje, -29));
    assert.equal(r.statusCode, 200, r.body);
    const taxas = r.json().conteudos.map((c: { taxaAcerto: number }) => c.taxaAcerto);
    assert.deepEqual(taxas, [...taxas].sort((a: number, b: number) => a - b));
  });

  it("vínculo desfeito tira o aluno das turmas do professor", async () => {
    const vinculo = banco().prepare("SELECT idVinculo FROM Vinculo WHERE idAluno = 3 AND idAcompanhante = 100").get() as { idVinculo: number };
    assert.equal((await chamar("rafael", "DELETE", `/vinculos/${vinculo.idVinculo}`)).statusCode, 200);
    assert.equal(banco().prepare("SELECT 1 FROM Matricula WHERE idAluno = 3 AND idTurma = 1").get(), undefined);
    assert.equal((await chamar("rafael", "GET", "/professor/alunos/3")).statusCode, 404);
  });
});

describe("PATCH /auth/eu", () => {
  it("muda o próprio nome", async () => {
    const r = await chamar("rafael", "PATCH", "/auth/eu", { nome: "  Rafael   Costa Lima " });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(r.json().usuario.nome, "Rafael Costa Lima");
    assert.equal((await chamar("rafael", "PATCH", "/auth/eu", { nome: " " })).statusCode, 400);
  });
});

describe("turmas da instituição", () => {
  let idTurma: number;
  const idProfessor = (apelido: string) =>
    (banco().prepare("SELECT idUsuario FROM Usuario WHERE email = ?").get(`${apelido}@${apelido === "lucas" ? "teste" : "ajai"}.app`) as { idUsuario: number }).idUsuario;

  it("instituição PENDENTE, professor e aluno não usam as rotas", async () => {
    assert.equal((await chamar("aprender", "GET", "/instituicao/turmas")).statusCode, 403);
    assert.equal((await chamar("rafael", "GET", "/instituicao/turmas")).statusCode, 403);
    assert.equal((await chamar("ana", "POST", "/instituicao/turmas", { nome: "EJA X", periodo: "2026", idProfessor: 100 })).statusCode, 403);
  });

  it("cria turma para um professor APROVADO dela; ela aparece na aba Turmas do professor", async () => {
    const r = await chamar("escola", "POST", "/instituicao/turmas", { nome: "EJA Tarde", periodo: "2026/2", idProfessor: 100 });
    assert.equal(r.statusCode, 201, r.body);
    idTurma = r.json().turma.idTurma;
    assert.equal(r.json().turma.professor.nome.startsWith("Rafael"), true);
    const doProfessor = (await chamar("rafael", "GET", "/professor/turmas")).json();
    assert.ok(doProfessor.turmas.some((t: { idTurma: number }) => t.idTurma === idTurma));
  });

  it("não cria turma para professor PENDENTE", async () => {
    const r = await chamar("escola", "POST", "/instituicao/turmas", { nome: "EJA Paula", periodo: "2026/2", idProfessor: idProfessor("paula") });
    assert.equal(r.statusCode, 404);
  });

  it("lista as turmas com o total de alunos, sem os nomes dos alunos", async () => {
    assert.equal((await chamar("rafael", "PUT", "/professor/alunos/2/turma", { idTurma })).statusCode, 200);
    const r = await chamar("escola", "GET", "/instituicao/turmas");
    assert.equal(r.statusCode, 200);
    const turma = r.json().turmas.find((t: { idTurma: number }) => t.idTurma === idTurma);
    assert.equal(turma.totalAlunos, 1);
    assert.doesNotMatch(r.body, /Ana Souza/);
    assert.ok(r.json().professores.some((p: { idUsuario: number }) => p.idUsuario === 100));
    assert.ok(!r.json().professores.some((p: { idUsuario: number }) => p.idUsuario === idProfessor("paula")));
  });

  it("trocar o professor tira os alunos da turma", async () => {
    const r = await chamar("escola", "PATCH", `/instituicao/turmas/${idTurma}`, { idProfessor: idProfessor("lucas") });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(banco().prepare("SELECT COUNT(*) AS n FROM Matricula WHERE idTurma = ?").get(idTurma)!.n, 0);
    const rafael = (await chamar("rafael", "GET", "/professor/turmas")).json();
    assert.ok(!rafael.turmas.some((t: { idTurma: number }) => t.idTurma === idTurma));
  });

  it("outra instituição não vê nem mexe na turma", async () => {
    banco().prepare("UPDATE Instituicao SET status = 'APROVADA', codigo = 'OUTRA2' WHERE idUsuario = (SELECT idUsuario FROM Usuario WHERE email = 'aprender@ajai.app')").run();
    assert.deepEqual((await chamar("aprender", "GET", "/instituicao/turmas")).json().turmas, []);
    assert.equal((await chamar("aprender", "PATCH", `/instituicao/turmas/${idTurma}`, { nome: "Minha" })).statusCode, 404);
    assert.equal((await chamar("aprender", "DELETE", `/instituicao/turmas/${idTurma}`)).statusCode, 404);
    assert.equal((await chamar("aprender", "POST", "/instituicao/turmas", { nome: "EJA X", periodo: "2026", idProfessor: 100 })).statusCode, 404);
  });

  it("apaga a turma", async () => {
    assert.equal((await chamar("escola", "DELETE", `/instituicao/turmas/${idTurma}`)).statusCode, 200);
  });
});
