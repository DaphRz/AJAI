// RF18, RF19 – histórico e evolução do aluno
// Ainda NÃO há tela no Figma para isto (pendência de UX/UI).
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Carregando, Cartao, Subtitulo, Tela, Titulo } from "@/components";
import { useAluno } from "@/hooks/useAluno";
import { useCarregar } from "@/hooks/useCarregar";
import { listarAtividadesDaTrilha, listarTrilha } from "@/services/atividades";
import { identificarDificuldades, taxaDeAcerto } from "@/services/progressao";
import { listarRespostasDoAluno } from "@/services/respostas";
import { cores, fontes } from "@/theme/tokens";

// TODO (passo 5): tudo isto vem pronto de GET /alunos/eu/progresso.
async function carregarProgresso() {
  const [trilha, atividades] = await Promise.all([listarTrilha(), listarAtividadesDaTrilha()]);
  return { trilha, atividades };
}

export default function Progresso() {
  const estado = useCarregar(carregarProgresso);
  return (
    <Carregando estado={estado} comAudio>
      {(dados) => <ConteudoProgresso {...dados} />}
    </Carregando>
  );
}

function ConteudoProgresso({ trilha, atividades }: Awaited<ReturnType<typeof carregarProgresso>>) {
  const aluno = useAluno();
  const respostas = listarRespostasDoAluno(aluno.idUsuario);
  const atual = trilha.find((n) => n.idNivel === aluno.idNivelAtual);
  const taxa = Math.round(taxaDeAcerto(respostas) * 100);
  const dificuldades = identificarDificuldades(respostas, atividades).filter((d) => d.erros > 0);

  return (
    <Tela rodape={<BotaoAudio texto={`Você fez ${respostas.length} atividades e acertou ${taxa} por cento.`} />}>
      <Titulo>Meu progresso</Titulo>
      <Subtitulo>Veja até onde você já chegou.</Subtitulo>

      <View style={{ gap: 8 }}>
        {trilha.map((n) => {
          const feito = atual ? n.ordem < atual.ordem : false;
          const agora = n.idNivel === atual?.idNivel;
          return (
            <View key={n.idNivel} style={[styles.etapa, agora && styles.etapaAtual]}>
              <Text style={styles.etapaIcone}>{feito ? "✅" : agora ? "▶️" : "⚪"}</Text>
              <Text style={styles.etapaNome}>{n.nome}</Text>
            </View>
          );
        })}
      </View>

      <Cartao>
        <Text style={styles.rotulo}>Atividades feitas</Text>
        <Text style={styles.valor}>{respostas.length}</Text>
        <Text style={styles.rotulo}>Acertos</Text>
        <Text style={styles.valor}>{taxa}%</Text>
      </Cartao>

      {dificuldades.length > 0 ? (
        <Cartao>
          <Text style={styles.rotulo}>Vale a pena treinar</Text>
          {dificuldades.slice(0, 3).map((d) => (
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
  etapaIcone: { fontSize: 22 },
  etapaNome: { fontSize: fontes.corpo, fontWeight: "700", color: cores.texto },
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  valor: { fontSize: fontes.titulo, fontWeight: "800", color: cores.primaria },
  item: { fontSize: fontes.corpo, color: cores.texto },
});
