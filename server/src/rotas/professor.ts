// Área do professor (passo 8; RF20, RF21; APF 20–24, 35, 40–43). Só PROFESSOR com a conta liberada
// (aprovado pela instituição), e só sobre alunos com Vinculo ACEITO com ele (temVinculoAceito).
//   GET    /professor/painel?inicio&fim                   resumo por aluno vinculado
//   GET    /professor/alunos/:id?inicio&fim               relatório individual, série diária,
//                                                         histórico de níveis e respostas (para corrigir)
//   GET    /professor/relatorios/frequencia?idTurma&inicio&fim
//   GET    /professor/relatorios/dificuldades?idTurma&inicio&fim
//   GET    /professor/turmas                              turmas do professor com os alunos + alunos sem turma
//   POST   /professor/turmas                              { nome, periodo }
//   PATCH  /professor/turmas/:id                          { nome?, periodo?, ativa? }
//   DELETE /professor/turmas/:id                          apaga a turma (os alunos ficam sem turma)
//   PUT    /professor/alunos/:id/turma                    { idTurma | null } põe, move ou tira o aluno
//   PATCH  /respostas/:id/correcao                        { correta, observacao? } correção manual
//
// Período: `inicio` e `fim` são dias "AAAA-MM-DD" (incluídos), no fuso America/Sao_Paulo.
// Sem eles: os últimos 7 dias, hoje incluído. Regra da situação (EM_DIA/ATENCAO/REFORCO): progressao.ts.
// Aluno sem vínculo ACEITO (ou de outro professor) → 404, para não revelar que ele existe.
import type { FastifyInstance } from "fastify";
import { exigirContaLiberada } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import {
  conteudosDasAtividades,
  emTransacao,
  historicoDeNiveis,
  listarNiveis,
  recalcularDesempenhoConteudo,
  respostasDoAluno,
  type RespostaLinha,
} from "../desempenho.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import {
  diaNoFuso,
  diasNoPeriodo,
  estaNoPeriodo,
  identificarDificuldades,
  serieDiaria,
  situacaoDoAluno,
  somarDias,
  taxaDeAcerto,
} from "../progressao.ts";
import { temVinculoAceito } from "./vinculos.ts";

/** Período padrão (dias) e o maior permitido. */
const DIAS_PADRAO = 7;
const MAXIMO_DIAS = 366;
/** Quantas respostas recentes a tela de métricas mostra para correção manual. */
const MAXIMO_RESPOSTAS = 30;

const DIA = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } as const;
const queryPeriodo = { type: "object", properties: { inicio: DIA, fim: DIA } } as const;
const queryRelatorio = {
  type: "object",
  properties: { inicio: DIA, fim: DIA, idTurma: { type: "integer", minimum: 1 } },
} as const;
const paramsId = { type: "object", properties: { id: { type: "integer", minimum: 1 } }, required: ["id"] } as const;
const errosComuns = { 400: esquemaErro, 401: esquemaErro, 403: esquemaErro, 404: esquemaErro, 409: esquemaErro } as const;
export const NOME_TURMA = { type: "string", minLength: 2, maxLength: 60, pattern: "\\S" } as const;
export const PERIODO_TURMA = { type: "string", minLength: 1, maxLength: 30, pattern: "\\S" } as const;

