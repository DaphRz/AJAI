// Testes do passo 10 (npm test): narração com cache (POST /narracao, GET /narracao/audio/:arquivo),
// sintetizador Azure (padrão) e Piper (alternativa) falando com um servidor HTTP DE MENTIRA, e
// preferências do aluno (PATCH /alunos/eu). Banco e pasta de áudios TEMPORÁRIOS: o seu ajai.db e
// seus áudios não são tocados, e nada vai para a Azure de verdade.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";

/** MP3 de mentira: começa com "ID3", como os da Azure. */
function mp3Falso(): Buffer {
  return Buffer.concat([Buffer.from("ID3", "ascii"), Buffer.alloc(300, 1)]);
}

/** WAV mínimo (só o cabeçalho "RIFF....WAVE" importa para o Piper). */
function wavFalso(): Buffer {
  const audio = Buffer.alloc(244);
  audio.write("RIFF", 0, "ascii");
  audio.write("WAVE", 8, "ascii");
  return audio;
}

interface PedidoAzure {
  chave: string;
  tipo: string;
  formato: string;
  ssml: string;
}

// Servidor de mentira com as duas APIs: Azure (/cognitiveservices/v1) e Piper (/synthesize).
const pedidosAzure: PedidoAzure[] = [];
const pedidosPiper: Record<string, unknown>[] = [];
const azure = { falhando: false, recusas429: 0 };
const CHAVE = "chave-de-teste";
const falso: Server = createServer((req, res) => {
  let corpo = "";
  req.on("data", (c) => (corpo += c));
  req.on("end", () => {
    if (req.url === "/synthesize") {
      pedidosPiper.push(JSON.parse(corpo));
      res.writeHead(200, { "Content-Type": "audio/wav" }).end(wavFalso());
      return;
    }
    pedidosAzure.push({
      chave: String(req.headers["ocp-apim-subscription-key"] ?? ""),
      tipo: String(req.headers["content-type"] ?? ""),
      formato: String(req.headers["x-microsoft-outputformat"] ?? ""),
      ssml: corpo,
    });
    if (req.headers["ocp-apim-subscription-key"] !== CHAVE) return void res.writeHead(401).end();
    if (azure.recusas429 > 0) {
      azure.recusas429--;
      return void res.writeHead(429, { "Retry-After": "1" }).end();
    }
    if (azure.falhando) return void res.writeHead(500).end("falhou");
    // Um pouco de demora, para os pedidos simultâneos se encontrarem.
    setTimeout(() => res.writeHead(200, { "Content-Type": "audio/mpeg" }).end(mp3Falso()), 30);
  });
});
await new Promise<void>((ok) => falso.listen(0, "127.0.0.1", ok));
const enderecoFalso = `http://127.0.0.1:${(falso.address() as AddressInfo).port}`;

const pasta = mkdtempSync(join(tmpdir(), "ajai-teste-voz-"));
process.env.AJAI_DB = join(pasta, "ajai.db");
process.env.VOZ_PASTA_AUDIO = join(pasta, "audio");
process.env.VOZ_PROVEDOR = "azure";
process.env.AZURE_SPEECH_KEY = CHAVE;
process.env.AZURE_SPEECH_REGION = "brazilsouth";
process.env.AZURE_SPEECH_ENDPOINT = `${enderecoFalso}/cognitiveservices/v1`;
process.env.AZURE_VOZ = "pt-BR-TesteNeural";
process.env.PIPER_URL = `${enderecoFalso}/synthesize`;
process.env.PIPER_VOZ = "pt_BR-teste-medium";
process.env.VOZ_TEMPO_LIMITE_MS = "8000";
process.env.LIMITE_LOGIN_POR_MINUTO = "1000";

