/**
 * Instituições e aprovação de contas (Passo 3.1; server/src/rotas/instituicoes.ts).
 * - Administrador: lista as instituições e aprova (gera o código) ou recusa com motivo.
 * - Instituição: vê o próprio código e aprova ou recusa os professores dela.
 * - Professor recusado: informa o código de outra instituição.
 */
import type { StatusInstituicao, StatusProfessor } from "@/domain/modelos";
import { chamarApi } from "./api";

export type Decisao = "APROVAR" | "RECUSAR";

/** Instituição como o administrador e a própria instituição veem. */
export interface ResumoInstituicao {
  idUsuario: number;
  nome: string;
  cnpj: string;
  nomeResponsavel?: string;
  email?: string;
  telefone?: string;
  codigo?: string;
  status: StatusInstituicao;
  motivoRecusa?: string;
  criadoEm?: string;
}

/** Professor como a instituição vê. */
export interface ResumoProfessor {
  idUsuario: number;
  nome: string;
  email?: string;
  telefone?: string;
  status: StatusProfessor;
  motivoRecusa?: string;
  criadoEm?: string;
}

/** CNPJ só com dígitos → 11.222.333/0001-81. */
export function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : cnpj;
}

// ---------- Administrador ----------

export async function listarInstituicoes(status?: StatusInstituicao): Promise<ResumoInstituicao[]> {
  const { instituicoes } = await chamarApi<{ instituicoes: ResumoInstituicao[] }>(
    `/admin/instituicoes${status ? `?status=${status}` : ""}`,
  );
  return instituicoes;
}

/** Aprova (o servidor gera o código) ou recusa com motivo. Devolve a instituição atualizada. */
export async function decidirInstituicao(id: number, decisao: Decisao, motivo?: string): Promise<ResumoInstituicao> {
  const { instituicao } = await chamarApi<{ instituicao: ResumoInstituicao }>(`/admin/instituicoes/${id}`, {
    metodo: "PATCH",
    corpo: { decisao, motivo: motivo?.trim() || undefined },
  });
  return instituicao;
}

// ---------- Instituição ----------

export async function visualizarMinhaInstituicao(): Promise<ResumoInstituicao> {
  const { instituicao } = await chamarApi<{ instituicao: ResumoInstituicao }>("/instituicao/eu");
  return instituicao;
}

export async function listarProfessoresDaInstituicao(): Promise<ResumoProfessor[]> {
  const { professores } = await chamarApi<{ professores: ResumoProfessor[] }>("/instituicao/professores");
  return professores;
}

export async function decidirProfessor(id: number, decisao: Decisao, motivo?: string): Promise<ResumoProfessor> {
  const { professor } = await chamarApi<{ professor: ResumoProfessor }>(`/instituicao/professores/${id}`, {
    metodo: "PATCH",
    corpo: { decisao, motivo: motivo?.trim() || undefined },
  });
  return professor;
}

// ---------- Professor ainda não aprovado ----------

/** Professor recusado (ou pendente) informa o código de outra instituição. Devolve a confirmação. */
export async function informarCodigoInstituicao(codigo: string): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>("/professor/instituicao", {
    metodo: "PATCH",
    corpo: { codigo: codigo.trim() },
  });
  return mensagem;
}
