/**
 * Regras de nivelamento e progressão (RF03, RF16, RF17, RF19).
 *
 * São funções puras: recebem dados e devolvem decisões. Assim podem ser
 * testadas sem tela e reaproveitadas no backend.
 *
 * Pendências (ver README):
 * - validar com a equipe o critério final de progressão (hoje: taxa de
 *   acerto das últimas N respostas do nível >= Nivel.criterioAcerto);
 * - gravar HistoricoNivel e DesempenhoConteudo no banco.
 */
import type { Atividade, Nivel, Resposta } from "@/domain/modelos";

/** Quantas respostas recentes do nível entram no cálculo. */
export const JANELA_PROGRESSAO = 5;

export function taxaDeAcerto(lista: Resposta[]): number {
  if (lista.length === 0) return 0;
  return lista.filter((r) => r.correta).length / lista.length;
}

/**
 * Nivelamento: as perguntas vêm em ordem crescente de nível.
 * O nível inicial é o da última pergunta acertada antes do primeiro erro.
 */
export function definirNivelInicial(
  perguntas: Atividade[],
  acertos: boolean[],
  trilha: Nivel[],
): Nivel {
  let idNivel = trilha[0].idNivel;
  for (let i = 0; i < perguntas.length; i++) {
    if (!acertos[i]) break;
    idNivel = perguntas[i].idNivel;
  }
  return trilha.find((n) => n.idNivel === idNivel) ?? trilha[0];
}

export function deveAvancar(
  nivel: Nivel,
  respostasDoNivel: Resposta[],
): boolean {
  const recentes = respostasDoNivel.slice(-JANELA_PROGRESSAO);
  if (recentes.length < JANELA_PROGRESSAO) return false;
  return taxaDeAcerto(recentes) >= nivel.criterioAcerto;
}

/** Agrupa respostas por conteúdo e devolve os de menor taxa de acerto. */
export function identificarDificuldades(
  respostas: Resposta[],
  atividades: Atividade[],
): { conteudo: string; tentativas: number; erros: number; taxaAcerto: number }[] {
  const porConteudo = new Map<string, Resposta[]>();
  for (const r of respostas) {
    const atividade = atividades.find((a) => a.idAtividade === r.idAtividade);
    if (!atividade) continue;
    const lista = porConteudo.get(atividade.conteudo) ?? [];
    lista.push(r);
    porConteudo.set(atividade.conteudo, lista);
  }
  return [...porConteudo.entries()]
    .map(([conteudo, lista]) => ({
      conteudo,
      tentativas: lista.length,
      erros: lista.filter((r) => !r.correta).length,
      taxaAcerto: taxaDeAcerto(lista),
    }))
    .sort((a, b) => a.taxaAcerto - b.taxaAcerto);
}
