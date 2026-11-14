// Regras de nivelamento e progressão (RF03, RF16, RF17, RF19, RF22).
//
// Funções PURAS (sem banco, sem Fastify, sem React): recebem dados e devolvem decisões.
// Vieram de src/services/progressao.ts (passo 5) SEM mudar a lógica. Desde o passo 8 o app não
// importa mais este arquivo: painel, relatórios e recomendações vêm da API.
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

// ---------------------------------------------------------------------------------------------
// Frequência e ofensiva (RF15, passo 7).
// "Dia" é o dia do calendário no fuso do aluno (America/Sao_Paulo), não o dia UTC: uma resposta
// às 22h de segunda em Brasília (01h de terça em UTC) conta como segunda.

/** Fuso usado para decidir em que dia cada resposta aconteceu. */
export const FUSO_PADRAO = "America/Sao_Paulo";

/** Dia do calendário ("AAAA-MM-DD") de um instante, no fuso pedido. */
export function diaNoFuso(instante: string | Date, fuso: string = FUSO_PADRAO): string {
  const data = typeof instante === "string" ? new Date(instante) : instante;
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
}

/** Soma `dias` (pode ser negativo) a um dia "AAAA-MM-DD". Conta no calendário, sem fuso nem horário de verão. */
export function somarDias(dia: string, dias: number): string {
  const [ano, mes, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, d + dias)).toISOString().slice(0, 10);
}

export interface Ofensiva {
  /** Dias seguidos com pelo menos 1 resposta, terminando hoje ou ontem (0 = a sequência acabou). */
  dias: number;
  /** Respondeu alguma atividade hoje. */
  praticouHoje: boolean;
}

/**
 * Ofensiva: quantos dias seguidos o aluno respondeu pelo menos 1 atividade. A sequência pode
 * terminar hoje OU ontem (quem ainda não treinou hoje não perde a ofensiva antes do dia acabar).
 * `datas`: dataHora (ISO 8601) das respostas, em qualquer ordem.
 */
export function calcularOfensiva(datas: readonly string[], agora: Date, fuso: string = FUSO_PADRAO): Ofensiva {
  const diasComResposta = new Set(datas.map((d) => diaNoFuso(d, fuso)));
  const hoje = diaNoFuso(agora, fuso);
  const praticouHoje = diasComResposta.has(hoje);
  let dia = praticouHoje ? hoje : somarDias(hoje, -1);
  let dias = 0;
  while (diasComResposta.has(dia)) {
    dias++;
    dia = somarDias(dia, -1);
  }
  return { dias, praticouHoje };
}

export interface FrequenciaRecente {
  /** Respostas nos últimos `dias` dias (hoje incluído). */
  atividades: number;
  /** Em quantos desses dias o aluno respondeu pelo menos 1 atividade. */
  diasComAtividade: number;
}

/** Atividades respondidas nos últimos `dias` dias do calendário, contando hoje. */
export function frequenciaRecente(
  datas: readonly string[],
  agora: Date,
  dias = 7,
  fuso: string = FUSO_PADRAO,
): FrequenciaRecente {
  const primeiroDia = somarDias(diaNoFuso(agora, fuso), -(dias - 1));
  const recentes = datas.map((d) => diaNoFuso(d, fuso)).filter((dia) => dia >= primeiroDia);
  return { atividades: recentes.length, diasComAtividade: new Set(recentes).size };
}

// ---------------------------------------------------------------------------------------------
// Área do professor e do responsável (RF20, RF21, passo 8).
// O período é sempre um intervalo de dias do calendário ("AAAA-MM-DD", início e fim incluídos),
// no fuso America/Sao_Paulo, como a ofensiva.

/** Abaixo desta taxa de acerto no período, o aluno precisa de REFORÇO. */
export const TAXA_MINIMA_EM_DIA = 0.6;
/** Dias com atividade esperados por semana; menos que isso (proporcional ao período) = ATENÇÃO. */
export const DIAS_ESPERADOS_POR_SEMANA = 3;

export type Situacao = "EM_DIA" | "ATENCAO" | "REFORCO";

/** Quantos dias tem o período (início e fim incluídos). */
export function diasNoPeriodo(inicio: string, fim: string): number {
  const [a, b] = [inicio, fim].map((d) => {
    const [ano, mes, dia] = d.split("-").map(Number);
    return Date.UTC(ano, mes - 1, dia);
  });
  return Math.round((b - a) / 86_400_000) + 1;
}

