// Trilha de níveis, atividades e nivelamento (RF03–RF11; APF Nivel.ListarTrilha,
// Atividade.Listar, Atividade.Visualizar). Todas exigem login (qualquer perfil).
//   GET  /niveis                    trilha ordenada
//   GET  /niveis/:id/atividades     atividades ATIVAS do nível, com alternativas ordenadas
//   GET  /atividades/:id            uma atividade ATIVA
//   GET  /nivelamento               perguntas do nivelamento (uma ou mais por nível, em ordem crescente)
//   POST /atividades/:id/corrigir   { respostaDada } → { correta }   SÓ perguntas do nivelamento
//
// O GABARITO NUNCA SAI DAQUI: nem Atividade.respostaCorreta nem Alternativa.correta são lidos
// nas consultas de listagem, e os esquemas de resposta também não os têm (dupla proteção).
// As respostas do dia a dia vão para POST /respostas (rotas/progresso.ts), que corrige E grava.
// /atividades/:id/corrigir ficou só para o nivelamento, que precisa saber na hora se o aluno
// acertou para parar no primeiro erro; quem grava e decide o nível é POST /nivelamento/concluir.
import type { FastifyInstance } from "fastify";
import { exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { corrigirAutomaticamente } from "../correcao.ts";
import { ErroApi, esquemaErro } from "../erros.ts";

const TIPOS = ["LETRA", "SILABA", "PALAVRA", "FRASE", "ESCRITA", "INTERPRETACAO"] as const;

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

/** Alternativa como o aluno vê: SEM o campo `correta`. */
const esquemaAlternativa = {
  type: "object",
  properties: {
    idAlternativa: { type: "integer" },
    texto: { type: "string" },
    ordem: { type: "integer" },
    urlImagem: { type: "string" },
    ilustracao: { type: "string" },
  },
  required: ["idAlternativa", "texto", "ordem"],
} as const;

/** Atividade como o aluno vê: SEM `respostaCorreta`. */
const esquemaAtividade = {
  type: "object",
  properties: {
    idAtividade: { type: "integer" },
    idNivel: { type: "integer" },
    tipo: { type: "string", enum: TIPOS },
    conteudo: { type: "string" },
    enunciado: { type: "string" },
    textoApoio: { type: "string" },
    urlImagem: { type: "string" },
    alternativas: { type: "array", items: esquemaAlternativa },
  },
  required: ["idAtividade", "idNivel", "tipo", "conteudo", "enunciado", "alternativas"],
} as const;

const paramsId = {
  type: "object",
  properties: { id: { type: "integer", minimum: 1 } },
  required: ["id"],
} as const;

const errosComuns = { 400: esquemaErro, 401: esquemaErro, 403: esquemaErro, 404: esquemaErro } as const;

type Linha = Record<string, unknown>;

/** O SQLite devolve NULL; na API campo vazio simplesmente não aparece. */
function semNulos<T extends Linha>(linha: T): T {
  return Object.fromEntries(Object.entries(linha).filter(([, v]) => v !== null)) as T;
}

// Colunas públicas (sem gabarito). Mantenha `respostaCorreta` e `correta` FORA destas listas.
const COLUNAS_ATIVIDADE = "a.idAtividade, a.idNivel, a.tipo, a.conteudo, a.enunciado, a.textoApoio, a.urlImagem";
const COLUNAS_ALTERNATIVA = "idAlternativa, idAtividade, texto, ordem, urlImagem, ilustracao";

/** Junta as alternativas (já ordenadas) às atividades, numa consulta só. */
function comAlternativas(atividades: Linha[]): Linha[] {
  if (atividades.length === 0) return [];
  const ids = atividades.map((a) => a.idAtividade as number);
  const alternativas = banco()
    .prepare(
      `SELECT ${COLUNAS_ALTERNATIVA} FROM Alternativa
        WHERE idAtividade IN (${ids.map(() => "?").join(",")})
        ORDER BY idAtividade, ordem`,
    )
    .all(...ids) as Linha[];
  return atividades.map((a) => ({
    ...semNulos(a),
    alternativas: alternativas
      .filter((alt) => alt.idAtividade === a.idAtividade)
      .map(({ idAtividade: _idAtividade, ...alt }) => semNulos(alt)),
  }));
}

export async function rotasAtividades(app: FastifyInstance): Promise<void> {
  app.get(
    "/niveis",
    {
      preHandler: exigirLogin(),
      schema: {
        response: {
          200: { type: "object", properties: { niveis: { type: "array", items: esquemaNivel } }, required: ["niveis"] },
          ...errosComuns,
        },
      },
    },
    async () => {
      const niveis = banco()
        .prepare("SELECT idNivel, nome, descricao, ordem, criterioAcerto FROM Nivel ORDER BY ordem")
        .all();
      return { niveis };
    },
  );

  app.get<{ Params: { id: number } }>(
    "/niveis/:id/atividades",
    {
      preHandler: exigirLogin(),
      schema: {
        params: paramsId,
        response: {
          200: {
            type: "object",
            properties: { atividades: { type: "array", items: esquemaAtividade } },
            required: ["atividades"],
          },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const db = banco();
      if (!db.prepare("SELECT 1 FROM Nivel WHERE idNivel = ?").get(req.params.id)) {
        throw new ErroApi(404, "Não encontramos esta etapa.");
      }
      const atividades = db
        .prepare(
          `SELECT ${COLUNAS_ATIVIDADE} FROM Atividade a
            WHERE a.idNivel = ? AND a.status = 'ATIVA'
            ORDER BY a.idAtividade`,
        )
        .all(req.params.id) as Linha[];
      return { atividades: comAlternativas(atividades) };
    },
  );

  app.get<{ Params: { id: number } }>(
    "/atividades/:id",
    {
      preHandler: exigirLogin(),
      schema: {
        params: paramsId,
        response: {
          200: { type: "object", properties: { atividade: esquemaAtividade }, required: ["atividade"] },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const atividade = banco()
        .prepare(`SELECT ${COLUNAS_ATIVIDADE} FROM Atividade a WHERE a.idAtividade = ? AND a.status = 'ATIVA'`)
        .get(req.params.id) as Linha | undefined;
      if (!atividade) throw new ErroApi(404, "Não encontramos esta atividade.");
      return { atividade: comAlternativas([atividade])[0] };
    },
  );

  app.get(
    "/nivelamento",
    {
      preHandler: exigirLogin(),
      schema: {
        response: {
          200: {
            type: "object",
            properties: { perguntas: { type: "array", items: esquemaAtividade } },
            required: ["perguntas"],
          },
          ...errosComuns,
        },
      },
    },
    async () => {
      // Em ordem crescente de nível; dentro do mesmo nível, pela ordem do nivelamento.
      const perguntas = banco()
        .prepare(
          `SELECT ${COLUNAS_ATIVIDADE} FROM Atividade a
             JOIN Nivel n ON n.idNivel = a.idNivel
            WHERE a.ordemNivelamento IS NOT NULL AND a.status = 'ATIVA'
            ORDER BY n.ordem, a.ordemNivelamento`,
        )
        .all() as Linha[];
      return { perguntas: comAlternativas(perguntas) };
    },
  );

  app.post<{ Params: { id: number }; Body: { respostaDada: string } }>(
    "/atividades/:id/corrigir",
    {
      preHandler: exigirLogin(),
      schema: {
        params: paramsId,
        body: {
          type: "object",
          properties: { respostaDada: { type: "string", minLength: 1, maxLength: 200 } },
          required: ["respostaDada"],
        },
        response: {
          200: { type: "object", properties: { correta: { type: "boolean" } }, required: ["correta"] },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const atividade = banco()
        .prepare(
          "SELECT respostaCorreta FROM Atividade WHERE idAtividade = ? AND status = 'ATIVA' AND ordemNivelamento IS NOT NULL",
        )
        .get(req.params.id) as { respostaCorreta: string } | undefined;
      if (!atividade) throw new ErroApi(404, "Não encontramos esta pergunta.");
      return { correta: corrigirAutomaticamente(atividade.respostaCorreta, req.body.respostaDada) };
    },
  );
}
