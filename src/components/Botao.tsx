import { Pressable, StyleSheet, Text } from "react-native";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";

type Variante = "primario" | "secundario" | "link";

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  /** Botão de destaque gigante (ex.: "CONTINUAR" na home do aluno). */
  grande?: boolean;
  desabilitado?: boolean;
  /** Texto lido pelo leitor de tela, se diferente do título. */
  rotuloAcessivel?: string;
}

/** Botão grande e com texto escrito (RNF03: não depender só de ícones). */
export function Botao({
  titulo,
  onPress,
  variante = "primario",
  grande = false,
  desabilitado = false,
  rotuloAcessivel,
}: Props) {
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
      <Text style={[styles.rotulo, rotulo[variante], grande && styles.rotuloGrande]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: toqueMinimo,
    borderRadius: raios.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  grande: { minHeight: 96, borderRadius: raios.lg },
  apertado: { opacity: 0.7 },
  rotulo: { fontSize: fontes.subtitulo, fontWeight: "700", textAlign: "center" },
  rotuloGrande: { fontSize: fontes.titulo, letterSpacing: 1 },
});

const fundo = StyleSheet.create({
  primario: { backgroundColor: cores.primaria },
  secundario: { backgroundColor: cores.superficie, borderWidth: 2, borderColor: cores.primaria },
  link: { backgroundColor: "transparent" },
});

const rotulo = StyleSheet.create({
  primario: { color: cores.primariaTexto },
  secundario: { color: cores.primaria },
  link: { color: cores.primaria, fontSize: fontes.corpo },
});
