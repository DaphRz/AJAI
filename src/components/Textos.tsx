import { Ionicons } from "@expo/vector-icons";
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

/** Logo "AJAI" do cabeçalho. */
export function Logo() {
  return (
    <View style={styles.logo} accessibilityLabel="AJAI">
      <View style={styles.logoIcone} accessibilityElementsHidden importantForAccessibility="no">
        <Ionicons name="book" size={24} color={cores.primaria} />
      </View>
      <Text style={styles.logoTexto}>AJAI</Text>
    </View>
  );
}

export function Cartao({ children, destaque = false }: { children: ReactNode; destaque?: boolean }) {
  return <View style={[styles.cartao, destaque && styles.cartaoDestaque]}>{children}</View>;
}

/**
 * Mensagem curta para o usuário (ex.: resposta do servidor). O leitor de tela anuncia sozinho.
 * "atencao" para pedir que confira algo (nunca chame de "erro" na tela); "sucesso" para confirmar.
 */
export function Aviso({ children, tipo = "atencao" }: { children: ReactNode; tipo?: "atencao" | "sucesso" }) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.aviso, tipo === "sucesso" ? styles.avisoSucesso : styles.avisoAtencao]}
    >
      <Text style={[styles.avisoTexto, { color: tipo === "sucesso" ? cores.sucesso : cores.erro }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: { borderRadius: raios.md, borderWidth: 2, padding: 12 },
  avisoAtencao: { backgroundColor: cores.superficie, borderColor: cores.erro },
  avisoSucesso: { backgroundColor: cores.superficieSuave, borderColor: cores.sucesso },
  avisoTexto: { fontSize: fontes.corpo, fontWeight: "600" },
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
