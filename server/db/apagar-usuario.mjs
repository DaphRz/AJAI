// npm run usuario:apagar -- <usuário, e-mail ou telefone> [--confirmar]
// Passo 12 (LGPD): apaga a conta de quem pediu, com os dados dela. O termo de uso
// (docs/privacidade.md) diz: "Para apagar a sua conta, fale com o seu professor ou com a sua escola.
// Eles avisam a equipe do AJAI." A equipe roda este script no computador do servidor.
// Sem --confirmar, só MOSTRA o que vai ser apagado (nada muda). Com --confirmar, apaga numa transação.
//
// O que sai, por perfil:
//   ALUNO        respostas, desempenho, histórico de etapas, vínculos e matrículas, e a conta.
//   RESPONSAVEL  vínculos e a conta.
//   PROFESSOR    as turmas dele (os alunos ficam sem turma), vínculos e a conta. As atividades que
//                ele cadastrou CONTINUAM para os alunos, sem criador (só o administrador mexe).
//   INSTITUICAO  turmas dos professores dela continuam; os professores dela ficam sem instituição
//                e voltam a PENDENTE (informam outro código na tela de espera). Depois, a conta.
//   ADMINISTRADOR não é apagado por aqui.
import { abrirBanco, caminhoBanco } from "./conectar.mjs";

const argumentos = process.argv.slice(2);
const confirmar = argumentos.includes("--confirmar");
const identificador = argumentos.filter((a) => a !== "--confirmar").join(" ").trim();
if (!identificador) {
  console.error("Uso: npm run usuario:apagar -- maria.silva            (mostra o que vai sair)");
  console.error("     npm run usuario:apagar -- maria.silva --confirmar (apaga de verdade)");
  process.exit(1);
}

const db = abrirBanco();
// Mesma regra do login: "@" → e-mail; só números → telefone; senão → nome de usuário (aluno).
const usuario = identificador.includes("@")
  ? db.prepare("SELECT idUsuario, nome, perfil FROM Usuario WHERE email = ?").get(identificador.toLowerCase())
  : /^[0-9()+ .-]+$/.test(identificador)
    ? db.prepare("SELECT idUsuario, nome, perfil FROM Usuario WHERE telefone = ?").get(identificador.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""))
    : db.prepare("SELECT idUsuario, nome, perfil FROM Usuario WHERE nomeUsuario = ?").get(identificador.toLowerCase());

if (!usuario) {
  console.error(`Nenhuma conta com "${identificador}" em ${caminhoBanco}.`);
  db.close();
  process.exit(1);
}
if (usuario.perfil === "ADMINISTRADOR") {
  console.error("Conta de administrador não é apagada por este script.");
  db.close();
  process.exit(1);
}

const id = usuario.idUsuario;
const contar = (sql) => db.prepare(sql).get(id).n;

/** [descrição, quantidade, comando que apaga ou muda] na ordem certa (filhos antes da conta). */
const passos = [];
if (usuario.perfil === "ALUNO") {
  passos.push(
    ["respostas", contar("SELECT COUNT(*) n FROM Resposta WHERE idAluno = ?"), "DELETE FROM Resposta WHERE idAluno = ?"],
    ["linhas de desempenho", contar("SELECT COUNT(*) n FROM DesempenhoConteudo WHERE idAluno = ?"), "DELETE FROM DesempenhoConteudo WHERE idAluno = ?"],
    ["mudanças de etapa", contar("SELECT COUNT(*) n FROM HistoricoNivel WHERE idAluno = ?"), "DELETE FROM HistoricoNivel WHERE idAluno = ?"],
    ["matrículas em turma", contar("SELECT COUNT(*) n FROM Matricula WHERE idAluno = ?"), "DELETE FROM Matricula WHERE idAluno = ?"],
    ["vínculos com acompanhantes", contar("SELECT COUNT(*) n FROM Vinculo WHERE idAluno = ?"), "DELETE FROM Vinculo WHERE idAluno = ?"],
  );
}
if (usuario.perfil === "RESPONSAVEL" || usuario.perfil === "PROFESSOR") {
  passos.push(["vínculos com alunos", contar("SELECT COUNT(*) n FROM Vinculo WHERE idAcompanhante = ?"), "DELETE FROM Vinculo WHERE idAcompanhante = ?"]);
}
if (usuario.perfil === "PROFESSOR") {
  passos.push(
    ["turmas (os alunos ficam sem turma)", contar("SELECT COUNT(*) n FROM Turma WHERE idProfessor = ?"), "DELETE FROM Turma WHERE idProfessor = ?"],
    ["atividades cadastradas (continuam, sem criador)", contar("SELECT COUNT(*) n FROM Atividade WHERE idCriador = ?"), "UPDATE Atividade SET idCriador = NULL WHERE idCriador = ?"],
  );
}
if (usuario.perfil === "INSTITUICAO") {
  passos.push([
    "professores (ficam sem instituição, PENDENTES)",
    contar("SELECT COUNT(*) n FROM Professor WHERE idInstituicao = ?"),
    "UPDATE Professor SET idInstituicao = NULL, statusVinculo = 'PENDENTE', motivoRecusa = NULL, decididoEm = NULL WHERE idInstituicao = ?",
  ]);
}
// Por último a conta (Aluno/Professor/Responsavel/Instituicao saem junto, em cascata).
passos.push(["conta", 1, "DELETE FROM Usuario WHERE idUsuario = ?"]);

console.log(`${usuario.nome} (${usuario.perfil}, id ${id}) em ${caminhoBanco}:`);
for (const [descricao, n] of passos) console.log(`  - ${descricao}: ${n}`);

if (!confirmar) {
  console.log("\nNada foi apagado. Para apagar, rode de novo com --confirmar no fim.");
  db.close();
  process.exit(0);
}

db.exec("BEGIN");
try {
  for (const [, , sql] of passos) db.prepare(sql).run(id);
  db.exec("COMMIT");
} catch (erro) {
  db.exec("ROLLBACK");
  db.close();
  console.error("Nada foi apagado:", erro instanceof Error ? erro.message : erro);
  process.exit(1);
}
db.close();
console.log("\nConta apagada.");
console.log("Lembrete: cópias de segurança (backup) do banco também precisam ser apagadas ou vencer.");