const esquemaPeriodo = {
  type: "object",
  properties: { inicio: { type: "string" }, fim: { type: "string" }, dias: { type: "integer" } },
  required: ["inicio", "fim", "dias"],
} as const;
const esquemaAlunoCurto = {
  type: "object",
  properties: { idUsuario: { type: "integer" }, nome: { type: "string" } },
  required: ["idUsuario", "nome"],
} as const;
const esquemaNivelCurto = {
  type: "object",
  properties: { idNivel: { type: "integer" }, nome: { type: "string" }, ordem: { type: "integer" } },
  required: ["idNivel", "nome", "ordem"],
} as const;
const esquemaTurmaCurta = {
  type: "object",
  properties: { idTurma: { type: "integer" }, nome: { type: "string" } },
  required: ["idTurma", "nome"],
} as const;
const esquemaDificuldade = {
  type: "object",
  properties: {
    conteudo: { type: "string" },
    tentativas: { type: "integer" },
    erros: { type: "integer" },
    taxaAcerto: { type: "number" },
  },
  required: ["conteudo", "tentativas", "erros", "taxaAcerto"],
} as const;
const esquemaResumo = {
  type: "object",
  properties: {
    diasAtivos: { type: "integer" },
    totalAtividades: { type: "integer" },
    totalAcertos: { type: "integer" },
    taxaAcerto: { type: "number" },
    situacao: { type: "string", enum: ["EM_DIA", "ATENCAO", "REFORCO"] },
    maiorDificuldade: esquemaDificuldade,
  },
  required: ["diasAtivos", "totalAtividades", "totalAcertos", "taxaAcerto", "situacao"],
} as const;
const esquemaTurma = {
  type: "object",
  properties: {
    idTurma: { type: "integer" },
    nome: { type: "string" },
    periodo: { type: "string" },
    ativa: { type: "boolean" },
    alunos: { type: "array", items: esquemaAlunoCurto },
  },
  required: ["idTurma", "nome", "periodo", "ativa", "alunos"],
} as const;

interface Periodo {
  inicio: string;
  fim: string;
  dias: number;
}

/** Confere e completa o período pedido (padrão: últimos 7 dias). 400 se for inválido. */
function lerPeriodo(query: { inicio?: string; fim?: string }): Periodo {
  const fim = query.fim ?? diaNoFuso(new Date());
  const inicio = query.inicio ?? somarDias(fim, -(DIAS_PADRAO - 1));
  // somarDias(d, 0) normaliza a data: "2026-02-30" vira "2026-03-02", então não bate.
  if (somarDias(inicio, 0) !== inicio || somarDias(fim, 0) !== fim) {
    throw new ErroApi(400, "Confira as datas do período.");
  }
  if (inicio > fim) throw new ErroApi(400, "A data de início precisa vir antes da data de fim.");
  const dias = diasNoPeriodo(inicio, fim);
  if (dias > MAXIMO_DIAS) throw new ErroApi(400, "Escolha um período de até 1 ano.");
  return { inicio, fim, dias };
}

interface AlunoVinculado {
  idUsuario: number;
  nome: string;
  idNivelAtual: number | null;
  idTurma: number | null;
  nomeTurma: string | null;
}

/** Alunos com vínculo ACEITO com o professor (e a turma DELE em que estão, se houver). */
function alunosVinculados(idProfessor: number, idTurma?: number): AlunoVinculado[] {
  const linhas = banco()
    .prepare(
      `SELECT va.idUsuario, va.nome, va.idNivelAtual, t.idTurma, t.nome AS nomeTurma
         FROM Vinculo v
         JOIN vw_aluno va ON va.idUsuario = v.idAluno
         LEFT JOIN Matricula m ON m.idAluno = va.idUsuario
              AND m.idTurma IN (SELECT idTurma FROM Turma WHERE idProfessor = v.idAcompanhante)
         LEFT JOIN Turma t ON t.idTurma = m.idTurma
        WHERE v.idAcompanhante = ? AND v.status = 'ACEITO' AND va.ativo = 1
        ORDER BY va.nome, t.idTurma`,
    )
    .all(idProfessor) as unknown as AlunoVinculado[];
  // Um aluno numa turma só (do mesmo professor); se houver duas por engano, fica a primeira.
  const unicos = linhas.filter((l, i) => linhas.findIndex((x) => x.idUsuario === l.idUsuario) === i);
  return idTurma === undefined ? unicos : unicos.filter((a) => a.idTurma === idTurma);
}

/** A turma precisa ser do professor (senão 404). */
function turmaDoProfessor(idTurma: number, idProfessor: number): { idTurma: number; nome: string; periodo: string; ativa: number } {
  const turma = banco()
    .prepare("SELECT idTurma, nome, periodo, ativa FROM Turma WHERE idTurma = ? AND idProfessor = ?")
    .get(idTurma, idProfessor) as { idTurma: number; nome: string; periodo: string; ativa: number } | undefined;
  if (!turma) throw new ErroApi(404, "Não encontramos esta turma.");
  return turma;
}

