import { Redirect, Stack } from "expo-router";
import { useAreaProtegida } from "@/hooks/useAreaProtegida";
import { cores } from "@/theme/tokens";

/** Área do administrador: só entra quem está logado com perfil ADMINISTRADOR. Perfil errado: manda para a área certa. */
export default function Layout() {
  const acesso = useAreaProtegida("ADMINISTRADOR");
  if (acesso === "carregando") return null;
  if (acesso !== "liberado") return <Redirect href={acesso} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
