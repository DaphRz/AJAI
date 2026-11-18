// `npm run db:reset` com o servidor ligado apaga e recria o arquivo do banco (passo 13).
// A conexão aberta antes precisa ser trocada, senão toda gravação vira erro 500 ("readonly database").
// Usa um banco TEMPORÁRIO (variável AJAI_DB): o seu ajai.db não é tocado.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, describe, it } from "node:test";

const pasta = mkdtempSync(join(tmpdir(), "ajai-banco-"));
const arquivo = join(pasta, "ajai.db");
process.env.AJAI_DB = arquivo;

function criarArquivo(): void {
  for (const sufixo of ["", "-wal", "-shm"]) rmSync(arquivo + sufixo, { force: true });
  const db = new DatabaseSync(arquivo);
  db.exec("PRAGMA journal_mode = WAL; CREATE TABLE Nota (texto TEXT)");
  db.close();
}

// Importado DEPOIS de definir AJAI_DB (o caminho do banco é lido ao importar).
const { banco, fecharBanco } = await import("./banco.ts");

after(() => {
  fecharBanco();
  rmSync(pasta, { recursive: true, force: true });
});

describe("banco()", () => {
  it("reabre a conexão quando o arquivo é recriado (db:reset com o servidor ligado)", () => {
    criarArquivo();
    banco().prepare("INSERT INTO Nota VALUES (?)").run("antes");

    criarArquivo(); // o que o db:reset faz: apaga e cria de novo

    banco().prepare("INSERT INTO Nota VALUES (?)").run("depois");
    const linhas = banco().prepare("SELECT texto FROM Nota").all();
    assert.deepEqual(linhas.map((l) => l.texto), ["depois"]);
  });

  it("devolve a mesma conexão enquanto o arquivo não muda", () => {
    assert.equal(banco(), banco());
  });
});
