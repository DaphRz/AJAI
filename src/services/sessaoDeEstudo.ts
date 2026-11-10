/**
 * Sessão de estudo (RF22): o aluno faz atividades em sequência e só volta para a home
 * depois de ATIVIDADES_POR_SESSAO atividades concluídas (acertadas). Ao chegar lá, pode
 * voltar ao início ou continuar treinando (aí a próxima parada é na 10ª, 15ª...).
 * Qual é a próxima atividade quem decide é o servidor (GET /alunos/eu/progresso).
 */
import { visualizarProgresso } from "./progresso";

/** Quantas atividades concluídas antes de voltar para a home. */
export const ATIVIDADES_POR_SESSAO = 5;

/** Chegou a hora de parar? (`concluidas` conta só as desta sessão.) */
export function fimDaSessao(concluidas: number): boolean {
  return concluidas > 0 && concluidas % ATIVIDADES_POR_SESSAO === 0;
}

/** Posição da próxima atividade dentro do bloco atual: 1 a ATIVIDADES_POR_SESSAO. */
export function posicaoNaSessao(concluidas: number): number {
  return (concluidas % ATIVIDADES_POR_SESSAO) + 1;
}

/**
 * Próxima atividade da etapa atual do aluno (1º as que ainda não acertou; depois repete a mais
 * antiga, nunca a que acabou de fazer se houver outra). Undefined = etapa sem atividades.
 */
export async function escolherProximaAtividade(idAnterior?: number): Promise<number | undefined> {
  return (await visualizarProgresso(idAnterior)).proximaAtividade;
}
