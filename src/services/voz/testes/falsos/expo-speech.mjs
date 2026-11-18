// expo-speech de mentira: guarda as falas e "termina" na hora (chama onDone).
export const falas = [];
export let paradas = 0;

export function speak(texto, opcoes = {}) {
  falas.push({ texto, opcoes });
  queueMicrotask(() => opcoes.onDone?.());
}

export async function stop() {
  paradas++;
}

export function limpar() {
  falas.length = 0;
  paradas = 0;
}