/** true se o instante cai entre os dias `inicio` e `fim` (incluídos), no fuso. */
export function estaNoPeriodo(instante: string, inicio: string, fim: string, fuso: string = FUSO_PADRAO): boolean {
  const dia = diaNoFuso(instante, fuso);
  return dia >= inicio && dia <= fim;
}

/** Dias com atividade esperados no período: 3 por semana, proporcional, no mínimo 1. */
export function diasEsperados(dias: number): number {
  return Math.max(1, Math.ceil((dias * DIAS_ESPERADOS_POR_SEMANA) / 7));
}

/**
 * Situação do aluno no período (selo do painel do professor). Regra, nesta ordem:
 * 1. nenhuma atividade no período → ATENCAO;
 * 2. taxa de acerto < 60% (TAXA_MINIMA_EM_DIA) → REFORCO;
 * 3. dias com atividade < 3 por semana (proporcional ao período, mínimo 1) → ATENCAO;
 * 4. senão → EM_DIA.
 */
export function situacaoDoAluno(dados: {
  totalAtividades: number;
  taxaAcerto: number;
  diasAtivos: number;
  diasNoPeriodo: number;
}): Situacao {
  if (dados.totalAtividades === 0) return "ATENCAO";
  if (dados.taxaAcerto < TAXA_MINIMA_EM_DIA) return "REFORCO";
  if (dados.diasAtivos < diasEsperados(dados.diasNoPeriodo)) return "ATENCAO";
  return "EM_DIA";
}

export interface PontoDaSerie {
  dia: string;
  atividades: number;
  acertos: number;
  /** null = sem atividade no dia. */
  taxaAcerto: number | null;
}

/** Uma linha por dia do período (inclusive os dias sem atividade), para o gráfico de evolução. */
export function serieDiaria(
  respostas: readonly { dataHora: string; correta: boolean }[],
  inicio: string,
  fim: string,
  fuso: string = FUSO_PADRAO,
): PontoDaSerie[] {
  const porDia = new Map<string, { atividades: number; acertos: number }>();
  for (const r of respostas) {
    const dia = diaNoFuso(r.dataHora, fuso);
    if (dia < inicio || dia > fim) continue;
    const atual = porDia.get(dia) ?? { atividades: 0, acertos: 0 };
    atual.atividades++;
    if (r.correta) atual.acertos++;
    porDia.set(dia, atual);
  }
  const serie: PontoDaSerie[] = [];
  for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
    const d = porDia.get(dia) ?? { atividades: 0, acertos: 0 };
    serie.push({ dia, ...d, taxaAcerto: d.atividades === 0 ? null : d.acertos / d.atividades });
  }
  return serie;
}

/**
 * Até 3 frases curtas e positivas para o responsável (familiar), sem métricas detalhadas:
 * frequência da semana, um conteúdo para treinar junto e a etapa atual.
 */
export function recomendacoesParaFamilia(dados: {
  primeiroNome: string;
  /** Dias com atividade nos últimos 7 dias. */
  diasNaSemana: number;
  nomeEtapa?: string;
  /** Conteúdo com mais erros (ex.: "Letra B"). */
  conteudoParaTreinar?: string;
}): string[] {
  const { primeiroNome: nome, diasNaSemana: dias } = dados;
  if (!dados.nomeEtapa) {
    return [`${nome} ainda não começou. Ajude a fazer as primeiras perguntas no aplicativo.`];
  }
  const frases: string[] = [];
  if (dias === 0) frases.push(`${nome} não treinou nos últimos 7 dias. Que tal combinar um horário para treinar juntos?`);
  else if (dias === 1) frases.push(`${nome} treinou 1 dia nos últimos 7 dias. Um incentivo ajuda a continuar!`);
  else if (dias < 4) frases.push(`${nome} treinou ${dias} dias nos últimos 7 dias. Treinar um pouco todo dia ajuda.`);
  else frases.push(`${nome} treinou ${dias} dias nos últimos 7 dias. Muito bem!`);
  if (dados.conteudoParaTreinar) frases.push(`Vale a pena treinar junto: ${dados.conteudoParaTreinar}.`);
  frases.push(`${nome} está na etapa ${dados.nomeEtapa}.`);
  return frases.slice(0, 3);
}
