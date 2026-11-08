// npm run usuario:senha -- <e-mail ou telefone>
// Gera uma senha provisória (6 números) para um PROFESSOR ou ADMINISTRADOR e mostra na tela.
// Aluno não: a senha dele só muda pelo professor que criou a conta (no app, Conta › Contas dos alunos).
// Roda no computador do servidor: quem tem acesso ao arquivo do banco já é administrador.
import { abrirBanco, caminhoBanco } from "./conectar.mjs";
import { gerarHashSenhaSync, gerarSenhaProvisoria } from "./senha.mjs";

const identificador = process.argv.slice(2).join(" ").trim();
if (!identificador) {
  console.error("Uso: npm run usuario:senha -- rafael@email.com   (ou o telefone com DDD: 11987654321)");
  process.exit(1);
}

const db = abrirBanco();
const usuario = identificador.includes("@")
  ? db.prepare("SELECT idUsuario, nome, perfil FROM Usuario WHERE email = ?").get(identificador.toLowerCase())
  : db.prepare("SELECT idUsuario, nome, perfil FROM Usuario WHERE telefone = ?").get(identificador.replace(/\D/g, ""));

if (!usuario) {
  console.error(`Nenhum professor ou administrador com "${identificador}" em ${caminhoBanco}.`);
  db.close();
  process.exit(1);
}

const senha = gerarSenhaProvisoria();
db.prepare("UPDATE Usuario SET senhaHash = ?, atualizadoEm = ? WHERE idUsuario = ?")
  .run(gerarHashSenhaSync(senha), new Date().toISOString(), usuario.idUsuario);
db.close();

console.log(`${usuario.nome} (${usuario.perfil}) agora entra com a senha provisória: ${senha}`);
console.log("Peça para a pessoa trocar a senha depois de entrar (Conta › Trocar senha).");
