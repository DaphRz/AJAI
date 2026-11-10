/**
 * Sessão de estudo (RF22): o aluno faz atividades em sequência e só volta para a home
 * depois de ATIVIDADES_POR_SESSAO atividades concluídas (acertadas). Ao chegar lá, pode
 * voltar ao início ou continuar treinando (aí a próxima parada é na 10ª, 15ª...).
 * TODO (passo 5): a próxima atividade passa a vir de GET /alunos/eu/progresso.
 */
import type { Aluno } from "@/domain/modelos";
import { listarAtividadesDoNivel, listarTrilha } from "./atividades";
import { listarRespostasDoAluno } from "./respostas";

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
 * Escolhe a próxima atividade da etapa atual do aluno:
 * 1º as que ele ainda não acertou, na ordem; depois, se já acertou todas, repete
 * a que faz mais tempo que ele não responde (nunca a que acabou de fazer, se houver outra).
 * Devolve undefined se a etapa não tem atividades.
 */
export async function escolherProximaAtividade(aluno: Aluno, idAnterior?: number): Promise<number | undefined> {
  const trilha = await listarTrilha();
  const nivel = trilha.find((n) => n.idNivel === aluno.idNivelAtual) ?? trilha[0];
  if (!nivel) return undefined;
  const atividades = await listarAtividadesDoNivel(nivel.idNivel);
  if (atividades.length === 0) return undefined;

  const respostas = listarRespostasDoAluno(aluno.idUsuario);
  const candidatas = atividades.length > 1 ? atividades.filter((a) => a.idAtividade !== idAnterior) : atividades;

  const pendente = candidatas.find(
    (a) => !respostas.some((r) => r.idAtividade === a.idAtividade && r.correta),
  );
  if (pendente) return pendente.idAtividade;

  const ultimaVez = (idAtividade: number) =>
    respostas.filter((r) => r.idAtividade === idAtividade).reduce((maior, r) => (r.dataHora > maior ? r.dataHora : maior), "");
  const maisAntiga = [...candidatas].sort((a, b) => ultimaVez(a.idAtividade).localeCompare(ultimaVez(b.idAtividade)))[0];
  return maisAntiga.idAtividade;
}
