// Monta a aplicação Fastify (plugins, tratamento de erro e rotas) sem abrir a porta.
// Separado de index.ts para os testes usarem app.inject() sem subir o servidor.
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { registrarAutenticacao } from "./autenticacao.ts";
import { config } from "./config.ts";
import { registrarTratamentoDeErros } from "./erros.ts";
import { rotasAtividades } from "./rotas/atividades.ts";
import { rotasAuth } from "./rotas/auth.ts";
import { rotasInstituicoes } from "./rotas/instituicoes.ts";
import { rotasProgresso } from "./rotas/progresso.ts";
import { rotasSaude } from "./rotas/saude.ts";
import { rotasSenhaProvisoria } from "./rotas/senhaProvisoria.ts";
import { rotasVinculos } from "./rotas/vinculos.ts";

export async function construirApp(opcoes: { log?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      opcoes.log === false
        ? false
        : { level: config.ambiente === "production" ? "info" : "debug" },
    bodyLimit: 100 * 1024, // 100 KB: a API só recebe JSON pequeno
    ajv: {
      // Validação de entrada pelos esquemas JSON de cada rota:
      // campos fora do esquema são descartados, e não convertidos à força.
      customOptions: { removeAdditional: "all", coerceTypes: "array", allErrors: false },
    },
  });

  registrarTratamentoDeErros(app);

  await app.register(cors, {
    origin: config.origensCors.includes("*") ? true : config.origensCors,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(rateLimit, {
    max: config.limiteRequisicoesPorMinuto,
    timeWindow: "1 minute",
    // A mensagem final vem do tratamento de erro padrão (429 → mensagem em português).
    errorResponseBuilder: (_req, contexto) => ({
      statusCode: contexto.statusCode,
      erro: "Muitas tentativas. Espere um minuto e tente de novo.",
      message: "rate limit",
    }),
  });

  await registrarAutenticacao(app);

  await app.register(rotasSaude);
  await app.register(rotasAuth);
  await app.register(rotasInstituicoes);
  await app.register(rotasVinculos);
  await app.register(rotasSenhaProvisoria);
  await app.register(rotasAtividades);
  await app.register(rotasProgresso);

  return app;
}
