// Contas dos alunos, criadas e cuidadas pelo professor/responsável (RF01, APF 18).
// O aluno não se cadastra sozinho, não tem e-mail e não troca a própria senha:
//   GET   /professor/alunos              alunos que ESTE professor criou
//   POST  /professor/alunos              cria aluno { nome, nomeUsuario, senha } e já matricula na turma
//   PATCH /professor/alunos/:id/senha    muda a senha de um aluno que ESTE professor criou
import type { FastifyInstance } from "fastify";
import { gerarHashSenha } from "../../db/senha.mjs";
import { exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { buscarPorId, nomeUsuarioLivre, normalizarNomeUsuario, PADRAO_NOME_USUARIO } from "../usuarios.ts";
import { limiteSenha, SENHA } from "./auth.ts";

const esquemaContaAluno = {
  type: "object",
  properties: {
    idUsuario: { type: "integer" },
    nome: { type: "string" },
    nomeUsuario: { type: "string" },
    turma: { type: "string" },
    criadoEm: { type: "string" },
  },
  required: ["idUsuario", "nome", "nomeUsuario"],
} as const;

const SQL_CONTAS = `
  SELECT u.idUsuario, u.nome, u.nomeUsuario, u.criadoEm,
         (SELECT t.nome FROM Matricula m JOIN Turma t ON t.idTurma = m.idTurma
           WHERE m.idAluno = u.idUsuario ORDER BY m.dataVinculo DESC LIMIT 1) AS turma
    FROM Usuario u
    JOIN Aluno a ON a.idUsuario = u.idUsuario
   WHERE a.idCriador = ?`;

interface ContaAluno {
  idUsuario: number;
  nome: string;
  nomeUsuario: string;
  turma: string | null;
  criadoEm: string;
}

function semTurmaNula(c: ContaAluno) {
  return c.turma === null ? { ...c, turma: undefined } : c;
}

/** Turma ativa do professor para matricular o aluno novo; cria uma se ele ainda não tiver. */
function turmaDoProfessor(idProfessor: number, agora: Date): number {
  const db = banco();
  const turma = db
    .prepare("SELECT idTurma FROM Turma WHERE idProfessor = ? AND ativa = 1 ORDER BY idTurma LIMIT 1")
    .get(idProfessor) as { idTurma: number } | undefined;
  if (turma) return turma.idTurma;
  const professor = buscarPorId(idProfessor)!;
  const periodo = `${agora.getFullYear()}/${agora.getMonth() < 6 ? 1 : 2}`;
  const r = db
    .prepare("INSERT INTO Turma (nome, periodo, ativa, idProfessor) VALUES (?, ?, 1, ?)")
    .run(`Turma de ${professor.nome.split(" ")[0]}`, periodo, idProfessor);
  return Number(r.lastInsertRowid);
}

/** Aluno que ESTE professor criou, ou erro 404 (não revela alunos de outros professores). */
function alunoCriadoPor(idAluno: number, idProfessor: number): ContaAluno {
  const conta = banco().prepare(`${SQL_CONTAS} AND u.idUsuario = ?`).get(idProfessor, idAluno) as
    | ContaAluno
    | undefined;
  if (!conta) throw new ErroApi(404, "Este aluno não foi cadastrado por você.");
  return conta;
}

export async function rotasProfessorAlunos(app: FastifyInstance): Promise<void> {
  app.get(
    "/professor/alunos",
    {
      preHandler: exigirLogin("PROFESSOR"),
      schema: {
        response: {
          200: { type: "object", properties: { alunos: { type: "array", items: esquemaContaAluno } }, required: ["alunos"] },
          401: esquemaErro,
          403: esquemaErro,
        },
      },
    },
    async (req) => {
      const contas = banco().prepare(`${SQL_CONTAS} ORDER BY u.nome COLLATE NOCASE`).all(req.user.idUsuario) as unknown as ContaAluno[];
      return { alunos: contas.map(semTurmaNula) };
    },
  );

  app.post<{ Body: { nome: string; nomeUsuario: string; senha: string } }>(
    "/professor/alunos",
    {
      preHandler: exigirLogin("PROFESSOR"),
      config: limiteSenha,
      schema: {
        // Figma "Cadastrar aluno" (sem o telefone do professor: quem cadastra já é o professor).
        body: {
          type: "object",
          properties: {
            nome: { type: "string", minLength: 2, maxLength: 100, pattern: "\\S" },
            nomeUsuario: { type: "string", minLength: 3, maxLength: 30, pattern: PADRAO_NOME_USUARIO },
            senha: SENHA,
          },
          required: ["nome", "nomeUsuario", "senha"],
        },
        response: {
          201: { type: "object", properties: { aluno: esquemaContaAluno }, required: ["aluno"] },
          400: esquemaErro,
          401: esquemaErro,
          403: esquemaErro,
          409: esquemaErro,
        },
      },
    },
    async (req, resposta) => {
      const nome = req.body.nome.trim().replace(/\s+/g, " ");
      const nomeUsuario = normalizarNomeUsuario(req.body.nomeUsuario);
      if (!/[a-z]/.test(nomeUsuario)) {
        throw new ErroApi(400, "O nome de usuário precisa ter letras. Exemplo: maria.silva");
      }
      const db = banco();
      if (db.prepare("SELECT 1 FROM Usuario WHERE nomeUsuario = ?").get(nomeUsuario)) {
        throw new ErroApi(409, `O usuário ${nomeUsuario} já existe. Que tal ${nomeUsuarioLivre(nomeUsuario)}?`);
      }

      const senhaHash = await gerarHashSenha(req.body.senha);
      const agora = new Date();
      const iso = agora.toISOString();
      let idAluno: number;
      db.exec("BEGIN");
      try {
        const r = db
          .prepare(
            `INSERT INTO Usuario (nome, nomeUsuario, senhaHash, perfil, ativo, criadoEm, atualizadoEm)
             VALUES (?, ?, ?, 'ALUNO', 1, ?, ?)`,
          )
          .run(nome, nomeUsuario, senhaHash, iso, iso);
        idAluno = Number(r.lastInsertRowid);
        // Preferências de voz e fonte ficam com os valores padrão da tabela.
        db.prepare("INSERT INTO Aluno (idUsuario, idCriador) VALUES (?, ?)").run(idAluno, req.user.idUsuario);
        const idTurma = turmaDoProfessor(req.user.idUsuario, agora);
        db.prepare("INSERT INTO Matricula (idAluno, idTurma, dataVinculo) VALUES (?, ?, ?)").run(idAluno, idTurma, iso);
        db.exec("COMMIT");
      } catch (erro) {
        db.exec("ROLLBACK");
        if (erro instanceof Error && /UNIQUE/.test(erro.message)) {
          throw new ErroApi(409, `O usuário ${nomeUsuario} já existe. Que tal ${nomeUsuarioLivre(nomeUsuario)}?`);
        }
        throw erro;
      }
      req.log.info({ idAluno }, "aluno cadastrado pelo professor");
      resposta.code(201);
      return { aluno: semTurmaNula(alunoCriadoPor(idAluno, req.user.idUsuario)) };
    },
  );

  app.patch<{ Params: { id: number }; Body: { senhaNova: string } }>(
    "/professor/alunos/:id/senha",
    {
      preHandler: exigirLogin("PROFESSOR"),
      config: limiteSenha,
      schema: {
        params: { type: "object", properties: { id: { type: "integer", minimum: 1 } }, required: ["id"] },
        body: { type: "object", properties: { senhaNova: SENHA }, required: ["senhaNova"] },
        response: {
          200: { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] },
          400: esquemaErro,
          401: esquemaErro,
          403: esquemaErro,
          404: esquemaErro,
        },
      },
    },
    async (req) => {
      const aluno = alunoCriadoPor(req.params.id, req.user.idUsuario);
      banco()
        .prepare("UPDATE Usuario SET senhaHash = ?, atualizadoEm = ? WHERE idUsuario = ?")
        .run(await gerarHashSenha(req.body.senhaNova), new Date().toISOString(), aluno.idUsuario);
      req.log.info({ idAluno: aluno.idUsuario }, "senha do aluno mudada pelo professor");
      return { mensagem: `Senha de ${aluno.nome.split(" ")[0]} mudada. Entregue a senha nova ao aluno.` };
    },
  );
}
