import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";

interface Props extends TextInputProps {
  rotulo: string;
}

/** Campo de texto com rótulo sempre visível (não só placeholder). */
export function Campo({ rotulo, style, ...props }: Props) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSuave}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 8 },
  rotulo: { fontSize: fontes.corpo, fontWeight: "700", color: cores.texto },
  input: {
    minHeight: toqueMinimo,
    borderWidth: 2,
    borderColor: cores.primaria,
    borderRadius: raios.md,
    paddingHorizontal: 16,
    fontSize: fontes.corpo,
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
});
