// Testes do modelo de contas do Passo 3.1 (npm test): cadastro por perfil, login, aprovação de
// instituição e professor, vínculos acompanhante ↔ aluno, troca de senha e senha provisória.
// Usam um banco TEMPORÁRIO (variável AJAI_DB), criado e semeado aqui: o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-contas-"));
process.env.AJAI_DB = join(pasta, "ajai.db");
// Muitos cadastros/logins do mesmo IP: folga no limite de tentativas só para o teste.
process.env.LIMITE_LOGIN_POR_MINUTO = "1000";

// Importados DEPOIS das variáveis (são lidas ao importar).
const { abrirBanco } = await import("../../db/conectar.mjs");
const { semear, SENHA_DEMO } = await import("../../db/seed.mjs");
const { construirApp } = await import("../app.ts");
const { banco, fecharBanco } = await import("../banco.ts");
const { ALFABETO_CODIGO, normalizarCnpj } = await import("../usuarios.ts");

let app: FastifyInstance;
const tokens: Record<string, string> = {};
const CODIGO_DEMO = "EJAVV2";
const SENHA = "senha123";

type Metodo = "GET" | "POST" | "PATCH" | "DELETE";

function chamar(quem: string | null, method: Metodo, url: string, payload?: unknown) {
  return app.inject({
    method,
    url,
    payload: payload as object,
    headers: quem ? { authorization: `Bearer ${tokens[quem]}` } : {},
  });
}

async function entrar(identificador: string, senha = SENHA_DEMO): Promise<string> {
  const r = await app.inject({ method: "POST", url: "/auth/login", payload: { identificador, senha } });
  assert.equal(r.statusCode, 200, r.body);
  return r.json().token;
}

/** Cadastra e guarda o token em tokens[apelido]. Devolve a resposta inteira. */
async function cadastrar(apelido: string, perfil: string, corpo: object) {
  const r = await app.inject({ method: "POST", url: `/auth/cadastro/${perfil}`, payload: corpo });
  if (r.statusCode === 201) tokens[apelido] = r.json().token;
  return r;
}

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
  tokens.admin = await entrar("admin@ajai.app");
  tokens.escola = await entrar("instituicao@ajai.app"); // instituição APROVADA (código EJAVV2)
  tokens.aprender = await entrar("aprender@ajai.app"); // instituição PENDENTE
  tokens.rafael = await entrar("rafael@ajai.app"); // professor APROVADO
  tokens.paula = await entrar("paula@ajai.app"); // professor PENDENTE
  tokens.joana = await entrar("joana@ajai.app"); // responsável (já acompanha Bruno)
  tokens.maria = await entrar("maria.silva");
});

after(async () => {
  await app.close();
  fecharBanco();
  rmSync(pasta, { recursive: true, force: true });
});

