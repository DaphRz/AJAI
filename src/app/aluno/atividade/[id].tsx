// Figma: "Reconhecimento", "Sílabas", "Formar palavra", "Ler frase"
// RF04–RF14, RF16 – realizar atividade, corrigir, registrar e progredir
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Tela, Corpo } from "@/components";
import { AtividadeView } from "@/components/AtividadeView";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";
import { definirNivelDoAluno } from "@/services/alunos";
import { buscarNivel, proximoNivel, visualizarAtividade } from "@/services/atividades";
import { deveAvancar } from "@/services/progressao";
import { incluirResposta, listarRespostasDoAluno } from "@/services/respostas";

export default function TelaAtividade() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const aluno = useAluno();
  const { entrar } = useSessao();
  const atividade = visualizarAtividade(Number(id));
  const [inicio] = useState(() => Date.now());

  if (!atividade) {
    return (
      <Tela>
        <Corpo>Atividade não encontrada.</Corpo>
      </Tela>
    );
  }

  function responder(respostaDada: string) {
    if (!atividade) return;
    const resposta = incluirResposta({
      idAluno: aluno.idUsuario,
      atividade,
      respostaDada,
      tempoRespostaSeg: Math.round((Date.now() - inicio) / 1000),
    });

    // RF16: verifica se o aluno atingiu o critério do nível.
    let subiuDeNivel = false;
    const nivel = buscarNivel(atividade.idNivel);
    if (nivel && resposta.correta) {
      const doNivel = listarRespostasDoAluno(aluno.idUsuario).filter(
        (r) => visualizarAtividade(r.idAtividade)?.idNivel === nivel.idNivel,
      );
      const proximo = proximoNivel(nivel.idNivel);
      if (proximo && deveAvancar(nivel, doNivel)) {
        entrar(definirNivelDoAluno(aluno, proximo.idNivel));
        subiuDeNivel = true;
      }
    }

    router.replace({
      pathname: "/aluno/resultado",
      params: {
        id: String(atividade.idAtividade),
        correta: resposta.correta ? "1" : "0",
        subiu: subiuDeNivel ? "1" : "0",
      },
    });
  }

  return (
    <Tela>
      <AtividadeView atividade={atividade} onResponder={responder} />
    </Tela>
  );
}
