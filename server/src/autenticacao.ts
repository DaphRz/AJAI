// Login por token (JWT): registra o @fastify/jwt e oferece o "middleware" exigirLogin.
// Uso numa rota:  app.get("/x", { preHandler: exigirLogin("PROFESSOR") }, async (req) => req.user.idUsuario)
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { config } from "./config.ts";
import { ErroApi } from "./erros.ts";
import { buscarPorId, type Perfil } from "./usuarios.ts";

/** O que vai dentro do token. Nada de dado pessoal: só o id e o perfil. */
export interface DadosToken {
  idUsuario: number;
  perfil: Perfil;
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

/** Gera o token de login de um usuário. */
export function gerarToken(app: FastifyInstance, dados: DadosToken): string {
  return app.jwt.sign({ idUsuario: dados.idUsuario, perfil: dados.perfil });
}

/**
 * Exige um token válido e, se perfis forem passados, um desses perfis.
 * Também confere no banco que o usuário ainda existe e está ativo, e usa o perfil do banco.
 * Sem token / token vencido → 401 ("Entre de novo"); perfil errado → 403.
 */
export function exigirLogin(...perfis: Perfil[]): preHandlerAsyncHookHandler {
  return async function (req: FastifyRequest) {
    try {
      await req.jwtVerify();
    } catch {
      throw new ErroApi(401, "Entre de novo para continuar.");
    }
    const usuario = buscarPorId(req.user.idUsuario);
    if (!usuario || usuario.ativo !== 1) throw new ErroApi(401, "Entre de novo para continuar.");
    req.user = { idUsuario: usuario.idUsuario, perfil: usuario.perfil };
    if (perfis.length > 0 && !perfis.includes(usuario.perfil)) {
      throw new ErroApi(403, "Esta parte do aplicativo não é para o seu perfil.");
    }
  };
}
