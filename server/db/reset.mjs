// npm run db:reset — APAGA o arquivo do banco, recria o esquema e carrega os dados de demonstração.
// Use quando quiser começar do zero (ou se o banco estragar). Só mexe no seu arquivo local.
import { existsSync, rmSync } from "node:fs";
import { abrirBanco, caminhoBanco } from "./conectar.mjs";
import { SENHA_DEMO, semear } from "./seed.mjs";

for (const sufixo of ["", "-journal", "-wal", "-shm"]) {
  if (existsSync(caminhoBanco + sufixo)) rmSync(caminhoBanco + sufixo);
}

const db = abrirBanco();
await semear(db);
const niveis = db.prepare("SELECT COUNT(*) AS n FROM Nivel").get().n;
const atividades = db.prepare("SELECT COUNT(*) AS n FROM Atividade").get().n;
const alunos = db.prepare("SELECT COUNT(*) AS n FROM Aluno").get().n;
db.close();

console.log(`Banco recriado em ${caminhoBanco}`);
console.log(`  ${niveis} níveis, ${atividades} atividades, ${alunos} alunos de demonstração.`);
console.log(`  Senha de todos os usuários de demonstração: ${SENHA_DEMO}`);
