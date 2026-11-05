// Configuração do servidor, lida de variáveis de ambiente.
// Os valores ficam em server/.env (fora do git); modelo em server/.env.example.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pastaServidor = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arquivoEnv = resolve(pastaServidor, ".env");

// Carrega server/.env sem biblioteca (process.loadEnvFile existe desde o Node 20.12).
// Variáveis já definidas no terminal têm prioridade.
if (existsSync(arquivoEnv)) process.loadEnvFile(arquivoEnv);

function numero(nome: string, padrao: number): number {
  const valor = process.env[nome];
  if (!valor) return padrao;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${nome} precisa ser um número inteiro positivo.`);
  return n;
}

export const config = {
  /** Porta HTTP da API. */
  porta: numero("PORT", 3333),
  /** 0.0.0.0 = aceita conexões de outros aparelhos da rede (celular na mesma Wi-Fi). */
  host: process.env.HOST || "0.0.0.0",
  /** Origens liberadas no CORS (separadas por vírgula). "*" libera todas (só em desenvolvimento). */
  origensCors: (process.env.CORS_ORIGEM || "*").split(",").map((o) => o.trim()),
  /** Máximo de requisições por IP por minuto (proteção simples contra abuso). */
  limiteRequisicoesPorMinuto: numero("LIMITE_REQUISICOES_POR_MINUTO", 300),
  ambiente: process.env.NODE_ENV || "development",
  // TODO: JWT_SECRET (passo 3) — obrigatório quando o login de verdade existir.
} as const;
