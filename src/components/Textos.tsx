import { Image } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useEstilos } from "@/context/preferencias";
import { familias, cores, raios, type Fontes } from "@/theme/tokens";

/**
 * Título da tela. `compacto` para título de uma palavra longa ("Acompanhamento"), que no tamanho
 * grande não cabe num celular estreito (360 de largura) e quebra no meio da palavra. Usa a letra dos
 * enunciados (`fontes.titulo`), em negrito.
 */
export function Titulo({ children, compacto = false }: { children: ReactNode; compacto?: boolean }) {
  const styles = useEstilos(criarEstilos);
  return (
    <Text accessibilityRole="header" style={[styles.titulo, compacto && styles.tituloCompacto]}>
      {children}
    </Text>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  const styles = useEstilos(criarEstilos);
  return <Text style={styles.subtitulo}>{children}</Text>;
}

export function Corpo({ children }: { children: ReactNode }) {
  const styles = useEstilos(criarEstilos);
  return <Text style={styles.corpo}>{children}</Text>;
}

/** Símbolo do AJAI (livro com broto) exportado do Figma: assets/images/simbolo.png. */
export function SimboloAjai({ tamanho }: { tamanho: number }) {
  return (
    <Image
      source={require("@/assets/images/simbolo.png")}
      style={{ width: tamanho, height: tamanho }}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

/** Logo "AJAI" do cabeçalho (Figma "Marca AJAI": símbolo de 48 e o nome ao lado). */
export function Logo() {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.logo} accessible accessibilityLabel="AJAI">
      <SimboloAjai tamanho={48} />
      <Text style={styles.logoTexto}>AJAI</Text>
    </View>
  );
}

export function Cartao({ children, destaque = false }: { children: ReactNode; destaque?: boolean }) {
  const styles = useEstilos(criarEstilos);
  return <View style={[styles.cartao, destaque && styles.cartaoDestaque]}>{children}</View>;
}

/**
 * Mensagem curta para o usuário (ex.: resposta do servidor). O leitor de tela anuncia sozinho.
 * "atencao" para pedir que confira algo (nunca chame de "erro" na tela); "sucesso" para confirmar.
 */
export function Aviso({ children, tipo = "atencao" }: { children: ReactNode; tipo?: "atencao" | "sucesso" }) {
  const styles = useEstilos(criarEstilos);
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

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    aviso: { borderRadius: raios.md, borderWidth: 2, padding: 12 },
    avisoAtencao: { backgroundColor: cores.superficie, borderColor: cores.erro },
    avisoSucesso: { backgroundColor: cores.superficieSuave, borderColor: cores.sucesso },
    avisoTexto: { fontSize: fontes.corpo, fontFamily: familias.seminegrito },
    titulo: { fontSize: fontes.tituloGrande, fontFamily: familias.negrito, color: cores.texto, lineHeight: Math.round(fontes.tituloGrande * 1.15) },
    tituloCompacto: { fontSize: fontes.titulo, lineHeight: Math.round(fontes.titulo * 1.2) },
    subtitulo: { fontSize: fontes.subtitulo, fontFamily: familias.regular, color: cores.textoSuave, lineHeight: Math.round(fontes.subtitulo * 1.3) },
    corpo: { fontFamily: familias.regular, fontSize: fontes.corpo, color: cores.texto },
    logo: { flexDirection: "row", alignItems: "center", gap: 12 },
    logoTexto: { fontSize: fontes.marca, fontFamily: familias.extranegrito, color: cores.primaria },
    cartao: {
      backgroundColor: cores.superficie,
      borderColor: cores.borda,
      borderWidth: 2,
      borderRadius: raios.lg,
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 4,
    },
    // Figma "Trilha de aprendizagem": verde-claro, sem borda aparente, padding 20.
    cartaoDestaque: { backgroundColor: cores.superficieSuave, borderColor: cores.superficieSuave, padding: 20 },
  });
