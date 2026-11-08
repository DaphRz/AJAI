// npm run db:migrate — aplica, em ordem, os arquivos de server/db/migrations/*.sql
// que ainda não foram aplicados neste banco. Cria o arquivo do banco se não existir.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirBanco, caminhoBanco, executadoDireto } from "./conectar.mjs";

const pastaMigracoes = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export function migrar(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS _migracoes (
    nome TEXT PRIMARY KEY,
    aplicadaEm TEXT NOT NULL
  )`);
  const aplicadas = new Set(db.prepare("SELECT nome FROM _migracoes").all().map((l) => l.nome));
  const novas = [];

  for (const arquivo of readdirSync(pastaMigracoes).filter((f) => f.endsWith(".sql")).sort()) {
    if (aplicadas.has(arquivo)) continue;
    const sql = readFileSync(join(pastaMigracoes, arquivo), "utf8");
    // Migrações que RECRIAM uma tabela (o SQLite não muda NOT NULL/UNIQUE com ALTER) começam
    // com a linha "-- ajai: sem-chaves-estrangeiras". Sem isso, apagar a tabela antiga
    // apagaria em cascata as linhas que apontam para ela. As chaves são conferidas antes do COMMIT.
    const semChaves = sql.startsWith("-- ajai: sem-chaves-estrangeiras");
    if (semChaves) db.exec("PRAGMA foreign_keys = OFF"); // só tem efeito fora de transação
    db.exec("BEGIN");
    try {
      db.exec(sql);
      if (semChaves) {
        const quebradas = db.prepare("PRAGMA foreign_key_check").all();
        if (quebradas.length) throw new Error(`chaves estrangeiras quebradas: ${JSON.stringify(quebradas)}`);
      }
      db.prepare("INSERT INTO _migracoes (nome, aplicadaEm) VALUES (?, ?)").run(
        arquivo,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
      novas.push(arquivo);
    } catch (erro) {
      db.exec("ROLLBACK");
      throw new Error(`Falha na migração ${arquivo}: ${erro.message}`);
    } finally {
      if (semChaves) db.exec("PRAGMA foreign_keys = ON");
    }
  }
  return novas;
}

if (executadoDireto(import.meta.url)) {
  const db = abrirBanco();
  const novas = migrar(db);
  console.log(`Banco: ${caminhoBanco}`);
  console.log(novas.length ? `Migrações aplicadas: ${novas.join(", ")}` : "Nada a migrar (já está atualizado).");
  db.close();
}
