// Cadastro de atividades e de níveis (passo 9; APF 25–31: IncluirAtividade, EditarAtividade,
// ExcluirAtividade, ListarAtividades, IncluirNivel, EditarNivel).
//
// ATIVIDADES: administrador e PROFESSOR com a conta liberada (aprovado pela instituição).
//   GET    /gestao/niveis                       etapas com o total de atividades ativas e inativas
//   GET    /gestao/atividades?idNivel&status&minhas   lista COM o gabarito (só para quem cadastra)
//   GET    /gestao/atividades/:id
//   POST   /gestao/atividades                   inclui (o criador é quem está logado)
//   PUT    /gestao/atividades/:id               edita (troca tudo, inclusive as alternativas)
//   DELETE /gestao/atividades/:id               "exclui" = INATIVA (nunca apaga: há respostas ligadas)
//   PATCH  /gestao/atividades/:id/status        { status: ATIVA | INATIVA } (reativar)
// O professor vê todas, mas só edita/inativa as que ELE criou (Atividade.idCriador, migração 006).
// As do seed não têm criador: só o administrador mexe. Outro dono → 403.
//
// NÍVEIS: só o administrador.
//   POST  /gestao/niveis          { nome, descricao, ordem, criterioAcerto }
//   PATCH /gestao/niveis/:id      os mesmos campos, todos opcionais
//
// O gabarito (respostaCorreta, Alternativa.correta) só sai por estas rotas, que exigem
// administrador ou professor. As rotas do aluno (rotas/atividades.ts) continuam sem ele.
// A atividade nova entra na trilha como as demais (ATIVA) e vale para todos os alunos
// (decisão pendente da equipe: ver docs/PROXIMOS_PASSOS.md, passo 9).
import type { FastifyInstance } from "fastify";
import { exigirContaLiberada, exigirLogin, type DadosToken } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { emTransacao } from "../desempenho.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { normalizarResposta } from "../correcao.ts";
import { TIPOS_ATIVIDADE, validarAtividade, type AtividadeEnviada } from "../validarAtividade.ts";

const quemCadastra = exigirContaLiberada("ADMINISTRADOR", "PROFESSOR");
const soAdministrador = exigirLogin("ADMINISTRADOR");

const errosComuns = {
  400: esquemaErro,
  401: esquemaErro,
  403: esquemaErro,
  404: esquemaErro,
  409: esquemaErro,
} as const;

const paramsId = {
  type: "object",
  properties: { id: { type: "integer", minimum: 1 } },
  required: ["id"],
} as const;

const respostaMensagem = {
  200: { type: "object", properties: { mensagem: { type: "string" } }, required: ["mensagem"] },
  ...errosComuns,
} as const;

// ---------- Níveis ----------

const esquemaNivel = {
  type: "object",
  properties: {
    idNivel: { type: "integer" },
    nome: { type: "string" },
    descricao: { type: "string" },
    ordem: { type: "integer" },
    criterioAcerto: { type: "number" },
    totalAtivas: { type: "integer" },
    totalInativas: { type: "integer" },
  },
  required: ["idNivel", "nome", "descricao", "ordem", "criterioAcerto", "totalAtivas", "totalInativas"],
} as const;

const camposNivel = {
  nome: { type: "string", minLength: 2, maxLength: 60 },
  descricao: { type: "string", minLength: 2, maxLength: 200 },
  ordem: { type: "integer", minimum: 1, maximum: 99 },
  criterioAcerto: { type: "number", minimum: 0.1, maximum: 1 },
} as const;

interface DadosNivel {
  nome: string;
  descricao: string;
  ordem: number;
  criterioAcerto: number;
}

function listarNiveisComTotais(idNivel?: number) {
  return banco()
    .prepare(
      `SELECT n.idNivel, n.nome, n.descricao, n.ordem, n.criterioAcerto,
              COALESCE(SUM(a.status = 'ATIVA'), 0) AS totalAtivas,
              COALESCE(SUM(a.status = 'INATIVA'), 0) AS totalInativas
         FROM Nivel n LEFT JOIN Atividade a ON a.idNivel = n.idNivel
        ${idNivel === undefined ? "" : "WHERE n.idNivel = ?"}
        GROUP BY n.idNivel
        ORDER BY n.ordem`,
    )
    .all(...(idNivel === undefined ? [] : [idNivel]));
}

