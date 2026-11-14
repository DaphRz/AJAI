import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { useAreaProtegida } from "@/hooks/useAreaProtegida";
import { cores } from "@/theme/tokens";

/** Ícone da aba (a aba já tem o título escrito; o ícone é só decorativo). */
function icone(nome: ComponentProps<typeof Ionicons>["name"]) {
  function IconeAba({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nome} color={color as string} size={size} />;
  }
  return IconeAba;
}

/**
 * Área do professor (RF20): abas Acompanhamento / Relatórios / Conta, como no Figma.
 * Só com perfil PROFESSOR e conta APROVADA pela instituição (senão, /espera). Passo 3.1.
 */
export default function ProfessorLayout() {
  const acesso = useAreaProtegida("PROFESSOR");
  if (acesso === "carregando") return null;
  if (acesso !== "liberado") return <Redirect href={acesso} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
        tabBarStyle: { minHeight: 72, backgroundColor: cores.superficie },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Acompanhamento", tabBarIcon: icone("grid") }} />
      <Tabs.Screen name="relatorios" options={{ title: "Relatórios", tabBarIcon: icone("bar-chart") }} />
      <Tabs.Screen name="conta" options={{ title: "Conta", tabBarIcon: icone("person") }} />
      <Tabs.Screen name="aluno/[id]" options={{ href: null }} />
      <Tabs.Screen name="senha" options={{ href: null }} />
      <Tabs.Screen name="alunos" options={{ href: null }} />
    </Tabs>
  );
}