function exigirAlunoVinculado(idProfessor: number, idAluno: number): void {
  if (!temVinculoAceito(idProfessor, idAluno)) throw new ErroApi(404, "Não encontramos este aluno entre os seus.");
}

/** Resumo de um aluno no período (painel e relatório individual). */
function resumir(respostasNoPeriodo: RespostaLinha[], periodo: Periodo, conteudos: { idAtividade: number; conteudo: string }[]) {
  const diasAtivos = new Set(respostasNoPeriodo.map((r) => diaNoFuso(r.dataHora))).size;
  const taxa = taxaDeAcerto(respostasNoPeriodo);
  const dificuldades = identificarDificuldades(respostasNoPeriodo, conteudos);
  const [pior] = dificuldades.filter((d) => d.erros > 0);
  return {
    resumo: {
      diasAtivos,
      totalAtividades: respostasNoPeriodo.length,
      totalAcertos: respostasNoPeriodo.filter((r) => r.correta).length,
      taxaAcerto: taxa,
      situacao: situacaoDoAluno({ totalAtividades: respostasNoPeriodo.length, taxaAcerto: taxa, diasAtivos, diasNoPeriodo: periodo.dias }),
      maiorDificuldade: pior,
    },
    dificuldades,
  };
}

function nivelCurto(idNivel: number | null) {
  const n = listarNiveis().find((x) => x.idNivel === idNivel);
  return n ? { idNivel: n.idNivel, nome: n.nome, ordem: n.ordem } : undefined;
}

