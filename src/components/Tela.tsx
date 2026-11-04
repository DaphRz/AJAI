import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cores, espacos } from "@/theme/tokens";

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
  conteudo: { flex: 1, padding: espacos.lg, gap: espacos.md },
  rodape: { paddingHorizontal: espacos.md, paddingBottom: espacos.md },
});
