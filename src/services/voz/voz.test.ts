/// <reference types="node" />
// Testes da narração do app (passo 10, item 11), no Node: `npm run app:test` (também roda no `npm test`).
// expo-speech, expo-audio, expo-constants e react-native são trocados por versões de mentira
// (testes/falsos/, ligadas por testes/carregador.mjs). A rede é um `fetch` de mentira.
// TODO (passo 12): passar para o jest-expo quando ele for configurado.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { definirPreferenciasFala, falar, pararFala } from "../narracao";
import { PROVEDOR_PADRAO, provedorAtual, usarProvedor } from "./index";

interface FalaFalsa {
  texto: string;
  opcoes: { language?: string; rate?: number };
}
interface PlayerFalso {
  uri: string;
  removido: boolean;
}

const speech = (await import("expo-speech")) as unknown as { falas: FalaFalsa[]; limpar: () => void };
const audio = (await import("expo-audio")) as unknown as {
  modos: { playsInSilentMode?: boolean }[];
  players: PlayerFalso[];
  ajuste: { comportamento: "termina" | "erro" | "fica" };
};

const fetchOriginal = globalThis.fetch;
let pedidos: { url: string; corpo: Record<string, unknown> }[] = [];

/** Troca a rede: cada POST /narracao responde o que `responder` devolver (ou lança, se for "sem-rede"). */
function rede(responder: () => Response | "sem-rede") {
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    pedidos.push({ url: String(url), corpo: JSON.parse(String(init?.body ?? "{}")) });
    const resposta = responder();
    if (resposta === "sem-rede") throw new TypeError("Network request failed");
    return resposta;
  }) as typeof fetch;
}

function json(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

/** Espera uma condição ficar verdadeira (as Promises dos provedores andam em microtarefas). */
async function esperar(condicao: () => boolean): Promise<void> {
  for (let i = 0; i < 200 && !condicao(); i++) await new Promise<void>((ok) => setImmediate(ok));
  assert.ok(condicao(), "a condição não aconteceu a tempo");
}

beforeEach(() => {
  speech.limpar();
  audio.players.length = 0;
  audio.ajuste.comportamento = "termina";
  pedidos = [];
  definirPreferenciasFala({ velocidade: 0.8, voz: "pt-BR" });
});

afterEach(() => {
  pararFala();
  globalThis.fetch = fetchOriginal;
  usarProvedor(PROVEDOR_PADRAO);
});

describe("registro de provedores", () => {
  it("o padrão é o servidor (voz da Azure), com o expo-speech de reserva", () => {
    assert.equal(PROVEDOR_PADRAO, "servidor");
    assert.equal(provedorAtual().nome, "servidor");
  });

  it('usarProvedor("console"): falar() chega no provedor console, com a velocidade do aluno', async () => {
    usarProvedor("console");
    const registros: unknown[][] = [];
    const logOriginal = console.log;
    console.log = (...args: unknown[]) => registros.push(args);
    try {
      await falar("Olá, turma!");
    } finally {
      console.log = logOriginal;
    }
    assert.equal(registros.length, 1);
    assert.match(String(registros[0][0]), /Olá, turma!/);
    assert.deepEqual(registros[0][1], { velocidade: 0.8, voz: "pt-BR" });
    assert.equal(speech.falas.length, 0);
  });

  it("provedor desconhecido avisa quais existem", () => {
    assert.throws(() => usarProvedor("nao-existe"), /servidor, expo-speech, console/);
  });
});

describe("provedor servidor", () => {
  it("toca o áudio que o servidor gerou (sem usar a voz do aparelho)", async () => {
    rede(() => json(200, { url: "/narracao/audio/abc.wav" }));
    await falar("Toque na letra B.");
    assert.equal(pedidos.length, 1);
    assert.equal(pedidos[0].url, "http://computador-teste:3333/narracao");
    assert.deepEqual(pedidos[0].corpo, { texto: "Toque na letra B.", velocidade: 0.8, voz: "pt-BR" });
    assert.equal(audio.players.length, 1);
    assert.equal(audio.players[0].uri, "http://computador-teste:3333/narracao/audio/abc.wav");
    assert.ok(audio.players[0].removido, "o player é liberado ao terminar");
    assert.equal(speech.falas.length, 0);
  });

  it("rede fora: cai no expo-speech, em pt-BR e na velocidade do aluno", async () => {
    rede(() => "sem-rede");
    await falar("Sem internet.");
    assert.equal(audio.players.length, 0);
    assert.deepEqual(
      speech.falas.map((f) => [f.texto, f.opcoes.language, f.opcoes.rate]),
      [["Sem internet.", "pt-BR", 0.8]],
    );
  });

  it("narração do servidor desligada (503): cai no expo-speech", async () => {
    rede(() => json(503, { erro: "A narração do servidor está desligada." }));
    await falar("Servidor sem voz.");
    assert.deepEqual(speech.falas.map((f) => f.texto), ["Servidor sem voz."]);
  });

  it("áudio que não carrega: cai no expo-speech", async () => {
    rede(() => json(200, { url: "/narracao/audio/sumiu.wav" }));
    audio.ajuste.comportamento = "erro";
    await falar("Áudio quebrado.");
    assert.equal(audio.players.length, 1);
    assert.deepEqual(speech.falas.map((f) => f.texto), ["Áudio quebrado."]);
  });

  it("opções explícitas (Ouvir exemplo) valem mais que a preferência", async () => {
    rede(() => json(200, { url: "/narracao/audio/abc.wav" }));
    await falar("Exemplo.", { velocidade: 1.2 });
    assert.equal(pedidos[0].corpo.velocidade, 1.2);
  });

  it("pararFala() interrompe o áudio e a Promise de falar() termina", async () => {
    rede(() => json(200, { url: "/narracao/audio/longo.wav" }));
    audio.ajuste.comportamento = "fica";
    const fala = falar("Um texto bem longo.");
    await esperar(() => audio.players.length === 1);
    pararFala();
    await fala;
    assert.ok(audio.players[0].removido);
    assert.equal(speech.falas.length, 0, "parar não é falha: não chama a reserva");
  });

  it("falar de novo interrompe a fala anterior", async () => {
    rede(() => json(200, { url: `/narracao/audio/${pedidos.length}.wav` }));
    audio.ajuste.comportamento = "fica";
    const primeira = falar("Primeira.");
    await esperar(() => audio.players.length === 1);
    audio.ajuste.comportamento = "termina";
    const segunda = falar("Segunda.");
    await primeira;
    assert.ok(audio.players[0].removido, "o primeiro áudio parou");
    await segunda;
    assert.equal(audio.players.length, 2);
    assert.equal(speech.falas.length, 0);
  });
});

describe("provedor expo-speech", () => {
  it("liga o som no modo silencioso do iPhone antes de falar (erro de 18/11)", async () => {
    usarProvedor("expo-speech");
    await falar("Com o silencioso ligado.");
    assert.ok(audio.modos.some((m) => m.playsInSilentMode === true));
    assert.deepEqual(speech.falas.map((f) => f.texto), ["Com o silencioso ligado."]);
  });

  it("fala em pt-BR, na velocidade pedida, e resolve ao terminar", async () => {
    usarProvedor("expo-speech");
    await falar("Muito bem!", { velocidade: 1.2 });
    assert.deepEqual(
      speech.falas.map((f) => [f.texto, f.opcoes.language, f.opcoes.rate]),
      [["Muito bem!", "pt-BR", 1.2]],
    );
  });
});
