// Aluno.EditarPreferencias (passo 10, APF 17; RNF04):
//   PATCH /alunos/eu  { velocidadeVoz?, tamanhoFonte? } → { usuario }
// Só o próprio aluno (o id vem do token). Velocidade 0.5 a 1.5 (o app oferece 0.8, 1.0 e 1.2);
// tamanho da letra 20 a 32 (o app oferece 20, 24 e 28). Nada de dado de outro aluno aqui.
import type { FastifyInstance } from "fastify";
import { exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { esquemaErro } from "../erros.ts";
import { buscarPorId, esquemaUsuario, usuarioPublico } from "../usuarios.ts";

interface Preferencias {
  velocidadeVoz?: number;
  tamanhoFonte?: number;
}

export async function rotasPreferencias(app: FastifyInstance): Promise<void> {
  app.patch<{ Body: Preferencias }>(
    "/alunos/eu",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: {
        body: {
          type: "object",
          properties: {
            velocidadeVoz: { type: "number", minimum: 0.5, maximum: 1.5 },
            tamanhoFonte: { type: "integer", minimum: 20, maximum: 32 },
          },
          minProperties: 1,
        },
        response: {
          200: { type: "object", properties: { usuario: esquemaUsuario }, required: ["usuario"] },
          400: esquemaErro,
          401: esquemaErro,
          403: esquemaErro,
        },
      },
    },
    async (req) => {
      const { velocidadeVoz, tamanhoFonte } = req.body;
      const id = req.user.idUsuario;
      const db = banco();
      if (velocidadeVoz !== undefined) {
        db.prepare("UPDATE Aluno SET velocidadeVoz = ? WHERE idUsuario = ?").run(Math.round(velocidadeVoz * 10) / 10, id);
      }
      if (tamanhoFonte !== undefined) {
        db.prepare("UPDATE Aluno SET tamanhoFonte = ? WHERE idUsuario = ?").run(tamanhoFonte, id);
      }
      db.prepare("UPDATE Usuario SET atualizadoEm = ? WHERE idUsuario = ?").run(new Date().toISOString(), id);
      return { usuario: usuarioPublico(buscarPorId(id)!) };
    },
  );
}
