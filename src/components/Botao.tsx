import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { useEstilos } from "@/context/preferencias";
import { alturaBotaoGrande, cores, familias, raios, toqueMinimo, type Fontes } from "@/theme/tokens";

type Variante = "primario" | "secundario" | "link";

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  /** Botão de destaque (ex.: "CONTINUAR" na home do aluno): 80 de altura e letra 32, como no Figma. */
  grande?: boolean;
  /** Letra menor (20), para botões no cabeçalho ("Minha conta" na home do aluno). */
  compacto?: boolean;
  /** Seta para a direita depois do texto ("CONTINUAR →" no Figma). Decorativa: o leitor de tela lê só o título. */
  seta?: boolean;
  desabilitado?: boolean;
  /** Texto lido pelo leitor de tela, se diferente do título. */
  rotuloAcessivel?: string;
}

/**
 * Botão com texto escrito (RNF03: não depender só de ícones). Figma (Home do aluno):
 * primário verde com letra branca em negrito; secundário branco com borda verde e letra seminegrito;
 * cantos de 22.
 */
export function Botao({
  titulo,
  onPress,
  variante = "primario",
  grande = false,
  seta = false,
  compacto = false,
  desabilitado = false,
  rotuloAcessivel,
}: Props) {
  const { styles, rotulo } = useEstilos(criarEstilos);
  const corDoTexto = variante === "primario" ? cores.primariaTexto : variante === "link" ? cores.primaria : cores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fundo[variante],
        grande && styles.grande,
        (pressed || desabilitado) && styles.apertado,
      ]}
    >
      <Text style={[rotulo[variante], compacto && styles.rotuloCompacto, grande && styles.rotuloGrande]}>{titulo}</Text>
      {seta ? (
        <Ionicons
          name="arrow-forward"
          size={grande ? 32 : 26}
          color={corDoTexto}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </Pressable>
  );
}

const criarEstilos = (fontes: Fontes) => ({
  styles: criarBase(fontes),
  rotulo: criarRotulo(fontes),
});

const criarBase = (fontes: Fontes) =>
  StyleSheet.create({
    base: {
      minHeight: toqueMinimo,
      borderRadius: raios.botao,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    grande: { minHeight: alturaBotaoGrande },
    apertado: { opacity: 0.7 },
    rotuloCompacto: { fontSize: fontes.corpo },
    rotuloGrande: { fontSize: fontes.botaoGrande, fontFamily: familias.negrito },
  });

const fundo = StyleSheet.create({
  primario: { backgroundColor: cores.primaria },
  secundario: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.primaria },
  link: { backgroundColor: "transparent" },
});

const criarRotulo = (fontes: Fontes) =>
  StyleSheet.create({
    primario: {
      fontSize: fontes.subtitulo,
      fontFamily: familias.negrito,
      color: cores.primariaTexto,
      textAlign: "center",
      flexShrink: 1,
    },
    secundario: {
      fontSize: fontes.subtitulo,
      fontFamily: familias.seminegrito,
      color: cores.texto,
      textAlign: "center",
      flexShrink: 1,
    },
    link: {
      fontSize: fontes.corpo,
      fontFamily: familias.seminegrito,
      color: cores.primaria,
      textAlign: "center",
      textDecorationLine: "underline",
      flexShrink: 1,
    },
  });
