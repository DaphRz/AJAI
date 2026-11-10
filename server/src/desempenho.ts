// Leitura e gravação do desempenho do aluno no banco (passo 5):
// Resposta (Aluno.IncluirResposta), DesempenhoConteudo (EditarProgressao) e HistoricoNivel.
// As DECISÕES (subir de nível, nível inicial, próxima atividade) ficam nas funções puras de
// progressao.ts; aqui só se lê e grava. Quem chama abre a transação (ver emTransacao).
import { banco } from "./banco.ts";

export interface NivelLinha {
  idNivel: number;
  nome: string;
  descricao: string;
  ordem: number;
  criterioAcerto: number;
}

/** Atividade com o gabarito: SÓ para uso interno do servidor, nunca vai para o app. */
export interface AtividadeComGabarito {
  idAtividade: number;
  idNivel: number;
  conteudo: string;
  respostaCorreta: string;
  ordemNivelamento: number | null;
}

export interface RespostaLinha {
  idResposta: number;
  idAtividade: number;
  idNivel: number;
  correta: boolean;
  dataHora: string;
}

/** Executa `fazer` dentro de BEGIN/COMMIT (ROLLBACK se der erro). */
export function emTransacao<T>(fazer: () => T): T {
  const db = banco();
  db.exec("BEGIN");
  try {
    const resultado = fazer();
    db.exec("COMMIT");
    return resultado;
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}

export function listarNiveis(): NivelLinha[] {
  return banco()
    .prepare("SELECT idNivel, nome, descricao, ordem, criterioAcerto FROM Nivel ORDER BY ordem")
    .all() as unknown as NivelLinha[];
}

export function buscarAtividadeAtiva(idAtividade: number): AtividadeComGabarito | undefined {
  return banco()
    .prepare(
      `SELECT idAtividade, idNivel, conteudo, respostaCorreta, ordemNivelamento
         FROM Atividade WHERE idAtividade = ? AND status = 'ATIVA'`,
    )
    .get(idAtividade) as AtividadeComGabarito | undefined;
}

/** Perguntas do nivelamento na ordem oficial (mesma de GET /nivelamento). */
export function perguntasDoNivelamento(): AtividadeComGabarito[] {
  return banco()
    .prepare(
      `SELECT a.idAtividade, a.idNivel, a.conteudo, a.respostaCorreta, a.ordemNivelamento
         FROM Atividade a JOIN Nivel n ON n.idNivel = a.idNivel
        WHERE a.ordemNivelamento IS NOT NULL AND a.status = 'ATIVA'
        ORDER BY n.ordem, a.ordemNivelamento`,
    )
    .all() as unknown as AtividadeComGabarito[];
}

/** Ids das atividades ATIVAS de um nível, em ordem (mesma de GET /niveis/:id/atividades). */
export function idsAtividadesDoNivel(idNivel: number): { idAtividade: number }[] {
  return banco()
    .prepare("SELECT idAtividade FROM Atividade WHERE idNivel = ? AND status = 'ATIVA' ORDER BY idAtividade")
    .all(idNivel) as unknown as { idAtividade: number }[];
}

/** Conteúdo de todas as atividades (ativas ou não: respostas antigas continuam contando). */
export function conteudosDasAtividades(): { idAtividade: number; conteudo: string }[] {
  return banco().prepare("SELECT idAtividade, conteudo FROM Atividade").all() as unknown as {
    idAtividade: number;
    conteudo: string;
  }[];
}

/** Nível inicial e atual do aluno (o atual é o HistoricoNivel mais recente, pela vw_aluno). */
export function niveisDoAluno(idAluno: number): { idNivelInicial?: number; idNivelAtual?: number } {
  const linha = banco()
    .prepare("SELECT idNivelInicial, idNivelAtual FROM vw_aluno WHERE idUsuario = ?")
    .get(idAluno) as { idNivelInicial: number | null; idNivelAtual: number | null } | undefined;
  return {
    idNivelInicial: linha?.idNivelInicial ?? undefined,
    idNivelAtual: linha?.idNivelAtual ?? undefined,
  };
}

/** Respostas do aluno em ordem cronológica (a mais antiga primeiro); `idNivel` filtra por nível. */
export function respostasDoAluno(idAluno: number, idNivel?: number): RespostaLinha[] {
  const filtroNivel = idNivel === undefined ? "" : "AND a.idNivel = ?";
  const linhas = banco()
    .prepare(
      `SELECT r.idResposta, r.idAtividade, a.idNivel, r.correta, r.dataHora
         FROM Resposta r JOIN Atividade a ON a.idAtividade = r.idAtividade
        WHERE r.idAluno = ? ${filtroNivel}
        ORDER BY r.dataHora, r.idResposta`,
    )
    .all(...(idNivel === undefined ? [idAluno] : [idAluno, idNivel])) as unknown as (Omit<RespostaLinha, "correta"> & {
    correta: number;
  })[];
  return linhas.map((r) => ({ ...r, correta: r.correta === 1 }));
}

/** Grava a Resposta e atualiza o DesempenhoConteudo do conteúdo da atividade. */
export function gravarResposta(params: {
  idAluno: number;
  atividade: AtividadeComGabarito;
  respostaDada: string;
  correta: boolean;
  tempoRespostaSeg: number;
  dataHora: string;
}): number {
  const db = banco();
  const { idAluno, atividade, correta, dataHora } = params;
  const r = db
    .prepare(
      `INSERT INTO Resposta (idAluno, idAtividade, respostaDada, correta, dataHora, tempoRespostaSeg)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(idAluno, atividade.idAtividade, params.respostaDada, correta ? 1 : 0, dataHora, params.tempoRespostaSeg);

  // Tentativas, acertos e taxa por (aluno, nível, conteúdo). No UPDATE, as colunas sem
  // "excluded." são os valores ANTIGOS da linha.
  db.prepare(
    `INSERT INTO DesempenhoConteudo (idAluno, idNivel, conteudo, totalTentativas, totalAcertos, taxaAcerto, atualizadoEm)
     VALUES (?, ?, ?, 1, ?, ?, ?)
     ON CONFLICT (idAluno, idNivel, conteudo) DO UPDATE SET
       totalTentativas = totalTentativas + 1,
       totalAcertos    = totalAcertos + excluded.totalAcertos,
       taxaAcerto      = CAST(totalAcertos + excluded.totalAcertos AS REAL) / (totalTentativas + 1),
       atualizadoEm    = excluded.atualizadoEm`,
  ).run(idAluno, atividade.idNivel, atividade.conteudo, correta ? 1 : 0, correta ? 1 : 0, dataHora);

  return Number(r.lastInsertRowid);
}

/** Registra a mudança de nível (o nível atual passa a ser este). */
export function gravarHistoricoNivel(idAluno: number, idNivel: number, dataMudanca: string): void {
  banco()
    .prepare("INSERT INTO HistoricoNivel (idAluno, idNivel, dataMudanca) VALUES (?, ?, ?)")
    .run(idAluno, idNivel, dataMudanca);
}

/** Nível inicial do aluno (só no nivelamento). */
export function gravarNivelInicial(idAluno: number, idNivel: number, agora: string): void {
  const db = banco();
  db.prepare("UPDATE Aluno SET idNivelInicial = ? WHERE idUsuario = ?").run(idNivel, idAluno);
  db.prepare("UPDATE Usuario SET atualizadoEm = ? WHERE idUsuario = ?").run(agora, idAluno);
}
