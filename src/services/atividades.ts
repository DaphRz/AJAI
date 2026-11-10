/**
 * Nivel.ListarTrilha / Atividade.Listar / Atividade.Visualizar / nivelamento (RF03–RF11).
 * Tudo vem da API (server/src/rotas/atividades.ts). O app NUNCA recebe o gabarito:
 * a correção é feita no servidor (ver respostas.ts).
 */
import type { AtividadeDoAluno, Nivel } from "@/domain/modelos";
import { chamarApi } from "./api";

// A trilha quase nunca muda: guarda a primeira resposta para não pedir de novo a cada tela.
let trilhaGuardada: Promise<Nivel[]> | null = null;

/** Níveis em ordem (GET /niveis). */
export function listarTrilha(): Promise<Nivel[]> {
  if (!trilhaGuardada) {
    trilhaGuardada = chamarApi<{ niveis: Nivel[] }>("/niveis").then(
      (r) => [...r.niveis].sort((a, b) => a.ordem - b.ordem),
      (erro: unknown) => {
        trilhaGuardada = null; // falhou: na próxima vez tenta de novo
        throw erro;
      },
    );
  }
  return trilhaGuardada;
}

export async function buscarNivel(idNivel: number | undefined): Promise<Nivel | undefined> {
  return (await listarTrilha()).find((n) => n.idNivel === idNivel);
}

export async function proximoNivel(idNivel: number): Promise<Nivel | undefined> {
  const trilha = await listarTrilha();
  const atual = trilha.find((n) => n.idNivel === idNivel);
  return atual ? trilha.find((n) => n.ordem > atual.ordem) : undefined;
}

/** Atividades ATIVAS do nível, com alternativas em ordem (GET /niveis/:id/atividades). */
export async function listarAtividadesDoNivel(idNivel: number): Promise<AtividadeDoAluno[]> {
  const r = await chamarApi<{ atividades: AtividadeDoAluno[] }>(`/niveis/${idNivel}/atividades`);
  return r.atividades;
}

/** Atividades de todos os níveis da trilha (para o histórico de dificuldades). */
export async function listarAtividadesDaTrilha(): Promise<AtividadeDoAluno[]> {
  const trilha = await listarTrilha();
  const porNivel = await Promise.all(trilha.map((n) => listarAtividadesDoNivel(n.idNivel)));
  return porNivel.flat();
}

/** Uma atividade ATIVA (GET /atividades/:id). */
export async function visualizarAtividade(idAtividade: number): Promise<AtividadeDoAluno> {
  const r = await chamarApi<{ atividade: AtividadeDoAluno }>(`/atividades/${idAtividade}`);
  return r.atividade;
}

/** Perguntas do nivelamento, do nível mais fácil ao mais difícil (GET /nivelamento). */
export async function atividadesDoNivelamento(): Promise<AtividadeDoAluno[]> {
  const r = await chamarApi<{ perguntas: AtividadeDoAluno[] }>("/nivelamento");
  return r.perguntas;
}
