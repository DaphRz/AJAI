/**
 * Textos que a narração fala nas atividades (passo 10). Fica num arquivo SEM imports porque é
 * usado por dois lados:
 *   - o app (AtividadeView: "Ouvir instrução", "Ouvir frase/texto" e o toque longo na opção);
 *   - o `npm run voz:preparar` (server/scripts/voz-preparar.mjs), que gera os áudios de antemão.
 * Os dois precisam produzir o MESMO texto, senão o áudio preparado não é encontrado no cache.
 */

interface AtividadeNarrada {
  tipo: string;
  enunciado: string;
  textoApoio?: string | null;
  alternativas: { texto: string; ordem: number }[];
}

/** Frases fixas que também vale a pena preparar (não dependem do nome do aluno). */
export const FRASES_FIXAS = [
  "Carregando. Espere um pouquinho.",
  "Esta é a velocidade da voz. Você entende bem?",
] as const;

/** "BO, LA ou CA". */
export function juntarOpcoes(lista: string[]): string {
  return lista.length <= 1 ? lista.join("") : `${lista.slice(0, -1).join(", ")} ou ${lista[lista.length - 1]}`;
}

/** O que o "Ouvir instrução" fala: o enunciado e, se houver, as opções (para quem ainda não lê). */
export function textoDaInstrucao(atividade: AtividadeNarrada): string {
  const opcoes = [...atividade.alternativas].sort((a, b) => a.ordem - b.ordem).map((a) => a.texto);
  switch (atividade.tipo) {
    case "PALAVRA":
      return `${atividade.enunciado} para formar a palavra ${atividade.textoApoio ?? ""}. Toque nas sílabas na ordem certa.`;
    case "ESCRITA":
      return `${atividade.enunciado}. Depois, toque em Confirmar.`;
    case "FRASE":
    case "INTERPRETACAO":
      return `${atividade.textoApoio ?? ""} ${atividade.enunciado} As opções são: ${juntarOpcoes(opcoes)}.`;
    default:
      return `${atividade.enunciado} As opções são: ${juntarOpcoes(opcoes)}.`;
  }
}

/** Todos os textos que uma atividade pode narrar: instrução, texto de apoio (frase/texto) e cada opção. */
export function textosDaAtividade(atividade: AtividadeNarrada): string[] {
  const textos = [textoDaInstrucao(atividade)];
  if ((atividade.tipo === "FRASE" || atividade.tipo === "INTERPRETACAO") && atividade.textoApoio) {
    textos.push(atividade.textoApoio);
  }
  for (const alternativa of atividade.alternativas) textos.push(alternativa.texto);
  return textos;
}
