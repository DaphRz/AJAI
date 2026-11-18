// Registro dos sintetizadores do servidor. É AQUI que se troca a API de voz:
//   1. crie server/src/voz/<api>.ts implementando SintetizadorVoz;
//   2. adicione em `fabricas` abaixo;
//   3. mude VOZ_PROVEDOR em server/.env.
// Nada mais muda (nem a rota /narracao, nem o app).
import { config } from "../config.ts";
import { criarSintetizadorAzure } from "./azure.ts";
import { criarSintetizadorPiper } from "./piper.ts";
import type { SintetizadorVoz } from "./sintetizador.ts";

export type { SintetizadorVoz } from "./sintetizador.ts";

const fabricas: Record<string, () => SintetizadorVoz> = {
  azure: criarSintetizadorAzure, // padrão desde 18/11: voz neural pt-BR da Microsoft
  piper: criarSintetizadorPiper, // alternativa local, sem conta (qualidade menor)
};

let ativo: SintetizadorVoz | null | undefined;

/** Sintetizador escolhido em VOZ_PROVEDOR, ou null se a narração do servidor estiver desligada. */
export function sintetizadorAtivo(): SintetizadorVoz | null {
  if (ativo !== undefined) return ativo;
  const nome = config.voz.provedor;
  if (!nome) {
    ativo = null;
  } else if (!fabricas[nome]) {
    console.warn(`VOZ_PROVEDOR="${nome}" não existe (disponíveis: ${Object.keys(fabricas).join(", ")}). Narração do servidor desligada.`);
    ativo = null;
  } else {
    ativo = fabricas[nome]();
  }
  return ativo;
}

/** Troca o sintetizador em tempo de execução (testes). null = desligado; undefined = volta ao do .env. */
export function usarSintetizador(sintetizador: SintetizadorVoz | null | undefined): void {
  ativo = sintetizador;
}
