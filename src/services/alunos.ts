/**
 * Aluno.RealizarNivelamento / DesempenhoConteudo.EditarProgressao.
 * O nível é decidido e gravado no servidor (HistoricoNivel); aqui só se monta o aluno da sessão.
 * Sempre devolve um NOVO objeto (o React Compiler depende de imutabilidade).
 */
import { alunos } from "@/data/mock";
import type { Aluno, Nivel } from "@/domain/modelos";
import { chamarApi } from "./api";

/** Cópia do aluno com o nível novo (não grava nada: o servidor já gravou). */
export function comNivel(aluno: Aluno, idNivel: number, nivelamento = false): Aluno {
  return {
    ...aluno,
    idNivelAtual: idNivel,
    idNivelInicial: nivelamento ? idNivel : aluno.idNivelInicial,
    atualizadoEm: new Date().toISOString(),
  };
}

export interface RespostaDoNivelamento {
  idAtividade: number;
  respostaDada: string;
  tempoRespostaSeg: number;
}

/**
 * Manda as respostas do nivelamento, na ordem em que o aluno fez (POST /nivelamento/concluir).
 * O servidor corrige de novo, grava as respostas e o nível inicial, e devolve a etapa.
 */
export async function concluirNivelamento(
  aluno: Aluno,
  respostas: RespostaDoNivelamento[],
): Promise<{ nivel: Nivel; alunoAtualizado: Aluno }> {
  const { nivel } = await chamarApi<{ nivel: Nivel }>("/nivelamento/concluir", {
    metodo: "POST",
    corpo: { respostas },
  });
  return { nivel, alunoAtualizado: comNivel(aluno, nivel.idNivel, true) };
}

/** TODO (passo 10): o painel do professor ainda lê o mock; trocar por GET /professor/alunos/:id. */
export function buscarAluno(idUsuario: number): Aluno | undefined {
  return alunos.find((a) => a.idUsuario === idUsuario);
}
