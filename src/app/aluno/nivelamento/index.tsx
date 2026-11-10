// Figma: "AJAI · Nivelamento · Pergunta"  |  RF03 – Identificação do nível inicial
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Carregando, Tela } from "@/components";
import { AtividadeView } from "@/components/AtividadeView";
import { useSessao } from "@/context/sessao";
import type { AtividadeDoAluno, Nivel } from "@/domain/modelos";
import { useAluno } from "@/hooks/useAluno";
import { useCarregar } from "@/hooks/useCarregar";
import { definirNivelDoAluno } from "@/services/alunos";
import { mensagemDeErro } from "@/services/api";
import { atividadesDoNivelamento, listarTrilha } from "@/services/atividades";
import { definirNivelInicial } from "@/services/progressao";
import { incluirResposta } from "@/services/respostas";
import { cores, fontes, raios } from "@/theme/tokens";

async function carregarNivelamento() {
  const [perguntas, trilha] = await Promise.all([atividadesDoNivelamento(), listarTrilha()]);
  return { perguntas, trilha };
}

export default function NivelamentoPergunta() {
  const estado = useCarregar(carregarNivelamento);
  return (
    <Carregando estado={estado} comAudio>
      {({ perguntas, trilha }) => <Perguntas perguntas={perguntas} trilha={trilha} />}
    </Carregando>
  );
}

function Perguntas({ perguntas, trilha }: { perguntas: AtividadeDoAluno[]; trilha: Nivel[] }) {
  const aluno = useAluno();
  const { entrar } = useSessao();
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState<boolean[]>([]);
  const [inicio, setInicio] = useState(() => Date.now());
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const atual = perguntas[indice];

  function concluir(respondidas: AtividadeDoAluno[], resultado: boolean[]) {
    const nivel = definirNivelInicial(respondidas, resultado, trilha);
    // TODO (passo 5): POST /nivelamento/concluir grava o nível inicial no servidor.
    entrar(definirNivelDoAluno(aluno, nivel.idNivel, true));
    router.replace({ pathname: "/aluno/nivelamento/resultado", params: { idNivel: String(nivel.idNivel) } });
  }

  async function responder(respostaDada: string) {
    if (enviando) return;
    setEnviando(true);
    setAviso(undefined);
    try {
      const resposta = await incluirResposta({
        idAluno: aluno.idUsuario,
        atividade: atual,
        respostaDada,
        tempoRespostaSeg: Math.round((Date.now() - inicio) / 1000),
      });
      const novos = [...acertos, resposta.correta];
      // Para no primeiro erro ou na última pergunta.
      if (!resposta.correta || indice === perguntas.length - 1) {
        concluir(perguntas, novos);
        return;
      }
      setAcertos(novos);
      setIndice(indice + 1);
      setInicio(Date.now());
    } catch (erro) {
      setAviso(mensagemDeErro(erro));
    }
    setEnviando(false);
  }

  if (!atual) {
    // Sem perguntas cadastradas: começa pela primeira etapa da trilha.
    const texto = "Ainda não há perguntas de nivelamento. Você vai começar pela primeira etapa.";
    return (
      <Tela rodape={<BotaoAudio texto={texto} />}>
        <Aviso>{texto}</Aviso>
        <Botao titulo="Começar" grande onPress={() => concluir([], [])} />
      </Tela>
    );
  }

  const progresso = (indice + 1) / perguntas.length;

  return (
    <Tela>
      <AtividadeView
        key={atual.idAtividade}
        atividade={atual}
        onResponder={responder}
        ocupado={enviando}
        cabecalho={
          <View style={{ gap: 8 }}>
            <Text style={styles.etapa}>
              Pergunta {indice + 1} de {perguntas.length}
            </Text>
            <View style={styles.barra} accessibilityElementsHidden importantForAccessibility="no">
              <View style={[styles.preenchido, { width: `${progresso * 100}%` }]} />
            </View>
          </View>
        }
      />
      {aviso ? <Aviso>{aviso}</Aviso> : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  etapa: { fontSize: fontes.corpo, color: cores.texto, fontWeight: "700", textAlign: "center" },
  barra: { height: 12, borderRadius: raios.md, backgroundColor: cores.superficieSuave, overflow: "hidden" },
  preenchido: { height: 12, borderRadius: raios.md, backgroundColor: cores.primaria },
});
