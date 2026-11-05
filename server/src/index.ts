// Ponto de entrada da API: `npm run server:dev` (desenvolvimento) ou `npm run server:start`.
import { construirApp } from "./app.ts";
import { caminhoBanco, fecharBanco } from "./banco.ts";
import { config } from "./config.ts";

const app = await construirApp();

async function desligar(sinal: string): Promise<void> {
  app.log.info(`Recebido ${sinal}, desligando...`);
  await app.close();
  fecharBanco();
  process.exit(0);
}
process.on("SIGINT", () => void desligar("SIGINT"));
process.on("SIGTERM", () => void desligar("SIGTERM"));

try {
  await app.listen({ port: config.porta, host: config.host });
  app.log.info(`Banco: ${caminhoBanco}`);
  app.log.info(`Teste: http://localhost:${config.porta}/health`);
} catch (erro) {
  app.log.error(erro);
  process.exit(1);
}