describe("cadastro de cada perfil", () => {
  it("aluno com nome de usuário, e entra por ele", async () => {
    const r = await cadastrar("joao", "aluno", { nome: "João Pedro", nomeUsuario: "joao.pedro", senha: SENHA });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().usuario.perfil, "ALUNO");
    assert.equal(r.json().usuario.situacao.status, "APROVADA");
    assert.doesNotMatch(r.body, /senhaHash/);
    await entrar("joao.pedro", SENHA);
  });

  it("aluno só com e-mail entra pelo e-mail; só com telefone, pelo telefone", async () => {
    assert.equal((await cadastrar("lia", "aluno", { nome: "Lia Rocha", email: "Lia@Email.com", senha: SENHA })).statusCode, 201);
    await entrar("lia@email.com", SENHA);
    assert.equal((await cadastrar("tito", "aluno", { nome: "Tito Alves", telefone: "(27) 99876-5432", senha: SENHA })).statusCode, 201);
    await entrar("27998765432", SENHA);
  });

  it("aluno sem usuário, e-mail nem telefone: 400", async () => {
    const r = await cadastrar("x", "aluno", { nome: "Sem Contato", senha: SENHA });
    assert.equal(r.statusCode, 400);
    assert.match(r.json().erro, /usuário|e-mail|telefone/);
  });

  it("nome de usuário repetido: 409 com sugestão", async () => {
    const r = await cadastrar("x", "aluno", { nome: "Maria Silva", nomeUsuario: "maria.silva", senha: SENHA });
    assert.equal(r.statusCode, 409);
    assert.match(r.json().erro, /maria\.silva2/);
  });

  it("responsável", async () => {
    const r = await cadastrar("resp", "responsavel", { nome: "Rita Souza", email: "rita@email.com", telefone: "11911112222", senha: SENHA });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().usuario.perfil, "RESPONSAVEL");
    assert.equal(r.json().usuario.situacao.status, "APROVADA");
  });

  it("instituição: CNPJ inválido recusado; válido fica PENDENTE", async () => {
    const base = { nome: "Escola Nova", nomeResponsavel: "Ana Diretora", email: "escola.nova@email.com", telefone: "11933334444", senha: SENHA };
    assert.equal((await cadastrar("x", "instituicao", { ...base, cnpj: "11.222.333/0001-82" })).statusCode, 400);
    const r = await cadastrar("nova", "instituicao", { ...base, cnpj: "11.444.777/0001-61" });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().usuario.perfil, "INSTITUICAO");
    assert.equal(r.json().usuario.situacao.status, "PENDENTE");
    assert.equal((await cadastrar("x", "instituicao", { ...base, email: "outra@email.com", telefone: "11955556666", cnpj: "11444777000161" })).statusCode, 409);
  });

  it("valida os dígitos do CNPJ", () => {
    assert.equal(normalizarCnpj("11.222.333/0001-81"), "11222333000181");
    assert.equal(normalizarCnpj("11222333000180"), null);
    assert.equal(normalizarCnpj("00000000000000"), null);
  });

  it("administrador não é criável por cadastro", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/auth/cadastro/administrador",
      payload: { nome: "Hacker", email: "h@email.com", telefone: "11900001111", senha: SENHA },
    });
    assert.equal(r.statusCode, 404);
    // Campo "perfil" extra é descartado: continua sendo aluno.
    const a = await cadastrar("x2", "aluno", { nome: "Quer Ser Admin", nomeUsuario: "quer.admin", senha: SENHA, perfil: "ADMINISTRADOR" });
    assert.equal(a.json().usuario.perfil, "ALUNO");
    assert.equal((await app.inject({ method: "POST", url: "/auth/cadastro", payload: {} })).statusCode, 404);
  });
});