export async function rotasProfessor(app: FastifyInstance): Promise<void> {
  const soProfessor = exigirContaLiberada("PROFESSOR");

  // Professor.VisualizarPainel (RF20).
  app.get<{ Querystring: { inicio?: string; fim?: string } }>(
    "/professor/painel",
    {
      preHandler: soProfessor,
      schema: {
        querystring: queryPeriodo,
        response: {
          200: {
            type: "object",
            properties: {
              periodo: esquemaPeriodo,
              alunos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    aluno: esquemaAlunoCurto,
                    nivel: esquemaNivelCurto,
                    turma: esquemaTurmaCurta,
                    ...esquemaResumo.properties,
                  },
                  required: ["aluno", ...esquemaResumo.required],
                },
              },
            },
            required: ["periodo", "alunos"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const periodo = lerPeriodo(req.query);
      const conteudos = conteudosDasAtividades();
      const alunos = alunosVinculados(req.user.idUsuario).map((a) => {
        const noPeriodo = respostasDoAluno(a.idUsuario).filter((r) => estaNoPeriodo(r.dataHora, periodo.inicio, periodo.fim));
        return {
          aluno: { idUsuario: a.idUsuario, nome: a.nome },
          nivel: nivelCurto(a.idNivelAtual),
          turma: a.idTurma ? { idTurma: a.idTurma, nome: a.nomeTurma! } : undefined,
          ...resumir(noPeriodo, periodo, conteudos).resumo,
        };
      });
      return { periodo, alunos };
    },
  );

  // Professor.VisualizarRelatorioAluno (RF21) + gráfico de evolução + respostas para correção manual.
  app.get<{ Params: { id: number }; Querystring: { inicio?: string; fim?: string } }>(
    "/professor/alunos/:id",
    {
      preHandler: soProfessor,
      schema: {
        params: paramsId,
        querystring: queryPeriodo,
        response: {
          200: {
            type: "object",
            properties: {
              aluno: esquemaAlunoCurto,
              nivel: esquemaNivelCurto,
              turma: esquemaTurmaCurta,
              periodo: esquemaPeriodo,
              resumo: esquemaResumo,
              dificuldades: { type: "array", items: esquemaDificuldade },
              serie: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    dia: { type: "string" },
                    atividades: { type: "integer" },
                    acertos: { type: "integer" },
                    taxaAcerto: { type: ["number", "null"] },
                  },
                  required: ["dia", "atividades", "acertos", "taxaAcerto"],
                },
              },
              historicoNiveis: {
                type: "array",
                items: { type: "object", properties: { ...esquemaNivelCurto.properties, dataMudanca: { type: "string" } }, required: ["idNivel", "nome", "ordem", "dataMudanca"] },
              },
              respostas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    idResposta: { type: "integer" },
                    dataHora: { type: "string" },
                    tipo: { type: "string" },
                    conteudo: { type: "string" },
                    enunciado: { type: "string" },
                    respostaDada: { type: "string" },
                    respostaEsperada: { type: "string" },
                    correta: { type: "boolean" },
                    correcaoProfessor: { type: "string" },
                  },
                  required: ["idResposta", "dataHora", "tipo", "conteudo", "enunciado", "respostaDada", "respostaEsperada", "correta"],
                },
              },
            },
            required: ["aluno", "periodo", "resumo", "dificuldades", "serie", "historicoNiveis", "respostas"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const idAluno = req.params.id;
      exigirAlunoVinculado(req.user.idUsuario, idAluno);
      const periodo = lerPeriodo(req.query);
      const aluno = alunosVinculados(req.user.idUsuario).find((a) => a.idUsuario === idAluno);
      if (!aluno) throw new ErroApi(404, "Não encontramos este aluno entre os seus.");

      const noPeriodo = respostasDoAluno(idAluno).filter((r) => estaNoPeriodo(r.dataHora, periodo.inicio, periodo.fim));
      const { resumo, dificuldades } = resumir(noPeriodo, periodo, conteudosDasAtividades());

      // As mais recentes primeiro. O professor vê a resposta esperada (o aluno nunca vê).
      const ids = noPeriodo.map((r) => r.idResposta).reverse().slice(0, MAXIMO_RESPOSTAS);
      const respostas = ids.length
        ? (banco()
            .prepare(
              `SELECT r.idResposta, r.dataHora, a.tipo, a.conteudo, a.enunciado, r.respostaDada,
                      a.respostaCorreta AS respostaEsperada, r.correta, r.correcaoProfessor
                 FROM Resposta r JOIN Atividade a ON a.idAtividade = r.idAtividade
                WHERE r.idResposta IN (${ids.map(() => "?").join(",")})
                ORDER BY r.dataHora DESC, r.idResposta DESC`,
            )
            .all(...ids) as unknown as { correta: number; correcaoProfessor: string | null }[]).map((r) => ({
            ...r,
            correta: r.correta === 1,
            correcaoProfessor: r.correcaoProfessor ?? undefined,
          }))
        : [];

      return {
        aluno: { idUsuario: aluno.idUsuario, nome: aluno.nome },
        nivel: nivelCurto(aluno.idNivelAtual),
        turma: aluno.idTurma ? { idTurma: aluno.idTurma, nome: aluno.nomeTurma! } : undefined,
        periodo,
        resumo,
        dificuldades,
        serie: serieDiaria(noPeriodo, periodo.inicio, periodo.fim),
        historicoNiveis: historicoDeNiveis(idAluno),
        respostas,
      };
    },
  );

  // Professor.VisualizarRelatorioFrequencia (RF21), da turma ou de todos os alunos vinculados.
  app.get<{ Querystring: { inicio?: string; fim?: string; idTurma?: number } }>(
    "/professor/relatorios/frequencia",
    {
      preHandler: soProfessor,
      schema: {
        querystring: queryRelatorio,
        response: {
          200: {
            type: "object",
            properties: {
              periodo: esquemaPeriodo,
              turma: esquemaTurmaCurta,
              totalAlunos: { type: "integer" },
              alunosAtivos: { type: "integer" },
              totalAtividades: { type: "integer" },
              porAluno: {
                type: "array",
                items: {
                  type: "object",
                  properties: { aluno: esquemaAlunoCurto, diasAtivos: { type: "integer" }, totalAtividades: { type: "integer" } },
                  required: ["aluno", "diasAtivos", "totalAtividades"],
                },
              },
              porDia: {
                type: "array",
                items: {
                  type: "object",
                  properties: { dia: { type: "string" }, atividades: { type: "integer" }, alunos: { type: "integer" } },
                  required: ["dia", "atividades", "alunos"],
                },
              },
            },
            required: ["periodo", "totalAlunos", "alunosAtivos", "totalAtividades", "porAluno", "porDia"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const periodo = lerPeriodo(req.query);
      const turma = req.query.idTurma ? turmaDoProfessor(req.query.idTurma, req.user.idUsuario) : undefined;
      const alunos = alunosVinculados(req.user.idUsuario, turma?.idTurma);

      const alunosPorDia = new Map<string, Set<number>>();
      const atividadesPorDia = new Map<string, number>();
      const porAluno = alunos
        .map((a) => {
          const noPeriodo = respostasDoAluno(a.idUsuario).filter((r) => estaNoPeriodo(r.dataHora, periodo.inicio, periodo.fim));
          const dias = new Set<string>();
          for (const r of noPeriodo) {
            const dia = diaNoFuso(r.dataHora);
            dias.add(dia);
            atividadesPorDia.set(dia, (atividadesPorDia.get(dia) ?? 0) + 1);
            alunosPorDia.set(dia, (alunosPorDia.get(dia) ?? new Set()).add(a.idUsuario));
          }
          return { aluno: { idUsuario: a.idUsuario, nome: a.nome }, diasAtivos: dias.size, totalAtividades: noPeriodo.length };
        })
        .sort((x, y) => x.diasAtivos - y.diasAtivos || x.aluno.nome.localeCompare(y.aluno.nome));

      const porDia = [];
      for (let dia = periodo.inicio; dia <= periodo.fim; dia = somarDias(dia, 1)) {
        porDia.push({ dia, atividades: atividadesPorDia.get(dia) ?? 0, alunos: alunosPorDia.get(dia)?.size ?? 0 });
      }
      return {
        periodo,
        turma: turma ? { idTurma: turma.idTurma, nome: turma.nome } : undefined,
        totalAlunos: alunos.length,
        alunosAtivos: porAluno.filter((p) => p.diasAtivos > 0).length,
        totalAtividades: porAluno.reduce((soma, p) => soma + p.totalAtividades, 0),
        porAluno,
        porDia,
      };
    },
  );

  // Professor.VisualizarDificuldades (RF17, RF21): conteúdos com mais erros na turma, pior primeiro.
  app.get<{ Querystring: { inicio?: string; fim?: string; idTurma?: number } }>(
    "/professor/relatorios/dificuldades",
    {
      preHandler: soProfessor,
      schema: {
        querystring: queryRelatorio,
        response: {
          200: {
            type: "object",
            properties: {
              periodo: esquemaPeriodo,
              turma: esquemaTurmaCurta,
              totalAlunos: { type: "integer" },
              conteudos: {
                type: "array",
                items: {
                  type: "object",
                  properties: { ...esquemaDificuldade.properties, alunosComErro: { type: "integer" } },
                  required: [...esquemaDificuldade.required, "alunosComErro"],
                },
              },
            },
            required: ["periodo", "totalAlunos", "conteudos"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const periodo = lerPeriodo(req.query);
      const turma = req.query.idTurma ? turmaDoProfessor(req.query.idTurma, req.user.idUsuario) : undefined;
      const alunos = alunosVinculados(req.user.idUsuario, turma?.idTurma);
      const conteudos = conteudosDasAtividades();

      const todas: RespostaLinha[] = [];
      const alunosComErro = new Map<string, number>();
      for (const a of alunos) {
        const noPeriodo = respostasDoAluno(a.idUsuario).filter((r) => estaNoPeriodo(r.dataHora, periodo.inicio, periodo.fim));
        todas.push(...noPeriodo);
        for (const d of identificarDificuldades(noPeriodo, conteudos)) {
          if (d.erros > 0) alunosComErro.set(d.conteudo, (alunosComErro.get(d.conteudo) ?? 0) + 1);
        }
      }
      return {
        periodo,
        turma: turma ? { idTurma: turma.idTurma, nome: turma.nome } : undefined,
        totalAlunos: alunos.length,
        conteudos: identificarDificuldades(todas, conteudos).map((d) => ({ ...d, alunosComErro: alunosComErro.get(d.conteudo) ?? 0 })),
      };
    },
  );

  // ---------- Turmas (APF 20–24): só as do próprio professor, só alunos com vínculo ACEITO ----------

  app.get(
    "/professor/turmas",
    {
      preHandler: soProfessor,
      schema: {
        response: {
          200: {
            type: "object",
            properties: { turmas: { type: "array", items: esquemaTurma }, semTurma: { type: "array", items: esquemaAlunoCurto } },
            required: ["turmas", "semTurma"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const linhas = banco()
        .prepare("SELECT idTurma, nome, periodo, ativa FROM Turma WHERE idProfessor = ? ORDER BY ativa DESC, nome")
        .all(req.user.idUsuario) as unknown as { idTurma: number; nome: string; periodo: string; ativa: number }[];
      const alunos = alunosVinculados(req.user.idUsuario);
      return {
        turmas: linhas.map((t) => ({
          ...t,
          ativa: t.ativa === 1,
          alunos: alunos.filter((a) => a.idTurma === t.idTurma).map((a) => ({ idUsuario: a.idUsuario, nome: a.nome })),
        })),
        semTurma: alunos.filter((a) => a.idTurma === null).map((a) => ({ idUsuario: a.idUsuario, nome: a.nome })),
      };
    },
  );

  app.post<{ Body: { nome: string; periodo: string } }>(
    "/professor/turmas",
    {
      preHandler: soProfessor,
      schema: {
        body: { type: "object", properties: { nome: NOME_TURMA, periodo: PERIODO_TURMA }, required: ["nome", "periodo"] },
        response: { 201: { type: "object", properties: { turma: esquemaTurma }, required: ["turma"] }, ...errosComuns },
      },
    },
    async (req, resposta) => {
      const nome = req.body.nome.trim().replace(/\s+/g, " ");
      const periodo = req.body.periodo.trim();
      const r = banco()
        .prepare("INSERT INTO Turma (nome, periodo, ativa, idProfessor) VALUES (?, ?, 1, ?)")
        .run(nome, periodo, req.user.idUsuario);
      resposta.code(201);
      return { turma: { idTurma: Number(r.lastInsertRowid), nome, periodo, ativa: true, alunos: [] } };
    },
  );

  app.patch<{ Params: { id: number }; Body: { nome?: string; periodo?: string; ativa?: boolean } }>(
    "/professor/turmas/:id",
    {
      preHandler: soProfessor,
      schema: {
        params: paramsId,
        body: {
          type: "object",
          properties: { nome: NOME_TURMA, periodo: PERIODO_TURMA, ativa: { type: "boolean" } },
          minProperties: 1,
        },
        response: { 200: { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] }, ...errosComuns },
      },
    },
    async (req) => {
      const atual = turmaDoProfessor(req.params.id, req.user.idUsuario);
      banco()
        .prepare("UPDATE Turma SET nome = ?, periodo = ?, ativa = ? WHERE idTurma = ?")
        .run(
          req.body.nome?.trim().replace(/\s+/g, " ") ?? atual.nome,
          req.body.periodo?.trim() ?? atual.periodo,
          req.body.ativa === undefined ? atual.ativa : req.body.ativa ? 1 : 0,
          atual.idTurma,
        );
      return { mensagem: "Turma atualizada." };
    },
  );

  app.delete<{ Params: { id: number } }>(
    "/professor/turmas/:id",
    {
      preHandler: soProfessor,
      schema: {
        params: paramsId,
        response: { 200: { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] }, ...errosComuns },
      },
    },
    async (req) => {
      const turma = turmaDoProfessor(req.params.id, req.user.idUsuario);
      // Matricula sai junto (ON DELETE CASCADE); respostas e vínculos dos alunos continuam.
      banco().prepare("DELETE FROM Turma WHERE idTurma = ?").run(turma.idTurma);
      return { mensagem: "Turma apagada. Os alunos continuam com você, sem turma." };
    },
  );

  // Põe, move ou tira (idTurma: null) o aluno das turmas do professor. Um aluno fica em uma turma
  // de cada professor; pôr numa turma tira das outras turmas DESTE professor.
  app.put<{ Params: { id: number }; Body: { idTurma: number | null } }>(
    "/professor/alunos/:id/turma",
    {
      preHandler: soProfessor,
      schema: {
        params: paramsId,
        body: {
          type: "object",
          properties: { idTurma: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] } },
          required: ["idTurma"],
        },
        response: { 200: { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] }, ...errosComuns },
      },
    },
    async (req) => {
      const idProfessor = req.user.idUsuario;
      const idAluno = req.params.id;
      exigirAlunoVinculado(idProfessor, idAluno);
      const turma = req.body.idTurma === null ? undefined : turmaDoProfessor(req.body.idTurma, idProfessor);
      if (turma && turma.ativa !== 1) throw new ErroApi(409, "Esta turma está encerrada. Escolha outra turma.");

      emTransacao(() => {
        const db = banco();
        db.prepare("DELETE FROM Matricula WHERE idAluno = ? AND idTurma IN (SELECT idTurma FROM Turma WHERE idProfessor = ?)").run(
          idAluno,
          idProfessor,
        );
        if (turma) {
          db.prepare("INSERT INTO Matricula (idAluno, idTurma, dataVinculo) VALUES (?, ?, ?)").run(
            idAluno,
            turma.idTurma,
            new Date().toISOString(),
          );
        }
      });
      return { mensagem: turma ? `Aluno colocado na turma ${turma.nome}.` : "Aluno tirado da turma." };
    },
  );

  // Resposta.EditarCorrecao (APF 35): o professor muda o "certo/errado" de uma resposta de um aluno
  // dele. Grava a observação em correcaoProfessor e recalcula o DesempenhoConteudo. NÃO mexe no
  // nível (HistoricoNivel): a subida de etapa já aconteceu ou não; a correção vale para as métricas.
  app.patch<{ Params: { id: number }; Body: { correta: boolean; observacao?: string } }>(
    "/respostas/:id/correcao",
    {
      preHandler: soProfessor,
      schema: {
        params: paramsId,
        body: {
          type: "object",
          properties: { correta: { type: "boolean" }, observacao: { type: "string", maxLength: 200 } },
          required: ["correta"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              resposta: {
                type: "object",
                properties: { idResposta: { type: "integer" }, correta: { type: "boolean" }, correcaoProfessor: { type: "string" } },
                required: ["idResposta", "correta", "correcaoProfessor"],
              },
            },
            required: ["resposta"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const linha = banco()
        .prepare(
          `SELECT r.idResposta, r.idAluno, a.idNivel, a.conteudo
             FROM Resposta r JOIN Atividade a ON a.idAtividade = r.idAtividade WHERE r.idResposta = ?`,
        )
        .get(req.params.id) as { idResposta: number; idAluno: number; idNivel: number; conteudo: string } | undefined;
      // Resposta de aluno que não é dele = mesma resposta de "não existe".
      if (!linha || !temVinculoAceito(req.user.idUsuario, linha.idAluno)) {
        throw new ErroApi(404, "Não encontramos esta resposta.");
      }
      const observacao = req.body.observacao?.trim();
      const correcao = observacao || (req.body.correta ? "O professor considerou certa." : "O professor considerou errada.");
      const agora = new Date().toISOString();

      emTransacao(() => {
        banco()
          .prepare("UPDATE Resposta SET correta = ?, correcaoProfessor = ? WHERE idResposta = ?")
          .run(req.body.correta ? 1 : 0, correcao, linha.idResposta);
        recalcularDesempenhoConteudo(linha.idAluno, linha.idNivel, linha.conteudo, agora);
      });
      req.log.info({ idResposta: linha.idResposta, correta: req.body.correta }, "correção manual");
      return { resposta: { idResposta: linha.idResposta, correta: req.body.correta, correcaoProfessor: correcao } };
    },
  );
}
