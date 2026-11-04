/**
 * Aluno.IncluirResposta + Resposta.CorrigirAutomaticamente (RF12, RF14).
 * ESQUELETO: grava no array em memória. Trocar por POST /respostas.
 */
import { respostas } from "@/data/mock";
import type { Atividade, Resposta } from "@/domain/modelos";

/** Compara ignorando maiúsculas, acentos e espaços extras. */
export function corrigirAutomaticamente(atividade: Atividade, respostaDada: string): boolean {
  return normalizar(respostaDada) === normalizar(atividade.respostaCorreta);
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function incluirResposta(params: {
  idAluno: number;
  atividade: Atividade;
  respostaDada: string;
  tempoRespostaSeg: number;
}): Resposta {
  const resposta: Resposta = {
    idResposta: respostas.length + 1,
    idAluno: params.idAluno,
    idAtividade: params.atividade.idAtividade,
    respostaDada: params.respostaDada,
    correta: corrigirAutomaticamente(params.atividade, params.respostaDada),
    dataHora: new Date().toISOString(),
    tempoRespostaSeg: params.tempoRespostaSeg,
  };
  respostas.push(resposta);
  return resposta;
}

export function listarRespostasDoAluno(idAluno: number): Resposta[] {
  return respostas.filter((r) => r.idAluno === idAluno);
}
