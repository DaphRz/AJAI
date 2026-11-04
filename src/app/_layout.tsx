import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessaoProvider } from "@/context/sessao";
import { cores } from "@/theme/tokens";

export default function RootLayout() {
  return (
    <SessaoProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </SessaoProvider>
  );
}
