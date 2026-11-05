/**
 * Narração por voz (RNF04). Fachada usada por telas e componentes (BotaoAudio...).
 *
 * Quem de fato fala é o ProvedorVoz ativo (ver src/services/voz/). Esta fachada não
 * muda quando trocamos expo-speech por uma API de voz: só o provedor muda.
 */
import { provedorAtual, type OpcoesFala } from "./voz";

export type { OpcoesFala };

export async function falar(texto: string, opcoes: OpcoesFala = {}): Promise<void> {
  await provedorAtual().falar(texto, opcoes);
}

export function pararFala(): void {
  provedorAtual().parar();
}
