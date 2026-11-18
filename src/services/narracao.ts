/**
 * Narração por voz (RNF04). Fachada usada por telas e componentes (BotaoAudio...).
 *
 * Quem de fato fala é o ProvedorVoz ativo (ver src/services/voz/). Esta fachada não
 * muda quando trocamos expo-speech por uma API de voz: só o provedor muda.
 *
 * As preferências do aluno (velocidade e voz, passo 10) entram aqui como padrão, por
 * definirPreferenciasFala (chamada pelo PreferenciasProvider): as telas continuam chamando
 * só falar(texto). Quem passar opções explícitas (ex.: "Ouvir exemplo") tem prioridade.
 */
import { provedorAtual, type OpcoesFala } from "./voz";

export type { OpcoesFala };

let preferencias: OpcoesFala = {};

/** Velocidade/voz usadas quando a tela não diz nada (Aluno.velocidadeVoz, Aluno.vozPreferida). */
export function definirPreferenciasFala(novas: OpcoesFala): void {
  preferencias = { ...novas };
}

export async function falar(texto: string, opcoes: OpcoesFala = {}): Promise<void> {
  await provedorAtual().falar(texto, { ...preferencias, ...opcoes });
}

export function pararFala(): void {
  provedorAtual().parar();
}
