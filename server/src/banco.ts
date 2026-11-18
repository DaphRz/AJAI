// Acesso ao banco SQLite do AJAI pelo módulo nativo node:sqlite (sem ORM).
// O caminho do arquivo é o mesmo dos scripts db:* (server/db/conectar.mjs):
// server/data/ajai.db, ou o da variável AJAI_DB.
import { existsSync, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { caminhoBanco } from "../db/conectar.mjs";

export { caminhoBanco };

let conexao: DatabaseSync | undefined;
let arquivoAberto: number | undefined;

/** Identidade do arquivo do banco (inode); muda quando o `db:reset` apaga e recria o arquivo. */
function identidadeDoArquivo(): number | undefined {
  try {
    return statSync(caminhoBanco).ino;
  } catch {
    return undefined;
  }
}

/**
 * Devolve a conexão única com o banco (abre na primeira chamada).
 * Não cria o arquivo: se ele não existir, avisa para rodar `npm run db:reset`.
 * Se o arquivo foi trocado (`npm run db:reset` com o servidor ligado), reabre: a conexão antiga
 * só leria o banco apagado e recusaria toda gravação ("readonly database"), virando erro 500.
 */
export function banco(): DatabaseSync {
  if (conexao) {
    const atual = identidadeDoArquivo();
    // Sem arquivo (o reset está no meio) ou o mesmo arquivo: segue com a conexão aberta.
    if (atual === undefined || atual === arquivoAberto) return conexao;
    fecharBanco();
  }
  if (!existsSync(caminhoBanco)) {
    throw new Error(`Banco não encontrado em ${caminhoBanco}. Rode "npm run db:reset".`);
  }
  const db = new DatabaseSync(caminhoBanco);
  db.exec("PRAGMA foreign_keys = ON"); // o SQLite deixa desligado por padrão
  db.exec("PRAGMA busy_timeout = 5000"); // espera se um script db:* estiver gravando
  conexao = db;
  arquivoAberto = identidadeDoArquivo();
  return db;
}

/** Fecha a conexão (usado ao desligar o servidor). */
export function fecharBanco(): void {
  conexao?.close();
  conexao = undefined;
  arquivoAberto = undefined;
}
