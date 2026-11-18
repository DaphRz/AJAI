/**
 * Provedor "expo-speech": a voz do próprio aparelho (grátis e sem internet).
 * É a ALTERNATIVA (PROVEDOR_PADRAO = "expo-speech") e a RESERVA do provedor "servidor"
 * quando a rede ou a API de voz falham. API do SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/speech/
 */
import * as Speech from "expo-speech";
import { prepararModoAudio } from "./modoAudio";
import type { OpcoesFala, ProvedorVoz } from "./provedor";

/** Resolve a Promise da fala em andamento (ao terminar, ao parar ou se der erro). */
let terminarAtual: (() => void) | null = null;
/** Cada fala nova (ou parar) muda a geração: quem esperava o modo de áudio e ficou velho desiste. */
let geracao = 0;

function parar(): void {
  geracao++;
  const terminar = terminarAtual;
  terminarAtual = null;
  void Speech.stop();
  terminar?.();
}

export const provedorExpoSpeech: ProvedorVoz = {
  nome: "expo-speech",
  async falar(texto: string, opcoes: OpcoesFala = {}) {
    // Falar de novo interrompe a anterior (o expo-speech, sozinho, enfileiraria).
    parar();
    const minha = geracao;
    await prepararModoAudio(); // iPhone no silencioso: sem isto a voz fica muda
    if (minha !== geracao) return;
    return new Promise<void>((resolve) => {
      const terminar = () => {
        if (terminarAtual === terminar) terminarAtual = null;
        resolve();
      };
      terminarAtual = terminar;
      Speech.speak(texto, {
        language: opcoes.voz ?? "pt-BR",
        rate: opcoes.velocidade ?? 1,
        onDone: terminar,
        onStopped: terminar,
        onError: terminar,
      });
    });
  },
  parar,
};
