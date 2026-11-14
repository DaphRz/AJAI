import { useSessao } from "@/context/sessao";
import type { Perfil } from "@/domain/modelos";
import { contaLiberada, rotaInicial } from "@/services/auth";

/**
 * Usado no _layout de cada área protegida (aluno, professor, responsável, instituição, admin).
 * - "carregando": o login guardado ainda está sendo restaurado (mostre nada);
 * - "liberado": pode mostrar a área;
 * - senão, a rota para onde redirecionar: /login sem login; a área certa se o perfil for outro;
 *   /espera se a conta ainda não foi aprovada (professor ou instituição).
 */
export function useAreaProtegida(perfil: Perfil) {
  const { usuario, carregando } = useSessao();
  if (carregando) return "carregando" as const;
  if (!usuario) return "/login" as const;
  if (usuario.perfil !== perfil || !contaLiberada(usuario)) return rotaInicial(usuario);
  return "liberado" as const;
}
