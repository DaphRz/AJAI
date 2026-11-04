/**
 * Aluno.RealizarNivelamento / DesempenhoConteudo.EditarProgressao.
 * Sempre devolve um NOVO objeto (o React Compiler depende de imutabilidade).
 * ESQUELETO: atualiza o mock. Trocar por PATCH /alunos/:id e POST /historico-nivel.
 */
import { alunos } from "@/data/mock";
import type { Aluno } from "@/domain/modelos";

export function definirNivelDoAluno(aluno: Aluno, idNivel: number, nivelamento = false): Aluno {
  const atualizado: Aluno = {
    ...aluno,
    idNivelAtual: idNivel,
    idNivelInicial: nivelamento ? idNivel : aluno.idNivelInicial,
    atualizadoEm: new Date().toISOString(),
  };
  const i = alunos.findIndex((a) => a.idUsuario === aluno.idUsuario);
  if (i >= 0) alunos[i] = atualizado;
  // TODO: registrar HistoricoNivel { idAluno, idNivel, dataMudanca }
  return atualizado;
}

export function buscarAluno(idUsuario: number): Aluno | undefined {
  return alunos.find((a) => a.idUsuario === idUsuario);
}
