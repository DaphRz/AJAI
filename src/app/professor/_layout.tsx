import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useSessao } from "@/context/sessao";
import { cores } from "@/theme/tokens";

/** Área do professor (RF20): abas Acompanhamento / Relatórios / Conta, como no Figma. */
export default function ProfessorLayout() {
  const { usuario } = useSessao();
  if (!usuario || usuario.perfil !== "PROFESSOR") {
    return <Redirect href="/login" />;
  }

  // TODO: trocar os emojis pelos ícones do Figma.
  const icone = (simbolo: string) => () => <Text style={{ fontSize: 22 }}>{simbolo}</Text>;

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
      <Tabs.Screen name="index" options={{ title: "Acompanhamento", tabBarIcon: icone("▦") }} />
      <Tabs.Screen name="relatorios" options={{ title: "Relatórios", tabBarIcon: icone("📊") }} />
      <Tabs.Screen name="conta" options={{ title: "Conta", tabBarIcon: icone("👤") }} />
      <Tabs.Screen name="aluno/[id]" options={{ href: null }} />
    </Tabs>
  );
}
