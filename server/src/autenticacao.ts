// Login por token (JWT): registra o @fastify/jwt e oferece os "middlewares" exigirLogin e
// exigirContaLiberada.
// Uso numa rota:  app.get("/x", { preHandler: exigirContaLiberada("PROFESSOR") }, async (req) => req.user.idUsuario)
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { config } from "./config.ts";
import { ErroApi } from "./erros.ts";
import { buscarPorId, situacaoDaConta, type Perfil } from "./usuarios.ts";

/** O que vai dentro do token. Nada de dado pessoal: só o id, o perfil e a versão. */
export interface DadosToken {
  idUsuario: number;
  perfil: Perfil;
  /**
   * Usuario.versaoToken de quando o token foi gerado (passo 12). Trocar a senha sobe a versão
   * e derruba os tokens antigos. Tokens de antes do passo 12 não têm o campo (vale 0).
   */
  versao?: number;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: DadosToken;
    user: DadosToken;
  }
}

export async function registrarAutenticacao(app: FastifyInstance): Promise<void> {
  await app.register(jwt, {
    secret: config.jwtSegredo,
    sign: { expiresIn: config.jwtValidade },
  });
}

/** Gera o token de login de um usuário (com a versão atual: veja DadosToken.versao). */
export function gerarToken(app: FastifyInstance, dados: { idUsuario: number; perfil: Perfil; versaoToken: number }): string {
  return app.jwt.sign({ idUsuario: dados.idUsuario, perfil: dados.perfil, versao: dados.versaoToken });
}

/** Mensagem do 403 de quem entrou com a senha provisória e ainda não trocou. */
export const MENSAGEM_TROCAR_SENHA = "Troque a senha provisória para continuar.";

interface OpcoesLogin {
  /**
   * true = a rota funciona mesmo com a senha provisória ainda não trocada
   * (só GET /auth/eu, PATCH /auth/senha e a narração da tela de troca de senha).
   */
  aceitaSenhaProvisoria?: boolean;
}

/** Como exigirLogin, mas deixa passar quem ainda precisa trocar a senha provisória. */
export function exigirLoginComSenhaProvisoria(...perfis: Perfil[]): preHandlerAsyncHookHandler {
  return verificarLogin(perfis, { aceitaSenhaProvisoria: true });
}

/**
 * Exige um token válido e, se perfis forem passados, um desses perfis.
 * Também confere no banco que o usuário ainda existe e está ativo, e usa o perfil do banco.
 * Sem token / token vencido / token de antes da última troca de senha → 401 ("Entre de novo");
 * perfil errado → 403; senha provisória ainda não trocada → 403 (MENSAGEM_TROCAR_SENHA).
 */
export function exigirLogin(...perfis: Perfil[]): preHandlerAsyncHookHandler {
  return verificarLogin(perfis, {});
}

function verificarLogin(perfis: Perfil[], opcoes: OpcoesLogin): preHandlerAsyncHookHandler {
  return async function (req: FastifyRequest) {
    try {
      await req.jwtVerify();
    } catch {
      throw new ErroApi(401, "Entre de novo para continuar.");
    }
    const usuario = buscarPorId(req.user.idUsuario);
    if (!usuario || usuario.ativo !== 1) throw new ErroApi(401, "Entre de novo para continuar.");
    // Senha trocada depois deste token (aqui ou em outro aparelho): o token antigo não vale mais.
    if ((req.user.versao ?? 0) !== usuario.versaoToken) throw new ErroApi(401, "Entre de novo para continuar.");
    req.user = { idUsuario: usuario.idUsuario, perfil: usuario.perfil, versao: usuario.versaoToken };
    if (perfis.length > 0 && !perfis.includes(usuario.perfil)) {
      throw new ErroApi(403, "Esta parte do aplicativo não é para o seu perfil.");
    }
    if (usuario.senhaProvisoria === 1 && !opcoes.aceitaSenhaProvisoria) {
      throw new ErroApi(403, MENSAGEM_TROCAR_SENHA);
    }
  };
}

/** Mensagem do 403 de quem ainda não foi aprovado, por perfil. */
const mensagemContaPresa: Partial<Record<Perfil, Record<"PENDENTE" | "RECUSADA", string>>> = {
  PROFESSOR: {
    PENDENTE: "Sua conta espera a instituição aprovar. Tente de novo mais tarde.",
    RECUSADA: "A instituição não aprovou sua conta. Veja o motivo na tela inicial.",
  },
  INSTITUICAO: {
    PENDENTE: "Sua instituição espera a aprovação do AJAI. Tente de novo mais tarde.",
    RECUSADA: "O cadastro da instituição não foi aprovado. Veja o motivo na tela inicial.",
  },
};

/**
 * Como exigirLogin, e também exige a conta LIBERADA: professor aprovado pela instituição e
 * instituição aprovada pelo administrador. Aluno, responsável e administrador já são liberados.
 * Conta pendente ou recusada → 403 (o app mostra a tela de espera, pelo `situacao` do /auth/eu).
 */
export function exigirContaLiberada(...perfis: Perfil[]): preHandlerAsyncHookHandler {
  const login = exigirLogin(...perfis);
  return async function (this: unknown, req, resposta) {
    await login.call(this as never, req, resposta);
    const { status } = situacaoDaConta(req.user);
    if (status !== "APROVADA") {
      throw new ErroApi(403, mensagemContaPresa[req.user.perfil]?.[status] ?? "Sua conta ainda não foi liberada.");
    }
  };
}
