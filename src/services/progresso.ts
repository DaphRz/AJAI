/**
 * Aluno.VisualizarProgresso (RF18, RF19, RF22): GET /alunos/eu/progresso.
 * Tudo vem calculado do servidor (nível, trilha, acertos, dificuldades e a próxima atividade).
 */
import type { Nivel } from "@/domain/modelos";
import { chamarApi } from "./api";

export type StatusEtapa = "CONCLUIDA" | "ATUAL" | "BLOQUEADA";

export interface ProgressoDoAluno {
  /** Ausente = ainda não fez o nivelamento. */
  nivelAtual?: Nivel;
  trilha: (Nivel & { status: StatusEtapa })[];
  totalAtividades: number;
  totalAcertos: number;
  /** 0 a 1. */
  taxaAcerto: number;
  /** Conteúdos com erro, pior primeiro (no máximo 3). */
  dificuldades: { conteudo: string; tentativas: number; erros: number; taxaAcerto: number }[];
  /** Próxima atividade da etapa atual; ausente se a etapa não tem atividades. */
  proximaAtividade?: number;
}

/** `anterior`: atividade que o aluno acabou de fazer (o servidor evita repetir, se houver outra). */
export function visualizarProgresso(anterior?: number): Promise<ProgressoDoAluno> {
  return chamarApi<ProgressoDoAluno>(`/alunos/eu/progresso${anterior ? `?anterior=${anterior}` : ""}`);
}
