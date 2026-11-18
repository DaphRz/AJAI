// Narração por voz (passo 10, RNF04):
//   POST /narracao               { texto, velocidade? } → { url }  (qualquer perfil logado)
//                                url é relativa à API: "/narracao/audio/<arquivo>.wav"
//   GET  /narracao/audio/:arquivo  o áudio (sem login: o player do app não manda o token;
//                                o nome é um hash de 160 bits, impossível de adivinhar)
// 503 quando a narração do servidor está desligada ou a API de voz falha: o app usa a voz do aparelho.
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import type { FastifyInstance } from "fastify";
import { exigirLogin } from "../autenticacao.ts";
import { config } from "../config.ts";
import { ErroApi, esquemaErro } from "../erros.ts";
import { LIMITE_TEXTO, PADRAO_ARQUIVO, obterNarracao } from "../voz/narracao.ts";
import { tipoDoFormato } from "../voz/sintetizador.ts";

export async function rotasNarracao(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { texto: string; velocidade?: number; voz?: string } }>(
    "/narracao",
    {
      preHandler: exigirLogin(),
      schema: {
        body: {
          type: "object",
          properties: {
            texto: { type: "string", minLength: 1, maxLength: LIMITE_TEXTO },
            velocidade: { type: "number", minimum: 0.5, maximum: 1.5, default: 1 },
            // Aluno.vozPreferida: por enquanto só existe a voz pt-BR configurada no servidor.
            voz: { type: "string", maxLength: 20 },
          },
          required: ["texto"],
        },
        response: {
          200: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
          400: esquemaErro,
          401: esquemaErro,
          503: esquemaErro,
        },
      },
    },
    async (req) => {
      const { arquivo } = await obterNarracao(req.body.texto, req.body.velocidade);
      return { url: `/narracao/audio/${arquivo}` };
    },
  );

  app.get<{ Params: { arquivo: string } }>(
    "/narracao/audio/:arquivo",
    {
      // Uma tela pode tocar vários áudios seguidos; o limite geral já protege.
      schema: {
        params: {
          type: "object",
          properties: { arquivo: { type: "string", pattern: PADRAO_ARQUIVO.source } },
          required: ["arquivo"],
        },
      },
    },
    async (req, reply) => {
      const caminho = join(config.voz.pastaAudio, req.params.arquivo);
      if (!existsSync(caminho)) throw new ErroApi(404, "Áudio não encontrado.");
      const audio = readFileSync(caminho);
      const formato = extname(caminho).slice(1) as keyof typeof tipoDoFormato;

      reply
        .type(tipoDoFormato[formato] ?? "application/octet-stream")
        .header("Accept-Ranges", "bytes")
        // O nome muda quando o conteúdo muda: o aparelho pode guardar o áudio para sempre.
        .header("Cache-Control", "public, max-age=31536000, immutable");

      // O player do iPhone pede o áudio em pedaços (Range); sem isso ele não toca.
      const faixa = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
      if (faixa && (faixa[1] || faixa[2])) {
        const total = audio.length;
        let inicio = faixa[1] ? Number(faixa[1]) : total - Number(faixa[2]);
        let fim = faixa[1] && faixa[2] ? Number(faixa[2]) : total - 1;
        inicio = Math.max(0, inicio);
        fim = Math.min(fim, total - 1);
        if (inicio > fim) {
          return reply.code(416).header("Content-Range", `bytes */${total}`).send();
        }
        return reply
          .code(206)
          .header("Content-Range", `bytes ${inicio}-${fim}/${total}`)
          .send(audio.subarray(inicio, fim + 1));
      }
      return reply.send(audio);
    },
  );
}