function conferirOrdemLivre(ordem: number, idNivelAtual?: number): void {
  const outra = banco().prepare("SELECT idNivel, nome FROM Nivel WHERE ordem = ?").get(ordem) as
    | { idNivel: number; nome: string }
    | undefined;
  if (outra && outra.idNivel !== idNivelAtual) {
    throw new ErroApi(409, `A etapa ${outra.nome} já usa a ordem ${ordem}. Escolha outro número.`);
  }
}

// ---------- Atividades ----------

const esquemaAlternativaGestao = {
  type: "object",
  properties: {
    idAlternativa: { type: "integer" },
    texto: { type: "string" },
    ordem: { type: "integer" },
    correta: { type: "boolean" },
    urlImagem: { type: "string" },
    ilustracao: { type: "string" },
  },
  required: ["idAlternativa", "texto", "ordem", "correta"],
} as const;

const esquemaAtividadeGestao = {
  type: "object",
  properties: {
    idAtividade: { type: "integer" },
    idNivel: { type: "integer" },
    tipo: { type: "string" },
    conteudo: { type: "string" },
    enunciado: { type: "string" },
    textoApoio: { type: "string" },
    urlImagem: { type: "string" },
    respostaCorreta: { type: "string" },
    status: { type: "string" },
    ordemNivelamento: { type: "integer" },
    idCriador: { type: "integer" },
    nomeCriador: { type: "string" },
    podeEditar: { type: "boolean" },
    criadoEm: { type: "string" },
    atualizadoEm: { type: "string" },
    alternativas: { type: "array", items: esquemaAlternativaGestao },
  },
  required: ["idAtividade", "idNivel", "tipo", "conteudo", "enunciado", "respostaCorreta", "status", "podeEditar", "alternativas"],
} as const;

const corpoAtividade = {
  type: "object",
  properties: {
    idNivel: { type: "integer", minimum: 1 },
    tipo: { type: "string", enum: TIPOS_ATIVIDADE },
    conteudo: { type: "string", minLength: 1, maxLength: 60 },
    enunciado: { type: "string", minLength: 1, maxLength: 300 },
    textoApoio: { type: "string", maxLength: 600 },
    respostaCorreta: { type: "string", maxLength: 100 },
    alternativas: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          texto: { type: "string", maxLength: 40 },
          correta: { type: "boolean" },
          ilustracao: { type: "string", maxLength: 60, pattern: "^[a-z0-9-]*$" },
        },
        required: ["texto"],
      },
    },
  },
  required: ["idNivel", "tipo", "conteudo", "enunciado"],
} as const;

type CorpoAtividade = AtividadeEnviada & { idNivel: number };

interface LinhaAtividade {
  idAtividade: number;
  idNivel: number;
  status: "ATIVA" | "INATIVA";
  ordemNivelamento: number | null;
  idCriador: number | null;
}

type Linha = Record<string, unknown>;

const semNulos = <T extends Linha>(linha: T): T =>
  Object.fromEntries(Object.entries(linha).filter(([, v]) => v !== null)) as T;

const podeEditar = (usuario: DadosToken, idCriador: number | null): boolean =>
  usuario.perfil === "ADMINISTRADOR" || (idCriador !== null && idCriador === usuario.idUsuario);

/** Atividades (com gabarito e alternativas) no formato da gestão. */
function montarAtividades(usuario: DadosToken, filtro: { where: string; params: (string | number)[] }): Linha[] {
  const db = banco();
  const atividades = db
    .prepare(
      `SELECT a.idAtividade, a.idNivel, a.tipo, a.conteudo, a.enunciado, a.textoApoio, a.urlImagem, a.respostaCorreta,
              a.status, a.ordemNivelamento, a.idCriador, u.nome AS nomeCriador, a.criadoEm, a.atualizadoEm
         FROM Atividade a
         JOIN Nivel n ON n.idNivel = a.idNivel
         LEFT JOIN Usuario u ON u.idUsuario = a.idCriador
        ${filtro.where}
        ORDER BY n.ordem, a.status, a.idAtividade`,
    )
    .all(...filtro.params) as Linha[];
  if (atividades.length === 0) return [];

  const ids = atividades.map((a) => a.idAtividade as number);
  const alternativas = db
    .prepare(
      `SELECT idAlternativa, idAtividade, texto, ordem, correta, urlImagem, ilustracao FROM Alternativa
        WHERE idAtividade IN (${ids.map(() => "?").join(",")}) ORDER BY idAtividade, ordem`,
    )
    .all(...ids) as Linha[];

  return atividades.map((a) => ({
    ...semNulos(a),
    podeEditar: podeEditar(usuario, a.idCriador as number | null),
    alternativas: alternativas
      .filter((alt) => alt.idAtividade === a.idAtividade)
      .map(({ idAtividade: _id, correta, ...alt }) => ({ ...semNulos(alt), correta: correta === 1 })),
  }));
}

