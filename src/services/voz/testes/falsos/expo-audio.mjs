// expo-audio de mentira: cada player guarda a URL e reage conforme `comportamento`
// ("termina" = toca até o fim; "erro" = não carrega; "fica" = continua tocando até alguém parar).
export const players = [];
export const ajuste = { comportamento: "termina" };

class PlayerFalso {
  constructor(fonte) {
    this.uri = fonte?.uri;
    this.ouvintes = [];
    this.removido = false;
    this.tocou = false;
    players.push(this);
  }
  addListener(_evento, ouvinte) {
    this.ouvintes.push(ouvinte);
    return { remove: () => (this.ouvintes = this.ouvintes.filter((o) => o !== ouvinte)) };
  }
  emitir(status) {
    for (const o of [...this.ouvintes]) o({ playing: false, didJustFinish: false, error: null, ...status });
  }
  play() {
    this.tocou = true;
    const comportamento = ajuste.comportamento;
    queueMicrotask(() => {
      if (comportamento === "erro") this.emitir({ error: "não carregou" });
      else {
        this.emitir({ playing: true });
        if (comportamento === "termina") queueMicrotask(() => this.emitir({ didJustFinish: true }));
      }
    });
  }
  pause() {}
  remove() {
    this.removido = true;
  }
}

export function createAudioPlayer(fonte) {
  return new PlayerFalso(fonte);
}

export const modos = [];

export async function setAudioModeAsync(modo) {
  modos.push(modo);
}
