import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useSessao } from "@/context/sessao";
import { rotaInicial } from "@/services/auth";
import { cores } from "@/theme/tokens";

// TODO: trocar os emojis pelos ícones do Figma.
function icone(simbolo: string) {
  function IconeAba() {
    return <Text style={{ fontSize: 22 }}>{simbolo}</Text>;
  }
  return IconeAba;
}

/** Área do professor (RF20): abas Acompanhamento / Relatórios / Conta, como no Figma. */
export default function ProfessorLayout() {
  const { usuario, carregando } = useSessao();
  if (carregando) return null;
  if (!usuario) return <Redirect href="/login" />;
  // Perfil errado: manda para a área certa (cada perfil só vê a sua).
  if (usuario.perfil !== "PROFESSOR") return <Redirect href={rotaInicial(usuario)} />;

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
      <Tabs.Screen name="senha" options={{ href: null }} />
      <Tabs.Screen name="contas/index" options={{ href: null }} />
      <Tabs.Screen name="contas/nova" options={{ href: null }} />
      <Tabs.Screen name="contas/[id]" options={{ href: null }} />
    </Tabs>
  );
}
