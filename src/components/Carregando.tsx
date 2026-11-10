import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { Carregamento } from "@/hooks/useCarregar";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";
import { BotaoAudio } from "./BotaoAudio";
import { Tela } from "./Tela";

interface Props<T> {
  estado: Carregamento<T>;
  /** O que mostrar quando os dados chegam. */
  children: (dados: T) => ReactNode;
  /** Telas do aluno: mostra "Ouvir ajuda" também na espera e na falha (RNF04). */
  comAudio?: boolean;
}

/**
 * Moldura das telas que dependem da API: "Carregando..." enquanto espera e, se falhar,
 * uma mensagem amigável que se toca para tentar de novo.
 */
export function Carregando<T>({ estado, children, comAudio = false }: Props<T>) {
  if (estado.dados !== undefined) return <>{children(estado.dados)}</>;

  if (estado.erro) {
    return (
      <Tela rodape={comAudio ? <BotaoAudio texto={estado.erro} /> : undefined}>
        <View style={styles.centro}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={estado.erro}
            onPress={estado.tentarDeNovo}
            style={({ pressed }) => [styles.falha, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.textoFalha}>{estado.erro}</Text>
          </Pressable>
        </View>
      </Tela>
    );
  }

  return (
    <Tela rodape={comAudio ? <BotaoAudio texto="Carregando. Espere um pouquinho." /> : undefined}>
      <View style={styles.centro} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={styles.texto}>Carregando...</Text>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  texto: { fontSize: fontes.subtitulo, color: cores.texto, fontWeight: "600" },
  falha: {
    minHeight: toqueMinimo * 2,
    justifyContent: "center",
    padding: 20,
    borderRadius: raios.lg,
    borderWidth: 2,
    borderColor: cores.primaria,
    backgroundColor: cores.superficie,
  },
  textoFalha: { fontSize: fontes.subtitulo, color: cores.texto, fontWeight: "700", textAlign: "center" },
});
