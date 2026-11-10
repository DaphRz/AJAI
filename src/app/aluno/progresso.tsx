// RF18, RF19 – histórico e evolução do aluno
// Ainda NÃO há tela no Figma para isto (pendência de UX/UI).
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Carregando, Cartao, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { visualizarProgresso, type ProgressoDoAluno } from "@/services/progresso";
import { cores, fontes } from "@/theme/tokens";

export default function Progresso() {
  // Tudo vem calculado do servidor (GET /alunos/eu/progresso).
  const estado = useCarregar(() => visualizarProgresso());
  return (
    <Carregando estado={estado} comAudio>
      {(dados) => <ConteudoProgresso {...dados} />}
    </Carregando>
  );
}

function ConteudoProgresso({ trilha, totalAtividades, taxaAcerto, dificuldades }: ProgressoDoAluno) {
  const taxa = Math.round(taxaAcerto * 100);

  return (
    <Tela rodape={<BotaoAudio texto={`Você fez ${totalAtividades} atividades e acertou ${taxa} por cento.`} />}>
      <Titulo>Meu progresso</Titulo>
      <Subtitulo>Veja até onde você já chegou.</Subtitulo>

      <View style={{ gap: 8 }}>
        {trilha.map((n) => {
          const feito = n.status === "CONCLUIDA";
          const agora = n.status === "ATUAL";
          return (
            <View key={n.idNivel} style={[styles.etapa, agora && styles.etapaAtual]}>
              <Ionicons
                name={feito ? "checkmark-circle" : agora ? "play-circle" : "ellipse-outline"}
                size={28}
                color={feito ? cores.sucesso : agora ? cores.primaria : cores.textoSuave}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={styles.etapaNome}>{n.nome}</Text>
            </View>
          );
        })}
      </View>

      <Cartao>
        <Text style={styles.rotulo}>Atividades feitas</Text>
        <Text style={styles.valor}>{totalAtividades}</Text>
        <Text style={styles.rotulo}>Acertos</Text>
        <Text style={styles.valor}>{taxa}%</Text>
      </Cartao>

      {dificuldades.length > 0 ? (
        <Cartao>
          <Text style={styles.rotulo}>Vale a pena treinar</Text>
          {dificuldades.map((d) => (
            <Text key={d.conteudo} style={styles.item}>
              • {d.conteudo}
            </Text>
          ))}
        </Cartao>
      ) : null}

      <Botao titulo="Voltar" variante="secundario" onPress={() => router.back()} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  etapa: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12 },
  etapaAtual: { backgroundColor: cores.superficieSuave },
  etapaNome: { fontSize: fontes.corpo, fontWeight: "700", color: cores.texto },
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  valor: { fontSize: fontes.titulo, fontWeight: "800", color: cores.primaria },
  item: { fontSize: fontes.corpo, color: cores.texto },
});
