// Figma: "AJAI · Acerto" e "AJAI · Tentar novamente"  |  RF13, RNF15 – feedback claro; RF22 – continuidade
// Depois de um acerto, segue direto para a próxima atividade; só volta para a home ao fim
// de cada bloco de ATIVIDADES_POR_SESSAO atividades (services/sessaoDeEstudo.ts).
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Tela } from "@/components";
import { mensagemDeErro } from "@/services/api";
import { escolherProximaAtividade, fimDaSessao } from "@/services/sessaoDeEstudo";
import { cores, fontes } from "@/theme/tokens";

export default function Resultado() {
  const { id, correta, subiu, concluidas: concluidasParam } = useLocalSearchParams<{
    id: string;
    correta: string;
    subiu?: string;
    concluidas?: string;
  }>();
  const [indo, setIndo] = useState(false);
  const [aviso, setAviso] = useState<string>();
  const acertou = correta === "1";
  const concluidas = Number(concluidasParam ?? 0) || 0;
  const terminouBloco = acertou && fimDaSessao(concluidas);

  const titulo = acertou ? "Muito bem!" : "Quase lá!";
  let mensagem = "Vamos tentar de novo? Errar faz parte de aprender.";
  if (acertou) {
    const partes = [subiu === "1" ? "Você passou para a próxima etapa!" : "Você acertou."];
    if (terminouBloco) partes.push(`Você já fez ${concluidas} atividades. Pode descansar ou continuar treinando.`);
    mensagem = partes.join(" ");
  }

  async function proximaAtividade() {
    if (indo) return;
    setIndo(true);
    setAviso(undefined);
    try {
      const proxima = await escolherProximaAtividade(Number(id));
      if (proxima === undefined) {
        router.replace("/aluno");
        return;
      }
      router.replace({
        pathname: "/aluno/atividade/[id]",
        params: { id: String(proxima), concluidas: String(concluidas) },
      });
    } catch (erro) {
      setAviso(mensagemDeErro(erro));
      setIndo(false);
    }
  }

  return (
    <Tela rodape={<BotaoAudio texto={`${titulo} ${mensagem}`} />}>
      <View style={styles.centro}>
        <Ionicons
          name={acertou ? "checkmark-circle" : "refresh"}
          size={96}
          color={acertou ? cores.sucesso : cores.primaria}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text accessibilityRole="header" style={[styles.titulo, !acertou && { color: cores.texto }]}>
          {titulo}
        </Text>
        <Text style={styles.mensagem}>{mensagem}</Text>
      </View>

      {aviso ? <Aviso>{aviso}</Aviso> : null}

      {!acertou ? (
        <>
          <Botao
            titulo="Tentar novamente"
            grande
            onPress={() =>
              router.replace({ pathname: "/aluno/atividade/[id]", params: { id, concluidas: String(concluidas) } })
            }
          />
          <Botao titulo="Voltar ao início" variante="link" onPress={() => router.replace("/aluno")} />
        </>
      ) : terminouBloco ? (
        <>
          <Botao titulo="Voltar ao início" grande onPress={() => router.replace("/aluno")} />
          <Botao
            titulo={indo ? "Carregando..." : "Continuar treinando"}
            variante="secundario"
            desabilitado={indo}
            onPress={proximaAtividade}
          />
        </>
      ) : (
        <>
          <Botao titulo={indo ? "Carregando..." : "Continuar →"} grande desabilitado={indo} onPress={proximaAtividade} />
          <Botao titulo="Voltar ao início" variante="link" onPress={() => router.replace("/aluno")} />
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 32 },
  titulo: { fontSize: 40, fontWeight: "800", color: cores.sucesso },
  mensagem: { fontSize: fontes.subtitulo, color: cores.texto, textAlign: "center" },
});
