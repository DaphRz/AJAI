// Vínculo acompanhante ↔ aluno (Passo 3.1). O aluno tem conta própria; o professor (aprovado) ou o
// responsável pede para acompanhar, e o aluno aceita ou recusa.
//   POST   /vinculos                     { aluno: usuário, e-mail ou telefone } → convite PENDENTE
//   GET    /vinculos                     convites e alunos do acompanhante logado
//   DELETE /vinculos/:id                 acompanhante desfaz (ou cancela o convite)
//   GET    /alunos/eu/vinculos           convites PENDENTES e vínculos ACEITOS do aluno
//   PATCH  /alunos/eu/vinculos/:id       { aceitar: true|false }
//   DELETE /alunos/eu/vinculos/:id       aluno desfaz
// Privacidade: enquanto o aluno não aceita, o acompanhante só vê o que ele mesmo digitou; nome e
// demais dados do aluno só com o vínculo ACEITO. Responsável: no máximo 2 (PENDENTE + ACEITO),
// conferido NO SERVIDOR, dentro da transação. Professor: sem limite.
import type { FastifyInstance } from "fastify";
import { exigirContaLiberada, exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { emTransacao } from "../desempenho.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { buscarPorIdentificador } from "../usuarios.ts";
import { limiteSenha } from "./auth.ts";

/** Quantas pessoas um responsável pode acompanhar (convites pendentes contam). */
export const LIMITE_RESPONSAVEL = 2;

/** true se o acompanhante tem vínculo ACEITO com o aluno. Use em toda rota que mostrar dado de aluno. */
export function temVinculoAceito(idAcompanhante: number, idAluno: number): boolean {
  return !!banco()
    .prepare("SELECT 1 FROM Vinculo WHERE idAcompanhante = ? AND idAluno = ? AND status = 'ACEITO'")
    .get(idAcompanhante, idAluno);
}

const paramsId = { type: "object", properties: { id: { type: "integer", minimum: 1 } }, required: ["id"] } as const;
const errosComuns = { 400: esquemaErro, 401: esquemaErro, 403: esquemaErro, 404: esquemaErro, 409: esquemaErro } as const;
const respostaMensagem = { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] } as const;

/** Vínculo visto pelo acompanhante. `aluno` só vem quando ACEITO. */
const esquemaVinculoAcompanhante = {
  type: "object",
  properties: {
    idVinculo: { type: "integer" },
    status: { type: "string" },
    identificadorConvite: { type: "string" },
    criadoEm: { type: "string" },
    decididoEm: { type: "string" },
    aluno: {
      type: "object",
      properties: { idUsuario: { type: "integer" }, nome: { type: "string" } },
      required: ["idUsuario", "nome"],
    },
  },
  required: ["idVinculo", "status", "criadoEm"],
} as const;

/** Vínculo visto pelo aluno: quem quer acompanhar (nome, perfil e instituição do professor). */
const esquemaVinculoAluno = {
  type: "object",
  properties: {
    idVinculo: { type: "integer" },
    status: { type: "string" },
    criadoEm: { type: "string" },
    decididoEm: { type: "string" },
    acompanhante: {
      type: "object",
      properties: { nome: { type: "string" }, perfil: { type: "string" }, instituicao: { type: "string" } },
      required: ["nome", "perfil"],
    },
  },
  required: ["idVinculo", "status", "criadoEm", "acompanhante"],
} as const;

interface LinhaVinculo {
  idVinculo: number;
  idAluno: number;
  status: "PENDENTE" | "ACEITO" | "RECUSADO";
  identificadorConvite: string | null;
  criadoEm: string;
  decididoEm: string | null;
  nomeAluno: string;
}

function paraAcompanhante(v: LinhaVinculo) {
  return {
    idVinculo: v.idVinculo,
    status: v.status,
    identificadorConvite: v.identificadorConvite ?? undefined,
    criadoEm: v.criadoEm,
    decididoEm: v.decididoEm ?? undefined,
    aluno: v.status === "ACEITO" ? { idUsuario: v.idAluno, nome: v.nomeAluno } : undefined,
  };
}

