// Autenticação (RF01, RF02, APF 18): cadastro, login, dados do usuário logado e troca de senha.
// Modelo de contas do Passo 3.1: cada perfil cria a própria conta (o administrador não).
//   POST  /auth/cadastro/aluno         { nome, senha, nomeUsuario?, email?, telefone? } (pelo menos um dos 3)
//   POST  /auth/cadastro/professor     { nome, email, telefone, senha, codigo } → fica PENDENTE até a instituição aprovar
//   POST  /auth/cadastro/responsavel   { nome, email, telefone, senha }
//   POST  /auth/cadastro/instituicao   { nome, cnpj, nomeResponsavel, email, telefone, senha } → PENDENTE até o administrador aprovar
//                                      todos → { token, usuario } (usuario.situacao diz se a conta já está liberada)
//   POST  /auth/login      usuário, e-mail ou telefone + senha → { token, usuario }
//   GET   /auth/eu         usuário do token (com a situação da conta: o app usa em "Verificar de novo")
//   PATCH /auth/senha      qualquer perfil troca a própria senha (inclusive o aluno)
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
  nomeUsuarioLivre,
  normalizarCnpj,
  normalizarCodigo,
  normalizarEmail,
  normalizarNomeUsuario,
  normalizarTelefone,
  PADRAO_NOME_USUARIO,
  type Perfil,
  usuarioPublico,
} from "../usuarios.ts";

export const SENHA = { type: "string", minLength: 6, maxLength: 128 } as const;
const NOME = { type: "string", minLength: 2, maxLength: 100, pattern: "\\S" } as const;
const EMAIL = { type: "string", format: "email", maxLength: 120 } as const;
const TELEFONE = { type: "string", minLength: 8, maxLength: 20, pattern: "^[0-9()+ .-]+$" } as const;
const NOME_USUARIO = { type: "string", minLength: 3, maxLength: 30, pattern: PADRAO_NOME_USUARIO } as const;
/** Código da instituição: 6 caracteres (aceita minúsculas, espaço e traço; o servidor normaliza). */
export const CODIGO = { type: "string", minLength: 6, maxLength: 12, pattern: "^[A-Za-z0-9 -]+$" } as const;

const respostaComToken = {
  type: "object",
  properties: { token: { type: "string" }, usuario: esquemaUsuario },
  required: ["token", "usuario"],
} as const;

/** Limite próprio (mais apertado) para as rotas que recebem senha ou código. */
export const limiteSenha = { rateLimit: { max: config.limiteLoginPorMinuto, timeWindow: "1 minute" } };

const respostasCadastro = { 201: respostaComToken, 400: esquemaErro, 409: esquemaErro, 429: esquemaErro } as const;

/** Nome digitado → sem espaços repetidos nem nas pontas. */
function limparNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

interface Contato {
  nomeUsuario: string | null;
  email: string | null;
  telefone: string | null;
}

/** Normaliza e confere se e-mail, telefone e nome de usuário ainda estão livres (409 se não). */
function conferirContato(dados: { nomeUsuario?: string; email?: string; telefone?: string }): Contato {
  const db = banco();
  const email = dados.email ? normalizarEmail(dados.email) : null;
  let telefone: string | null = null;
  if (dados.telefone) {
    telefone = normalizarTelefone(dados.telefone);
    if (!telefone) throw new ErroApi(400, "Confira o telefone. Escreva com DDD, só números.");
  }
  const nomeUsuario = dados.nomeUsuario ? normalizarNomeUsuario(dados.nomeUsuario) : null;
  if (nomeUsuario && !/[a-z]/.test(nomeUsuario)) {
    throw new ErroApi(400, "O nome de usuário precisa ter letras. Exemplo: maria.silva");
  }

  if (email && db.prepare("SELECT 1 FROM Usuario WHERE email = ?").get(email)) {
    throw new ErroApi(409, "Este e-mail já tem conta. Volte e toque em Entrar.");
  }
  if (telefone && db.prepare("SELECT 1 FROM Usuario WHERE telefone = ?").get(telefone)) {
    throw new ErroApi(409, "Este telefone já tem conta. Volte e toque em Entrar.");
  }
  if (nomeUsuario && db.prepare("SELECT 1 FROM Usuario WHERE nomeUsuario = ?").get(nomeUsuario)) {
    throw new ErroApi(409, `O usuário ${nomeUsuario} já existe. Que tal ${nomeUsuarioLivre(nomeUsuario)}?`);
  }
  return { nomeUsuario, email, telefone };
}