describe("instituição e administrador", () => {
  it("instituição PENDENTE não acessa as rotas dela", async () => {
    assert.equal((await chamar("aprender", "GET", "/instituicao/eu")).statusCode, 403);
    assert.equal((await chamar("aprender", "GET", "/instituicao/professores")).statusCode, 403);
    const eu = await chamar("aprender", "GET", "/auth/eu");
    assert.equal(eu.json().usuario.situacao.status, "PENDENTE");
  });

  it("só o administrador lista e decide instituições", async () => {
    assert.equal((await chamar("rafael", "GET", "/admin/instituicoes")).statusCode, 403);
    const r = await chamar("admin", "GET", "/admin/instituicoes?status=PENDENTE");
    assert.equal(r.statusCode, 200);
    const nomes = r.json().instituicoes.map((i: { nome: string }) => i.nome);
    assert.ok(nomes.includes("Instituto Aprender Sempre"));
    assert.ok(!nomes.includes("Escola EJA Centro (demonstração)"));
  });

  it("recusar exige motivo, e o motivo aparece para a instituição", async () => {
    const id = (banco().prepare("SELECT idUsuario FROM Usuario WHERE email = 'escola.nova@email.com'").get() as { idUsuario: number }).idUsuario;
    assert.equal((await chamar("admin", "PATCH", `/admin/instituicoes/${id}`, { decisao: "RECUSAR" })).statusCode, 400);
    const r = await chamar("admin", "PATCH", `/admin/instituicoes/${id}`, { decisao: "RECUSAR", motivo: "CNPJ de outra escola." });
    assert.equal(r.statusCode, 200, r.body);
    const eu = await chamar("nova", "GET", "/auth/eu");
    assert.deepEqual(eu.json().usuario.situacao, { status: "RECUSADA", motivo: "CNPJ de outra escola." });
    assert.equal((await chamar("nova", "GET", "/instituicao/eu")).statusCode, 403);
  });

  it("aprovar gera um código único, de 6 caracteres sem 0/O/1/I/L, e libera as rotas", async () => {
    const r = await chamar("admin", "PATCH", "/admin/instituicoes/801", { decisao: "APROVAR" });
    assert.equal(r.statusCode, 200, r.body);
    const { codigo, status } = r.json().instituicao;
    assert.equal(status, "APROVADA");
    assert.equal(codigo.length, 6);
    assert.ok([...codigo].every((c: string) => ALFABETO_CODIGO.includes(c)));
    assert.doesNotMatch(codigo, /[0O1IL]/);
    assert.notEqual(codigo, CODIGO_DEMO);
    const eu = await chamar("aprender", "GET", "/instituicao/eu");
    assert.equal(eu.statusCode, 200);
    assert.equal(eu.json().instituicao.codigo, codigo);
    // Decidir de novo: 409.
    assert.equal((await chamar("admin", "PATCH", "/admin/instituicoes/801", { decisao: "RECUSAR", motivo: "Mudei de ideia" })).statusCode, 409);
  });
});

describe("professor e código da instituição", () => {
  const dados = (email: string, telefone: string, codigo: string) => ({ nome: "Prof Teste", email, telefone, senha: SENHA, codigo });

  it("código inexistente ou de instituição não aprovada: 400", async () => {
    assert.equal((await cadastrar("x", "professor", dados("p1@email.com", "11970000001", "ZZZZZZ"))).statusCode, 400);
    // A instituição recusada não tem código; a pendente também não.
    assert.equal((banco().prepare("SELECT COUNT(*) AS n FROM Instituicao WHERE status <> 'APROVADA' AND codigo IS NOT NULL").get() as { n: number }).n, 0);
  });

  it("professor novo fica PENDENTE e bloqueado; a instituição aprova e ele é liberado", async () => {
    const r = await cadastrar("carla", "professor", dados("carla@email.com", "11970000002", " ejavv2 "));
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().usuario.situacao.status, "PENDENTE");
    assert.equal(r.json().usuario.situacao.nomeInstituicao, "Escola EJA Centro (demonstração)");
    assert.equal((await chamar("carla", "GET", "/vinculos")).statusCode, 403);

    const pendentes = await chamar("escola", "GET", "/instituicao/professores?status=PENDENTE");
    const carla = pendentes.json().professores.find((p: { nome: string }) => p.nome === "Prof Teste");
    assert.ok(carla);
    assert.equal((await chamar("escola", "PATCH", `/instituicao/professores/${carla.idUsuario}`, { decisao: "APROVAR" })).statusCode, 200);

    assert.equal((await chamar("carla", "GET", "/auth/eu")).json().usuario.situacao.status, "APROVADA");
    assert.equal((await chamar("carla", "GET", "/vinculos")).statusCode, 200);
  });

  it("professor PENDENTE do seed (Paula) está bloqueado", async () => {
    assert.equal((await chamar("paula", "POST", "/vinculos", { aluno: "maria.silva" })).statusCode, 403);
  });

  it("instituição só decide professores dela", async () => {
    // Paula é da Escola EJA Centro; o Instituto Aprender (aprovado acima) não pode decidir.
    assert.equal((await chamar("aprender", "PATCH", "/instituicao/professores/101", { decisao: "APROVAR" })).statusCode, 404);
    const lista = await chamar("aprender", "GET", "/instituicao/professores");
    assert.equal(lista.json().professores.length, 0);
  });

  it("professor recusado informa outro código e volta a esperar", async () => {
    assert.equal(
      (await chamar("escola", "PATCH", "/instituicao/professores/101", { decisao: "RECUSAR", motivo: "Não trabalha aqui." })).statusCode,
      200,
    );
    assert.equal((await chamar("paula", "GET", "/auth/eu")).json().usuario.situacao.status, "RECUSADA");
    const codigoAprender = (banco().prepare("SELECT codigo FROM Instituicao WHERE idUsuario = 801").get() as { codigo: string }).codigo;
    const r = await chamar("paula", "PATCH", "/professor/instituicao", { codigo: codigoAprender });
    assert.equal(r.statusCode, 200, r.body);
    const situacao = (await chamar("paula", "GET", "/auth/eu")).json().usuario.situacao;
    assert.deepEqual(situacao, { status: "PENDENTE", nomeInstituicao: "Instituto Aprender Sempre" });
    // Agora quem decide é o Instituto Aprender.
    assert.equal((await chamar("aprender", "PATCH", "/instituicao/professores/101", { decisao: "APROVAR" })).statusCode, 200);
    // Professor aprovado não troca de instituição por aqui.
    assert.equal((await chamar("rafael", "PATCH", "/professor/instituicao", { codigo: CODIGO_DEMO })).statusCode, 409);
  });
});

