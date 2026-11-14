// Turmas criadas pela instituição (passo 8). A instituição (aprovada) cria a turma e escolhe um
// professor APROVADO dela; a turma passa a aparecer na aba Turmas desse professor, que põe os alunos.
// Privacidade: a instituição vê só QUANTOS alunos a turma tem (não tem vínculo com os alunos).
//   GET    /instituicao/turmas          turmas dos professores dela + professores aprovados (para escolher)
//   POST   /instituicao/turmas          { nome, periodo, idProfessor }
//   PATCH  /instituicao/turmas/:id      { nome?, periodo?, ativa?, idProfessor? } trocar o professor
//                                       tira os alunos (eles são acompanhados pelo professor antigo)
//   DELETE /instituicao/turmas/:id      apaga a turma (os alunos ficam sem turma)
// Turma de professor de outra instituição → 404.
import type { FastifyInstance } from "fastify";
import { exigirContaLiberada } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { emTransacao } from "../desempenho.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { NOME_TURMA, PERIODO_TURMA } from "./professor.ts";

const paramsId = { type: "object", properties: { id: { type: "integer", minimum: 1 } }, required: ["id"] } as const;
const errosComuns = { 400: esquemaErro, 401: esquemaErro, 403: esquemaErro, 404: esquemaErro, 409: esquemaErro } as const;
const respostaMensagem = { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] } as const;
const ID_PROFESSOR = { type: "integer", minimum: 1 } as const;
const esquemaPessoa = {
  type: "object",
  properties: { idUsuario: { type: "integer" }, nome: { type: "string" } },
  required: ["idUsuario", "nome"],
} as const;
const esquemaTurma = {
  type: "object",
  properties: {
    idTurma: { type: "integer" },
    nome: { type: "string" },
    periodo: { type: "string" },
    ativa: { type: "boolean" },
    professor: esquemaPessoa,
    totalAlunos: { type: "integer" },
  },
  required: ["idTurma", "nome", "periodo", "ativa", "professor", "totalAlunos"],
} as const;

const limpar = (texto: string) => texto.trim().replace(/\s+/g, " ");

/** O professor precisa ser APROVADO desta instituição (senão 404). Devolve o nome. */
function professorDaInstituicao(idProfessor: number, idInstituicao: number): string {
  const p = banco()
    .prepare(
      `SELECT u.nome FROM Professor p JOIN Usuario u ON u.idUsuario = p.idUsuario
        WHERE p.idUsuario = ? AND p.idInstituicao = ? AND p.statusVinculo = 'APROVADO' AND u.ativo = 1`,
    )
    .get(idProfessor, idInstituicao) as { nome: string } | undefined;
  if (!p) throw new ErroApi(404, "Escolha um professor aprovado da sua instituição.");
  return p.nome;
}

/** A turma precisa ser de um professor desta instituição (senão 404). */
function turmaDaInstituicao(idTurma: number, idInstituicao: number) {
  const t = banco()
    .prepare(
      `SELECT t.idTurma, t.nome, t.periodo, t.ativa, t.idProfessor
         FROM Turma t JOIN Professor p ON p.idUsuario = t.idProfessor
        WHERE t.idTurma = ? AND p.idInstituicao = ?`,
    )
    .get(idTurma, idInstituicao) as { idTurma: number; nome: string; periodo: string; ativa: number; idProfessor: number } | undefined;
  if (!t) throw new ErroApi(404, "Não encontramos esta turma.");
  return t;
}

