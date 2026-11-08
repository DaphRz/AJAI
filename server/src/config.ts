// Configuração do servidor, lida de variáveis de ambiente.
// Os valores ficam em server/.env (fora do git); modelo em server/.env.example.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

const ambiente = process.env.NODE_ENV || "development";

/**
 * Segredo que assina os tokens de login (JWT_SECRET em server/.env).
 * Em produção é obrigatório. Em desenvolvimento, se faltar, é gerado uma vez e guardado em
 * server/data/jwt-segredo.local (fora do git), para os logins sobreviverem aos reinícios.
 */
function segredoJwt(): string {
  const doAmbiente = process.env.JWT_SECRET?.trim();
  if (doAmbiente) {
    if (doAmbiente.length < 32) throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.");
    return doAmbiente;
  }
  if (ambiente === "production") throw new Error("Defina JWT_SECRET em server/.env (veja server/.env.example).");
  const arquivo = resolve(pastaServidor, "data", "jwt-segredo.local");
  if (existsSync(arquivo)) return readFileSync(arquivo, "utf8").trim();
  const novo = randomBytes(48).toString("hex");
  mkdirSync(dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, novo, { mode: 0o600 });
  console.warn(`JWT_SECRET não definido: gerei um segredo de desenvolvimento em ${arquivo}.`);
  return novo;
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
  ambiente,
  /** Segredo dos tokens de login (JWT). */
  jwtSegredo: segredoJwt(),
  /** Validade do token de login (formato do @fastify/jwt: "30d", "12h"...). */
  jwtValidade: process.env.JWT_VALIDADE || "30d",
  /** Tentativas de login/cadastro por IP por minuto (proteção contra adivinhar senha). */
  limiteLoginPorMinuto: numero("LIMITE_LOGIN_POR_MINUTO", 10),
} as const;
