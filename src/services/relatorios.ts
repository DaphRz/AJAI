/**
 * Área do professor e do responsável (passo 8; RF20, RF21; APF 35, 40–43):
 * Professor.VisualizarPainel / VisualizarRelatorioAluno / VisualizarRelatorioFrequencia /
 * VisualizarDificuldades, Resposta.EditarCorrecao e as recomendações do responsável.
 * Tudo vem do servidor (server/src/rotas/professor.ts e responsavel.ts), que só devolve alunos
 * com vínculo ACEITO. A regra da situação (EM_DIA/ATENCAO/REFORCO) está em server/src/progressao.ts.
 */
import { chamarApi } from "./api";

export type Situacao = "EM_DIA" | "ATENCAO" | "REFORCO";

/** Período em dias do calendário "AAAA-MM-DD", início e fim incluídos. */
export interface Periodo {
  inicio: string;
  fim: string;
}

export interface Dificuldade {
  conteudo: string;
  tentativas: number;
  erros: number;
  /** 0 a 1. */
  taxaAcerto: number;
}

export interface AlunoCurto {
  idUsuario: number;
  nome: string;
}

export interface ResumoNoPeriodo {
  diasAtivos: number;
  totalAtividades: number;
  totalAcertos: number;
  taxaAcerto: number;
  situacao: Situacao;
  maiorDificuldade?: Dificuldade;
}

export interface ResumoAluno extends ResumoNoPeriodo {
  aluno: AlunoCurto;
  /** Ausente = ainda não fez o nivelamento. */
  nivel?: { idNivel: number; nome: string; ordem: number };
  turma?: { idTurma: number; nome: string };
}

export interface Painel {
  periodo: Periodo & { dias: number };
  alunos: ResumoAluno[];
}

export interface RespostaParaCorrigir {
  idResposta: number;
  dataHora: string;
  tipo: string;
  conteudo: string;
  enunciado: string;
  respostaDada: string;
  respostaEsperada: string;
  correta: boolean;
  correcaoProfessor?: string;
}

export interface RelatorioAluno {
  aluno: AlunoCurto;
  nivel?: { idNivel: number; nome: string; ordem: number };
  turma?: { idTurma: number; nome: string };
  periodo: Periodo & { dias: number };
  resumo: ResumoNoPeriodo;
  dificuldades: Dificuldade[];
  /** Um ponto por dia do período; taxaAcerto null = sem atividade no dia. */
  serie: { dia: string; atividades: number; acertos: number; taxaAcerto: number | null }[];
  historicoNiveis: { idNivel: number; nome: string; ordem: number; dataMudanca: string }[];
  /** As mais recentes primeiro (no máximo 30). */
  respostas: RespostaParaCorrigir[];
}

export interface RelatorioFrequencia {
  periodo: Periodo & { dias: number };
  turma?: { idTurma: number; nome: string };
  totalAlunos: number;
  alunosAtivos: number;
  totalAtividades: number;
  porAluno: { aluno: AlunoCurto; diasAtivos: number; totalAtividades: number }[];
  porDia: { dia: string; atividades: number; alunos: number }[];
}

export interface RelatorioDificuldades {
  periodo: Periodo & { dias: number };
  turma?: { idTurma: number; nome: string };
  totalAlunos: number;
  conteudos: (Dificuldade & { alunosComErro: number })[];
}

export const rotuloSituacao: Record<Situacao, string> = {
  EM_DIA: "Em dia",
  ATENCAO: "Atenção",
  REFORCO: "Reforço pontual",
};

export const AVISO_COMPLEMENTA = "Os dados do aplicativo complementam a avaliação do professor, não a substituem.";

// ---------- Período ----------

function diaLocal(data: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

/** Os últimos `dias` dias, hoje incluído (dia do aparelho). */
export function ultimosDias(dias: number, hoje = new Date()): Periodo {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (dias - 1));
  return { inicio: diaLocal(inicio), fim: diaLocal(hoje) };
}

/** "14/11/2026" (ou "14/11/26", "14-11-2026") → "2026-11-14"; undefined se a data não existe. */
export function lerDataBrasileira(texto: string): string | undefined {
  const m = texto.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (!m) return undefined;
  const [dia, mes, anoTexto] = [Number(m[1]), Number(m[2]), m[3]];
  const ano = anoTexto.length === 2 ? 2000 + Number(anoTexto) : Number(anoTexto);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return undefined;
  return diaLocal(data);
}

/** "2026-11-14" → "14/11". */
export function diaCurto(dia: string): string {
  const [, mes, d] = dia.split("-");
  return `${d}/${mes}`;
}

/** "2026-11-14" (ou um instante ISO, no dia do aparelho) → "14/11/2026". */
export function diaCompleto(diaOuInstante: string): string {
  const dia = diaOuInstante.length > 10 ? diaLocal(new Date(diaOuInstante)) : diaOuInstante;
  const [ano, mes, d] = dia.split("-");
  return `${d}/${mes}/${ano}`;
}

function consulta(periodo: Periodo, extra: Record<string, number | undefined> = {}): string {
  const partes = [`inicio=${periodo.inicio}`, `fim=${periodo.fim}`];
  for (const [chave, valor] of Object.entries(extra)) if (valor !== undefined) partes.push(`${chave}=${valor}`);
  return `?${partes.join("&")}`;
}

// ---------- Professor ----------

export function visualizarPainel(periodo: Periodo): Promise<Painel> {
  return chamarApi<Painel>(`/professor/painel${consulta(periodo)}`);
}

export function visualizarRelatorioAluno(idAluno: number, periodo: Periodo): Promise<RelatorioAluno> {
  return chamarApi<RelatorioAluno>(`/professor/alunos/${idAluno}${consulta(periodo)}`);
}

export function visualizarRelatorioFrequencia(periodo: Periodo, idTurma?: number): Promise<RelatorioFrequencia> {
  return chamarApi<RelatorioFrequencia>(`/professor/relatorios/frequencia${consulta(periodo, { idTurma })}`);
}

export function visualizarDificuldades(periodo: Periodo, idTurma?: number): Promise<RelatorioDificuldades> {
  return chamarApi<RelatorioDificuldades>(`/professor/relatorios/dificuldades${consulta(periodo, { idTurma })}`);
}

/** Correção manual (APF 35): muda o certo/errado de uma resposta. */
export async function corrigirResposta(idResposta: number, correta: boolean, observacao?: string): Promise<void> {
  await chamarApi(`/respostas/${idResposta}/correcao`, {
    metodo: "PATCH",
    corpo: { correta, ...(observacao?.trim() ? { observacao: observacao.trim() } : {}) },
  });
}

// ---------- Responsável ----------

export interface RecomendacoesDaPessoa {
  idVinculo: number;
  aluno: AlunoCurto;
  frases: string[];
}

/** 1 a 3 frases curtas para cada pessoa acompanhada (sem métricas detalhadas). */
export async function listarRecomendacoes(): Promise<RecomendacoesDaPessoa[]> {
  const { pessoas } = await chamarApi<{ pessoas: RecomendacoesDaPessoa[] }>("/responsavel/recomendacoes");
  return pessoas;
}
