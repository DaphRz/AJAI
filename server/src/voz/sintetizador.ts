// SintetizadorVoz: contrato da API de voz do SERVIDOR (passo 10). Mesma ideia do ProvedorVoz do app:
// cada serviço de voz é um arquivo que implementa esta interface (azure.ts, padrão; piper.ts), e o ativo é
// escolhido por VOZ_PROVEDOR em server/.env. A rota /narracao e o `npm run voz:preparar` só
// conversam com esta interface; trocar de API = criar o arquivo e registrá-lo em voz/index.ts.

export interface SintetizadorVoz {
  /** Identificador estável, gravado em AudioCache.provedor (ex.: "azure"). */
  readonly nome: string;
  /** Nome da voz usada (gravado em AudioCache.voz), ex.: "pt-BR-FranciscaNeural". */
  readonly vozPadrao: string;
  /** Formato do áudio devolvido; vira a extensão do arquivo. WAV não depende do ffmpeg. */
  readonly formato: "wav" | "mp3";
  /** Gera o áudio do texto. velocidade: 0.5 (lenta) a 1.5 (rápida), 1 = normal. */
  sintetizar(texto: string, voz: string, velocidade: number): Promise<Buffer>;
}

/** Tipo MIME de cada formato (para servir os arquivos). */
export const tipoDoFormato: Record<SintetizadorVoz["formato"], string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
};
