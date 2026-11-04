import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { cores, fontes, raios } from "@/theme/tokens";

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.titulo}>
      {children}
    </Text>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitulo}>{children}</Text>;
}

export function Corpo({ children }: { children: ReactNode }) {
  return <Text style={styles.corpo}>{children}</Text>;
}

/** Logo "AJAI" do cabeçalho. TODO: usar o ícone do livro exportado do Figma. */
export function Logo() {
  return (
    <View style={styles.logo} accessibilityLabel="AJAI">
      <View style={styles.logoIcone}>
        <Text style={{ fontSize: 22 }}>📖</Text>
      </View>
      <Text style={styles.logoTexto}>AJAI</Text>
    </View>
  );
}

export function Cartao({ children, destaque = false }: { children: ReactNode; destaque?: boolean }) {
  return <View style={[styles.cartao, destaque && styles.cartaoDestaque]}>{children}</View>;
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.tituloGrande, fontWeight: "800", color: cores.texto },
  subtitulo: { fontSize: fontes.subtitulo, color: cores.textoSuave },
  corpo: { fontSize: fontes.corpo, color: cores.texto },
  logo: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: cores.superficieSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTexto: { fontSize: fontes.titulo, fontWeight: "800", color: cores.primaria },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 2,
    borderRadius: raios.lg,
    padding: 16,
    gap: 6,
  },
  cartaoDestaque: { backgroundColor: cores.superficieSuave, borderColor: cores.superficieSuave },
});
