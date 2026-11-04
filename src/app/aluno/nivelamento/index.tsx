// Figma: "AJAI · Nivelamento · Pergunta"  |  RF03 – Identificação do nível inicial
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Tela } from "@/components";
import { AtividadeView } from "@/components/AtividadeView";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";
import { definirNivelDoAluno } from "@/services/alunos";
import { atividadesDoNivelamento, listarTrilha } from "@/services/atividades";
import { definirNivelInicial } from "@/services/progressao";
import { corrigirAutomaticamente, incluirResposta } from "@/services/respostas";
import { cores, fontes } from "@/theme/tokens";

export default function NivelamentoPergunta() {
  const aluno = useAluno();
  const { entrar } = useSessao();
  const perguntas = atividadesDoNivelamento();
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState<boolean[]>([]);
  const [inicio, setInicio] = useState(Date.now());

  const atual = perguntas[indice];

  function responder(respostaDada: string) {
    const correta = corrigirAutomaticamente(atual, respostaDada);
    incluirResposta({
      idAluno: aluno.idUsuario,
      atividade: atual,
      respostaDada,
      tempoRespostaSeg: Math.round((Date.now() - inicio) / 1000),
    });
    const novos = [...acertos, correta];

    // Para no primeiro erro ou na última pergunta.
    if (!correta || indice === perguntas.length - 1) {
      const nivel = definirNivelInicial(perguntas, novos, listarTrilha());
      entrar(definirNivelDoAluno(aluno, nivel.idNivel, true));
      router.replace({ pathname: "/aluno/nivelamento/resultado", params: { idNivel: String(nivel.idNivel) } });
      return;
    }
    setAcertos(novos);
    setIndice(indice + 1);
    setInicio(Date.now());
  }

  if (!atual) return null;

  return (
    <Tela>
      <Text style={styles.etapa}>
        Pergunta {indice + 1} de {perguntas.length}
      </Text>
      <AtividadeView key={atual.idAtividade} atividade={atual} onResponder={responder} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  etapa: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "700", textAlign: "center" },
});