function buscarAtividade(usuario: DadosToken, idAtividade: number): Linha {
  const [atividade] = montarAtividades(usuario, { where: "WHERE a.idAtividade = ?", params: [idAtividade] });
  if (!atividade) throw new ErroApi(404, "Não encontramos esta atividade.");
  return atividade;
}

/** Busca a atividade e confere se quem está logado pode mexer nela (404 / 403). */
function atividadeQuePodeMudar(usuario: DadosToken, idAtividade: number): LinhaAtividade {
  const linha = banco()
    .prepare("SELECT idAtividade, idNivel, status, ordemNivelamento, idCriador FROM Atividade WHERE idAtividade = ?")
    .get(idAtividade) as LinhaAtividade | undefined;
  if (!linha) throw new ErroApi(404, "Não encontramos esta atividade.");
  if (!podeEditar(usuario, linha.idCriador)) {
    throw new ErroApi(403, "Você só pode mudar as atividades que você criou.");
  }
  return linha;
}

function conferirNivelExiste(idNivel: number): void {
  if (!banco().prepare("SELECT 1 FROM Nivel WHERE idNivel = ?").get(idNivel)) {
    throw new ErroApi(400, "Escolha uma etapa que existe.");
  }
}

/** Cada etapa precisa de pelo menos uma atividade ativa, senão o aluno dela fica sem o que fazer. */
function conferirNaoEhAUltimaAtiva(atividade: LinhaAtividade): void {
  if (atividade.status !== "ATIVA") return;
  const { total } = banco()
    .prepare("SELECT COUNT(*) AS total FROM Atividade WHERE idNivel = ? AND status = 'ATIVA'")
    .get(atividade.idNivel) as { total: number };
  if (total <= 1) {
    throw new ErroApi(409, "Esta é a última atividade ativa da etapa. Inclua outra antes, para os alunos terem o que fazer.");
  }
}

function validarCorpo(corpo: CorpoAtividade) {
  conferirNivelExiste(corpo.idNivel);
  const resultado = validarAtividade(corpo);
  if (!resultado.ok) throw new ErroApi(400, resultado.mensagem);
  return resultado.atividade;
}

function gravarAlternativas(
  idAtividade: number,
  alternativas: ReturnType<typeof validarCorpo>["alternativas"],
  imagensAntigas: Map<string, string> = new Map(),
): void {
  const inserir = banco().prepare(
    "INSERT INTO Alternativa (idAtividade, texto, ordem, correta, urlImagem, ilustracao) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const alt of alternativas) {
    inserir.run(
      idAtividade,
      alt.texto,
      alt.ordem,
      alt.correta ? 1 : 0,
      imagensAntigas.get(normalizarResposta(alt.texto)) ?? null,
      alt.ilustracao,
    );
  }
}

