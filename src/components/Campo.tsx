import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { familias, cores, raios, toqueMinimo, type Fontes } from "@/theme/tokens";
import { useEstilos } from "@/context/preferencias";

interface Props extends TextInputProps {
  rotulo: string;
}

/** Campo de texto com rótulo sempre visível (não só placeholder). */
export function Campo({ rotulo, style, ...props }: Props) {
  const styles = useEstilos(criarEstilos);
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

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    grupo: { gap: 8 },
    rotulo: { fontSize: fontes.corpo, fontFamily: familias.negrito, color: cores.texto },
    input: {
      minHeight: toqueMinimo,
      borderWidth: 2,
      borderColor: cores.primaria,
      borderRadius: raios.md,
      paddingHorizontal: 16,
      fontFamily: familias.regular,
      fontSize: fontes.corpo,
      color: cores.texto,
      backgroundColor: cores.superficie,
    },
  });