export async function rotasTurmasInstituicao(app: FastifyInstance): Promise<void> {
  const soInstituicao = exigirContaLiberada("INSTITUICAO");

  app.get(
    "/instituicao/turmas",
    {
      preHandler: soInstituicao,
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              turmas: { type: "array", items: esquemaTurma },
              professores: { type: "array", items: esquemaPessoa },
            },
            required: ["turmas", "professores"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const idInstituicao = req.user.idUsuario;
      const db = banco();
      // Só conta aluno que ainda tem vínculo ACEITO com o professor da turma.
      const turmas = db
        .prepare(
          `SELECT t.idTurma, t.nome, t.periodo, t.ativa, u.idUsuario AS idProfessor, u.nome AS nomeProfessor,
                  (SELECT COUNT(*) FROM Matricula m JOIN Vinculo v
                      ON v.idAluno = m.idAluno AND v.idAcompanhante = t.idProfessor AND v.status = 'ACEITO'
                    WHERE m.idTurma = t.idTurma) AS totalAlunos
             FROM Turma t
             JOIN Professor p ON p.idUsuario = t.idProfessor
             JOIN Usuario u ON u.idUsuario = p.idUsuario
            WHERE p.idInstituicao = ?
            ORDER BY t.ativa DESC, t.nome`,
        )
        .all(idInstituicao) as unknown as {
        idTurma: number;
        nome: string;
        periodo: string;
        ativa: number;
        idProfessor: number;
        nomeProfessor: string;
        totalAlunos: number;
      }[];
      const professores = db
        .prepare(
          `SELECT u.idUsuario, u.nome FROM Professor p JOIN Usuario u ON u.idUsuario = p.idUsuario
            WHERE p.idInstituicao = ? AND p.statusVinculo = 'APROVADO' AND u.ativo = 1 ORDER BY u.nome`,
        )
        .all(idInstituicao) as unknown as { idUsuario: number; nome: string }[];
      return {
        turmas: turmas.map((t) => ({
          idTurma: t.idTurma,
          nome: t.nome,
          periodo: t.periodo,
          ativa: t.ativa === 1,
          professor: { idUsuario: t.idProfessor, nome: t.nomeProfessor },
          totalAlunos: t.totalAlunos,
        })),
        professores,
      };
    },
  );

  app.post<{ Body: { nome: string; periodo: string; idProfessor: number } }>(
    "/instituicao/turmas",
    {
      preHandler: soInstituicao,
      schema: {
        body: {
          type: "object",
          properties: { nome: NOME_TURMA, periodo: PERIODO_TURMA, idProfessor: ID_PROFESSOR },
          required: ["nome", "periodo", "idProfessor"],
        },
        response: { 201: { type: "object", properties: { turma: esquemaTurma }, required: ["turma"] }, ...errosComuns },
      },
    },
    async (req, resposta) => {
      const nomeProfessor = professorDaInstituicao(req.body.idProfessor, req.user.idUsuario);
      const nome = limpar(req.body.nome);
      const periodo = req.body.periodo.trim();
      const r = banco()
        .prepare("INSERT INTO Turma (nome, periodo, ativa, idProfessor) VALUES (?, ?, 1, ?)")
        .run(nome, periodo, req.body.idProfessor);
      resposta.code(201);
      return {
        turma: {
          idTurma: Number(r.lastInsertRowid),
          nome,
          periodo,
          ativa: true,
          professor: { idUsuario: req.body.idProfessor, nome: nomeProfessor },
          totalAlunos: 0,
        },
      };
    },
  );

  app.patch<{ Params: { id: number }; Body: { nome?: string; periodo?: string; ativa?: boolean; idProfessor?: number } }>(
    "/instituicao/turmas/:id",
    {
      preHandler: soInstituicao,
      schema: {
        params: paramsId,
        body: {
          type: "object",
          properties: { nome: NOME_TURMA, periodo: PERIODO_TURMA, ativa: { type: "boolean" }, idProfessor: ID_PROFESSOR },
          minProperties: 1,
        },
        response: { 200: respostaMensagem, ...errosComuns },
      },
    },
    async (req) => {
      const atual = turmaDaInstituicao(req.params.id, req.user.idUsuario);
      const trocaProfessor = req.body.idProfessor !== undefined && req.body.idProfessor !== atual.idProfessor;
      const nomeProfessor = trocaProfessor ? professorDaInstituicao(req.body.idProfessor!, req.user.idUsuario) : undefined;
      emTransacao(() => {
        const db = banco();
        db.prepare("UPDATE Turma SET nome = ?, periodo = ?, ativa = ?, idProfessor = ? WHERE idTurma = ?").run(
          req.body.nome ? limpar(req.body.nome) : atual.nome,
          req.body.periodo?.trim() ?? atual.periodo,
          req.body.ativa === undefined ? atual.ativa : req.body.ativa ? 1 : 0,
          trocaProfessor ? req.body.idProfessor! : atual.idProfessor,
          atual.idTurma,
        );
        // Os alunos eram acompanhados pelo professor antigo: o novo os convida e põe na turma.
        if (trocaProfessor) db.prepare("DELETE FROM Matricula WHERE idTurma = ?").run(atual.idTurma);
      });
      return {
        mensagem: trocaProfessor
          ? `Turma passada para ${nomeProfessor}. Os alunos saíram da turma; o professor convida e coloca os dele.`
          : "Turma atualizada.",
      };
    },
  );

  app.delete<{ Params: { id: number } }>(
    "/instituicao/turmas/:id",
    { preHandler: soInstituicao, schema: { params: paramsId, response: { 200: respostaMensagem, ...errosComuns } } },
    async (req) => {
      const turma = turmaDaInstituicao(req.params.id, req.user.idUsuario);
      banco().prepare("DELETE FROM Turma WHERE idTurma = ?").run(turma.idTurma);
      return { mensagem: "Turma apagada." };
    },
  );
}
