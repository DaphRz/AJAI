/**
 * Aluno.VisualizarProgresso (RF18, RF19, RF22): GET /alunos/eu/progresso.
 * Tudo vem calculado do servidor (nível, trilha, acertos, dificuldades, a próxima atividade,
 * a ofensiva e a frequência dos últimos 7 dias).
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
  /** RF15: dias seguidos com pelo menos 1 resposta, até hoje ou ontem (fuso America/Sao_Paulo). */
  ofensiva: { dias: number; praticouHoje: boolean };
  /** Frequência dos últimos 7 dias, hoje incluído. */
  ultimos7Dias: { atividades: number; diasComAtividade: number };
}

/**
 * Textos da ofensiva para a home (RF15). Sempre encorajadores: quem parou NUNCA é culpado
 * (RNF06, RNF15). `numero` vai em destaque e `mensagem` embaixo.
 */
export function textoDaOfensiva({ dias, praticouHoje }: ProgressoDoAluno["ofensiva"]): {
  numero: string;
  mensagem: string;
} {
  if (dias === 0) {
    return { numero: "Que bom ter você de volta!", mensagem: "Faça uma atividade hoje para começar uma nova sequência." };
  }
  const numero = dias === 1 ? "1 dia seguido" : `${dias} dias seguidos`;
  if (praticouHoje) return { numero, mensagem: dias === 1 ? "Você treinou hoje. Muito bem!" : "Você está treinando todo dia. Muito bem!" };
  return { numero, mensagem: "Faça uma atividade hoje para continuar a sequência." };
}

/** "3 atividades em 2 dias" (frequência dos últimos 7 dias). */
export function textoDaSemana({ atividades, diasComAtividade }: ProgressoDoAluno["ultimos7Dias"]): string {
  if (atividades === 0) return "Nenhuma atividade nos últimos 7 dias ainda.";
  const a = atividades === 1 ? "1 atividade" : `${atividades} atividades`;
  const d = diasComAtividade === 1 ? "1 dia" : `${diasComAtividade} dias`;
  return `${a} em ${d}, nos últimos 7 dias.`;
}

/** `anterior`: atividade que o aluno acabou de fazer (o servidor evita repetir, se houver outra). */
export function visualizarProgresso(anterior?: number): Promise<ProgressoDoAluno> {
  return chamarApi<ProgressoDoAluno>(`/alunos/eu/progresso${anterior ? `?anterior=${anterior}` : ""}`);
}