// Importados DEPOIS das variáveis (são lidas ao importar).
const { abrirBanco } = await import("../../db/conectar.mjs");
const { semear, SENHA_DEMO } = await import("../../db/seed.mjs");
const { construirApp } = await import("../app.ts");
const { banco, fecharBanco } = await import("../banco.ts");
const { usarSintetizador } = await import("../voz/index.ts");
const { escaparXml, montarSsml, taxaSsml } = await import("../voz/azure.ts");
const { criarSintetizadorPiper, escalaDeDuracao } = await import("../voz/piper.ts");
const { LIMITE_TEXTO, normalizarVelocidade } = await import("../voz/narracao.ts");

let app: FastifyInstance;
const tokens: Record<string, string> = {};

async function entrar(identificador: string): Promise<string> {
  const r = await app.inject({ method: "POST", url: "/auth/login", payload: { identificador, senha: SENHA_DEMO } });
  assert.equal(r.statusCode, 200, r.body);
  return r.json().token;
}

function narrar(quem: string | null, payload: object) {
  return app.inject({
    method: "POST",
    url: "/narracao",
    payload,
    headers: quem ? { authorization: `Bearer ${tokens[quem]}` } : {},
  });
}

function linhasDoCache() {
  return banco().prepare("SELECT textoOrigem, voz, velocidade, provedor, caminhoArquivo FROM AudioCache").all() as {
    textoOrigem: string;
    voz: string;
    velocidade: number;
    provedor: string;
    caminhoArquivo: string;
  }[];
}

before(async () => {
  const db = abrirBanco();
  await semear(db);
  db.close();
  app = await construirApp({ log: false });
  tokens.ana = await entrar("ana.souza");
  tokens.rafael = await entrar("rafael@ajai.app");
});

after(async () => {
  await app.close();
  fecharBanco();
  await new Promise((ok) => falso.close(ok));
  rmSync(pasta, { recursive: true, force: true });
});

beforeEach(() => {
  usarSintetizador(undefined); // volta ao do ambiente (Azure de mentira)
  azure.falhando = false;
  azure.recusas429 = 0;
});

describe("Azure (sintetizador padrão)", () => {
  it("monta o SSML com a voz, a velocidade e o texto escapado", () => {
    assert.equal(taxaSsml(1), "+0%");
    assert.equal(taxaSsml(0.8), "-20%");
    assert.equal(taxaSsml(1.2), "+20%");
    assert.equal(escaparXml(`Pão & "leite" <já>`), "Pão &amp; &quot;leite&quot; &lt;já&gt;");
    const ssml = montarSsml("Arroz & feijão", "pt-BR-FranciscaNeural", 0.8);
    assert.match(ssml, /xml:lang="pt-BR"/);
    assert.match(ssml, /<voice name="pt-BR-FranciscaNeural"><prosody rate="-20%">Arroz &amp; feijão<\/prosody><\/voice>/);
  });

  it("normaliza a velocidade para uma casa decimal entre 0.5 e 1.5", () => {
    assert.equal(normalizarVelocidade(0.83), 0.8);
    assert.equal(normalizarVelocidade(3), 1.5);
    assert.equal(normalizarVelocidade(undefined), 1);
  });
});

