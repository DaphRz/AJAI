/**
 * Cliente da API do AJAI (servidor Fastify em server/).
 * - Endereço: EXPO_PUBLIC_API_URL (.env.local). Sem ela, usa o mesmo computador que serve o
 *   app no Expo (o IP do Metro) na porta 3333, o que já funciona no celular na mesma Wi-Fi.
 * - Envia o token de login no cabeçalho Authorization.
 * - Toda falha vira um ErroDaApi com mensagem curta e amigável, pronta para mostrar na tela.
 * Só os arquivos de src/services/ chamam a API; telas nunca usam fetch direto.
 */
import Constants from "expo-constants";
import { Platform } from "react-native";

const PORTA_PADRAO = 3333;
const TEMPO_LIMITE_MS = 15000;

function urlBase(): string {
  const configurada = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configurada) return configurada.replace(/\/+$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:${PORTA_PADRAO}`;
  }
  const hostMetro = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${hostMetro || "localhost"}:${PORTA_PADRAO}`;
}

export const URL_API = urlBase();

/** Erro com mensagem já pronta para o usuário (nunca técnica). */
export class ErroDaApi extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

const MENSAGEM_SEM_CONEXAO = "Não conseguimos falar com o servidor. Confira a internet e tente de novo.";
const MENSAGEM_PADRAO = "Não deu certo agora. Tente de novo.";

let token: string | null = null;
let aoExpirar: (() => void) | null = null;

/** Define o token enviado nas próximas chamadas (null = sem login). */
export function definirToken(novo: string | null): void {
  token = novo;
}

/** Chamada quando o servidor recusa o token (vencido ou conta desativada). */
export function quandoSessaoExpirar(funcao: (() => void) | null): void {
  aoExpirar = funcao;
}

type Metodo = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export async function chamarApi<T>(caminho: string, opcoes: { metodo?: Metodo; corpo?: unknown } = {}): Promise<T> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  const enviouToken = token !== null;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers: {
        Accept: "application/json",
        ...(opcoes.corpo !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ErroDaApi(0, MENSAGEM_SEM_CONEXAO);
  } finally {
    clearTimeout(relogio);
  }

  let dados: unknown = null;
  try {
    dados = await resposta.json();
  } catch {
    // resposta sem JSON (ex.: proxy fora do ar)
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && enviouToken) aoExpirar?.();
    const mensagem =
      dados && typeof dados === "object" && "erro" in dados && typeof dados.erro === "string"
        ? dados.erro
        : MENSAGEM_PADRAO;
    throw new ErroDaApi(resposta.status, mensagem);
  }
  return dados as T;
}

/** Mensagem para mostrar ao usuário a partir de qualquer erro. */
export function mensagemDeErro(erro: unknown): string {
  return erro instanceof ErroDaApi ? erro.message : MENSAGEM_PADRAO;
}
