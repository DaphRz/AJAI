/**
 * Narração por voz (RNF04): AudioCache.GerarNarracao → ServicoTTS.Sintetizar.
 *
 * ESQUELETO: ainda não fala nada, só registra no console.
 * Pendência (ver README): decidir entre
 *   a) expo-speech (voz do próprio aparelho, grátis e offline): `npx expo install expo-speech`
 *   b) API externa de voz humanizada (ServicoTTS do diagrama) com cache em AudioCache.
 * A interface `falar()` abaixo não muda em nenhum dos dois casos.
 */

export interface OpcoesFala {
  voz?: string;
  velocidade?: number;
}

export async function falar(texto: string, opcoes: OpcoesFala = {}): Promise<void> {
  console.log(`[narracao] (TODO TTS) "${texto}"`, opcoes);
}

export function pararFala(): void {
  // TODO: parar a reprodução atual.
}
