/**
 * Provedor "servidor" (PADRÃO): pede ao servidor do AJAI o áudio gerado pela API de voz
 * (Azure, voz neural pt-BR-FranciscaNeural; POST /narracao, com cache em AudioCache) e toca o MP3 com o expo-audio.
 * Se a rede cair, a narração do servidor estiver desligada ou o áudio não carregar, fala com a
 * voz do aparelho (provedor expo-speech), sem a tela precisar saber.
 */
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { chamarApi, URL_API } from "../api";
import { prepararModoAudio } from "./modoAudio";
import type { OpcoesFala, ProvedorVoz } from "./provedor";
import { provedorExpoSpeech } from "./provedorExpoSpeech";

/** Quanto esperar o servidor responder antes de usar a voz do aparelho. */
const ESPERA_SERVIDOR_MS = 8000;
/** Quanto esperar o áudio começar a tocar antes de desistir dele. */
const ESPERA_CARREGAR_MS = 8000;

/** Reserva usada quando o servidor falha (troque aqui se um dia houver outra). */
const reserva: ProvedorVoz = provedorExpoSpeech;

/** Cada fala nova (ou parar) muda a geração: respostas que chegam depois são ignoradas. */
let geracao = 0;
let tocando: { player: AudioPlayer; encerrar: () => void } | null = null;

function pararAudio(): void {
  const atual = tocando;
  tocando = null;
  atual?.encerrar();
}

/** Toca o áudio. true = tocou até o fim (ou foi parado); false = não carregou ou deu erro. */
function tocar(uri: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let player: AudioPlayer;
    try {
      player = createAudioPlayer({ uri });
    } catch {
      resolve(false);
      return;
    }
    let comecou = false;
    let terminou = false;

    const terminar = (tocouBem: boolean) => {
      if (terminou) return;
      terminou = true;
      clearTimeout(relogio);
      assinatura.remove();
      if (tocando?.player === player) tocando = null;
      try {
        player.pause();
        player.remove();
      } catch {
        // player já liberado
      }
      resolve(tocouBem);
    };

    const assinatura = player.addListener("playbackStatusUpdate", (status) => {
      if (status.error) terminar(false);
      else if (status.didJustFinish) terminar(true);
      else if (status.playing) comecou = true;
    });
    const relogio = setTimeout(() => {
      if (!comecou) terminar(false);
    }, ESPERA_CARREGAR_MS);

    tocando = { player, encerrar: () => terminar(true) };
    player.play();
  });
}

function parar(): void {
  geracao++;
  pararAudio();
  reserva.parar();
}

export const provedorServidor: ProvedorVoz = {
  nome: "servidor",
  async falar(texto: string, opcoes: OpcoesFala = {}) {
    parar();
    const minha = ++geracao;

    let uri: string;
    try {
      const { url } = await chamarApi<{ url: string }>("/narracao", {
        metodo: "POST",
        corpo: { texto, velocidade: opcoes.velocidade ?? 1, voz: opcoes.voz },
        tempoLimiteMs: ESPERA_SERVIDOR_MS,
      });
      uri = `${URL_API}${url}`;
    } catch {
      // Rede fora, narração desligada (503), texto grande demais...: voz do aparelho.
      if (minha === geracao) await reserva.falar(texto, opcoes);
      return;
    }
    await prepararModoAudio(); // iPhone no silencioso
    if (minha !== geracao) return; // parou ou pediu outra fala enquanto esperava

    const tocou = await tocar(uri);
    if (!tocou && minha === geracao) await reserva.falar(texto, opcoes);
  },
  parar,
};
