// Figma: "AJAI · Métricas de Ana Souza"  |  RF21 – Professor.VisualizarRelatorioAluno
// TODO: gráfico de evolução, histórico de níveis e correção manual (Resposta.EditarCorrecao).
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Botao, Cartao, Subtitulo, Tela, Titulo } from "@/components";
import { buscarAluno } from "@/services/alunos";
import { dificuldadesDoAluno, resumoDoAluno } from "@/services/relatorios";
import { cores, fontes } from "@/theme/tokens";

export default function MetricasAluno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const aluno = buscarAluno(Number(id));

  if (!aluno) {
    return (
      <Tela>
        <Titulo>Aluno não encontrado</Titulo>
        <Botao titulo="Voltar" onPress={() => router.back()} />
      </Tela>
    );
  }

  const resumo = resumoDoAluno(aluno);
  const dificuldades = dificuldadesDoAluno(aluno.idUsuario);

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>{aluno.nome}</Titulo>
      <Subtitulo>{resumo.nomeNivel}</Subtitulo>

      <Cartao>
        <Text style={styles.rotulo}>Frequência (7 dias)</Text>
        <Text style={styles.valor}>{resumo.diasAtivos}/7 dias</Text>
        <Text style={styles.rotulo}>Atividades realizadas</Text>
        <Text style={styles.valor}>{resumo.totalAtividades}</Text>
        <Text style={styles.rotulo}>Taxa de acerto</Text>
        <Text style={styles.valor}>{Math.round(resumo.taxaAcerto * 100)}%</Text>
      </Cartao>

      <Cartao>
        <Text style={styles.rotulo}>Acertos por conteúdo (pior primeiro)</Text>
        {dificuldades.map((d) => (
          <Text key={d.conteudo} style={styles.item}>
            {d.conteudo}: {Math.round(d.taxaAcerto * 100)}% ({d.erros} erros em {d.tentativas})
          </Text>
        ))}
      </Cartao>

      <Text style={styles.aviso}>
        Os dados do aplicativo complementam a avaliação do professor, não a substituem.
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  valor: { fontSize: fontes.titulo, fontWeight: "800", color: cores.primaria },
  item: { fontSize: fontes.corpo, color: cores.texto },
  aviso: { fontSize: 14, color: cores.textoSuave, textAlign: "center" },
});
