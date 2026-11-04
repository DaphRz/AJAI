// Figma: "AJAI · Splash"
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, Tela } from "@/components";
import { cores, fontes } from "@/theme/tokens";

export default function Splash() {
  return (
    <Tela rolavel={false}>
      <View style={styles.centro}>
        <View style={styles.icone}>
          <Text style={{ fontSize: 56 }}>📖</Text>
        </View>
        <Text style={styles.marca}>AJAI</Text>
        <Text style={styles.slogan}>Alfabetização para Jovens, Adultos e Idosos</Text>
      </View>
      <Botao titulo="Começar" grande onPress={() => router.replace("/login")} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  icone: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: cores.superficieSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  marca: { fontSize: 56, fontWeight: "800", color: cores.primaria },
  slogan: { fontSize: fontes.corpo, color: cores.textoSuave, textAlign: "center" },
});
