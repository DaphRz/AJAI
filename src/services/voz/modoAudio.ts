/**
 * Modo de áudio do app (iPhone): toca mesmo com a chave do silencioso ligada.
 * A narração é essencial para o aluno (RNF04), então os DOIS provedores chamam isto antes de falar:
 * o "servidor" (expo-audio) e o "expo-speech" (que usa a sessão de áudio do app). Sem isso, no
 * iPhone com o silencioso ligado, a voz do aparelho fica muda (erro visto em 18/11).
 */
import { setAudioModeAsync } from "expo-audio";

let pronto: Promise<void> | null = null;

export function prepararModoAudio(): Promise<void> {
  pronto ??= setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
    pronto = null; // tenta de novo na próxima fala
  });
  return pronto;
}
