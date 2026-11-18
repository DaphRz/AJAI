// Sintetizador Azure (Microsoft Azure AI Speech, voz neural): API de voz do AJAI desde 18/11.
// Voz padrão pt-BR-FranciscaNeural (português do Brasil). REST:
//   POST https://<região>.tts.speech.microsoft.com/cognitiveservices/v1
//   cabeçalhos Ocp-Apim-Subscription-Key, Content-Type: application/ssml+xml, X-Microsoft-OutputFormat, User-Agent
//   corpo em SSML; a velocidade vai em <prosody rate="-20%">.
// Devolve MP3 (24 kHz, ~10x menor que WAV; o expo-audio toca em Android, iPhone e web).
// Chave e região SÓ em server/.env (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION); ver README › Narração por voz.
// Plano gratuito (F0): 20 pedidos por minuto. Quando a Azure responde 429, espera e tenta de novo.
import { config } from "../config.ts";
import type { SintetizadorVoz } from "./sintetizador.ts";

const FORMATO_SAIDA = "audio-24khz-96kbitrate-mono-mp3";
const VOZ_PADRAO = "pt-BR-FranciscaNeural";

/** Texto seguro dentro do SSML (XML). */
export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Velocidade (0.8 = lenta) no formato do SSML: 0.8 → "-20%", 1.2 → "+20%". */
export function taxaSsml(velocidade: number): string {
  const porcento = Math.round((velocidade - 1) * 100);
  return `${porcento >= 0 ? "+" : ""}${porcento}%`;
}

export function montarSsml(texto: string, voz: string, velocidade: number): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">` +
    `<voice name="${escaparXml(voz)}"><prosody rate="${taxaSsml(velocidade)}">${escaparXml(texto)}</prosody></voice>` +
    `</speak>`
  );
}

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export function criarSintetizadorAzure(): SintetizadorVoz {
  const { azureChave, azureRegiao, azureEndpoint, azureVoz, tempoLimiteMs } = config.voz;
  const endereco =
    azureEndpoint || (azureRegiao ? `https://${azureRegiao}.tts.speech.microsoft.com/cognitiveservices/v1` : "");

  return {
    nome: "azure",
    vozPadrao: azureVoz || VOZ_PADRAO,
    formato: "mp3",
    async sintetizar(texto, voz, velocidade) {
      if (!azureChave || !endereco) {
        throw new Error("Defina AZURE_SPEECH_KEY e AZURE_SPEECH_REGION em server/.env (veja README › Narração por voz).");
      }
      const limite = Date.now() + tempoLimiteMs;
      for (let tentativa = 0; ; tentativa++) {
        const resposta = await fetch(endereco, {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureChave,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": FORMATO_SAIDA,
            "User-Agent": "ajai-servidor",
          },
          body: montarSsml(texto, voz, velocidade),
          signal: AbortSignal.timeout(Math.max(1000, limite - Date.now())),
        });

        if (resposta.status === 429) {
          // Limite de pedidos por minuto (no F0, 20/min): espera e tenta de novo, até o tempo limite.
          const pedida = Number(resposta.headers.get("retry-after")) * 1000;
          const espera = pedida > 0 ? pedida : Math.min(15000, 2000 * 2 ** tentativa);
          if (Date.now() + espera >= limite) throw new Error("A Azure recusou por excesso de pedidos (429). Tente de novo em 1 minuto.");
          await esperar(espera);
          continue;
        }
        if (resposta.status === 401) throw new Error("A Azure recusou a chave (401): confira AZURE_SPEECH_KEY e AZURE_SPEECH_REGION.");
        if (!resposta.ok) throw new Error(`A Azure respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);

        const audio = Buffer.from(await resposta.arrayBuffer());
        // MP3 começa com "ID3" ou com o byte de sincronia 0xFF.
        if (audio.length < 100 || !(audio.toString("ascii", 0, 3) === "ID3" || audio[0] === 0xff)) {
          throw new Error("A Azure não devolveu um áudio MP3.");
        }
        return audio;
      }
    },
  };
}
