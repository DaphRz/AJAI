import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEstilos } from "@/context/preferencias";
import { falar, pararFala } from "@/services/narracao";
import { cores, raios, toqueMinimo, type Fontes } from "@/theme/tokens";

interface Props {
  /** Texto que será narrado ao tocar. */
  texto: string;
  titulo?: string;
}

/**
 * Cartão amarelo "Ouvir ajuda / Toque para escutar" do Figma.
 * Deve existir em todas as telas do aluno (RNF04).
 * Enquanto fala, mostra "Falando..." (texto, não só ícone) e um toque para a fala.
 * Sair da tela (ou o botão sumir) também para a fala.
 */
export function BotaoAudio({ texto, titulo = "Ouvir ajuda" }: Props) {
  const styles = useEstilos(criarEstilos);
  const [falando, setFalando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => pararFala();
    }, []),
  );

  async function tocar() {
    if (falando) {
      pararFala();
      return;
    }
    setFalando(true);
    try {
      await falar(texto);
    } finally {
      // A Promise também termina quando outra fala começa ou alguém chama pararFala().
      setFalando(false);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={falando ? `${titulo}. Falando. Toque para parar.` : `${titulo}. Toque para escutar.`}
      onPress={tocar}
      style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.8 }]}
    >
      <Ionicons
        name={falando ? "stop-circle" : "volume-high"}
        size={36}
        color={cores.texto}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={styles.textos}>
        <Text style={styles.titulo}>{falando ? "Falando..." : titulo}</Text>
        <Text style={styles.legenda}>{falando ? "Toque para parar" : "Toque para escutar"}</Text>
      </View>
    </Pressable>
  );
}

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    cartao: {
      minHeight: toqueMinimo + 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: cores.audioFundo,
      borderColor: cores.audioBorda,
      borderWidth: 2,
      borderRadius: raios.lg,
    },
    textos: { flexShrink: 1 },
    titulo: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
    legenda: { fontSize: fontes.legenda, color: cores.texto },
  });
