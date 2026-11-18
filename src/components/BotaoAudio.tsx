import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEstilos } from "@/context/preferencias";
import { falar, pararFala } from "@/services/narracao";
import { alturaBotaoGrande, cores, familias, raios, type Fontes } from "@/theme/tokens";

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
      <Feather
        name={falando ? "stop-circle" : "volume-2"}
        size={44}
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
    // Figma "Botão ouvir ajuda": 104 de altura, padding 20, ícone 44 e espaço de 18.
    cartao: {
      minHeight: alturaBotaoGrande + 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      padding: 20,
      backgroundColor: cores.audioFundo,
      borderColor: cores.audioBorda,
      borderWidth: 2,
      borderRadius: raios.botao,
    },
    textos: { flex: 1, gap: 4 },
    titulo: { fontSize: fontes.titulo, fontFamily: familias.negrito, color: cores.texto },
    legenda: { fontSize: fontes.corpo, fontFamily: familias.regular, color: cores.texto },
  });
