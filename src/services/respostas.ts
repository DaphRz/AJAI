/**
 * Aluno.IncluirResposta + Resposta.CorrigirAutomaticamente (RF12–RF14, RF16).
 * Tudo acontece no SERVIDOR (o app não tem o gabarito): POST /respostas corrige, grava a
 * Resposta, atualiza o DesempenhoConteudo e decide a subida de nível.
 */
import type { Aluno, AtividadeDoAluno, Nivel } from "@/domain/modelos";
import { comNivel } from "./alunos";
import { chamarApi } from "./api";

export interface ResultadoResposta {
  correta: boolean;
  subiuDeNivel: boolean;
  /** Etapa do aluno depois desta resposta (a nova, se subiu). */
  nivelAtual: Nivel;
}

/** Envia a resposta ao servidor, que corrige e grava (POST /respostas). */
export function incluirResposta(params: {
  idAtividade: number;
  respostaDada: string;
  tempoRespostaSeg: number;
}): Promise<ResultadoResposta> {
  return chamarApi<ResultadoResposta>("/respostas", { metodo: "POST", corpo: params });
}

/**
 * Responde uma atividade do dia a dia. Quando o aluno sobe de nível, devolve também o aluno
 * atualizado (objeto NOVO, nunca mutado) para a tela passar a `entrar(...)` da sessão.
 */
export async function responderAtividade(params: {
  aluno: Aluno;
  atividade: AtividadeDoAluno;
  respostaDada: string;
  tempoRespostaSeg: number;
}): Promise<ResultadoResposta & { alunoAtualizado?: Aluno }> {
  const { aluno, atividade } = params;
  const r = await incluirResposta({
    idAtividade: atividade.idAtividade,
    respostaDada: params.respostaDada,
    tempoRespostaSeg: params.tempoRespostaSeg,
  });
  const mudou = r.nivelAtual.idNivel !== aluno.idNivelAtual;
  return mudou ? { ...r, alunoAtualizado: comNivel(aluno, r.nivelAtual.idNivel) } : r;
}

/**
 * Nivelamento: só diz se a resposta está certa, SEM gravar (POST /atividades/:id/corrigir,
 * aceita só perguntas do nivelamento). Serve para parar no primeiro erro; quem grava e decide
 * o nível é concluirNivelamento (services/alunos.ts).
 */
export async function corrigirPerguntaDoNivelamento(idAtividade: number, respostaDada: string): Promise<boolean> {
  const r = await chamarApi<{ correta: boolean }>(`/atividades/${idAtividade}/corrigir`, {
    metodo: "POST",
    corpo: { respostaDada },
  });
  return r.correta;
}
