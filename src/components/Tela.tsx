import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cores, espacos, margensTela } from "@/theme/tokens";

interface Props {
  children: ReactNode;
  /** Conteúdo fixo no rodapé (ex.: botão "Ouvir ajuda"). */
  rodape?: ReactNode;
  rolavel?: boolean;
}

/** Moldura padrão de toda tela: fundo creme, área segura e margens. */
export function Tela({ children, rodape, rolavel = true }: Props) {
  const conteudo = <View style={styles.conteudo}>{children}</View>;
  return (
    <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
      {rolavel ? (
        <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled">
          {conteudo}
        </ScrollView>
      ) : (
        conteudo
      )}
      {rodape ? <View style={styles.rodape}>{rodape}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  rolagem: { flexGrow: 1 },
  // Figma: 28 dos lados, 20 em cima e embaixo, 16 entre os blocos.
  conteudo: {
    flex: 1,
    paddingHorizontal: margensTela.horizontal,
    paddingVertical: margensTela.vertical,
    gap: espacos.md,
  },
  // Figma "Ajuda por áudio": 24 dos lados e 18 em cima e embaixo.
  rodape: { paddingHorizontal: margensTela.rodapeHorizontal, paddingVertical: margensTela.rodapeVertical },
});