describe("POST /narracao", () => {
  it("exige login", async () => {
    const r = await narrar(null, { texto: "Olá" });
    assert.equal(r.statusCode, 401);
  });

  it("gera o MP3 na Azure (chave, SSML e formato certos), grava em AudioCache e responde a URL", async () => {
    const antes = pedidosAzure.length;
    const r = await narrar("ana", { texto: "Toque na letra B.", velocidade: 0.8 });
    assert.equal(r.statusCode, 200, r.body);
    const { url } = r.json();
    assert.match(url, /^\/narracao\/audio\/[a-f0-9]{40}\.mp3$/);

    assert.equal(pedidosAzure.length, antes + 1);
    const pedido = pedidosAzure.at(-1)!;
    assert.equal(pedido.chave, CHAVE);
    assert.equal(pedido.tipo, "application/ssml+xml");
    assert.equal(pedido.formato, "audio-24khz-96kbitrate-mono-mp3");
    assert.match(pedido.ssml, /<voice name="pt-BR-TesteNeural"><prosody rate="-20%">Toque na letra B\.<\/prosody>/);

    const linha = linhasDoCache().find((l) => l.textoOrigem === "Toque na letra B.");
    assert.ok(linha);
    assert.equal(linha.provedor, "azure");
    assert.equal(linha.voz, "pt-BR-TesteNeural");
    assert.equal(linha.velocidade, 0.8);
    assert.ok(existsSync(join(process.env.VOZ_PASTA_AUDIO!, linha.caminhoArquivo)));
  });

  it("o mesmo texto (mesmo com espaços a mais) vem do cache, sem chamar a Azure", async () => {
    const primeira = await narrar("rafael", { texto: "Muito bem!" });
    const antes = pedidosAzure.length;
    const segunda = await narrar("ana", { texto: "  Muito   bem! " });
    assert.equal(segunda.statusCode, 200);
    assert.equal(segunda.json().url, primeira.json().url);
    assert.equal(pedidosAzure.length, antes);
  });

  it("arquivo que já existe na pasta (veio pelo git) é usado sem chamar a Azure, mesmo sem a linha no banco", async () => {
    const primeira = await narrar("ana", { texto: "Veio pelo git." });
    banco().prepare("DELETE FROM AudioCache WHERE textoOrigem = ?").run("Veio pelo git.");
    const antes = pedidosAzure.length;
    const segunda = await narrar("ana", { texto: "Veio pelo git." });
    assert.equal(segunda.statusCode, 200);
    assert.equal(segunda.json().url, primeira.json().url);
    assert.equal(pedidosAzure.length, antes, "não pediu à Azure");
    assert.ok(linhasDoCache().some((l) => l.textoOrigem === "Veio pelo git."), "registrou no AudioCache");
  });

  it("outra velocidade gera outro áudio", async () => {
    const normal = await narrar("ana", { texto: "Vamos tentar de novo?", velocidade: 1 });
    const rapida = await narrar("ana", { texto: "Vamos tentar de novo?", velocidade: 1.2 });
    assert.notEqual(normal.json().url, rapida.json().url);
  });

  it("pedidos iguais ao mesmo tempo geram um áudio só", async () => {
    const antes = pedidosAzure.length;
    const respostas = await Promise.all([1, 2, 3].map(() => narrar("ana", { texto: "Ao mesmo tempo." })));
    assert.ok(respostas.every((r) => r.statusCode === 200));
    assert.equal(new Set(respostas.map((r) => r.json().url)).size, 1);
    assert.equal(pedidosAzure.length, antes + 1);
  });

  it("Azure pedindo calma (429, plano gratuito): espera o Retry-After e tenta de novo", async () => {
    azure.recusas429 = 1;
    const antes = pedidosAzure.length;
    const r = await narrar("ana", { texto: "Depois de esperar." });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(pedidosAzure.length, antes + 2);
  });

  it("recusa texto vazio, grande demais ou velocidade fora do limite (400)", async () => {
    assert.equal((await narrar("ana", { texto: "" })).statusCode, 400);
    assert.equal((await narrar("ana", { texto: "a".repeat(LIMITE_TEXTO + 1) })).statusCode, 400);
    assert.equal((await narrar("ana", { texto: "Oi", velocidade: 3 })).statusCode, 400);
  });

  it("Azure fora do ar = 503 (o app usa a voz do aparelho) e nada vai para o cache", async () => {
    azure.falhando = true;
    const r = await narrar("ana", { texto: "Isto não será gravado." });
    assert.equal(r.statusCode, 503);
    assert.ok(r.json().erro);
    assert.ok(!linhasDoCache().some((l) => l.textoOrigem === "Isto não será gravado."));
  });

  it("narração desligada (sem VOZ_PROVEDOR) = 503", async () => {
    usarSintetizador(null);
    const r = await narrar("ana", { texto: "Olá" });
    assert.equal(r.statusCode, 503);
  });

  it("troca pela interface: com o Piper (alternativa) a rota é a mesma e gera WAV", async () => {
    usarSintetizador(criarSintetizadorPiper());
    assert.equal(escalaDeDuracao(0.8), 1.25);
    const r = await narrar("ana", { texto: "Outro provedor.", velocidade: 0.8 });
    assert.equal(r.statusCode, 200, r.body);
    assert.match(r.json().url, /\.wav$/);
    assert.deepEqual(pedidosPiper.at(-1), { text: "Outro provedor.", length_scale: 1.25, voice: "pt_BR-teste-medium" });
    assert.ok(linhasDoCache().some((l) => l.textoOrigem === "Outro provedor." && l.provedor === "piper"));
  });
});