describe("vínculos acompanhante ↔ aluno", () => {
  it("convite pendente não revela o nome do aluno; aceito revela", async () => {
    const r = await chamar("resp", "POST", "/vinculos", { aluno: "joao.pedro" });
    assert.equal(r.statusCode, 201, r.body);
    assert.equal(r.json().vinculo.status, "PENDENTE");
    assert.equal(r.json().vinculo.aluno, undefined);
    assert.doesNotMatch(r.body, /João Pedro/);

    const lista = await chamar("resp", "GET", "/vinculos");
    assert.doesNotMatch(lista.body, /João Pedro/);

    const convites = await chamar("joao", "GET", "/alunos/eu/vinculos");
    const convite = convites.json().vinculos[0];
    assert.equal(convite.status, "PENDENTE");
    assert.deepEqual(convite.acompanhante, { nome: "Rita Souza", perfil: "RESPONSAVEL" });
    assert.equal((await chamar("joao", "PATCH", `/alunos/eu/vinculos/${convite.idVinculo}`, { aceitar: true })).statusCode, 200);

    const depois = await chamar("resp", "GET", "/vinculos");
    assert.equal(depois.json().vinculos[0].aluno.nome, "João Pedro");
    assert.equal(depois.json().limite, 2);
  });

  it("aluno inexistente ou que não é aluno: mesma resposta 404", async () => {
    const a = await chamar("resp", "POST", "/vinculos", { aluno: "ninguem.aqui" });
    const b = await chamar("resp", "POST", "/vinculos", { aluno: "rafael@ajai.app" });
    assert.equal(a.statusCode, 404);
    assert.equal(b.statusCode, 404);
    assert.equal(a.json().erro, b.json().erro);
  });

  it("convite repetido: 409", async () => {
    assert.equal((await chamar("resp", "POST", "/vinculos", { aluno: "joao.pedro" })).statusCode, 409);
  });

  it("responsável com 2 vínculos (pendente + aceito) recebe 409 no 3º", async () => {
    assert.equal((await chamar("resp", "POST", "/vinculos", { aluno: "lia@email.com" })).statusCode, 201); // pendente
    const r = await chamar("resp", "POST", "/vinculos", { aluno: "27998765432" });
    assert.equal(r.statusCode, 409);
    assert.equal(r.json().erro, "Você já acompanha 2 pessoas.");
    const { n } = banco()
      .prepare("SELECT COUNT(*) AS n FROM Vinculo v JOIN Usuario u ON u.idUsuario = v.idAcompanhante WHERE u.email = 'rita@email.com'")
      .get() as { n: number };
    assert.equal(n, 2);
  });

  it("recusar libera a vaga do responsável", async () => {
    const convite = (await chamar("lia", "GET", "/alunos/eu/vinculos")).json().vinculos[0];
    assert.equal((await chamar("lia", "PATCH", `/alunos/eu/vinculos/${convite.idVinculo}`, { aceitar: false })).statusCode, 200);
    assert.equal((await chamar("lia", "GET", "/alunos/eu/vinculos")).json().vinculos.length, 0);
    assert.equal((await chamar("resp", "POST", "/vinculos", { aluno: "27998765432" })).statusCode, 201);
  });

  it("professor não tem limite", async () => {
    // Rafael já acompanha os 4 alunos do seed; convida mais 3.
    for (const aluno of ["joao.pedro", "lia@email.com", "27998765432"]) {
      assert.equal((await chamar("rafael", "POST", "/vinculos", { aluno })).statusCode, 201);
    }
    const lista = (await chamar("rafael", "GET", "/vinculos")).json();
    assert.equal(lista.vinculos.length, 7);
    assert.equal(lista.limite, null);
  });

  it("aluno e acompanhante podem desfazer; sem vínculo ACEITO ninguém vê o aluno", async () => {
    // Bruno (id 3) com Joana: aluno desfaz.
    const doBruno = await chamar(null, "GET", "/alunos/eu/vinculos");
    assert.equal(doBruno.statusCode, 401);
    tokens.bruno = await entrar("bruno.lima");
    const vinculoJoana = (await chamar("bruno", "GET", "/alunos/eu/vinculos")).json().vinculos.find(
      (v: { acompanhante: { nome: string } }) => v.acompanhante.nome === "Joana Lima",
    );
    assert.equal((await chamar("bruno", "DELETE", `/alunos/eu/vinculos/${vinculoJoana.idVinculo}`)).statusCode, 200);
    assert.doesNotMatch((await chamar("joana", "GET", "/vinculos")).body, /Bruno/);

    // Acompanhante desfaz; outro acompanhante não consegue apagar vínculo alheio.
    const doRafael = (await chamar("rafael", "GET", "/vinculos")).json().vinculos.find(
      (v: { aluno?: { nome: string } }) => v.aluno?.nome === "Maria Silva",
    );
    assert.equal((await chamar("joana", "DELETE", `/vinculos/${doRafael.idVinculo}`)).statusCode, 404);
    assert.equal((await chamar("rafael", "DELETE", `/vinculos/${doRafael.idVinculo}`)).statusCode, 200);
    assert.doesNotMatch((await chamar("rafael", "GET", "/vinculos")).body, /Maria Silva/);
  });

  it("aluno não acessa rotas de acompanhante nem de professor", async () => {
    assert.equal((await chamar("maria", "GET", "/vinculos")).statusCode, 403);
    assert.equal((await chamar("maria", "POST", "/vinculos", { aluno: "ana.souza" })).statusCode, 403);
  });

  it("rotas antigas do professor cadastrar aluno não existem mais", async () => {
    assert.equal((await chamar("rafael", "GET", "/professor/alunos")).statusCode, 404);
    assert.equal((await chamar("rafael", "POST", "/professor/alunos", { nome: "X", nomeUsuario: "xx.yy", senha: SENHA })).statusCode, 404);
  });
});

describe("senha", () => {
  it("aluno troca a própria senha", async () => {
    const r = await chamar("maria", "PATCH", "/auth/senha", { senhaAtual: SENHA_DEMO, senhaNova: "nova1234" });
    assert.equal(r.statusCode, 200, r.body);
    await entrar("maria.silva", "nova1234");
  });

  it("senha provisória do administrador vale para aluno", async () => {
    const r = await chamar("admin", "POST", "/admin/usuarios/1/senha-provisoria");
    assert.equal(r.statusCode, 200, r.body);
    assert.match(r.json().senhaProvisoria, /^\d{6}$/);
    await entrar("maria.silva", r.json().senhaProvisoria);
  });

  it("só o administrador gera senha provisória", async () => {
    assert.equal((await chamar("escola", "POST", "/admin/usuarios/1/senha-provisoria")).statusCode, 403);
  });
});
