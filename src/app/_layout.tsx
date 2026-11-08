import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SessaoProvider, useSessao } from "@/context/sessao";
import { cores } from "@/theme/tokens";

// Mantém a splash do sistema até o login guardado ser restaurado.
void SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { carregando } = useSessao();

  useEffect(() => {
    if (!carregando) void SplashScreen.hideAsync();
  }, [carregando]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SessaoProvider>
      <StatusBar style="dark" />
      <Navegacao />
    </SessaoProvider>
  );
}
