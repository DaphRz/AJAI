// npm run db:query -- "SELECT ..."   consulta o banco e mostra o resultado em tabela.
//
//   npm run db:query                                  lista as tabelas e quantas linhas cada uma tem
//   npm run db:query -- "SELECT * FROM Nivel"         consulta (somente leitura)
//   npm run db:query -- --json "SELECT * FROM Nivel"  resultado em JSON (bom para agentes de IA)
//   npm run db:query -- --escrever "UPDATE ..."       permite INSERT/UPDATE/DELETE (use com cuidado)
//
// Alterar a ESTRUTURA (CREATE/ALTER/DROP) não se faz por aqui: crie uma migração em
// server/db/migrations/ e rode `npm run db:migrate`.
import { abrirBanco, caminhoBanco } from "./conectar.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const escrever = args.includes("--escrever");
const sql = args.filter((a) => !a.startsWith("--")).join(" ").trim();

const db = abrirBanco();

if (!sql) {
  const tabelas = db
    .prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name")
    .all();
  const linhas = tabelas.map(({ name }) => ({
    tabela: name,
    linhas: db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get().n,
  }));
  console.log(`Banco: ${caminhoBanco}`);
  console.table(linhas);
  db.close();
  process.exit(0);
}

const somenteLeitura = /^\s*(select|with|pragma|explain)\b/i.test(sql);
const estrutural = /^\s*(create|alter|drop)\b/i.test(sql);

if (estrutural) {
  console.error("Mudança de estrutura: crie uma migração em server/db/migrations/ e rode `npm run db:migrate`.");
  process.exit(1);
}
if (!somenteLeitura && !escrever) {
  console.error("Esta consulta altera dados. Se é isso mesmo, repita com --escrever.");
  process.exit(1);
}

try {
  if (somenteLeitura) {
    const linhas = db.prepare(sql).all();
    if (json) console.log(JSON.stringify(linhas, null, 2));
    else if (linhas.length) console.table(linhas);
    else console.log("(nenhuma linha)");
  } else {
    const r = db.prepare(sql).run();
    console.log(`OK: ${r.changes} linha(s) alterada(s).`);
  }
} catch (erro) {
  console.error(`Erro no SQL: ${erro.message}`);
  process.exitCode = 1;
} finally {
  db.close();
}
