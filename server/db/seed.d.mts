// Tipos de seed.mjs, para os testes do servidor (server/src/**/*.test.ts) poderem importá-lo.
import type { DatabaseSync } from "node:sqlite";

export const SENHA_DEMO: string;
export function semear(db: DatabaseSync): Promise<void>;
