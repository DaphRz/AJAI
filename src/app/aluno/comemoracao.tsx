// RF16, RF19 – comemoração ao subir de etapa (passo 7)
// Sem frame no Figma: segue o padrão da tela "AJAI · Acerto" (/aluno/resultado).
// Aparece no lugar do "Muito bem!" quando POST /respostas devolve subiuDeNivel. A narração
// começa sozinha ao abrir (o aluno pode não conseguir ler a mensagem) e para ao sair da tela.
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Tela } from "@/components";
import { mensagemDeErro } from "@/services/api";
import { falar, pararFala } from "@/services/narracao";
import { escolherProximaAtividade } from "@/services/sessaoDeEstudo";
import { cores, fontes } from "@/theme/tokens";

export default function Comemoracao() {
  const { id, etapa, concluidas: concluidasParam } = useLocalSearchParams<{
    id: string;
    etapa?: string;
    concluidas?: string;
  }>();
  const concluidas = Number(concluidasParam ?? 0) || 0;
  const [indo, setIndo] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const titulo = "Parabéns!";
  const mensagem = etapa
    ? `Você passou para a etapa ${etapa}. Seu esforço está dando resultado!`
    : "Você passou para a próxima etapa. Seu esforço está dando resultado!";
  const narracao = `${titulo} ${mensagem} Toque em continuar para começar a nova etapa.`;

  useEffect(() => {
    falar(narracao).catch(() => {});
    return () => pararFala();
  }, [narracao]);

  async function continuar() {
    // Começa a nova etapa: o servidor já sabe o nível novo e escolhe a primeira atividade dela.
    if (indo) return;
    setIndo(true);
    setAviso(undefined);
    try {
      const proxima = await escolherProximaAtividade(Number(id));
      if (proxima === undefined) {
        router.replace("/aluno");
        return;
      }
      router.replace({ pathname: "/aluno/atividade/[id]", params: { id: String(proxima), concluidas: String(concluidas) } });
    } catch (erro) {
      setAviso(mensagemDeErro(erro));
      setIndo(false);
    }
  }

  return (
    <Tela rodape={<BotaoAudio texto={narracao} />}>
      <View style={styles.centro}>
        <View style={styles.medalha} accessibilityElementsHidden importantForAccessibility="no">
          <Ionicons name="trophy" size={88} color={cores.primaria} />
        </View>
        <Text accessibilityRole="header" style={styles.titulo}>
          {titulo}
        </Text>
        <Text style={styles.mensagem}>{mensagem}</Text>
      </View>

      {aviso ? <Aviso>{aviso}</Aviso> : null}

      <Botao titulo={indo ? "Carregando..." : "Continuar →"} grande desabilitado={indo} onPress={continuar} />
      <Botao titulo="Ver meu progresso" variante="secundario" onPress={() => router.replace("/aluno/progresso")} />
      <Botao titulo="Voltar ao início" variante="link" onPress={() => router.replace("/aluno")} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 32 },
  medalha: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: cores.audioFundo,
    borderWidth: 4,
    borderColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 40, fontWeight: "800", color: cores.sucesso },
  mensagem: { fontSize: fontes.subtitulo, color: cores.texto, textAlign: "center" },
});
