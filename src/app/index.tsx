// Figma: "AJAI · Geral · Splash"
// Diferença do Figma: o botão "Começar" (no Figma a splash não tem ação; no app é a porta para o login).
import { Redirect, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, SimboloAjai, Tela } from "@/components";
import { useSessao } from "@/context/sessao";
import { rotaInicial } from "@/services/auth";
import { cores, familias, fontes } from "@/theme/tokens";

export default function Splash() {
  const { usuario, carregando } = useSessao();
  if (carregando) return null; // a splash do sistema continua na tela
  if (usuario) return <Redirect href={rotaInicial(usuario)} />; // login guardado: vai direto

  return (
    <Tela
      rolavel={false}
      rodape={
        <BotaoAudio texto="AJAI. Alfabetização para jovens, adultos e idosos. Aprender, no seu tempo. Toque em Começar para entrar." />
      }
    >
      <View style={styles.centro}>
        <View style={styles.identidade} accessible accessibilityRole="header" accessibilityLabel="AJAI. Alfabetização para Jovens, Adultos e Idosos">
          <SimboloAjai tamanho={144} />
          <Text style={styles.marca}>AJAI</Text>
          <Text style={styles.slogan}>Alfabetização para{"\n"}Jovens, Adultos e Idosos</Text>
        </View>
        <Text style={styles.lema}>Aprender, no seu tempo.</Text>
      </View>
      <Botao titulo="Começar" seta grande onPress={() => router.replace("/login")} />
    </Tela>
  );
}

// A splash não muda com o tamanho de letra do aluno (ainda não há aluno logado).
const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 40 },
  identidade: { alignItems: "center", gap: 20 },
  marca: { fontSize: fontes.marcaGrande, fontFamily: familias.extranegrito, color: cores.primaria },
  slogan: {
    fontFamily: familias.regular,
    fontSize: 26,
    lineHeight: 35,
    color: cores.texto,
    textAlign: "center",
  },
  lema: { fontFamily: familias.regular, fontSize: fontes.subtitulo, lineHeight: 32, color: cores.textoSuave, textAlign: "center" },
});
