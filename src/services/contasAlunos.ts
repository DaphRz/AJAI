/**
 * Contas dos alunos, cuidadas pelo professor/responsável (Professor.IncluirAluno, APF 18).
 * O aluno não se cadastra sozinho, entra com nome de usuário (ex.: maria.silva) e não troca a
 * própria senha: só o professor que criou a conta muda (server/src/rotas/professorAlunos.ts).
 */
import { chamarApi } from "./api";

export interface ContaAluno {
  idUsuario: number;
  nome: string;
  nomeUsuario: string;
  turma?: string;
  criadoEm?: string;
}

export async function listarContasAlunos(): Promise<ContaAluno[]> {
  const { alunos } = await chamarApi<{ alunos: ContaAluno[] }>("/professor/alunos");
  return alunos;
}

export interface DadosNovoAluno {
  nome: string;
  nomeUsuario: string;
  senha: string;
}

/** Cria o aluno e já o coloca na turma do professor logado. */
export async function cadastrarAluno(dados: DadosNovoAluno): Promise<ContaAluno> {
  const { aluno } = await chamarApi<{ aluno: ContaAluno }>("/professor/alunos", {
    metodo: "POST",
    corpo: { nome: dados.nome.trim(), nomeUsuario: dados.nomeUsuario.trim(), senha: dados.senha },
  });
  return aluno;
}

/** Muda a senha de um aluno que o professor logado criou. Devolve a mensagem de confirmação. */
export async function mudarSenhaDoAluno(idAluno: number, senhaNova: string): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/professor/alunos/${idAluno}/senha`, {
    metodo: "PATCH",
    corpo: { senhaNova },
  });
  return mensagem;
}

/**
 * Sugere um nome de usuário a partir do nome: "Maria da Silva" → "maria.silva".
 * Sem acentos, primeiro e último nome separados por ponto. Função pura (fácil de testar).
 */
export function sugerirNomeUsuario(nome: string): string {
  const partes = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0];
  return `${partes[0]}.${partes[partes.length - 1]}`;
}
