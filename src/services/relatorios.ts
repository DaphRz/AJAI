/**
 * Área do professor (RF20, RF21):
 * Professor.VisualizarPainel / VisualizarRelatorioAluno / VisualizarDificuldades.
 * ESQUELETO: calcula em cima dos dados em memória.
 */
import { alunos, atividades, matriculas, respostas, turmas } from "@/data/mock";
import type { Aluno } from "@/domain/modelos";
import { buscarNivel } from "./atividades";
import { identificarDificuldades, taxaDeAcerto } from "./progressao";

export type Situacao = "EM_DIA" | "ATENCAO" | "REFORCO";

export interface ResumoAluno {
  aluno: Aluno;
  nomeNivel: string;
  diasAtivos: number; // nos últimos 7 dias
  totalAtividades: number;
  taxaAcerto: number;
  maiorDificuldade?: { conteudo: string; erros: number; tentativas: number };
  situacao: Situacao;
}

export function listarAlunosDoProfessor(idProfessor: number): Aluno[] {
  const idsTurmas = turmas.filter((t) => t.idProfessor === idProfessor).map((t) => t.idTurma);
  const idsAlunos = matriculas.filter((m) => idsTurmas.includes(m.idTurma)).map((m) => m.idAluno);
  return alunos.filter((a) => idsAlunos.includes(a.idUsuario));
}

export function resumoDoAluno(aluno: Aluno): ResumoAluno {
  const lista = respostas.filter((r) => r.idAluno === aluno.idUsuario);
  const seteDiasAtras = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const dias = new Set(
    lista
      .filter((r) => new Date(r.dataHora).getTime() >= seteDiasAtras)
      .map((r) => r.dataHora.slice(0, 10)),
  );
  const taxa = taxaDeAcerto(lista);
  const [pior] = identificarDificuldades(lista, atividades);

  let situacao: Situacao = "EM_DIA";
  if (lista.length > 0 && taxa < 0.6) situacao = "REFORCO";
  else if (dias.size < 4) situacao = "ATENCAO";

  return {
    aluno,
    nomeNivel: buscarNivel(aluno.idNivelAtual)?.nome ?? "Sem nivelamento",
    diasAtivos: dias.size,
    totalAtividades: lista.length,
    taxaAcerto: taxa,
    maiorDificuldade: pior,
    situacao,
  };
}

export function visualizarPainel(idProfessor: number): ResumoAluno[] {
  return listarAlunosDoProfessor(idProfessor).map(resumoDoAluno);
}
