import { Redirect, Stack } from "expo-router";
import { useSessao } from "@/context/sessao";
import { rotaInicial } from "@/services/auth";
import { cores } from "@/theme/tokens";

/** Área do administrador: só entra quem está logado com perfil ADMINISTRADOR. */
export default function AdminLayout() {
  const { usuario, carregando } = useSessao();
  if (carregando) return null;
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.perfil !== "ADMINISTRADOR") return <Redirect href={rotaInicial(usuario)} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
