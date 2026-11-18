import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { PreferenciasProvider } from "@/context/preferencias";
import { SessaoProvider, useSessao } from "@/context/sessao";
import { cores } from "@/theme/tokens";

// Mantém a splash do sistema até o login guardado ser restaurado e a fonte Inter carregar.
void SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { carregando } = useSessao();
  // Fonte do Figma (Inter). Um arquivo por peso: os estilos usam `familias` de theme/tokens.
  // Se a fonte falhar, o app segue com a fonte do sistema.
  const [fonteCarregada, falhaNaFonte] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  const pronto = !carregando && (fonteCarregada || falhaNaFonte !== null);

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

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
      <PreferenciasProvider>
        <StatusBar style="dark" />
        <Navegacao />
      </PreferenciasProvider>
    </SessaoProvider>
  );
}
