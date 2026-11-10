// Respostas, nivelamento e progresso do aluno (passo 5; RF03, RF12–RF19, RF22).
// Só o perfil ALUNO, e sempre sobre ele mesmo (o id vem do token, nunca do corpo):
//   POST /respostas               { idAtividade, respostaDada, tempoRespostaSeg }
//                                 → { correta, subiuDeNivel, nivelAtual }
//   POST /nivelamento/concluir    { respostas: [{ idAtividade, respostaDada, tempoRespostaSeg }] } → { nivel }
//   GET  /alunos/eu/progresso     ?anterior=<idAtividade> → nível, trilha, totais, dificuldades, próxima atividade
//
// A correção e as decisões de nível acontecem AQUI (o app não tem o gabarito). Regras em progressao.ts.
import type { FastifyInstance } from "fastify";
import { exigirLogin } from "../autenticacao.ts";
import { corrigirAutomaticamente } from "../correcao.ts";
import {
  buscarAtividadeAtiva,
  conteudosDasAtividades,
  emTransacao,
  gravarHistoricoNivel,
  gravarNivelInicial,
  gravarResposta,
  idsAtividadesDoNivel,
  listarNiveis,
  niveisDoAluno,
  perguntasDoNivelamento,
  respostasDoAluno,
} from "../desempenho.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import {
  definirNivelInicial,
  deveAvancar,
  escolherProximaAtividade,
  identificarDificuldades,
  statusDaTrilha,
  taxaDeAcerto,
} from "../progressao.ts";

/** Quantos conteúdos aparecem em "Vale a pena treinar". */
const MAXIMO_DIFICULDADES = 3;

const esquemaNivel = {
  type: "object",
  properties: {
    idNivel: { type: "integer" },
    nome: { type: "string" },
    descricao: { type: "string" },
    ordem: { type: "integer" },
    criterioAcerto: { type: "number" },
  },
  required: ["idNivel", "nome", "descricao", "ordem", "criterioAcerto"],
} as const;

const esquemaRespostaDada = {
  type: "object",
  properties: {
    idAtividade: { type: "integer", minimum: 1 },
    respostaDada: { type: "string", minLength: 1, maxLength: 200 },
    // Segundos até responder; limite de 1 dia só para recusar lixo.
    tempoRespostaSeg: { type: "integer", minimum: 0, maximum: 86400, default: 0 },
  },
  required: ["idAtividade", "respostaDada"],
} as const;

interface RespostaDada {
  idAtividade: number;
  respostaDada: string;
  tempoRespostaSeg: number;
}

const errosComuns = { 400: esquemaErro, 401: esquemaErro, 403: esquemaErro, 404: esquemaErro, 409: esquemaErro } as const;

