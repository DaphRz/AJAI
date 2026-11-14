import { Redirect, Stack } from "expo-router";
import { useAreaProtegida } from "@/hooks/useAreaProtegida";
import { cores } from "@/theme/tokens";

/** Área do responsável (Passo 3.1): só com perfil RESPONSAVEL. */
export default function Layout() {
  const acesso = useAreaProtegida("RESPONSAVEL");
  if (acesso === "carregando") return null;
  if (acesso !== "liberado") return <Redirect href={acesso} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
