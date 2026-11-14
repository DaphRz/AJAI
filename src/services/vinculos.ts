/**
 * Vínculo acompanhante ↔ aluno (Passo 3.1; server/src/rotas/vinculos.ts).
 * O professor (aprovado) ou o responsável convida o aluno pelo usuário, e-mail ou telefone; o aluno
 * aceita ou recusa. Só com o vínculo ACEITO o acompanhante vê o nome (e, no passo 8, os dados) do aluno.
 * Responsável: no máximo 2 pessoas (o servidor confere).
 */
import type { Perfil, StatusVinculo } from "@/domain/modelos";
import { chamarApi } from "./api";

/** Vínculo visto pelo acompanhante. `aluno` só vem depois do aceite. */
export interface VinculoDoAcompanhante {
  idVinculo: number;
  status: StatusVinculo;
  /** O que o acompanhante digitou ao convidar. */
  identificadorConvite?: string;
  criadoEm: string;
  decididoEm?: string;
  aluno?: { idUsuario: number; nome: string };
}

/** Vínculo visto pelo aluno: quem quer acompanhar. */
export interface VinculoDoAluno {
  idVinculo: number;
  status: StatusVinculo;
  criadoEm: string;
  decididoEm?: string;
  acompanhante: { nome: string; perfil: Perfil; instituicao?: string };
}

// ---------- Acompanhante ----------

/** Lista os convites e alunos; `limite` = null para professor (sem limite). */
export async function listarMeusAlunos(): Promise<{ vinculos: VinculoDoAcompanhante[]; limite: number | null }> {
  const { vinculos, limite } = await chamarApi<{ vinculos: VinculoDoAcompanhante[]; limite?: number | null }>("/vinculos");
  return { vinculos, limite: limite ?? null };
}

export async function convidarAluno(aluno: string): Promise<VinculoDoAcompanhante> {
  const { vinculo } = await chamarApi<{ vinculo: VinculoDoAcompanhante }>("/vinculos", {
    metodo: "POST",
    corpo: { aluno: aluno.trim() },
  });
  return vinculo;
}

/** Desfaz o vínculo (ou cancela o convite). Devolve a confirmação. */
export async function desfazerVinculo(idVinculo: number): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/vinculos/${idVinculo}`, { metodo: "DELETE" });
  return mensagem;
}

// ---------- Aluno ----------

/** Convites PENDENTES e vínculos ACEITOS do aluno logado. */
export async function listarConvitesDoAluno(): Promise<VinculoDoAluno[]> {
  const { vinculos } = await chamarApi<{ vinculos: VinculoDoAluno[] }>("/alunos/eu/vinculos");
  return vinculos;
}

export async function responderConvite(idVinculo: number, aceitar: boolean): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/alunos/eu/vinculos/${idVinculo}`, {
    metodo: "PATCH",
    corpo: { aceitar },
  });
  return mensagem;
}

export async function desfazerVinculoDoAluno(idVinculo: number): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/alunos/eu/vinculos/${idVinculo}`, { metodo: "DELETE" });
  return mensagem;
}

/** "Professor Rafael Costa (Escola X)" / "Responsável Joana Lima": como o aluno vê quem convidou. */
export function descreverAcompanhante(v: VinculoDoAluno): string {
  const papel = v.acompanhante.perfil === "PROFESSOR" ? "Professor" : "Responsável";
  const onde = v.acompanhante.instituicao ? ` (${v.acompanhante.instituicao})` : "";
  return `${papel} ${v.acompanhante.nome}${onde}`;
}
