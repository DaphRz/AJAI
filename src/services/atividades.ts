/**
 * Atividade.Listar / Atividade.Visualizar / Nivel.ListarTrilha.
 * ESQUELETO: lê de src/data/mock.ts. Trocar por GET /atividades e GET /niveis.
 */
import { atividades, idsAtividadesNivelamento, niveis } from "@/data/mock";
import type { Atividade, Nivel } from "@/domain/modelos";

export function listarTrilha(): Nivel[] {
  return [...niveis].sort((a, b) => a.ordem - b.ordem);
}

export function buscarNivel(idNivel: number | undefined): Nivel | undefined {
  return niveis.find((n) => n.idNivel === idNivel);
}

export function proximoNivel(idNivel: number): Nivel | undefined {
  const atual = buscarNivel(idNivel);
  if (!atual) return undefined;
  return listarTrilha().find((n) => n.ordem === atual.ordem + 1);
}

export function listarAtividadesDoNivel(idNivel: number): Atividade[] {
  return atividades.filter((a) => a.idNivel === idNivel && a.status === "ATIVA");
}

export function visualizarAtividade(idAtividade: number): Atividade | undefined {
  return atividades.find((a) => a.idAtividade === idAtividade);
}

export function atividadesDoNivelamento(): Atividade[] {
  return idsAtividadesNivelamento
    .map((id) => visualizarAtividade(id))
    .filter((a): a is Atividade => a !== undefined);
}

export function listarAtividades(): Atividade[] {
  return atividades;
}
