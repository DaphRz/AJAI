// GET /health — confere que a API está no ar e que o banco abre e tem as tabelas.
import type { FastifyInstance } from "fastify";
import { banco } from "../banco.ts";
import { ErroApi, esquemaErro } from "../erros.ts";

export async function rotasSaude(app: FastifyInstance): Promise<void> {
  app.get(
    "/health",
    {
      config: { rateLimit: false },
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              banco: { type: "string" },
              migracoes: { type: "integer" },
              horario: { type: "string" },
            },
            required: ["status", "banco", "migracoes", "horario"],
          },
          503: esquemaErro,
        },
      },
    },
    async (req) => {
      try {
        const db = banco();
        const linha = db.prepare("SELECT COUNT(*) AS total FROM _migracoes").get() as { total: number };
        db.prepare("SELECT 1 FROM Usuario LIMIT 1").get();
        return { status: "ok", banco: "ok", migracoes: linha.total, horario: new Date().toISOString() };
      } catch (erro) {
        req.log.error(erro, "banco indisponível");
        throw new ErroApi(503, "O banco de dados não abriu. Rode \"npm run db:reset\" e tente de novo.");
      }
    },
  );
}
