/**
 * Usuario.Autenticar / Usuario.Incluir (RF01, RF02).
 *
 * ESQUELETO: valida contra os dados de demonstração em memória.
 * Pendências:
 * - chamar a API (POST /auth/login, POST /usuarios) quando o backend existir;
 * - senha com hash no servidor (nunca comparar senha no app);
 * - guardar o token com expo-secure-store.
 */
import { alunos, professores } from "@/data/mock";
import type { Aluno, Perfil, Professor } from "@/domain/modelos";

export type UsuarioSessao = Aluno | Professor;

export async function autenticar(
  identificador: string,
  _senha: string,
  perfil: Exclude<Perfil, "ADMINISTRADOR">,
): Promise<UsuarioSessao> {
  const lista: UsuarioSessao[] = perfil === "ALUNO" ? alunos : professores;
  const termo = identificador.trim().toLowerCase();

  // Modo demonstração: campo vazio entra com o primeiro usuário do perfil.
  const usuario = termo === "" ? lista[0] : lista.find((u) => u.email === termo);

  if (!usuario) {
    throw new Error("Não encontramos essa conta. Confira o e-mail ou telefone.");
  }
  return usuario;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  dataNascimento?: string;
}

export async function cadastrarAluno(dados: DadosCadastro): Promise<Aluno> {
  const agora = new Date().toISOString();
  const novo: Aluno = {
    idUsuario: Date.now(),
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    senhaHash: "TODO-hash-no-servidor",
    perfil: "ALUNO",
    dataNascimento: dados.dataNascimento,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
    vozPreferida: "pt-BR",
    velocidadeVoz: 0.9,
    tamanhoFonte: 20,
  };
  alunos.push(novo);
  return novo;
}

export async function cadastrarProfessor(dados: DadosCadastro): Promise<Professor> {
  const agora = new Date().toISOString();
  const novo: Professor = {
    idUsuario: Date.now(),
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    senhaHash: "TODO-hash-no-servidor",
    perfil: "PROFESSOR",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  professores.push(novo);
  return novo;
}
