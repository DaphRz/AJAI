import { Pressable, StyleSheet, Text, View } from "react-native";
import { falar } from "@/services/narracao";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";

interface Props {
  /** Texto que será narrado ao tocar. */
  texto: string;
  titulo?: string;
}

/**
 * Cartão amarelo "Ouvir ajuda / Toque para escutar" do Figma.
 * Deve existir em todas as telas do aluno (RNF04).
 */
export function BotaoAudio({ texto, titulo = "Ouvir ajuda" }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. Toque para escutar.`}
      onPress={() => falar(texto)}
      style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.8 }]}
    >
      {/* TODO: trocar o emoji pelo ícone de alto-falante do Figma */}
      <Text style={styles.icone} accessibilityElementsHidden>
        🔊
      </Text>
      <View>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.legenda}>Toque para escutar</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    minHeight: toqueMinimo + 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    backgroundColor: cores.audioFundo,
    borderColor: cores.audioBorda,
    borderWidth: 2,
    borderRadius: raios.lg,
  },
  icone: { fontSize: 32 },
  titulo: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
  legenda: { fontSize: fontes.legenda, color: cores.texto },
});