describe("GET /narracao/audio/:arquivo", () => {
  it("serve o MP3 (inteiro e em pedaços, para o iPhone)", async () => {
    const { url } = (await narrar("ana", { texto: "Áudio para baixar." })).json();
    const inteiro = await app.inject({ method: "GET", url });
    assert.equal(inteiro.statusCode, 200);
    assert.equal(inteiro.headers["content-type"], "audio/mpeg");
    assert.equal(inteiro.rawPayload.length, mp3Falso().length);

    const pedaco = await app.inject({ method: "GET", url, headers: { range: "bytes=0-2" } });
    assert.equal(pedaco.statusCode, 206);
    assert.equal(pedaco.headers["content-range"], `bytes 0-2/${mp3Falso().length}`);
    assert.equal(pedaco.rawPayload.toString("ascii"), "ID3");
  });

  it("nome fora do padrão = 400; arquivo que não existe = 404", async () => {
    assert.equal((await app.inject({ method: "GET", url: "/narracao/audio/..%2F..%2Fdata%2Fajai.db" })).statusCode, 400);
    assert.equal((await app.inject({ method: "GET", url: `/narracao/audio/${"0".repeat(40)}.mp3` })).statusCode, 404);
  });

  it("os arquivos ficam na pasta configurada", () => {
    assert.ok(readdirSync(process.env.VOZ_PASTA_AUDIO!).every((f) => /^[a-f0-9]{40}\.(mp3|wav)$/.test(f)));
  });
});

describe("PATCH /alunos/eu (preferências)", () => {
  function preferir(quem: string, payload: object) {
    return app.inject({
      method: "PATCH",
      url: "/alunos/eu",
      payload,
      headers: { authorization: `Bearer ${tokens[quem]}` },
    });
  }

  it("o aluno muda a velocidade da voz e o tamanho da letra, e o /auth/eu devolve o novo", async () => {
    const r = await preferir("ana", { velocidadeVoz: 1.2, tamanhoFonte: 28 });
    assert.equal(r.statusCode, 200, r.body);
    assert.equal(r.json().usuario.velocidadeVoz, 1.2);
    assert.equal(r.json().usuario.tamanhoFonte, 28);

    const eu = await app.inject({ method: "GET", url: "/auth/eu", headers: { authorization: `Bearer ${tokens.ana}` } });
    assert.equal(eu.json().usuario.velocidadeVoz, 1.2);
    assert.equal(eu.json().usuario.tamanhoFonte, 28);

    const so = await preferir("ana", { tamanhoFonte: 20 });
    assert.equal(so.json().usuario.tamanhoFonte, 20);
    assert.equal(so.json().usuario.velocidadeVoz, 1.2, "o que não foi enviado não muda");
  });

  it("valores fora do limite ou corpo vazio = 400", async () => {
    assert.equal((await preferir("ana", { tamanhoFonte: 50 })).statusCode, 400);
    assert.equal((await preferir("ana", { velocidadeVoz: 0.1 })).statusCode, 400);
    assert.equal((await preferir("ana", {})).statusCode, 400);
  });

  it("só o aluno tem essas preferências (professor = 403)", async () => {
    assert.equal((await preferir("rafael", { tamanhoFonte: 24 })).statusCode, 403);
  });
});
