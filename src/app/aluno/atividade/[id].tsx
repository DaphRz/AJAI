// Figma: "Reconhecimento", "Sílabas", "Formar palavra", "Ler frase"
// RF04–RF14, RF16 – realizar atividade, corrigir (no servidor), registrar e progredir
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Aviso, Carregando, Tela } from "@/components";
import { AtividadeView } from "@/components/AtividadeView";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";
import { useCarregar } from "@/hooks/useCarregar";
import { mensagemDeErro } from "@/services/api";
import { visualizarAtividade } from "@/services/atividades";
import { responderAtividade } from "@/services/respostas";
import { ATIVIDADES_POR_SESSAO, posicaoNaSessao } from "@/services/sessaoDeEstudo";
import { cores, fontes } from "@/theme/tokens";

export default function TelaAtividade() {
  // concluidas: atividades acertadas nesta sessão de estudo (ver services/sessaoDeEstudo.ts).
  const { id, concluidas: concluidasParam } = useLocalSearchParams<{ id: string; concluidas?: string }>();
  const concluidas = Number(concluidasParam ?? 0) || 0;
  const aluno = useAluno();
  const { entrar } = useSessao();
  const estado = useCarregar(() => visualizarAtividade(Number(id)), id);
  const [inicio] = useState(() => Date.now());
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string>();

  return (
    <Carregando estado={estado} comAudio>
      {(atividade) => {
        async function responder(respostaDada: string) {
          if (enviando) return;
          setEnviando(true);
          setAviso(undefined);
          try {
            const r = await responderAtividade({
              aluno,
              atividade,
              respostaDada,
              tempoRespostaSeg: Math.round((Date.now() - inicio) / 1000),
            });
            if (r.alunoAtualizado) entrar(r.alunoAtualizado);
            router.replace({
              pathname: "/aluno/resultado",
              params: {
                id: String(atividade.idAtividade),
                correta: r.correta ? "1" : "0",
                subiu: r.subiuDeNivel ? "1" : "0",
                concluidas: String(r.correta ? concluidas + 1 : concluidas),
              },
            });
          } catch (erro) {
            setAviso(mensagemDeErro(erro));
            setEnviando(false);
          }
        }

        return (
          <Tela>
            <AtividadeView
              key={atividade.idAtividade}
              atividade={atividade}
              onResponder={responder}
              ocupado={enviando}
              cabecalho={
                <Text style={styles.posicao}>
                  Atividade {posicaoNaSessao(concluidas)} de {ATIVIDADES_POR_SESSAO}
                </Text>
              }
            />
            {aviso ? <Aviso>{aviso}</Aviso> : null}
          </Tela>
        );
      }}
    </Carregando>
  );
}

const styles = StyleSheet.create({
  posicao: { fontSize: fontes.corpo, color: cores.texto, fontWeight: "700", textAlign: "center" },
});
