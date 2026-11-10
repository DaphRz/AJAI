// Correção automática da resposta do aluno (RF12): Resposta.CorrigirAutomaticamente.
// Fica no servidor porque o app nunca recebe o gabarito (respostaCorreta / Alternativa.correta).
// Função pura: sem banco e sem Fastify, fácil de testar (passo 12).

/** Deixa o texto comparável: sem acentos, sem diferença de maiúsculas e sem espaços sobrando. */
export function normalizarResposta(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Compara a resposta dada com a correta, tolerando maiúsculas, acentos e espaços extras. */
export function corrigirAutomaticamente(respostaCorreta: string, respostaDada: string): boolean {
  return normalizarResposta(respostaDada) === normalizarResposta(respostaCorreta);
}
