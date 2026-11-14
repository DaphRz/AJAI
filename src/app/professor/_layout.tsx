import { Redirect, Stack } from "expo-router";
import { useAreaProtegida } from "@/hooks/useAreaProtegida";
import { cores } from "@/theme/tokens";

/**
 * Área do professor (RF20): só com perfil PROFESSOR e conta APROVADA pela instituição (senão, /espera).
 * Pilha (Stack) com as abas no grupo (abas) e, por cima delas, as telas internas (métricas do aluno,
 * Meus alunos, trocar senha). No SDK 58, tela escondida das abas (`href: null`) REDIRECIONA para a
 * primeira aba; por isso as telas internas ficam fora do Tabs.
 */
export default function ProfessorLayout() {
  const acesso = useAreaProtegida("PROFESSOR");
  if (acesso === "carregando") return null;
  if (acesso !== "liberado") return <Redirect href={acesso} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />;
}
