import { Redirect, Stack } from "expo-router";
import { useAreaProtegida } from "@/hooks/useAreaProtegida";
import { cores } from "@/theme/tokens";

/** Área da instituição (Passo 3.1): só com perfil INSTITUICAO e cadastro APROVADO pelo AJAI (senão, /espera). */
export default function Layout() {
  const acesso = useAreaProtegida("INSTITUICAO");
  if (acesso === "carregando") return null;
  if (acesso !== "liberado") return <Redirect href={acesso} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
