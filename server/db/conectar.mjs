// Abre o banco SQLite do AJAI (módulo nativo node:sqlite, sem instalar nada).
// Requer Node 22.18 ou mais novo.
// Local do arquivo: server/data/ajai.db (ignorado pelo git). Para usar outro arquivo
// (ex.: testes), defina a variável de ambiente AJAI_DB.
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const caminhoBanco = process.env.AJAI_DB
  ? resolve(process.env.AJAI_DB)
  : resolve(raiz, "server", "data", "ajai.db");

export function abrirBanco() {
  mkdirSync(dirname(caminhoBanco), { recursive: true });
  const db = new DatabaseSync(caminhoBanco);
  db.exec("PRAGMA foreign_keys = ON"); // o SQLite deixa desligado por padrão
  return db;
}

/** True quando este arquivo foi chamado direto (node arquivo.mjs), não importado. */
export function executadoDireto(importMetaUrl) {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}