export async function rotasCadastroAtividades(app: FastifyInstance): Promise<void> {
  // ---------- Níveis ----------

  app.get(
    "/gestao/niveis",
    {
      preHandler: quemCadastra,
      schema: {
        response: {
          200: { type: "object", properties: { niveis: { type: "array", items: esquemaNivel } }, required: ["niveis"] },
          ...errosComuns,
        },
      },
    },
    async () => ({ niveis: listarNiveisComTotais() }),
  );

  app.post<{ Body: DadosNivel }>(
    "/gestao/niveis",
    {
      preHandler: soAdministrador,
      schema: {
        body: { type: "object", properties: camposNivel, required: ["nome", "descricao", "ordem", "criterioAcerto"] },
        response: { 201: { type: "object", properties: { nivel: esquemaNivel }, required: ["nivel"] }, ...errosComuns },
      },
    },
    async (req, resposta) => {
      const { nome, descricao, ordem, criterioAcerto } = req.body;
      conferirOrdemLivre(ordem);
      const { lastInsertRowid } = banco()
        .prepare("INSERT INTO Nivel (nome, descricao, ordem, criterioAcerto) VALUES (?, ?, ?, ?)")
        .run(nome.trim(), descricao.trim(), ordem, criterioAcerto);
      resposta.code(201);
      return { nivel: listarNiveisComTotais(Number(lastInsertRowid))[0] };
    },
  );

  app.patch<{ Params: { id: number }; Body: Partial<DadosNivel> }>(
    "/gestao/niveis/:id",
    {
      preHandler: soAdministrador,
      schema: {
        params: paramsId,
        body: { type: "object", properties: camposNivel, minProperties: 1 },
        response: { 200: { type: "object", properties: { nivel: esquemaNivel }, required: ["nivel"] }, ...errosComuns },
      },
    },
    async (req) => {
      const atual = banco().prepare("SELECT * FROM Nivel WHERE idNivel = ?").get(req.params.id) as DadosNivel | undefined;
      if (!atual) throw new ErroApi(404, "Não encontramos esta etapa.");
      const novo = { ...atual, ...req.body };
      if (req.body.ordem !== undefined) conferirOrdemLivre(req.body.ordem, req.params.id);
      banco()
        .prepare("UPDATE Nivel SET nome = ?, descricao = ?, ordem = ?, criterioAcerto = ? WHERE idNivel = ?")
        .run(novo.nome.trim(), novo.descricao.trim(), novo.ordem, novo.criterioAcerto, req.params.id);
      return { nivel: listarNiveisComTotais(req.params.id)[0] };
    },
  );

  // ---------- Atividades ----------

  app.get<{ Querystring: { idNivel?: number; status?: "ATIVA" | "INATIVA"; minhas?: boolean } }>(
    "/gestao/atividades",
    {
      preHandler: quemCadastra,
      schema: {
        querystring: {
          type: "object",
          properties: {
            idNivel: { type: "integer", minimum: 1 },
            status: { type: "string", enum: ["ATIVA", "INATIVA"] },
            minhas: { type: "boolean" },
          },
        },
        response: {
          200: { type: "object", properties: { atividades: { type: "array", items: esquemaAtividadeGestao } }, required: ["atividades"] },
          ...errosComuns,
        },
      },
    },
    async (req) => {
      const condicoes: string[] = [];
      const params: (string | number)[] = [];
      if (req.query.idNivel !== undefined) {
        condicoes.push("a.idNivel = ?");
        params.push(req.query.idNivel);
      }
      if (req.query.status) {
        condicoes.push("a.status = ?");
        params.push(req.query.status);
      }
      if (req.query.minhas) {
        condicoes.push("a.idCriador = ?");
        params.push(req.user.idUsuario);
      }
      const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
      return { atividades: montarAtividades(req.user, { where, params }) };
    },
  );

  app.get<{ Params: { id: number } }>(
    "/gestao/atividades/:id",
    {
      preHandler: quemCadastra,
      schema: {
        params: paramsId,
        response: { 200: { type: "object", properties: { atividade: esquemaAtividadeGestao }, required: ["atividade"] }, ...errosComuns },
      },
    },
    async (req) => ({ atividade: buscarAtividade(req.user, req.params.id) }),
  );

  app.post<{ Body: CorpoAtividade }>(
    "/gestao/atividades",
    {
      preHandler: quemCadastra,
      schema: {
        body: corpoAtividade,
        response: { 201: { type: "object", properties: { atividade: esquemaAtividadeGestao }, required: ["atividade"] }, ...errosComuns },
      },
    },
    async (req, resposta) => {
      const a = validarCorpo(req.body);
      const agora = new Date().toISOString();
      const idAtividade = emTransacao(() => {
        const { lastInsertRowid } = banco()
          .prepare(
            `INSERT INTO Atividade (idNivel, tipo, conteudo, enunciado, textoApoio, respostaCorreta, status, idCriador, criadoEm, atualizadoEm)
             VALUES (?, ?, ?, ?, ?, ?, 'ATIVA', ?, ?, ?)`,
          )
          .run(req.body.idNivel, a.tipo, a.conteudo, a.enunciado, a.textoApoio, a.respostaCorreta, req.user.idUsuario, agora, agora);
        const id = Number(lastInsertRowid);
        gravarAlternativas(id, a.alternativas);
        return id;
      });
      req.log.info({ idAtividade, por: req.user.idUsuario }, "atividade incluída");
      resposta.code(201);
      return { atividade: buscarAtividade(req.user, idAtividade) };
    },
  );

  app.put<{ Params: { id: number }; Body: CorpoAtividade }>(
    "/gestao/atividades/:id",
    {
      preHandler: quemCadastra,
      schema: {
        params: paramsId,
        body: corpoAtividade,
        response: { 200: { type: "object", properties: { atividade: esquemaAtividadeGestao }, required: ["atividade"] }, ...errosComuns },
      },
    },
    async (req) => {
      const atual = atividadeQuePodeMudar(req.user, req.params.id);
      const a = validarCorpo(req.body);
      if (req.body.idNivel !== atual.idNivel) {
        if (atual.ordemNivelamento !== null) {
          throw new ErroApi(409, "Esta atividade faz parte do nivelamento: ela não pode mudar de etapa.");
        }
        conferirNaoEhAUltimaAtiva(atual);
      }
      const db = banco();
      // Guarda as imagens das alternativas (passo 11) que continuam com o mesmo texto.
      const imagensAntigas = new Map(
        (
          db.prepare("SELECT texto, urlImagem FROM Alternativa WHERE idAtividade = ? AND urlImagem IS NOT NULL").all(atual.idAtividade) as {
            texto: string;
            urlImagem: string;
          }[]
        ).map((l) => [normalizarResposta(l.texto), l.urlImagem]),
      );
      emTransacao(() => {
        db.prepare(
          `UPDATE Atividade SET idNivel = ?, tipo = ?, conteudo = ?, enunciado = ?, textoApoio = ?, respostaCorreta = ?, atualizadoEm = ?
            WHERE idAtividade = ?`,
        ).run(req.body.idNivel, a.tipo, a.conteudo, a.enunciado, a.textoApoio, a.respostaCorreta, new Date().toISOString(), atual.idAtividade);
        // As respostas guardam o texto (respostaDada), não o id da alternativa: dá para trocar todas.
        db.prepare("DELETE FROM Alternativa WHERE idAtividade = ?").run(atual.idAtividade);
        gravarAlternativas(atual.idAtividade, a.alternativas, imagensAntigas);
      });
      req.log.info({ idAtividade: atual.idAtividade, por: req.user.idUsuario }, "atividade editada");
      return { atividade: buscarAtividade(req.user, atual.idAtividade) };
    },
  );

  /** Inativa ou reativa. Inativar = "Excluir" da APF: nunca apaga (há respostas ligadas). */
  function mudarStatus(usuario: DadosToken, idAtividade: number, status: "ATIVA" | "INATIVA"): string {
    const atual = atividadeQuePodeMudar(usuario, idAtividade);
    if (atual.status === status) {
      return status === "ATIVA" ? "A atividade já está ativa." : "A atividade já está inativa.";
    }
    if (status === "INATIVA") {
      if (atual.ordemNivelamento !== null) {
        throw new ErroApi(409, "Esta atividade faz parte do nivelamento e não pode ser inativada.");
      }
      conferirNaoEhAUltimaAtiva(atual);
    }
    banco()
      .prepare("UPDATE Atividade SET status = ?, atualizadoEm = ? WHERE idAtividade = ?")
      .run(status, new Date().toISOString(), idAtividade);
    return status === "ATIVA" ? "Atividade ativada. Os alunos já podem fazer." : "Atividade inativada. Os alunos não veem mais.";
  }

  app.delete<{ Params: { id: number } }>(
    "/gestao/atividades/:id",
    { preHandler: quemCadastra, schema: { params: paramsId, response: respostaMensagem } },
    async (req) => ({ mensagem: mudarStatus(req.user, req.params.id, "INATIVA") }),
  );

  app.patch<{ Params: { id: number }; Body: { status: "ATIVA" | "INATIVA" } }>(
    "/gestao/atividades/:id/status",
    {
      preHandler: quemCadastra,
      schema: {
        params: paramsId,
        body: {
          type: "object",
          properties: { status: { type: "string", enum: ["ATIVA", "INATIVA"] } },
          required: ["status"],
        },
        response: respostaMensagem,
      },
    },
    async (req) => ({ mensagem: mudarStatus(req.user, req.params.id, req.body.status) }),
  );
}
