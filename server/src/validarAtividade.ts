// Validação de uma atividade cadastrada pelo administrador ou pelo professor (passo 9; APF 25–31).
// Função PURA (sem banco, sem Fastify), com testes em validarAtividade.test.ts.
// As mesmas regras do helper `atividade()` do src/data/mock.ts (que confere o seed):
//   - múltipla escolha (LETRA, SILABA, FRASE, INTERPRETACAO): de 2 a 4 alternativas, EXATAMENTE 1 correta,
//     sem textos repetidos; o gabarito é o texto da correta;
//   - PALAVRA: as alternativas são as PEÇAS (sílabas); as marcadas como corretas, numa ordem qualquer,
//     formam a palavra do textoApoio; o gabarito é a palavra;
//   - ESCRITA: sem alternativas e com respostaCorreta.
// LETRA: a letra grande da tela sai do `conteudo` ("Letra B" → "B"), então o conteúdo tem esse formato.
import { normalizarResposta } from "./correcao.ts";

export const TIPOS_ATIVIDADE = ["LETRA", "SILABA", "PALAVRA", "FRASE", "ESCRITA", "INTERPRETACAO"] as const;
export type TipoAtividade = (typeof TIPOS_ATIVIDADE)[number];

/** Tipos que precisam do texto de apoio (a palavra, a frase ou o texto mostrado à parte). */
export const TIPOS_COM_TEXTO_APOIO: readonly TipoAtividade[] = ["SILABA", "PALAVRA", "FRASE", "INTERPRETACAO"];

export const LIMITES = {
  alternativasMin: 2,
  alternativasMax: 4,
  pecasMax: 8,
} as const;

export interface AlternativaEnviada {
  texto: string;
  correta?: boolean;
  /** Nome de um ícone do MaterialCommunityIcons (provisório até existirem as imagens, urlImagem). */
  ilustracao?: string;
}

export interface AtividadeEnviada {
  tipo: TipoAtividade;
  conteudo: string;
  enunciado: string;
  textoApoio?: string;
  /** Só ESCRITA usa; nos outros tipos o gabarito sai das alternativas. */
  respostaCorreta?: string;
  alternativas?: AlternativaEnviada[];
}

export interface AtividadeValidada {
  tipo: TipoAtividade;
  conteudo: string;
  enunciado: string;
  textoApoio: string | null;
  respostaCorreta: string;
  alternativas: { texto: string; correta: boolean; ilustracao: string | null; ordem: number }[];
}

export type ResultadoValidacao = { ok: true; atividade: AtividadeValidada } | { ok: false; mensagem: string };

const limpar = (texto: string | undefined): string => (texto ?? "").trim().replace(/\s+/g, " ");
/** Para comparar peças e palavras: sem acento, maiúsculas e sem espaço nenhum. */
const compacto = (texto: string): string => normalizarResposta(texto).replace(/ /g, "");

/** As peças, cada uma usada uma vez e numa ordem qualquer, formam exatamente a palavra? */
export function pecasFormamPalavra(pecas: readonly string[], palavra: string): boolean {
  const alvo = compacto(palavra);
  const resto = pecas.map(compacto);
  if (alvo.length === 0 || resto.some((p) => p.length === 0)) return false;
  if (resto.reduce((t, p) => t + p.length, 0) !== alvo.length) return false;

  const usadas = resto.map(() => false);
  const montar = (posicao: number): boolean => {
    if (posicao === alvo.length) return true;
    for (let i = 0; i < resto.length; i++) {
      if (!usadas[i] && alvo.startsWith(resto[i], posicao)) {
        usadas[i] = true;
        if (montar(posicao + resto[i].length)) return true;
        usadas[i] = false;
      }
    }
    return false;
  };
  return montar(0);
}

export function validarAtividade(dados: AtividadeEnviada): ResultadoValidacao {
  const falha = (mensagem: string): ResultadoValidacao => ({ ok: false, mensagem });
  const tipo = dados.tipo;
  if (!TIPOS_ATIVIDADE.includes(tipo)) return falha("Escolha o tipo da atividade.");

  let conteudo = limpar(dados.conteudo);
  const enunciado = limpar(dados.enunciado);
  // O texto de interpretação pode ter quebras de linha: só tira os espaços das pontas.
  const textoApoio = (dados.textoApoio ?? "").trim() || null;
  const alternativas = (dados.alternativas ?? [])
    .map((a, i) => ({
      texto: limpar(a.texto),
      correta: a.correta === true,
      ilustracao: limpar(a.ilustracao) || null,
      ordem: i + 1,
    }))
    .filter((a) => a.texto.length > 0);

  if (conteudo.length < 2) return falha("Escreva o conteúdo. Exemplo: Letra B, Sílaba BO, Palavra CASA.");
  if (enunciado.length < 3) return falha("Escreva o enunciado (a pergunta para o aluno).");
  if (TIPOS_COM_TEXTO_APOIO.includes(tipo) && !textoApoio) {
    return falha(
      tipo === "FRASE"
        ? "Escreva a frase que o aluno vai ler."
        : tipo === "INTERPRETACAO"
          ? "Escreva o texto que o aluno vai ler."
          : "Escreva a palavra em destaque.",
    );
  }

  if (tipo === "LETRA") {
    const letra = /^letra\s+(\p{L})$/iu.exec(conteudo);
    if (!letra) return falha('Na atividade de letra, o conteúdo é "Letra" e a letra. Exemplo: Letra B.');
    conteudo = `Letra ${letra[1].toUpperCase()}`;
  }

  if (tipo === "ESCRITA") {
    const resposta = limpar(dados.respostaCorreta);
    if (alternativas.length > 0) return falha("A atividade de escrita não tem alternativas: o aluno escreve a resposta.");
    if (!resposta) return falha("Escreva a resposta certa da atividade de escrita.");
    return { ok: true, atividade: { tipo, conteudo, enunciado, textoApoio, respostaCorreta: resposta, alternativas: [] } };
  }

  if (tipo === "PALAVRA") {
    const palavra = textoApoio ?? "";
    if (alternativas.length < LIMITES.alternativasMin || alternativas.length > LIMITES.pecasMax) {
      return falha(`Escreva de ${LIMITES.alternativasMin} a ${LIMITES.pecasMax} peças (sílabas).`);
    }
    const corretas = alternativas.filter((a) => a.correta).map((a) => a.texto);
    if (!pecasFormamPalavra(corretas, palavra)) {
      return falha(`Marque as peças que formam a palavra ${palavra}. Juntas, elas precisam formar a palavra inteira.`);
    }
    return { ok: true, atividade: { tipo, conteudo, enunciado, textoApoio, respostaCorreta: palavra, alternativas } };
  }

  // Múltipla escolha
  if (alternativas.length < LIMITES.alternativasMin || alternativas.length > LIMITES.alternativasMax) {
    return falha(`Escreva de ${LIMITES.alternativasMin} a ${LIMITES.alternativasMax} alternativas.`);
  }
  const textos = alternativas.map((a) => normalizarResposta(a.texto));
  if (new Set(textos).size !== textos.length) return falha("As alternativas precisam ser diferentes umas das outras.");
  const corretas = alternativas.filter((a) => a.correta);
  if (corretas.length !== 1) return falha("Marque exatamente uma alternativa certa.");
  return {
    ok: true,
    atividade: { tipo, conteudo, enunciado, textoApoio, respostaCorreta: corretas[0].texto, alternativas },
  };
}
