/**
 * Cadastro de atividades e de níveis (passo 9; APF 25–31; server/src/rotas/cadastroAtividades.ts).
 * - Atividades: administrador (todas) e professor aprovado (só as que ele criou) incluem, editam e
 *   inativam. "Excluir" nunca apaga: a atividade fica INATIVA e some da trilha do aluno.
 * - Níveis (etapas): só o administrador inclui e edita.
 * Estas rotas trazem o GABARITO: use só nas áreas do administrador e do professor.
 */
import type { Alternativa, Atividade, Nivel, StatusAtividade, TipoAtividade } from "@/domain/modelos";
import { chamarApi } from "./api";

/** Atividade como quem cadastra vê: com o gabarito, quem criou e se pode mudar. */
export interface AtividadeGestao
  extends Pick<
    Atividade,
    "idAtividade" | "idNivel" | "tipo" | "conteudo" | "enunciado" | "textoApoio" | "urlImagem" | "respostaCorreta" | "status" | "ordemNivelamento" | "idCriador"
  > {
  nomeCriador?: string;
  podeEditar: boolean;
  alternativas: Pick<Alternativa, "idAlternativa" | "texto" | "ordem" | "correta" | "urlImagem" | "ilustracao">[];
}

/** O que o formulário envia. O servidor confere o gabarito e devolve a mensagem se faltar algo. */
export interface DadosAtividade {
  idNivel: number;
  tipo: TipoAtividade;
  conteudo: string;
  enunciado: string;
  textoApoio?: string;
  /** Só ESCRITA. */
  respostaCorreta?: string;
  alternativas: { texto: string; correta: boolean; ilustracao?: string }[];
}

export interface NivelGestao extends Nivel {
  totalAtivas: number;
  totalInativas: number;
}

export type DadosNivel = Pick<Nivel, "nome" | "descricao" | "ordem" | "criterioAcerto">;

/** Nome do tipo na tela (sem jargão). */
export const NOMES_TIPO: Record<TipoAtividade, string> = {
  LETRA: "Letra",
  SILABA: "Sílaba",
  PALAVRA: "Formar palavra",
  FRASE: "Frase",
  ESCRITA: "Escrita",
  INTERPRETACAO: "Texto",
};

// ---------- Atividades ----------

export async function listarAtividades(filtro: { idNivel?: number; minhas?: boolean } = {}): Promise<AtividadeGestao[]> {
  const params = new URLSearchParams();
  if (filtro.idNivel) params.set("idNivel", String(filtro.idNivel));
  if (filtro.minhas) params.set("minhas", "true");
  const consulta = params.toString();
  const { atividades } = await chamarApi<{ atividades: AtividadeGestao[] }>(`/gestao/atividades${consulta ? `?${consulta}` : ""}`);
  return atividades;
}

export async function visualizarAtividadeGestao(idAtividade: number): Promise<AtividadeGestao> {
  const { atividade } = await chamarApi<{ atividade: AtividadeGestao }>(`/gestao/atividades/${idAtividade}`);
  return atividade;
}

export async function incluirAtividade(dados: DadosAtividade): Promise<AtividadeGestao> {
  const { atividade } = await chamarApi<{ atividade: AtividadeGestao }>("/gestao/atividades", { metodo: "POST", corpo: dados });
  return atividade;
}

export async function editarAtividade(idAtividade: number, dados: DadosAtividade): Promise<AtividadeGestao> {
  const { atividade } = await chamarApi<{ atividade: AtividadeGestao }>(`/gestao/atividades/${idAtividade}`, {
    metodo: "PUT",
    corpo: dados,
  });
  return atividade;
}

/** ExcluirAtividade da APF: só inativa. */
export async function excluirAtividade(idAtividade: number): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/gestao/atividades/${idAtividade}`, { metodo: "DELETE" });
  return mensagem;
}

export async function mudarStatusAtividade(idAtividade: number, status: StatusAtividade): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>(`/gestao/atividades/${idAtividade}/status`, {
    metodo: "PATCH",
    corpo: { status },
  });
  return mensagem;
}

// ---------- Níveis (etapas) ----------

export async function listarNiveisGestao(): Promise<NivelGestao[]> {
  const { niveis } = await chamarApi<{ niveis: NivelGestao[] }>("/gestao/niveis");
  return niveis;
}

export async function incluirNivel(dados: DadosNivel): Promise<NivelGestao> {
  const { nivel } = await chamarApi<{ nivel: NivelGestao }>("/gestao/niveis", { metodo: "POST", corpo: dados });
  return nivel;
}

export async function editarNivel(idNivel: number, dados: Partial<DadosNivel>): Promise<NivelGestao> {
  const { nivel } = await chamarApi<{ nivel: NivelGestao }>(`/gestao/niveis/${idNivel}`, { metodo: "PATCH", corpo: dados });
  return nivel;
}
