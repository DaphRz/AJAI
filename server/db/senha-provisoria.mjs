// npm run usuario:senha -- <usuário, e-mail ou telefone>
// Gera uma senha provisória (6 números) para QUALQUER perfil (aluno, professor, responsável,
// instituição ou administrador) e mostra na tela.
// Roda no computador do servidor: quem tem acesso ao arquivo do banco já é administrador.
import { abrirBanco, caminhoBanco } from "./conectar.mjs";
import { gerarHashSenhaSync, gerarSenhaProvisoria } from "./senha.mjs";

const identificador = process.argv.slice(2).join(" ").trim();
if (!identificador) {
  console.error("Uso: npm run usuario:senha -- rafael@email.com   (ou o telefone com DDD: 11987654321, ou o usuário: maria.silva)");
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

const senha = gerarSenhaProvisoria();
db.prepare("UPDATE Usuario SET senhaHash = ?, atualizadoEm = ? WHERE idUsuario = ?")
  .run(gerarHashSenhaSync(senha), new Date().toISOString(), usuario.idUsuario);
db.close();

console.log(`${usuario.nome} (${usuario.perfil}) agora entra com a senha provisória: ${senha}`);
console.log("Peça para a pessoa trocar a senha depois de entrar (Minha conta / Conta › Trocar minha senha).");
