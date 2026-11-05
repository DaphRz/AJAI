import type { OpcoesFala, ProvedorVoz } from "./provedor";

/** Provedor provisório: não fala, só registra. Serve para desenvolver sem áudio. */
export const provedorConsole: ProvedorVoz = {
  nome: "console",
  async falar(texto: string, opcoes: OpcoesFala = {}) {
    console.log(`[voz:console] "${texto}"`, opcoes);
  },
  parar() {
    // nada a interromper
  },
};
