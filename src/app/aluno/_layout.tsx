import { Redirect, Stack } from "expo-router";
import { useAreaProtegida } from "@/hooks/useAreaProtegida";
import { cores } from "@/theme/tokens";

/** Área do aluno: só entra quem está logado com perfil ALUNO. Perfil errado: manda para a área certa. */
export default function Layout() {
  const acesso = useAreaProtegida("ALUNO");
  if (acesso === "carregando") return null;
  if (acesso !== "liberado") return <Redirect href={acesso} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
