// Regras de nivelamento e progressão (RF03, RF16, RF17, RF19, RF22).
//
// Funções PURAS (sem banco, sem Fastify, sem React): recebem dados e devolvem decisões.
// Vieram de src/services/progressao.ts (passo 5) SEM mudar a lógica; o app reexporta este
// arquivo (o painel do professor ainda calcula em cima do mock até o passo 8).
// Por isso este arquivo NÃO importa nada: os tipos abaixo são o mínimo de cada modelo
// (compatíveis com Atividade, Nivel e Resposta de src/domain/modelos.ts).
// Testes: progressao.test.ts (`npm run server:test`).
//
// Regra de progressão (provisória até a equipe validar com os profissionais da EJA):
// o aluno sobe quando a taxa de acerto das últimas JANELA_PROGRESSAO respostas do nível
// é >= Nivel.criterioAcerto. Se mudar, mude aqui, nos testes e no README.

/** Quantas respostas recentes do nível entram no cálculo. */
export const JANELA_PROGRESSAO = 5;

export interface RespostaParaProgressao {
  idAtividade: number;
  correta: boolean;
  /** ISO 8601; usada para escolher a próxima atividade. */
  dataHora?: string;
}

export interface NivelParaProgressao {
  idNivel: number;
  criterioAcerto: number;
}

export function taxaDeAcerto(lista: readonly Pick<RespostaParaProgressao, "correta">[]): number {
  if (lista.length === 0) return 0;
  return lista.filter((r) => r.correta).length / lista.length;
}

/**
 * Nivelamento (RF03, regra definida no passo 6): as perguntas vêm em pares, um par por nível,
 * em ordem crescente, e o aluno para no primeiro erro. Ele só passa de nível acertando AS DUAS
 * perguntas do par, então o nível inicial é o da pergunta que ele errou (o primeiro nível que
 * ainda não domina). Sem erro: o nível da última pergunta respondida (acertou tudo = último nível).
 * `perguntas` e `acertos` são das perguntas respondidas, na ordem.
 */
export function definirNivelInicial<N extends { idNivel: number }>(
  perguntas: readonly { idNivel: number }[],
  acertos: readonly boolean[],
  trilha: readonly N[],
): N {
  const respondidas = Math.min(perguntas.length, acertos.length);
  let idNivel = trilha[0].idNivel;
  for (let i = 0; i < respondidas; i++) {
    idNivel = perguntas[i].idNivel;
    if (!acertos[i]) break;
  }
  return trilha.find((n) => n.idNivel === idNivel) ?? trilha[0];
}

/** `respostasDoNivel` em ordem cronológica (a mais antiga primeiro). */
export function deveAvancar(
  nivel: NivelParaProgressao,
  respostasDoNivel: readonly Pick<RespostaParaProgressao, "correta">[],
): boolean {
  const recentes = respostasDoNivel.slice(-JANELA_PROGRESSAO);
  if (recentes.length < JANELA_PROGRESSAO) return false;
  return taxaDeAcerto(recentes) >= nivel.criterioAcerto;
}

export interface Dificuldade {
  conteudo: string;
  tentativas: number;
  erros: number;
  taxaAcerto: number;
}

/** Agrupa respostas por conteúdo e devolve os de menor taxa de acerto. */
export function identificarDificuldades(
  respostas: readonly RespostaParaProgressao[],
  atividades: readonly { idAtividade: number; conteudo: string }[],
): Dificuldade[] {
  const porConteudo = new Map<string, RespostaParaProgressao[]>();
  for (const r of respostas) {
    const atividade = atividades.find((a) => a.idAtividade === r.idAtividade);
    if (!atividade) continue;
    const lista = porConteudo.get(atividade.conteudo) ?? [];
    lista.push(r);
    porConteudo.set(atividade.conteudo, lista);
  }
  return [...porConteudo.entries()]
    .map(([conteudo, lista]) => ({
      conteudo,
      tentativas: lista.length,
      erros: lista.filter((r) => !r.correta).length,
      taxaAcerto: taxaDeAcerto(lista),
    }))
    .sort((a, b) => a.taxaAcerto - b.taxaAcerto);
}

/**
 * Próxima atividade da etapa atual (RF22). Veio de src/services/sessaoDeEstudo.ts, sem mudar a lógica:
 * 1º as que o aluno ainda não acertou, na ordem; depois, se já acertou todas, repete a que faz
 * mais tempo que ele não responde (nunca a que acabou de fazer, se houver outra).
 * Devolve undefined se a etapa não tem atividades.
 */
export function escolherProximaAtividade(
  atividadesDaEtapa: readonly { idAtividade: number }[],
  respostas: readonly RespostaParaProgressao[],
  idAnterior?: number,
): number | undefined {
  if (atividadesDaEtapa.length === 0) return undefined;
  const candidatas =
    atividadesDaEtapa.length > 1 ? atividadesDaEtapa.filter((a) => a.idAtividade !== idAnterior) : atividadesDaEtapa;

  const pendente = candidatas.find((a) => !respostas.some((r) => r.idAtividade === a.idAtividade && r.correta));
  if (pendente) return pendente.idAtividade;

  const ultimaVez = (idAtividade: number) =>
    respostas
      .filter((r) => r.idAtividade === idAtividade)
      .reduce((maior, r) => ((r.dataHora ?? "") > maior ? (r.dataHora ?? "") : maior), "");
  const maisAntiga = [...candidatas].sort((a, b) => ultimaVez(a.idAtividade).localeCompare(ultimaVez(b.idAtividade)))[0];
  return maisAntiga.idAtividade;
}

export type StatusEtapa = "CONCLUIDA" | "ATUAL" | "BLOQUEADA";

/** Situação de cada etapa da trilha em relação ao nível atual (sem nível = todas bloqueadas). */
export function statusDaTrilha<N extends { idNivel: number; ordem: number }>(
  trilha: readonly N[],
  idNivelAtual: number | undefined,
): (N & { status: StatusEtapa })[] {
  const atual = trilha.find((n) => n.idNivel === idNivelAtual);
  return trilha.map((n) => ({
    ...n,
    status: !atual ? "BLOQUEADA" : n.ordem < atual.ordem ? "CONCLUIDA" : n.idNivel === atual.idNivel ? "ATUAL" : "BLOQUEADA",
  }));
}
