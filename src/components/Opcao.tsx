import { Pressable, StyleSheet, Text } from "react-native";
import { familias, cores, toqueMinimo, type Fontes } from "@/theme/tokens";
import { useEstilos } from "@/context/preferencias";

interface Props {
  texto: string;
  ativo: boolean;
  onPress: () => void;
  rotuloAcessivel?: string;
}

/** Opção de um grupo (filtro, período, turma): pílula com texto; a escolhida fica verde. */
export function Opcao({ texto, ativo, onPress, rotuloAcessivel }: Props) {
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? texto}
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={({ pressed }) => [styles.opcao, ativo && styles.ativa, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.texto, ativo && { color: cores.primariaTexto }]}>{texto}</Text>
    </Pressable>
  );
}

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    opcao: {
      minHeight: toqueMinimo,
      justifyContent: "center",
      borderWidth: 2,
      borderColor: cores.borda,
      borderRadius: 999,
      paddingHorizontal: 18,
      backgroundColor: cores.superficie,
    },
    ativa: { backgroundColor: cores.primaria, borderColor: cores.primaria },
    texto: { fontSize: fontes.legenda, fontFamily: familias.negrito, color: cores.texto },
  });
