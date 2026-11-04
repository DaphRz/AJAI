// Figma: "AJAI · Acerto" e "AJAI · Tentar novamente"  |  RF13, RNF15 – feedback claro
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Tela } from "@/components";
import { cores, fontes } from "@/theme/tokens";

export default function Resultado() {
  const { id, correta, subiu } = useLocalSearchParams<{ id: string; correta: string; subiu?: string }>();
  const acertou = correta === "1";

  const titulo = acertou ? "Muito bem!" : "Quase lá!";
  const mensagem = acertou
    ? subiu === "1"
      ? "Você passou para a próxima etapa!"
      : "Você acertou."
    : "Vamos tentar de novo? Errar faz parte de aprender.";

  return (
    <Tela rodape={<BotaoAudio texto={`${titulo} ${mensagem}`} />}>
      <View style={styles.centro}>
        <Text style={styles.icone}>{acertou ? "✅" : "🔁"}</Text>
        <Text accessibilityRole="header" style={[styles.titulo, !acertou && { color: cores.texto }]}>
          {titulo}
        </Text>
        <Text style={styles.mensagem}>{mensagem}</Text>
      </View>

      {acertou ? (
        <Botao titulo="Continuar →" grande onPress={() => router.replace("/aluno")} />
      ) : (
        <>
          <Botao
            titulo="Tentar novamente"
            grande
            onPress={() => router.replace({ pathname: "/aluno/atividade/[id]", params: { id } })}
          />
          <Botao titulo="Voltar ao início" variante="link" onPress={() => router.replace("/aluno")} />
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 32 },
  icone: { fontSize: 96 },
  titulo: { fontSize: 40, fontWeight: "800", color: cores.sucesso },
  mensagem: { fontSize: fontes.subtitulo, color: cores.texto, textAlign: "center" },
});
