import { Redirect, Stack } from "expo-router";
import { useSessao } from "@/context/sessao";
import { cores } from "@/theme/tokens";

/** Área do aluno: só entra quem está logado com perfil ALUNO. */
export default function AlunoLayout() {
  const { usuario } = useSessao();
  if (!usuario || usuario.perfil !== "ALUNO") {
    return <Redirect href="/login" />;
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