/**
 * Cria Usuario + a linha da especialização (dentro de uma transação) e devolve o id.
 * `especializar` recebe o id novo e insere em Aluno/Professor/Responsavel/Instituicao.
 */
function criarUsuario(
  perfil: Exclude<Perfil, "ADMINISTRADOR">,
  nome: string,
  contato: Contato,
  senhaHash: string,
  especializar: (idUsuario: number, agora: string) => void,
): number {
  const db = banco();
  const agora = new Date().toISOString();
  db.exec("BEGIN");
  try {
    const r = db
      .prepare(
        `INSERT INTO Usuario (nome, nomeUsuario, email, telefone, senhaHash, perfil, ativo, criadoEm, atualizadoEm)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      )
      .run(nome, contato.nomeUsuario, contato.email, contato.telefone, senhaHash, perfil, agora, agora);
    const idUsuario = Number(r.lastInsertRowid);
    especializar(idUsuario, agora);
    db.exec("COMMIT");
    return idUsuario;
  } catch (erro) {
    db.exec("ROLLBACK");
    // Corrida rara: outra pessoa cadastrou o mesmo dado entre a checagem e o INSERT.
    if (erro instanceof Error && /UNIQUE/.test(erro.message)) {
      throw new ErroApi(409, "Estes dados já têm conta. Volte e toque em Entrar.");
    }
    throw erro;
  }
}

/** Instituição APROVADA com este código, ou 400 com mensagem curta (não diz se existe pendente). */
export function instituicaoPeloCodigo(codigo: string): number {
  const linha = banco()
    .prepare("SELECT idUsuario FROM Instituicao WHERE codigo = ? AND status = 'APROVADA'")
    .get(normalizarCodigo(codigo)) as { idUsuario: number } | undefined;
  if (!linha) throw new ErroApi(400, "Não achamos este código. Confira com a sua instituição.");
  return linha.idUsuario;
}

interface CorpoComContato {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}

export async function rotasAuth(app: FastifyInstance): Promise<void> {
  function responderComToken(idUsuario: number) {
    const usuario = buscarPorId(idUsuario)!;
    return { token: gerarToken(app, usuario), usuario: usuarioPublico(usuario) };
  }

  app.post<{ Body: { nome: string; senha: string; nomeUsuario?: string; email?: string; telefone?: string } }>(
    "/auth/cadastro/aluno",
    {
      config: limiteSenha,
      schema: {
        body: {
          type: "object",
          properties: { nome: NOME, senha: SENHA, nomeUsuario: NOME_USUARIO, email: EMAIL, telefone: TELEFONE },
          required: ["nome", "senha"],
        },
        response: respostasCadastro,
      },
    },
    async (req, resposta) => {
      const { nomeUsuario, email, telefone } = req.body;
      if (!nomeUsuario && !email && !telefone) {
        throw new ErroApi(400, "Escreva um nome de usuário, um e-mail ou um telefone para entrar depois.");
      }
      const contato = conferirContato({ nomeUsuario, email, telefone });
      const senhaHash = await gerarHashSenha(req.body.senha); // antes da transação (é assíncrono)
      const id = criarUsuario("ALUNO", limparNome(req.body.nome), contato, senhaHash, (idUsuario) => {
        // Preferências de voz e fonte ficam com os valores padrão da tabela.
        banco().prepare("INSERT INTO Aluno (idUsuario) VALUES (?)").run(idUsuario);
      });
      resposta.code(201);
      return responderComToken(id);
    },
  );

  app.post<{ Body: CorpoComContato & { codigo: string } }>(
    "/auth/cadastro/professor",
    {
      config: limiteSenha,
      schema: {
        body: {
          type: "object",
          properties: { nome: NOME, email: EMAIL, telefone: TELEFONE, senha: SENHA, codigo: CODIGO },
          required: ["nome", "email", "telefone", "senha", "codigo"],
        },
        response: respostasCadastro,
      },
    },
    async (req, resposta) => {
      const idInstituicao = instituicaoPeloCodigo(req.body.codigo);
      const contato = conferirContato({ email: req.body.email, telefone: req.body.telefone });
      const senhaHash = await gerarHashSenha(req.body.senha);
      const id = criarUsuario("PROFESSOR", limparNome(req.body.nome), contato, senhaHash, (idUsuario) => {
        banco()
          .prepare("INSERT INTO Professor (idUsuario, idInstituicao, statusVinculo) VALUES (?, ?, 'PENDENTE')")
          .run(idUsuario, idInstituicao);
      });
      resposta.code(201);
      return responderComToken(id);
    },
  );

  app.post<{ Body: CorpoComContato }>(
    "/auth/cadastro/responsavel",
    {
      config: limiteSenha,
      schema: {
        body: {
          type: "object",
          properties: { nome: NOME, email: EMAIL, telefone: TELEFONE, senha: SENHA },
          required: ["nome", "email", "telefone", "senha"],
        },
        response: respostasCadastro,
      },
    },
    async (req, resposta) => {
      const contato = conferirContato({ email: req.body.email, telefone: req.body.telefone });
      const senhaHash = await gerarHashSenha(req.body.senha);
      const id = criarUsuario("RESPONSAVEL", limparNome(req.body.nome), contato, senhaHash, (idUsuario) => {
        banco().prepare("INSERT INTO Responsavel (idUsuario) VALUES (?)").run(idUsuario);
      });
      resposta.code(201);
      return responderComToken(id);
    },
  );

  app.post<{ Body: CorpoComContato & { cnpj: string; nomeResponsavel: string } }>(
    "/auth/cadastro/instituicao",
    {
      config: limiteSenha,
      schema: {
        body: {
          type: "object",
          properties: {
            nome: NOME,
            cnpj: { type: "string", minLength: 14, maxLength: 20, pattern: "^[0-9./ -]+$" },
            nomeResponsavel: NOME,
            email: EMAIL,
            telefone: TELEFONE,
            senha: SENHA,
          },
          required: ["nome", "cnpj", "nomeResponsavel", "email", "telefone", "senha"],
        },
        response: respostasCadastro,
      },
    },
    async (req, resposta) => {
      const cnpj = normalizarCnpj(req.body.cnpj);
      if (!cnpj) throw new ErroApi(400, "Confira o CNPJ. São 14 números.");
      if (banco().prepare("SELECT 1 FROM Instituicao WHERE cnpj = ?").get(cnpj)) {
        throw new ErroApi(409, "Este CNPJ já tem cadastro. Volte e toque em Entrar.");
      }
      const contato = conferirContato({ email: req.body.email, telefone: req.body.telefone });
      const senhaHash = await gerarHashSenha(req.body.senha);
      const id = criarUsuario("INSTITUICAO", limparNome(req.body.nome), contato, senhaHash, (idUsuario) => {
        banco()
          .prepare("INSERT INTO Instituicao (idUsuario, cnpj, nomeResponsavel, status) VALUES (?, ?, ?, 'PENDENTE')")
          .run(idUsuario, cnpj, limparNome(req.body.nomeResponsavel));
      });
      req.log.info({ idUsuario: id }, "instituição inscrita, esperando o administrador");
      resposta.code(201);
      return responderComToken(id);
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
        response: { 200: respostaComToken, 400: esquemaErro, 401: esquemaErro, 429: esquemaErro },
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
      // Todos os perfis trocam a própria senha (inclusive o aluno e quem ainda espera aprovação).
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
        },
      },
    },
    async (req) => {
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
