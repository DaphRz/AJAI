// Imagens das atividades. Atividade.urlImagem e Alternativa.urlImagem guardam um endereço completo
// (https://...) ou um caminho relativo à API ("/..."). O servidor ainda não serve imagens.
import { URL_API } from "./api";

/** Endereço completo da imagem, ou undefined se a atividade/alternativa não tem imagem. */
export function enderecoDaImagem(urlImagem?: string | null): string | undefined {
  if (!urlImagem) return undefined;
  if (/^https?:\/\//.test(urlImagem)) return urlImagem;
  return `${URL_API}${urlImagem.startsWith("/") ? "" : "/"}${urlImagem}`;
}
