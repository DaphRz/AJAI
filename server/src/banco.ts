// Acesso ao banco SQLite do AJAI pelo módulo nativo node:sqlite (sem ORM).
// O caminho do arquivo é o mesmo dos scripts db:* (server/db/conectar.mjs):
// server/data/ajai.db, ou o da variável AJAI_DB.
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { caminhoBanco } from "../db/conectar.mjs";

export { caminhoBanco };

let conexao: DatabaseSync | undefined;

/**
 * Devolve a conexão única com o banco (abre na primeira chamada).
 * Não cria o arquivo: se ele não existir, avisa para rodar `npm run db:reset`.
 */
export function banco(): DatabaseSync {
  if (conexao) return conexao;
  if (!existsSync(caminhoBanco)) {
    throw new Error(`Banco não encontrado em ${caminhoBanco}. Rode "npm run db:reset".`);
  }
  const db = new DatabaseSync(caminhoBanco);
  db.exec("PRAGMA foreign_keys = ON"); // o SQLite deixa desligado por padrão
  db.exec("PRAGMA busy_timeout = 5000"); // espera se um script db:* estiver gravando
  conexao = db;
  return db;
}

/** Fecha a conexão (usado ao desligar o servidor). */
export function fecharBanco(): void {
  conexao?.close();
  conexao = undefined;
}
