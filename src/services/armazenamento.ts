/**
 * Guarda o login no aparelho: token e uma cópia do usuário (para abrir sem internet).
 * Celular: expo-secure-store (área protegida do sistema). Navegador: localStorage, porque o
 * expo-secure-store não funciona na web (a versão web é só para desenvolvimento).
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHAVE_TOKEN = "ajai.token";
const CHAVE_USUARIO = "ajai.usuario";

const naWeb = Platform.OS === "web";

async function ler(chave: string): Promise<string | null> {
  try {
    if (naWeb) return globalThis.localStorage?.getItem(chave) ?? null;
    return await SecureStore.getItemAsync(chave);
  } catch {
    return null;
  }
}

async function gravar(chave: string, valor: string | null): Promise<void> {
  try {
    if (naWeb) {
      if (valor === null) globalThis.localStorage?.removeItem(chave);
      else globalThis.localStorage?.setItem(chave, valor);
    } else if (valor === null) {
      await SecureStore.deleteItemAsync(chave);
    } else {
      await SecureStore.setItemAsync(chave, valor);
    }
  } catch {
    // Sem onde guardar: o login vale só até fechar o app.
  }
}

export interface LoginGuardado<U> {
  token: string;
  usuario: U | null;
}

export async function lerLogin<U>(): Promise<LoginGuardado<U> | null> {
  const token = await ler(CHAVE_TOKEN);
  if (!token) return null;
  const texto = await ler(CHAVE_USUARIO);
  let usuario: U | null = null;
  try {
    usuario = texto ? (JSON.parse(texto) as U) : null;
  } catch {
    usuario = null;
  }
  return { token, usuario };
}

export async function guardarLogin<U>(token: string, usuario: U): Promise<void> {
  await gravar(CHAVE_TOKEN, token);
  await gravar(CHAVE_USUARIO, JSON.stringify(usuario));
}

export async function apagarLogin(): Promise<void> {
  await gravar(CHAVE_TOKEN, null);
  await gravar(CHAVE_USUARIO, null);
}
