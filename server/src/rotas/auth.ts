// Autenticação (RF01, RF02, APF 18): cadastro, login, dados do usuário logado e troca de senha.
//   POST  /auth/cadastro   SÓ professor/responsável → { token, usuario }
//                          (o aluno é cadastrado pelo professor: rotas/professorAlunos.ts)
//   POST  /auth/login      usuário (aluno), e-mail ou telefone + senha → { token, usuario }
//                          (o perfil vem da conta; a tela de login não pergunta)
//   GET   /auth/eu         usuário do token
//   PATCH /auth/senha      professor/administrador troca a própria senha (aluno NÃO: só quem criou a conta dele)
import type { FastifyInstance } from "fastify";
import { conferirSenha, gerarHashSenha, HASH_FALSO } from "../../db/senha.mjs";
import { exigirLogin, gerarToken } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { config } from "../config.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import {
  buscarPorId,
  buscarPorIdentificador,
  esquemaUsuario,
  normalizarEmail,
  normalizarTelefone,
  usuarioPublico,
} from "../usuarios.ts";

export const SENHA = { type: "string", minLength: 6, maxLength: 128 } as const;
const TELEFONE = { type: "string", minLength: 8, maxLength: 20, pattern: "^[0-9()+ .-]+$" } as const;

const respostaComToken = {
  type: "object",
  properties: { token: { type: "string" }, usuario: esquemaUsuario },
  required: ["token", "usuario"],
} as const;

/** Limite próprio (mais apertado) para as rotas que recebem senha. */
export const limiteSenha = { rateLimit: { max: config.limiteLoginPorMinuto, timeWindow: "1 minute" } };

interface CorpoCadastro {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  dataNascimento?: string;
}

export async function rotasAuth(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CorpoCadastro }>(
    "/auth/cadastro",
    {
      config: limiteSenha,
      schema: {
        // Campos do Figma "Cadastro de professor ou responsável".
        body: {
          type: "object",
          properties: {
            nome: { type: "string", minLength: 2, maxLength: 100, pattern: "\\S" },
            email: { type: "string", format: "email", maxLength: 120 },
            telefone: TELEFONE,
            senha: SENHA,
            dataNascimento: { type: "string", format: "date" },
          },
          required: ["nome", "email", "telefone", "senha"],
        },
        response: { 201: respostaComToken, 400: esquemaErro, 409: esquemaErro },
      },
    },
    async (req, resposta) => {
      const corpo = req.body;
      const nome = corpo.nome.trim().replace(/\s+/g, " ");
      const email = normalizarEmail(corpo.email);
      const telefone = normalizarTelefone(corpo.telefone);
      if (!telefone) throw new ErroApi(400, "Confira o telefone. Escreva com DDD, só números.");

      const db = banco();
      if (db.prepare("SELECT 1 FROM Usuario WHERE email = ?").get(email)) {
        throw new ErroApi(409, "Este e-mail já tem conta. Volte e toque em Entrar.");
      }
      if (db.prepare("SELECT 1 FROM Usuario WHERE telefone = ?").get(telefone)) {
        throw new ErroApi(409, "Este telefone já tem conta. Volte e toque em Entrar.");
      }

      const senhaHash = await gerarHashSenha(corpo.senha); // antes da transação (é assíncrono)
      const agora = new Date().toISOString();

      let idUsuario: number;
      db.exec("BEGIN");
      try {
        const r = db
          .prepare(
            `INSERT INTO Usuario (nome, email, telefone, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm)
             VALUES (?, ?, ?, ?, 'PROFESSOR', ?, 1, ?, ?)`,
          )
          .run(nome, email, telefone, senhaHash, corpo.dataNascimento ?? null, agora, agora);
        idUsuario = Number(r.lastInsertRowid);
        db.prepare("INSERT INTO Professor (idUsuario) VALUES (?)").run(idUsuario);
        db.exec("COMMIT");
      } catch (erro) {
        db.exec("ROLLBACK");
        // Corrida rara: outra pessoa cadastrou o mesmo e-mail/telefone entre a checagem e o INSERT.
        if (erro instanceof Error && /UNIQUE/.test(erro.message)) {
          throw new ErroApi(409, "Este e-mail ou telefone já tem conta. Volte e toque em Entrar.");
        }
        throw erro;
      }

      const usuario = buscarPorId(idUsuario)!;
      resposta.code(201);
      return { token: gerarToken(app, usuario), usuario: usuarioPublico(usuario) };
    },
  );

  app.post<{ Body: { identificador: string; senha: string } }>(
    "/auth/login",
    {
      config: limiteSenha,
      schema: {
        body: {
          type: "object",
          properties: {
            identificador: { type: "string", minLength: 3, maxLength: 120 },
            senha: { type: "string", minLength: 1, maxLength: 128 },
          },
          required: ["identificador", "senha"],
        },
        response: { 200: respostaComToken, 400: esquemaErro, 401: esquemaErro },
      },
    },
    async (req) => {
      const usuario = buscarPorIdentificador(req.body.identificador);
      // Confere a senha mesmo sem usuário (com um hash falso) para a resposta levar o mesmo
      // tempo e não revelar quais e-mails/telefones têm conta.
      const confere = await conferirSenha(req.body.senha, usuario?.senhaHash ?? HASH_FALSO);
      if (!usuario || !confere || usuario.ativo !== 1) {
        throw new ErroApi(401, "Usuário ou senha não conferem. Confira e tente de novo.");
      }
      return { token: gerarToken(app, usuario), usuario: usuarioPublico(usuario) };
    },
  );

  app.get(
    "/auth/eu",
    {
      preHandler: exigirLogin(),
      schema: {
        response: {
          200: { type: "object", properties: { usuario: esquemaUsuario }, required: ["usuario"] },
          401: esquemaErro,
        },
      },
    },
    async (req) => ({ usuario: usuarioPublico(buscarPorId(req.user.idUsuario)!) }),
  );

  app.patch<{ Body: { senhaAtual: string; senhaNova: string } }>(
    "/auth/senha",
    {
      // Aluno não troca a própria senha: só o professor que criou a conta dele (professorAlunos.ts).
      preHandler: exigirLogin(),
      config: limiteSenha,
      schema: {
        body: {
          type: "object",
          properties: { senhaAtual: { type: "string", minLength: 1, maxLength: 128 }, senhaNova: SENHA },
          required: ["senhaAtual", "senhaNova"],
        },
        response: {
          200: { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] },
          400: esquemaErro,
          401: esquemaErro,
          403: esquemaErro,
        },
      },
    },
    async (req) => {
      if (req.user.perfil === "ALUNO") {
        throw new ErroApi(403, "Para mudar sua senha, fale com seu professor.");
      }
      const usuario = buscarPorId(req.user.idUsuario)!;
      if (!(await conferirSenha(req.body.senhaAtual, usuario.senhaHash))) {
        throw new ErroApi(400, "A senha de hoje não confere. Tente de novo.");
      }
      const senhaHash = await gerarHashSenha(req.body.senhaNova);
      banco()
        .prepare("UPDATE Usuario SET senhaHash = ?, atualizadoEm = ? WHERE idUsuario = ?")
        .run(senhaHash, new Date().toISOString(), usuario.idUsuario);
      return { mensagem: "Senha trocada. Use a senha nova da próxima vez." };
    },
  );
}
