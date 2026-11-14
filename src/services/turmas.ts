/**
 * Turmas do professor (passo 8; APF 20–24; server/src/rotas/professor.ts).
 * Só as turmas do próprio professor e só alunos com vínculo ACEITO. Um aluno fica em uma turma
 * de cada professor: pôr numa turma tira das outras dele.
 */
import { chamarApi } from "./api";
import type { AlunoCurto } from "./relatorios";

export interface Turma {
  idTurma: number;
  nome: string;
  periodo: string;
  ativa: boolean;
  alunos: AlunoCurto[];
}

export function listarTurmas(): Promise<{ turmas: Turma[]; semTurma: AlunoCurto[] }> {
  return chamarApi("/professor/turmas");
}

export async function incluirTurma(nome: string, periodo: string): Promise<Turma> {
  const { turma } = await chamarApi<{ turma: Turma }>("/professor/turmas", { metodo: "POST", corpo: { nome, periodo } });
  return turma;
}

export async function editarTurma(idTurma: number, dados: { nome?: string; periodo?: string; ativa?: boolean }): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/professor/turmas/${idTurma}`, { metodo: "PATCH", corpo: dados });
  return mensagem;
}

export async function excluirTurma(idTurma: number): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/professor/turmas/${idTurma}`, { metodo: "DELETE" });
  return mensagem;
}

/** Põe, move (idTurma) ou tira (null) o aluno das turmas do professor. */
export async function mudarTurmaDoAluno(idAluno: number, idTurma: number | null): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/professor/alunos/${idAluno}/turma`, {
    metodo: "PUT",
    corpo: { idTurma },
  });
  return mensagem;
}
