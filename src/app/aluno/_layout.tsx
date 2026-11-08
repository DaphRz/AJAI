import { Redirect, Stack } from "expo-router";
import { useSessao } from "@/context/sessao";
import { rotaInicial } from "@/services/auth";
import { cores } from "@/theme/tokens";

/** Área do aluno: só entra quem está logado com perfil ALUNO. */
export default function AlunoLayout() {
  const { usuario, carregando } = useSessao();
  if (carregando) return null;
  if (!usuario) return <Redirect href="/login" />;
  // Perfil errado: manda para a área certa (cada perfil só vê a sua).
  if (usuario.perfil !== "ALUNO") return <Redirect href={rotaInicial(usuario)} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