export async function rotasProgresso(app: FastifyInstance): Promise<void> {
  // Aluno.IncluirResposta + Resposta.CorrigirAutomaticamente + DesempenhoConteudo.EditarProgressao (RF12–RF17).
  app.post<{ Body: RespostaDada }>(
    "/respostas",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: {
        body: esquemaRespostaDada,
        response: {
          201: {
            type: "object",
            properties: { correta: { type: "boolean" }, subiuDeNivel: { type: "boolean" }, nivelAtual: esquemaNivel },
            required: ["correta", "subiuDeNivel", "nivelAtual"],
          },
          ...errosComuns,
        },
      },
    },
    async (req, resposta) => {
      const idAluno = req.user.idUsuario;
      const { idNivelAtual } = niveisDoAluno(idAluno);
      if (idNivelAtual === undefined) throw new ErroApi(409, "Faça primeiro as perguntas do começo.");
      const atividade = buscarAtividadeAtiva(req.body.idAtividade);
      if (!atividade) throw new ErroApi(404, "Não encontramos esta atividade.");

      const trilha = listarNiveis();
      const correta = corrigirAutomaticamente(atividade.respostaCorreta, req.body.respostaDada);
      const agora = new Date().toISOString();

      const nivelFinal = emTransacao(() => {
        gravarResposta({ idAluno, atividade, respostaDada: req.body.respostaDada, correta, tempoRespostaSeg: req.body.tempoRespostaSeg, dataHora: agora });

        // Progressão (RF16): só depois de um ACERTO numa atividade da etapa atual
        // (subir logo depois de um erro confundiria o aluno). Na última etapa, não há para onde subir.
        const atual = trilha.find((n) => n.idNivel === idNivelAtual);
        if (!correta || !atual || atividade.idNivel !== atual.idNivel) return atual;
        const proximo = trilha.find((n) => n.ordem > atual.ordem);
        if (!proximo || !deveAvancar(atual, respostasDoAluno(idAluno, atual.idNivel))) return atual;
        gravarHistoricoNivel(idAluno, proximo.idNivel, agora);
        return proximo;
      });

      if (!nivelFinal) throw new ErroApi(409, "Sua etapa não foi encontrada. Fale com seu professor.");
      const subiuDeNivel = nivelFinal.idNivel !== idNivelAtual;
      req.log.info({ idAluno, idAtividade: atividade.idAtividade, correta, subiuDeNivel }, "resposta gravada");
      resposta.code(201);
      return { correta, subiuDeNivel, nivelAtual: nivelFinal };
    },
  );

  // Aluno.RealizarNivelamento (RF03): o app manda as respostas na ordem em que o aluno fez;
  // o servidor corrige de novo (não confia no app), grava tudo e define o nível inicial.
  app.post<{ Body: { respostas: RespostaDada[] } }>(
    "/nivelamento/concluir",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: {
        body: {
          type: "object",
          properties: { respostas: { type: "array", items: esquemaRespostaDada, maxItems: 50 } },
          required: ["respostas"],
        },
        response: {
          201: { type: "object", properties: { nivel: esquemaNivel }, required: ["nivel"] },
          ...errosComuns,
        },
      },
    },
    async (req, resposta) => {
      const idAluno = req.user.idUsuario;
      if (niveisDoAluno(idAluno).idNivelInicial !== undefined) {
        throw new ErroApi(409, "Você já fez as perguntas do começo.");
      }
      const trilha = listarNiveis();
      if (trilha.length === 0) throw new ErroApi(409, "Ainda não há etapas cadastradas. Fale com seu professor.");

      // As respostas precisam ser as primeiras perguntas do nivelamento, na ordem, sem pular
      // (senão daria para responder só a mais difícil e começar no fim da trilha).
      const perguntas = perguntasDoNivelamento();
      const enviadas = req.body.respostas;
      const respondidas = perguntas.slice(0, enviadas.length);
      if (enviadas.length > perguntas.length || enviadas.some((r, i) => r.idAtividade !== respondidas[i].idAtividade)) {
        throw new ErroApi(400, "As respostas não batem com as perguntas. Comece as perguntas de novo.");
      }

      const acertos = enviadas.map((r, i) => corrigirAutomaticamente(respondidas[i].respostaCorreta, r.respostaDada));
      const nivel = definirNivelInicial(respondidas, acertos, trilha);
      const agora = new Date().toISOString();

      emTransacao(() => {
        enviadas.forEach((r, i) =>
          gravarResposta({
            idAluno,
            atividade: respondidas[i],
            respostaDada: r.respostaDada,
            correta: acertos[i],
            tempoRespostaSeg: r.tempoRespostaSeg,
            dataHora: agora,
          }),
        );
        gravarNivelInicial(idAluno, nivel.idNivel, agora);
        gravarHistoricoNivel(idAluno, nivel.idNivel, agora);
      });

      req.log.info({ idAluno, idNivel: nivel.idNivel, respostas: enviadas.length }, "nivelamento concluído");
      resposta.code(201);
      return { nivel };
    },
  );

  // Aluno.VisualizarProgresso / Nivel.ListarTrilha (RF18, RF19, RF22).
  // `anterior`: atividade que o aluno acabou de fazer (a próxima não repete ela, se houver outra).
  app.get<{ Querystring: { anterior?: number } }>(
    "/alunos/eu/progresso",
    {
      preHandler: exigirLogin("ALUNO"),
      schema: {
        querystring: {
          type: "object",
          properties: { anterior: { type: "integer", minimum: 1 } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              nivelAtual: esquemaNivel,
              trilha: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ...esquemaNivel.properties,
                    status: { type: "string", enum: ["CONCLUIDA", "ATUAL", "BLOQUEADA"] },
                  },
                  required: [...esquemaNivel.required, "status"],
                },
              },
              totalAtividades: { type: "integer" },
              totalAcertos: { type: "integer" },
              taxaAcerto: { type: "number" },
              dificuldades: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    conteudo: { type: "string" },
                    tentativas: { type: "integer" },
                    erros: { type: "integer" },
                    taxaAcerto: { type: "number" },
                  },
                  required: ["conteudo", "tentativas", "erros", "taxaAcerto"],
                },
              },
              proximaAtividade: { type: "integer" },
            },
            required: ["trilha", "totalAtividades", "totalAcertos", "taxaAcerto", "dificuldades"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const idAluno = req.user.idUsuario;
      const { idNivelAtual } = niveisDoAluno(idAluno);
      const trilha = listarNiveis();
      const nivelAtual = trilha.find((n) => n.idNivel === idNivelAtual);
      const respostas = respostasDoAluno(idAluno);

      const dificuldades = identificarDificuldades(respostas, conteudosDasAtividades())
        .filter((d) => d.erros > 0)
        .slice(0, MAXIMO_DIFICULDADES);

      // Sem nivelamento ainda, não há próxima atividade (o app leva às perguntas do começo).
      const proximaAtividade = nivelAtual
        ? escolherProximaAtividade(idsAtividadesDoNivel(nivelAtual.idNivel), respostas, req.query.anterior)
        : undefined;

      return {
        nivelAtual,
        trilha: statusDaTrilha(trilha, idNivelAtual),
        totalAtividades: respostas.length,
        totalAcertos: respostas.filter((r) => r.correta).length,
        taxaAcerto: taxaDeAcerto(respostas),
        dificuldades,
        proximaAtividade,
      };
    },
  );
}
