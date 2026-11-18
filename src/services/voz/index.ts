/**
 * Registro de provedores de voz. É AQUI que se troca a forma de narrar.
 *
 * Para adicionar um provedor novo:
 *   1. crie src/services/voz/provedorXxx.ts implementando ProvedorVoz;
 *   2. importe e adicione em `provedores` abaixo;
 *   3. mude `PROVEDOR_PADRAO`.
 * Nada mais no app precisa mudar.
 */
import type { ProvedorVoz } from "./provedor";
import { provedorConsole } from "./provedorConsole";
import { provedorExpoSpeech } from "./provedorExpoSpeech";
import { provedorServidor } from "./provedorServidor";

export type { OpcoesFala, ProvedorVoz } from "./provedor";

const provedores: Record<string, ProvedorVoz> = {
  [provedorServidor.nome]: provedorServidor, // voz neural da Azure gerada no servidor (reserva: expo-speech)
  [provedorExpoSpeech.nome]: provedorExpoSpeech, // voz do aparelho (alternativa e reserva)
  [provedorConsole.nome]: provedorConsole, // desenvolvimento: só escreve no console
};

/**
 * Provedor usado pelo app (passo 10): "servidor" = a voz gerada no servidor (Azure, desde 18/11).
 * Para usar só a voz do aparelho, troque por "expo-speech".
 */
export const PROVEDOR_PADRAO = "servidor";

let ativo: ProvedorVoz = provedores[PROVEDOR_PADRAO];

export function provedorAtual(): ProvedorVoz {
  return ativo;
}

/** Troca o provedor em tempo de execução (útil em testes). */
export function usarProvedor(nome: string): void {
  const encontrado = provedores[nome];
  if (!encontrado) {
    throw new Error(`Provedor de voz desconhecido: "${nome}". Disponíveis: ${Object.keys(provedores).join(", ")}`);
  }
  ativo?.parar();
  ativo = encontrado;
}
