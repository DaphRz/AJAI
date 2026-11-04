import { useSessao } from "@/context/sessao";
import type { Aluno } from "@/domain/modelos";

/** Aluno logado. Só use dentro de src/app/aluno/ (o _layout garante o perfil). */
export function useAluno(): Aluno {
  const { usuario } = useSessao();
  if (!usuario || usuario.perfil !== "ALUNO") {
    throw new Error("useAluno usado fora da área do aluno");
  }
  return usuario;
}
