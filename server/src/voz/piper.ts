// ALTERNATIVA (o padrão é a Azure, azure.ts). Sintetizador Piper (https://github.com/OHF-Voice/piper1-gpl):
// voz gratuita, sem conta e sem chave, que roda NO PRÓPRIO COMPUTADOR. O AJAI chama o servidor HTTP do Piper
// (`python3 -m piper.http_server -m pt_BR-faber-medium --port 5050`, rota POST /synthesize) e recebe um WAV pronto
// (sem ffmpeg). Endereço e voz vêm de server/.env (PIPER_URL, PIPER_VOZ); ver README › Voz.
import { config } from "../config.ts";
import type { SintetizadorVoz } from "./sintetizador.ts";

/** O Piper controla a velocidade pela duração dos fonemas: length_scale 1/velocidade (0.8 → 1.25, mais lento). */
export function escalaDeDuracao(velocidade: number): number {
  return Math.round((1 / velocidade) * 1000) / 1000;
}

export function criarSintetizadorPiper(): SintetizadorVoz {
  const { piperUrl, piperVoz, tempoLimiteMs } = config.voz;
  return {
    nome: "piper",
    // Sem PIPER_VOZ, o Piper usa a voz com que foi iniciado (-m); o cache guarda "padrao".
    vozPadrao: piperVoz || "padrao",
    formato: "wav",
    async sintetizar(texto, voz, velocidade) {
      if (!piperUrl) throw new Error("PIPER_URL não definido em server/.env (veja README › Voz).");
      const corpo: Record<string, unknown> = { text: texto, length_scale: escalaDeDuracao(velocidade) };
      if (voz && voz !== "padrao") corpo.voice = voz;

      const resposta = await fetch(piperUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(tempoLimiteMs),
      });
      if (!resposta.ok) throw new Error(`O Piper respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
      const audio = Buffer.from(await resposta.arrayBuffer());
      // Todo WAV começa com "RIFF....WAVE"; qualquer outra coisa é erro do Piper.
      if (audio.length < 44 || audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") {
        throw new Error("O Piper não devolveu um áudio WAV.");
      }
      return audio;
    },
  };
}
