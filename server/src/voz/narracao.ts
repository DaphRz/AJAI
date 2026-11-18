// Narração com cache (passo 10, RNF04): procura o áudio em AudioCache (textoOrigem + voz +
// velocidade + provedor); se não achar, pede ao SintetizadorVoz ativo, grava o arquivo em
// server/storage/audio/ e insere a linha. Usado pela rota /narracao e pelo `npm run voz:preparar`.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { banco } from "../banco.ts";
import { config } from "../config.ts";
import { ErroApi } from "../erros.ts";
import { sintetizadorAtivo } from "./index.ts";

/** Maior texto aceito (caracteres). Curto de propósito: a narração é de uma tela, não de um livro. */
export const LIMITE_TEXTO = 800;

/** Velocidades das preferências do aluno (lenta, normal, rápida), geradas pelo voz:preparar. */
export const VELOCIDADES_PREPARADAS = [0.8, 1.0, 1.2] as const;

/** Nome do arquivo de áudio: 40 letras hexadecimais + extensão. Só isto é servido. */
export const PADRAO_ARQUIVO = /^[a-f0-9]{40}\.(wav|mp3)$/;

/** Espaços repetidos não mudam a fala: o mesmo texto sempre cai na mesma linha do cache. */
export function normalizarTexto(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/** 0.5 a 1.5, com uma casa decimal (0.83 → 0.8), para não gerar um áudio por centésimo. */
export function normalizarVelocidade(velocidade = 1): number {
  const limitada = Math.min(1.5, Math.max(0.5, Number.isFinite(velocidade) ? velocidade : 1));
  return Math.round(limitada * 10) / 10;
}

export interface Narracao {
  /** Nome do arquivo em server/storage/audio/ (servido em GET /narracao/audio/:arquivo). */
  arquivo: string;
  /** true = acabou de ser gerado; false = veio do cache. */
  gerado: boolean;
}

function registrarNoCache(texto: string, voz: string, velocidade: number, arquivo: string, provedor: string): void {
  banco()
    .prepare(
      `INSERT INTO AudioCache (textoOrigem, voz, velocidade, caminhoArquivo, provedor) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (textoOrigem, voz, velocidade, provedor) DO UPDATE SET caminhoArquivo = excluded.caminhoArquivo`,
    )
    .run(texto, voz, velocidade, arquivo, provedor);
}

/** Sínteses em andamento, para dois pedidos iguais ao mesmo tempo gerarem um arquivo só. */
const emAndamento = new Map<string, Promise<Narracao>>();

/**
 * Devolve o áudio do texto (do cache ou gerado agora).
 * 503 se a narração do servidor estiver desligada ou a API de voz falhar: o app cai na voz do aparelho.
 */
export async function obterNarracao(textoBruto: string, velocidadeBruta?: number): Promise<Narracao> {
  const sintetizador = sintetizadorAtivo();
  if (!sintetizador) throw new ErroApi(503, "A narração do servidor está desligada.");

  const texto = normalizarTexto(textoBruto);
  if (!texto) throw new ErroApi(400, "Não há texto para narrar.");
  if (texto.length > LIMITE_TEXTO) throw new ErroApi(400, "O texto é grande demais para narrar.");
  const velocidade = normalizarVelocidade(velocidadeBruta);
  const voz = sintetizador.vozPadrao;
  const provedor = sintetizador.nome;

  const linha = banco()
    .prepare(
      "SELECT caminhoArquivo FROM AudioCache WHERE textoOrigem = ? AND voz = ? AND velocidade = ? AND provedor = ?",
    )
    .get(texto, voz, velocidade, provedor) as { caminhoArquivo: string } | undefined;
  if (linha && existsSync(join(config.voz.pastaAudio, linha.caminhoArquivo))) {
    return { arquivo: linha.caminhoArquivo, gerado: false };
  }

  const chave = `${provedor}|${voz}|${velocidade}|${texto}`;
  const arquivo = `${createHash("sha256").update(chave).digest("hex").slice(0, 40)}.${sintetizador.formato}`;

  // O nome do arquivo depende só do texto, da voz, da velocidade e do provedor. Se o arquivo já
  // existe (ex.: veio pelo git, em server/storage/audio/) mas o banco desta máquina não tem a linha,
  // só registra no AudioCache: não precisa da chave da API de voz.
  if (existsSync(join(config.voz.pastaAudio, arquivo))) {
    registrarNoCache(texto, voz, velocidade, arquivo, provedor);
    return { arquivo, gerado: false };
  }

  const andando = emAndamento.get(chave);
  if (andando) return andando;

  const tarefa = (async (): Promise<Narracao> => {
    let audio: Buffer;
    try {
      audio = await sintetizador.sintetizar(texto, voz, velocidade);
    } catch (erro) {
      console.warn(`[voz:${provedor}] não gerou o áudio:`, erro instanceof Error ? erro.message : erro);
      throw new ErroApi(503, "A voz do servidor não respondeu agora.");
    }
    mkdirSync(config.voz.pastaAudio, { recursive: true });
    writeFileSync(join(config.voz.pastaAudio, arquivo), audio);
    registrarNoCache(texto, voz, velocidade, arquivo, provedor);
    return { arquivo, gerado: true };
  })();

  emAndamento.set(chave, tarefa);
  try {
    return await tarefa;
  } finally {
    emAndamento.delete(chave);
  }
}
