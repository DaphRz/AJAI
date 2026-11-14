// Recuperar senha SEM serviço de e-mail (APF 18), para TODOS os perfis (Passo 3.1):
//   POST /admin/usuarios/:id/senha-provisoria   administrador gera uma senha provisória
//   ou, no computador do servidor: npm run usuario:senha -- <usuário, e-mail ou telefone>
// Depois de entrar, a pessoa troca a senha em Minha conta / Conta › Trocar minha senha.
// A senha provisória (6 números) aparece UMA vez para quem gerou; só o hash fica no banco.
import type { FastifyInstance } from "fastify";
import { gerarHashSenha, gerarSenhaProvisoria } from "../../db/senha.mjs";
import { exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { buscarPorId } from "../usuarios.ts";

const esquema = {
  params: {
    type: "object",
    properties: { id: { type: "integer", minimum: 1 } },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: { nome: { type: "string" }, senhaProvisoria: { type: "string" } },
      required: ["nome", "senhaProvisoria"],
    },
    401: esquemaErro,
    403: esquemaErro,
    404: esquemaErro,
  },
} as const;

async function redefinir(idUsuario: number): Promise<string> {
  const senha = gerarSenhaProvisoria();
  banco()
    .prepare("UPDATE Usuario SET senhaHash = ?, atualizadoEm = ? WHERE idUsuario = ?")
    .run(await gerarHashSenha(senha), new Date().toISOString(), idUsuario);
  return senha;
}

export async function rotasSenhaProvisoria(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: number } }>(
    "/admin/usuarios/:id/senha-provisoria",
    { preHandler: exigirLogin("ADMINISTRADOR"), schema: esquema },
    async (req) => {
      const usuario = buscarPorId(req.params.id);
      if (!usuario) throw new ErroApi(404, "Usuário não encontrado.");
      req.log.info({ idUsuario: usuario.idUsuario }, "senha provisória gerada pelo administrador");
      return { nome: usuario.nome, senhaProvisoria: await redefinir(usuario.idUsuario) };
    },
  );
}
