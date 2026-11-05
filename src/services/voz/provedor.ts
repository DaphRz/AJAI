/**
 * ProvedorVoz (VoiceProvider): contrato único de narração do AJAI.
 *
 * O app só conversa com esta interface (via services/narracao.ts). Cada forma de
 * "falar" é um provedor que a implementa:
 *   - console      → provisório, só registra no console (padrão hoje)
 *   - expo-speech  → voz do aparelho, grátis e offline        (a criar: passo 6)
 *   - servidor     → toca o áudio gerado pelo servidor/AudioCache (a criar: passo 6)
 *
 * Trocar de provedor = mudar UMA linha em services/voz/index.ts. Telas e componentes
 * (BotaoAudio etc.) nunca importam um provedor direto.
 */

export interface OpcoesFala {
  /** Idioma/voz, ex.: "pt-BR" (Aluno.vozPreferida). */
  voz?: string;
  /** 0.5 (lenta) a 1.5 (rápida); 1 = normal (Aluno.velocidadeVoz). */
  velocidade?: number;
}

export interface ProvedorVoz {
  /** Identificador estável, usado em AudioCache.provedor e na configuração. */
  readonly nome: string;
  /** Fala o texto. Falar de novo interrompe a fala anterior. Resolve quando termina. */
  falar(texto: string, opcoes?: OpcoesFala): Promise<void>;
  /** Interrompe a fala atual (se houver). */
  parar(): void;
}