const SQL_DO_ACOMPANHANTE = `
  SELECT v.idVinculo, v.idAluno, v.status, v.identificadorConvite, v.criadoEm, v.decididoEm, u.nome AS nomeAluno
    FROM Vinculo v JOIN Usuario u ON u.idUsuario = v.idAluno
   WHERE v.idAcompanhante = ?`;

export async function rotasVinculos(app: FastifyInstance): Promise<void> {
  // ---------- Acompanhante (professor aprovado ou responsável) ----------

  app.post<{ Body: { aluno: string } }>(
    "/vinculos",
    {
      preHandler: exigirContaLiberada("PROFESSOR", "RESPONSAVEL"),
      config: limiteSenha, // evita testar muitos usuários/e-mails/telefones em sequência
      schema: {
        body: { type: "object", properties: { aluno: { type: "string", minLength: 3, maxLength: 120 } }, required: ["aluno"] },
        response: {
          201: { type: "object", properties: { vinculo: esquemaVinculoAcompanhante }, required: ["vinculo"] },
          ...errosComuns,
          429: esquemaErro,
        },
      },
    },
    async (req, resposta) => {
      const identificador = req.body.aluno.trim();
      const alvo = buscarPorIdentificador(identificador);
      // Mesma mensagem para "não existe" e "não é aluno": não revela que tipo de conta existe.
      if (!alvo || alvo.perfil !== "ALUNO" || alvo.ativo !== 1) {
        throw new ErroApi(404, "Não achamos um aluno com estes dados. Confira com o aluno e tente de novo.");
      }
      const idAcompanhante = req.user.idUsuario;
      const ehResponsavel = req.user.perfil === "RESPONSAVEL";
      const agora = new Date().toISOString();

      const idVinculo = emTransacao(() => {
        const db = banco();
        const existente = db
          .prepare("SELECT idVinculo, status FROM Vinculo WHERE idAluno = ? AND idAcompanhante = ?")
          .get(alvo.idUsuario, idAcompanhante) as { idVinculo: number; status: string } | undefined;
        if (existente?.status === "ACEITO") throw new ErroApi(409, "Você já acompanha esta pessoa.");
        if (existente?.status === "PENDENTE") throw new ErroApi(409, "O convite já foi enviado. Espere a pessoa aceitar.");

        if (ehResponsavel) {
          const { total } = db
            .prepare("SELECT COUNT(*) AS total FROM Vinculo WHERE idAcompanhante = ? AND status IN ('PENDENTE', 'ACEITO')")
            .get(idAcompanhante) as { total: number };
          if (total >= LIMITE_RESPONSAVEL) throw new ErroApi(409, `Você já acompanha ${LIMITE_RESPONSAVEL} pessoas.`);
        }

        if (existente) {
          // Convite recusado antes: pode convidar de novo (o aluno decide outra vez).
          db.prepare(
            "UPDATE Vinculo SET status = 'PENDENTE', identificadorConvite = ?, criadoEm = ?, decididoEm = NULL WHERE idVinculo = ?",
          ).run(identificador, agora, existente.idVinculo);
          return existente.idVinculo;
        }
        const r = db
          .prepare(
            "INSERT INTO Vinculo (idAluno, idAcompanhante, status, identificadorConvite, criadoEm) VALUES (?, ?, 'PENDENTE', ?, ?)",
          )
          .run(alvo.idUsuario, idAcompanhante, identificador, agora);
        return Number(r.lastInsertRowid);
      });

      const linha = banco().prepare(`${SQL_DO_ACOMPANHANTE} AND v.idVinculo = ?`).get(idAcompanhante, idVinculo) as unknown as LinhaVinculo;
      resposta.code(201);
      return { vinculo: paraAcompanhante(linha) };
    },
  );

  app.get(
    "/vinculos",
    {
      preHandler: exigirContaLiberada("PROFESSOR", "RESPONSAVEL"),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              vinculos: { type: "array", items: esquemaVinculoAcompanhante },
              // null = sem limite (professor)
              limite: { type: ["integer", "null"] },
            },
            required: ["vinculos"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const linhas = banco()
        .prepare(`${SQL_DO_ACOMPANHANTE} ORDER BY CASE v.status WHEN 'PENDENTE' THEN 0 WHEN 'ACEITO' THEN 1 ELSE 2 END, v.criadoEm DESC`)
        .all(req.user.idUsuario) as unknown as LinhaVinculo[];
      return {
        vinculos: linhas.map(paraAcompanhante),
        limite: req.user.perfil === "RESPONSAVEL" ? LIMITE_RESPONSAVEL : null,
      };
    },
  );

  app.delete<{ Params: { id: number } }>(
    "/vinculos/:id",
    {
      preHandler: exigirContaLiberada("PROFESSOR", "RESPONSAVEL"),
      schema: { params: paramsId, response: { 200: respostaMensagem, ...errosComuns } },
    },
    async (req) => {
      const r = banco().prepare("DELETE FROM Vinculo WHERE idVinculo = ? AND idAcompanhante = ?").run(req.params.id, req.user.idUsuario);
      if (r.changes === 0) throw new ErroApi(404, "Não encontramos este acompanhamento.");
      return { mensagem: "Pronto. Você não acompanha mais esta pessoa." };
    },
  );

  // ---------- Aluno ----------

  app.get(
    "/alunos/eu/vinculos",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: {
        response: {
          200: { type: "object", properties: { vinculos: { type: "array", items: esquemaVinculoAluno } }, required: ["vinculos"] },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const linhas = banco()
        .prepare(
          `SELECT v.idVinculo, v.status, v.criadoEm, v.decididoEm, u.nome, u.perfil, iu.nome AS instituicao
             FROM Vinculo v
             JOIN Usuario u ON u.idUsuario = v.idAcompanhante
             LEFT JOIN Professor p ON p.idUsuario = u.idUsuario
             LEFT JOIN Usuario iu ON iu.idUsuario = p.idInstituicao
            WHERE v.idAluno = ? AND v.status IN ('PENDENTE', 'ACEITO')
            ORDER BY CASE v.status WHEN 'PENDENTE' THEN 0 ELSE 1 END, v.criadoEm DESC`,
        )
        .all(req.user.idUsuario) as unknown as {
        idVinculo: number;
        status: string;
        criadoEm: string;
        decididoEm: string | null;
        nome: string;
        perfil: string;
        instituicao: string | null;
      }[];
      return {
        vinculos: linhas.map((l) => ({
          idVinculo: l.idVinculo,
          status: l.status,
          criadoEm: l.criadoEm,
          decididoEm: l.decididoEm ?? undefined,
          acompanhante: { nome: l.nome, perfil: l.perfil, instituicao: l.instituicao ?? undefined },
        })),
      };
    },
  );

  app.patch<{ Params: { id: number }; Body: { aceitar: boolean } }>(
    "/alunos/eu/vinculos/:id",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: {
        params: paramsId,
        body: { type: "object", properties: { aceitar: { type: "boolean" } }, required: ["aceitar"] },
        response: { 200: respostaMensagem, ...errosComuns },
      },
    },
    async (req) => {
      const db = banco();
      const atual = db
        .prepare("SELECT status FROM Vinculo WHERE idVinculo = ? AND idAluno = ?")
        .get(req.params.id, req.user.idUsuario) as { status: string } | undefined;
      if (!atual || atual.status === "RECUSADO") throw new ErroApi(404, "Não encontramos este convite.");
      if (atual.status !== "PENDENTE") throw new ErroApi(409, "Você já respondeu este convite.");
      db.prepare("UPDATE Vinculo SET status = ?, decididoEm = ? WHERE idVinculo = ?").run(
        req.body.aceitar ? "ACEITO" : "RECUSADO",
        new Date().toISOString(),
        req.params.id,
      );
      return {
        mensagem: req.body.aceitar ? "Muito bem! Agora essa pessoa acompanha seu progresso." : "Tudo bem. O convite foi recusado.",
      };
    },
  );

  app.delete<{ Params: { id: number } }>(
    "/alunos/eu/vinculos/:id",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: { params: paramsId, response: { 200: respostaMensagem, ...errosComuns } },
    },
    async (req) => {
      const r = banco()
        .prepare("DELETE FROM Vinculo WHERE idVinculo = ? AND idAluno = ? AND status = 'ACEITO'")
        .run(req.params.id, req.user.idUsuario);
      if (r.changes === 0) throw new ErroApi(404, "Não encontramos este acompanhamento.");
      return { mensagem: "Pronto. Essa pessoa não acompanha mais você." };
    },
  );
}
