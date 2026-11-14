// Área do responsável (passo 8): algumas recomendações sobre as (até 2) pessoas que ele acompanha.
// Sem turma e sem métricas detalhadas (essas são só do professor).
//   GET /responsavel/recomendacoes → para cada aluno com vínculo ACEITO, 1 a 3 frases curtas
//                                    (dias de treino na semana, conteúdo para treinar, etapa).
import type { FastifyInstance } from "fastify";
import { exigirLogin } from "../autenticacao.ts";
import { banco } from "../banco.ts";
import { conteudosDasAtividades, listarNiveis, respostasDoAluno } from "../desempenho.ts";
import { esquemaErro } from "../erros.ts";
import { frequenciaRecente, identificarDificuldades, recomendacoesParaFamilia } from "../progressao.ts";
import { temVinculoAceito } from "./vinculos.ts";

export async function rotasResponsavel(app: FastifyInstance): Promise<void> {
  app.get(
    "/responsavel/recomendacoes",
    {
      preHandler: exigirLogin("RESPONSAVEL"),
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              pessoas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    idVinculo: { type: "integer" },
                    aluno: {
                      type: "object",
                      properties: { idUsuario: { type: "integer" }, nome: { type: "string" } },
                      required: ["idUsuario", "nome"],
                    },
                    frases: { type: "array", items: { type: "string" } },
                  },
                  required: ["idVinculo", "aluno", "frases"],
                },
              },
            },
            required: ["pessoas"],
          },
          401: esquemaErro,
          403: esquemaErro,
        },
      },
    },
    async (req) => {
      const idResponsavel = req.user.idUsuario;
      const vinculos = banco()
        .prepare(
          `SELECT v.idVinculo, va.idUsuario, va.nome, va.idNivelAtual
             FROM Vinculo v JOIN vw_aluno va ON va.idUsuario = v.idAluno
            WHERE v.idAcompanhante = ? AND v.status = 'ACEITO' AND va.ativo = 1
            ORDER BY va.nome`,
        )
        .all(idResponsavel) as unknown as { idVinculo: number; idUsuario: number; nome: string; idNivelAtual: number | null }[];
      const niveis = listarNiveis();
      const conteudos = conteudosDasAtividades();
      const agora = new Date();

      return {
        pessoas: vinculos
          .filter((v) => temVinculoAceito(idResponsavel, v.idUsuario))
          .map((v) => {
            const respostas = respostasDoAluno(v.idUsuario);
            // Conteúdo para treinar: o pior das respostas RECENTES (últimas 20), para não lembrar
            // de uma dificuldade que já passou.
            const [pior] = identificarDificuldades(respostas.slice(-20), conteudos).filter((d) => d.erros > 0);
            return {
              idVinculo: v.idVinculo,
              aluno: { idUsuario: v.idUsuario, nome: v.nome },
              frases: recomendacoesParaFamilia({
                primeiroNome: v.nome.split(" ")[0],
                diasNaSemana: frequenciaRecente(respostas.map((r) => r.dataHora), agora, 7).diasComAtividade,
                nomeEtapa: niveis.find((n) => n.idNivel === v.idNivelAtual)?.nome,
                conteudoParaTreinar: pior?.conteudo,
              }),
            };
          }),
      };
    },
  );
}
