/**
 * Aluno.EditarPreferencias (passo 10, APF 17): velocidade da voz e tamanho da letra.
 * O servidor guarda (PATCH /alunos/eu) e devolve o aluno atualizado; a tela passa esse aluno
 * para entrar(...) da sessão, e o PreferenciasProvider aplica a letra e a voz no app inteiro.
 */
import type { Aluno } from "@/domain/modelos";
import { chamarApi } from "./api";

export interface MudancaPreferencias {
  velocidadeVoz?: number;
  tamanhoFonte?: number;
}

export async function editarPreferencias(mudanca: MudancaPreferencias): Promise<Aluno> {
  const { usuario } = await chamarApi<{ usuario: Aluno }>("/alunos/eu", { metodo: "PATCH", corpo: mudanca });
  return usuario;
}
