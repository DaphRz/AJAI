import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { cores } from "@/theme/tokens";

/** Ícone da aba (a aba já tem o título escrito; o ícone é só decorativo). */
function icone(nome: ComponentProps<typeof Ionicons>["name"]) {
  function IconeAba({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nome} color={color as string} size={size} />;
  }
  return IconeAba;
}

/**
 * Abas do professor: Acompanhamento / Turmas / Relatórios / Conta (Figma: Acompanhamento, Relatórios
 * e Conta; Turmas entrou no passo 8). A proteção de acesso fica no _layout de professor/.
 * Não use `href: null` aqui: no SDK 58 a tela escondida redireciona para a 1ª aba. Tela que não é
 * aba vai em src/app/professor/ (fora deste grupo).
 */
export default function AbasProfessor() {
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
      <Tabs.Screen name="turmas" options={{ title: "Turmas", tabBarIcon: icone("people") }} />
      <Tabs.Screen name="relatorios" options={{ title: "Relatórios", tabBarIcon: icone("bar-chart") }} />
      <Tabs.Screen name="conta" options={{ title: "Conta", tabBarIcon: icone("person") }} />
    </Tabs>
  );
}
