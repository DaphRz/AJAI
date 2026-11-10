// Figma: "AJAI · Nivelamento · Pergunta"  |  RF03 – Identificação do nível inicial
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Carregando, Tela } from "@/components";
import { AtividadeView } from "@/components/AtividadeView";
import { useSessao } from "@/context/sessao";
import type { AtividadeDoAluno } from "@/domain/modelos";
import { useAluno } from "@/hooks/useAluno";
import { useCarregar } from "@/hooks/useCarregar";
import { concluirNivelamento, type RespostaDoNivelamento } from "@/services/alunos";
import { mensagemDeErro } from "@/services/api";
import { atividadesDoNivelamento } from "@/services/atividades";
import { corrigirPerguntaDoNivelamento } from "@/services/respostas";
import { cores, fontes, raios } from "@/theme/tokens";

export default function NivelamentoPergunta() {
  const estado = useCarregar(atividadesDoNivelamento);
  return (
    <Carregando estado={estado} comAudio>
      {(perguntas) => <Perguntas perguntas={perguntas} />}
    </Carregando>
  );
}

function Perguntas({ perguntas }: { perguntas: AtividadeDoAluno[] }) {
  const aluno = useAluno();
  const { entrar } = useSessao();
  const [indice, setIndice] = useState(0);
  // Respostas já dadas, na ordem: vão todas para o servidor no fim.
  const [respostas, setRespostas] = useState<RespostaDoNivelamento[]>([]);
  const [inicio, setInicio] = useState(() => Date.now());
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const atual = perguntas[indice];

  /** O servidor corrige de novo, grava as respostas e o nível inicial (POST /nivelamento/concluir). */
  async function concluir(todas: RespostaDoNivelamento[]) {
    const { nivel, alunoAtualizado } = await concluirNivelamento(aluno, todas);
    entrar(alunoAtualizado);
    router.replace({ pathname: "/aluno/nivelamento/resultado", params: { idNivel: String(nivel.idNivel) } });
  }

  async function responder(respostaDada: string) {
    if (enviando) return;
    setEnviando(true);
    setAviso(undefined);
    try {
      const nova = {
        idAtividade: atual.idAtividade,
        respostaDada,
        tempoRespostaSeg: Math.round((Date.now() - inicio) / 1000),
      };
      const correta = await corrigirPerguntaDoNivelamento(atual.idAtividade, respostaDada);
      const todas = [...respostas, nova];
      // Para no primeiro erro ou na última pergunta.
      if (!correta || indice === perguntas.length - 1) {
        await concluir(todas);
        return;
      }
      setRespostas(todas);
      setIndice(indice + 1);
      setInicio(Date.now());
    } catch (erro) {
      // Sem conexão: a pergunta continua na tela e o aluno pode tocar de novo.
      setAviso(mensagemDeErro(erro));
    }
    setEnviando(false);
  }

  async function comecarSemPerguntas() {
    if (enviando) return;
    setEnviando(true);
    setAviso(undefined);
    try {
      await concluir([]);
    } catch (erro) {
      setAviso(mensagemDeErro(erro));
      setEnviando(false);
    }
  }

  if (!atual) {
    // Sem perguntas cadastradas: começa pela primeira etapa da trilha.
    const texto = "Ainda não há perguntas de nivelamento. Você vai começar pela primeira etapa.";
    return (
      <Tela rodape={<BotaoAudio texto={texto} />}>
        <Aviso>{texto}</Aviso>
        <Botao titulo={enviando ? "Carregando..." : "Começar"} grande desabilitado={enviando} onPress={comecarSemPerguntas} />
        {aviso ? <Aviso>{aviso}</Aviso> : null}
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
