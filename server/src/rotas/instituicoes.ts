// Instituições e aprovação de contas (Passo 3.1).
// Administrador decide as instituições; a instituição decide os professores dela.
//   GET   /admin/instituicoes?status=          lista (todas, ou só PENDENTE/APROVADA/RECUSADA)
//   PATCH /admin/instituicoes/:id              { decisao: APROVAR|RECUSAR, motivo? } → ao aprovar, gera o código
//   GET   /instituicao/eu                      dados da instituição logada (com o código)
//   GET   /instituicao/professores?status=     professores DELA
//   PATCH /instituicao/professores/:id         { decisao: APROVAR|RECUSAR, motivo? } (só professores dela)
//   PATCH /professor/instituicao               { codigo } professor pendente/recusado informa outro código
// Rotas da instituição exigem a conta APROVADA (exigirContaLiberada): pendente/recusada → 403.
import type { FastifyInstance } from "fastify";
import { exigirContaLiberada, exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { gerarCodigoInstituicao, situacaoDaConta } from "../usuarios.ts";
import { CODIGO, instituicaoPeloCodigo, limiteSenha } from "./auth.ts";

type Decisao = "APROVAR" | "RECUSAR";

/** Corpo das decisões: recusar pede um motivo curto (aparece para quem foi recusado). */
const corpoDecisao = {
  type: "object",
  properties: {
    decisao: { type: "string", enum: ["APROVAR", "RECUSAR"] },
    motivo: { type: "string", minLength: 3, maxLength: 200, pattern: "\\S" },
  },
  required: ["decisao"],
} as const;

const paramsId = { type: "object", properties: { id: { type: "integer", minimum: 1 } }, required: ["id"] } as const;

const errosComuns = { 400: esquemaErro, 401: esquemaErro, 403: esquemaErro, 404: esquemaErro, 409: esquemaErro } as const;

const esquemaInstituicao = {
  type: "object",
  properties: {
    idUsuario: { type: "integer" },
    nome: { type: "string" },
    cnpj: { type: "string" },
    nomeResponsavel: { type: "string" },
    email: { type: "string" },
    telefone: { type: "string" },
    codigo: { type: "string" },
    status: { type: "string" },
    motivoRecusa: { type: "string" },
    criadoEm: { type: "string" },
    decididoEm: { type: "string" },
  },
  required: ["idUsuario", "nome", "cnpj", "status"],
} as const;

const esquemaProfessor = {
  type: "object",
  properties: {
    idUsuario: { type: "integer" },
    nome: { type: "string" },
    email: { type: "string" },
    telefone: { type: "string" },
    status: { type: "string" },
    motivoRecusa: { type: "string" },
    criadoEm: { type: "string" },
    decididoEm: { type: "string" },
  },
  required: ["idUsuario", "nome", "status"],
} as const;

const SQL_INSTITUICAO = `
  SELECT u.idUsuario, u.nome, u.email, u.telefone, u.criadoEm,
         i.cnpj, i.nomeResponsavel, i.codigo, i.status, i.motivoRecusa, i.decididoEm
    FROM Instituicao i JOIN Usuario u ON u.idUsuario = i.idUsuario`;

const SQL_PROFESSOR = `
  SELECT u.idUsuario, u.nome, u.email, u.telefone, u.criadoEm,
         p.statusVinculo AS status, p.motivoRecusa, p.decididoEm
    FROM Professor p JOIN Usuario u ON u.idUsuario = p.idUsuario`;

function semNulos<T extends object>(linha: T): T {
  return Object.fromEntries(Object.entries(linha).filter(([, v]) => v !== null)) as T;
}

/** Recusar sem motivo não vale: a pessoa precisa saber o que corrigir. */
function motivoDaDecisao(decisao: Decisao, motivo?: string): string | null {
  if (decisao === "APROVAR") return null;
  const texto = motivo?.trim();
  if (!texto) throw new ErroApi(400, "Escreva o motivo da recusa, em poucas palavras.");
  return texto;
}

export async function rotasInstituicoes(app: FastifyInstance): Promise<void> {
  // ---------- Administrador ----------

  app.get<{ Querystring: { status?: string } }>(
    "/admin/instituicoes",
    {
      preHandler: exigirLogin("ADMINISTRADOR"),
      schema: {
        querystring: {
          type: "object",
          properties: { status: { type: "string", enum: ["PENDENTE", "APROVADA", "RECUSADA"] } },
        },
        response: {
          200: { type: "object", properties: { instituicoes: { type: "array", items: esquemaInstituicao } }, required: ["instituicoes"] },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const { status } = req.query;
      const linhas = banco()
        .prepare(`${SQL_INSTITUICAO} WHERE (? IS NULL OR i.status = ?) ORDER BY u.criadoEm, u.idUsuario`)
        .all(status ?? null, status ?? null) as object[];
      return { instituicoes: linhas.map(semNulos) };
    },
  );

  app.patch<{ Params: { id: number }; Body: { decisao: Decisao; motivo?: string } }>(
    "/admin/instituicoes/:id",
    {
      preHandler: exigirLogin("ADMINISTRADOR"),
      schema: {
        params: paramsId,
        body: corpoDecisao,
        response: { 200: { type: "object", properties: { instituicao: esquemaInstituicao }, required: ["instituicao"] }, ...errosComuns },
      },
    },
    async (req) => {
      const db = banco();
      const motivo = motivoDaDecisao(req.body.decisao, req.body.motivo);
      const atual = db.prepare("SELECT status FROM Instituicao WHERE idUsuario = ?").get(req.params.id) as
        | { status: string }
        | undefined;
      if (!atual) throw new ErroApi(404, "Instituição não encontrada.");
      if (atual.status !== "PENDENTE") throw new ErroApi(409, "Esta instituição já foi decidida.");

      const agora = new Date().toISOString();
      db.exec("BEGIN");
      try {
        if (req.body.decisao === "APROVAR") {
          // O código é sorteado e conferido dentro da transação (UNIQUE no banco garante de novo).
          db.prepare(
            "UPDATE Instituicao SET status = 'APROVADA', codigo = ?, motivoRecusa = NULL, decididoPor = ?, decididoEm = ? WHERE idUsuario = ?",
          ).run(gerarCodigoInstituicao(), req.user.idUsuario, agora, req.params.id);
        } else {
          db.prepare(
            "UPDATE Instituicao SET status = 'RECUSADA', motivoRecusa = ?, decididoPor = ?, decididoEm = ? WHERE idUsuario = ?",
          ).run(motivo, req.user.idUsuario, agora, req.params.id);
        }
        db.exec("COMMIT");
      } catch (erro) {
        db.exec("ROLLBACK");
        throw erro;
      }
      req.log.info({ idInstituicao: req.params.id, decisao: req.body.decisao }, "instituição decidida pelo administrador");
      return { instituicao: semNulos(db.prepare(`${SQL_INSTITUICAO} WHERE i.idUsuario = ?`).get(req.params.id) as object) };
    },
  );

  // ---------- Instituição ----------

  app.get(
    "/instituicao/eu",
    {
      preHandler: exigirContaLiberada("INSTITUICAO"),
      schema: { response: { 200: { type: "object", properties: { instituicao: esquemaInstituicao }, required: ["instituicao"] }, ...errosComuns } },
    },
    async (req) => ({
      instituicao: semNulos(banco().prepare(`${SQL_INSTITUICAO} WHERE i.idUsuario = ?`).get(req.user.idUsuario) as object),
    }),
  );

  app.get<{ Querystring: { status?: string } }>(
    "/instituicao/professores",
    {
      preHandler: exigirContaLiberada("INSTITUICAO"),
      schema: {
        querystring: {
          type: "object",
          properties: { status: { type: "string", enum: ["PENDENTE", "APROVADO", "RECUSADO"] } },
        },
        response: {
          200: { type: "object", properties: { professores: { type: "array", items: esquemaProfessor } }, required: ["professores"] },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const { status } = req.query;
      const linhas = banco()
        .prepare(`${SQL_PROFESSOR} WHERE p.idInstituicao = ? AND (? IS NULL OR p.statusVinculo = ?) ORDER BY u.nome COLLATE NOCASE`)
        .all(req.user.idUsuario, status ?? null, status ?? null) as object[];
      return { professores: linhas.map(semNulos) };
    },
  );

  app.patch<{ Params: { id: number }; Body: { decisao: Decisao; motivo?: string } }>(
    "/instituicao/professores/:id",
    {
      preHandler: exigirContaLiberada("INSTITUICAO"),
      schema: {
        params: paramsId,
        body: corpoDecisao,
        response: { 200: { type: "object", properties: { professor: esquemaProfessor }, required: ["professor"] }, ...errosComuns },
      },
    },
    async (req) => {
      const db = banco();
      const motivo = motivoDaDecisao(req.body.decisao, req.body.motivo);
      // Só professores DESTA instituição; de outra = 404 (não revela que existe).
      const atual = db
        .prepare("SELECT statusVinculo FROM Professor WHERE idUsuario = ? AND idInstituicao = ?")
        .get(req.params.id, req.user.idUsuario) as { statusVinculo: string } | undefined;
      if (!atual) throw new ErroApi(404, "Professor não encontrado na sua instituição.");
      if (atual.statusVinculo !== "PENDENTE") throw new ErroApi(409, "Este professor já foi decidido.");

      db.prepare("UPDATE Professor SET statusVinculo = ?, motivoRecusa = ?, decididoEm = ? WHERE idUsuario = ?").run(
        req.body.decisao === "APROVAR" ? "APROVADO" : "RECUSADO",
        motivo,
        new Date().toISOString(),
        req.params.id,
      );
      req.log.info({ idProfessor: req.params.id, decisao: req.body.decisao }, "professor decidido pela instituição");
      return { professor: semNulos(db.prepare(`${SQL_PROFESSOR} WHERE p.idUsuario = ?`).get(req.params.id) as object) };
    },
  );

  // ---------- Professor que ainda não foi aprovado ----------

  app.patch<{ Body: { codigo: string } }>(
    "/professor/instituicao",
    {
      preHandler: exigirLogin("PROFESSOR"),
      config: limiteSenha, // evita "adivinhar" códigos
      schema: {
        body: { type: "object", properties: { codigo: CODIGO }, required: ["codigo"] },
        response: {
          200: {
            type: "object",
            properties: { mensagem: { type: "string" }, nomeInstituicao: { type: "string" } },
            required: ["mensagem"],
          },
          ...errosComuns,
          429: esquemaErro,
        },
      },
    },
    async (req) => {
      if (situacaoDaConta(req.user).status === "APROVADA") {
        throw new ErroApi(409, "Sua conta já foi aprovada pela instituição.");
      }
      const idInstituicao = instituicaoPeloCodigo(req.body.codigo);
      banco()
        .prepare("UPDATE Professor SET idInstituicao = ?, statusVinculo = 'PENDENTE', motivoRecusa = NULL, decididoEm = NULL WHERE idUsuario = ?")
        .run(idInstituicao, req.user.idUsuario);
      const { nomeInstituicao } = situacaoDaConta(req.user);
      return { mensagem: "Código enviado. Agora é só esperar a instituição aprovar.", nomeInstituicao };
    },
  );
}
