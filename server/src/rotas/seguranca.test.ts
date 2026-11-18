// Testes do passo 12 (segurança e privacidade, npm test): aceite do termo nos cadastros, tokens
// antigos derrubados quando a senha muda, senha provisória obrigando a troca e dados que NÃO saem
// para o app. Banco TEMPORÁRIO (variável AJAI_DB): o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-seguranca-"));
process.env.AJAI_DB = join(pasta, "ajai.db");
process.env.LIMITE_LOGIN_POR_MINUTO = "1000";

const { abrirBanco } = await import("../../db/conectar.mjs");
const { semear, SENHA_DEMO } = await import("../../db/seed.mjs");
const { construirApp } = await import("../app.ts");
const { banco, fecharBanco } = await import("../banco.ts");
const { VERSAO_TERMOS } = await import("./auth.ts");

let app: FastifyInstance;

type Metodo = "GET" | "POST" | "PATCH";

function chamar(token: string | null, method: Metodo, url: string, payload?: unknown) {
  return app.inject({
    method,
    url,
    payload: payload as object,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

async function entrar(identificador: string, senha = SENHA_DEMO) {
  const r = await chamar(null, "POST", "/auth/login", { identificador, senha });
  assert.equal(r.statusCode, 200, r.body);
  return r.json() as { token: string; usuario: Record<string, unknown> & { idUsuario: number } };
}

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
});

after(async () => {
  await app.close();
  fecharBanco();
  rmSync(pasta, { recursive: true, force: true });
});

describe("aceite do termo de uso e privacidade", () => {
  const corpos: Record<string, object> = {
    aluno: { nome: "Termo Aluno", nomeUsuario: "termo.aluno", senha: "senha123" },
    professor: { nome: "Termo Prof", email: "termo.prof@teste.app", telefone: "11960000001", senha: "senha123", codigo: "EJAVV2" },
    responsavel: { nome: "Termo Resp", email: "termo.resp@teste.app", telefone: "11960000002", senha: "senha123" },
    instituicao: {
      nome: "Escola Termo",
      cnpj: "11.444.777/0001-61",
      nomeResponsavel: "Rosa Lima",
      email: "termo.escola@teste.app",
      telefone: "11960000003",
      senha: "senha123",
    },
  };

  for (const [perfil, corpo] of Object.entries(corpos)) {
    it(`${perfil}: sem "Li e concordo" não cria a conta`, async () => {
      for (const aceite of [undefined, false]) {
        const r = await chamar(null, "POST", `/auth/cadastro/${perfil}`, { ...corpo, aceitouTermos: aceite });
        assert.equal(r.statusCode, 400, r.body);
        assert.equal(r.json().erro, "Leia o termo de uso e toque em Li e concordo.");
      }
    });

    it(`${perfil}: com o aceite, guarda a data e a versão do termo`, async () => {
      const r = await chamar(null, "POST", `/auth/cadastro/${perfil}`, { ...corpo, aceitouTermos: true });
      assert.equal(r.statusCode, 201, r.body);
      const linha = banco()
        .prepare("SELECT termosAceitosEm, versaoTermos FROM Usuario WHERE idUsuario = ?")
        .get(r.json().usuario.idUsuario) as { termosAceitosEm: string | null; versaoTermos: string | null };
      assert.ok(linha.termosAceitosEm, "termosAceitosEm vazio");
      assert.equal(linha.versaoTermos, VERSAO_TERMOS);
    });
  }
});

describe("troca de senha derruba os logins antigos", () => {
  it("o token antigo (outro aparelho) para de valer; o token novo da resposta vale", async () => {
    const celular = await entrar("bruno.lima");
    const computador = await entrar("bruno.lima");
    assert.equal((await chamar(computador.token, "GET", "/auth/eu")).statusCode, 200);

    const r = await chamar(celular.token, "PATCH", "/auth/senha", { senhaAtual: SENHA_DEMO, senhaNova: "nova5678" });
    assert.equal(r.statusCode, 200, r.body);
    const { token: novo } = r.json();

    assert.equal((await chamar(computador.token, "GET", "/auth/eu")).statusCode, 401);
    assert.equal((await chamar(celular.token, "GET", "/alunos/eu/progresso")).statusCode, 401);
    assert.equal((await chamar(novo, "GET", "/alunos/eu/progresso")).statusCode, 200);
    await entrar("bruno.lima", "nova5678");
  });

  it("senha nova igual à de hoje é recusada", async () => {
    const { token } = await entrar("clara.santos");
    const r = await chamar(token, "PATCH", "/auth/senha", { senhaAtual: SENHA_DEMO, senhaNova: SENHA_DEMO });
    assert.equal(r.statusCode, 400);
    assert.match(r.json().erro, /diferente/);
  });

  it("token de antes do passo 12 (sem versão) continua valendo até a senha mudar", async () => {
    const { usuario } = await entrar("clara.santos");
    const antigo = app.jwt.sign({ idUsuario: usuario.idUsuario, perfil: "ALUNO" });
    assert.equal((await chamar(antigo, "GET", "/auth/eu")).statusCode, 200);
  });
});

describe("senha provisória obriga a trocar ao entrar", () => {
  it("derruba o login antigo, só libera /auth/eu e a troca, e some depois de trocar", async () => {
    const antes = await entrar("ana.souza");
    const { token: admin } = await entrar("admin@ajai.app");

    const gerada = await chamar(admin, "POST", `/admin/usuarios/${antes.usuario.idUsuario}/senha-provisoria`);
    assert.equal(gerada.statusCode, 200, gerada.body);
    assert.equal((await chamar(antes.token, "GET", "/auth/eu")).statusCode, 401);

    const provisoria = gerada.json().senhaProvisoria as string;
    const login = await entrar("ana.souza", provisoria);
    assert.equal(login.usuario.precisaTrocarSenha, true);

    assert.equal((await chamar(login.token, "GET", "/auth/eu")).json().usuario.precisaTrocarSenha, true);
    const bloqueada = await chamar(login.token, "GET", "/alunos/eu/progresso");
    assert.equal(bloqueada.statusCode, 403);
    assert.equal(bloqueada.json().erro, "Troque a senha provisória para continuar.");
    assert.equal((await chamar(login.token, "GET", "/niveis")).statusCode, 403);

    const troca = await chamar(login.token, "PATCH", "/auth/senha", { senhaAtual: provisoria, senhaNova: "minha123" });
    assert.equal(troca.statusCode, 200, troca.body);
    assert.equal(troca.json().usuario.precisaTrocarSenha, undefined);
    assert.equal((await chamar(troca.json().token, "GET", "/alunos/eu/progresso")).statusCode, 200);
  });

  it("professor com senha provisória também fica preso na troca", async () => {
    const { usuario } = await entrar("rafael@ajai.app");
    const { token: admin } = await entrar("admin@ajai.app");
    const gerada = await chamar(admin, "POST", `/admin/usuarios/${usuario.idUsuario}/senha-provisoria`);
    const login = await entrar("rafael@ajai.app", gerada.json().senhaProvisoria);
    assert.equal((await chamar(login.token, "GET", "/professor/painel")).statusCode, 403);
  });
});

describe("dados que não saem para o app", () => {
  it("login não devolve hash, versão do token, termo nem data de nascimento", async () => {
    const r = await chamar(null, "POST", "/auth/login", { identificador: "maria.silva", senha: SENHA_DEMO });
    assert.equal(r.statusCode, 200);
    assert.doesNotMatch(r.body, /senhaHash|versaoToken|senhaProvisoria|termosAceitosEm|dataNascimento/);
  });

  it("o token só leva id, perfil e versão (nada de nome, e-mail ou telefone)", async () => {
    const { token } = await entrar("joana@ajai.app");
    const dados = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    assert.deepEqual(Object.keys(dados).sort(), ["exp", "iat", "idUsuario", "perfil", "versao"]);
  });

  it("o aluno vê só nome, perfil e instituição de quem convida (sem e-mail nem telefone)", async () => {
    const { token } = await entrar("maria.silva");
    const r = await chamar(token, "GET", "/alunos/eu/vinculos");
    assert.equal(r.statusCode, 200);
    assert.doesNotMatch(r.body, /@|telefone|email/);
  });
});
