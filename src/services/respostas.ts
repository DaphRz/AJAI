/**
 * Aluno.IncluirResposta + Resposta.CorrigirAutomaticamente (RF12–RF14, RF16).
 * A CORREÇÃO já é do servidor (POST /atividades/:id/corrigir): o app não tem o gabarito.
 * TODO (passo 5): trocar por POST /respostas, que grava a Resposta no banco, atualiza
 * DesempenhoConteudo e decide a subida de nível ({ correta, subiuDeNivel, nivelAtual }).
 * Até lá, a resposta e a progressão ficam só na memória do app (arrays do mock).
 */
import { atividades, respostas } from "@/data/mock";
import type { Aluno, AtividadeDoAluno, Resposta } from "@/domain/modelos";
import { definirNivelDoAluno } from "./alunos";
import { chamarApi } from "./api";
import { buscarNivel, proximoNivel } from "./atividades";
import { deveAvancar } from "./progressao";

/** Pede ao servidor para corrigir (tolerante a maiúsculas, acentos e espaços). */
export async function corrigirNoServidor(idAtividade: number, respostaDada: string): Promise<boolean> {
  const r = await chamarApi<{ correta: boolean }>(`/atividades/${idAtividade}/corrigir`, {
    metodo: "POST",
    corpo: { respostaDada },
  });
  return r.correta;
}

/** Corrige no servidor e guarda a resposta (por enquanto, na memória). */
export async function incluirResposta(params: {
  idAluno: number;
  atividade: AtividadeDoAluno;
  respostaDada: string;
  tempoRespostaSeg: number;
}): Promise<Resposta> {
  const correta = await corrigirNoServidor(params.atividade.idAtividade, params.respostaDada);
  const resposta: Resposta = {
    idResposta: respostas.length + 1,
    idAluno: params.idAluno,
    idAtividade: params.atividade.idAtividade,
    respostaDada: params.respostaDada,
    correta,
    dataHora: new Date().toISOString(),
    tempoRespostaSeg: params.tempoRespostaSeg,
  };
  respostas.push(resposta);
  return resposta;
}

/**
 * Responde uma atividade do dia a dia: corrige, guarda e verifica a progressão (RF16).
 * Devolve o aluno atualizado (objeto NOVO, nunca mutado) quando ele sobe de nível.
 */
export async function responderAtividade(params: {
  aluno: Aluno;
  atividade: AtividadeDoAluno;
  respostaDada: string;
  tempoRespostaSeg: number;
}): Promise<{ correta: boolean; subiuDeNivel: boolean; alunoAtualizado?: Aluno }> {
  const { aluno, atividade } = params;
  const resposta = await incluirResposta({ ...params, idAluno: aluno.idUsuario });
  if (!resposta.correta) return { correta: false, subiuDeNivel: false };

  const nivel = await buscarNivel(atividade.idNivel);
  const proximo = nivel ? await proximoNivel(nivel.idNivel) : undefined;
  const doNivel = listarRespostasDoAluno(aluno.idUsuario).filter(
    (r) => nivelDaAtividade(r.idAtividade) === atividade.idNivel,
  );
  if (nivel && proximo && deveAvancar(nivel, doNivel)) {
    return { correta: true, subiuDeNivel: true, alunoAtualizado: definirNivelDoAluno(aluno, proximo.idNivel) };
  }
  return { correta: true, subiuDeNivel: false };
}

// TODO (passo 5): some junto com as respostas em memória (o servidor já sabe o nível de cada atividade).
function nivelDaAtividade(idAtividade: number): number | undefined {
  return atividades.find((a) => a.idAtividade === idAtividade)?.idNivel;
}

export function listarRespostasDoAluno(idAluno: number): Resposta[] {
  return respostas.filter((r) => r.idAluno === idAluno);
}
