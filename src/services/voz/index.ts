/**
 * Registro de provedores de voz. É AQUI que se troca a forma de narrar.
 *
 * Para adicionar um provedor novo (ex.: expo-speech):
 *   1. crie src/services/voz/provedorExpoSpeech.ts implementando ProvedorVoz;
 *   2. importe e adicione em `provedores` abaixo;
 *   3. mude `PROVEDOR_PADRAO`.
 * Nada mais no app precisa mudar.
 */
import type { ProvedorVoz } from "./provedor";
import { provedorConsole } from "./provedorConsole";

export type { OpcoesFala, ProvedorVoz } from "./provedor";

const provedores: Record<string, ProvedorVoz> = {
  [provedorConsole.nome]: provedorConsole,
  // TODO (passo 10): "servidor": provedorServidor (API de voz ainda não definida), "expo-speech": provedorExpoSpeech (alternativa e reserva)
};

/** Provedor usado pelo app. TODO (passo 10): escolher conforme a API de voz (ainda não definida); "expo-speech" é a alternativa. */
export const PROVEDOR_PADRAO = "console";

let ativo: ProvedorVoz = provedores[PROVEDOR_PADRAO];

export function provedorAtual(): ProvedorVoz {
  return ativo;
}

/** Troca o provedor em tempo de execução (útil em testes e na tela de preferências). */
export function usarProvedor(nome: string): void {
  const encontrado = provedores[nome];
  if (!encontrado) {
    throw new Error(`Provedor de voz desconhecido: "${nome}". Disponíveis: ${Object.keys(provedores).join(", ")}`);
  }
  ativo?.parar();
  ativo = encontrado;
}
