/**
 * Tokens visuais do AJAI, extraídos do protótipo no Figma.
 * Arquivo Figma: https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI
 * O Figma não tem variáveis/estilos publicados: os valores foram medidos nos frames
 * "Home do aluno" e "Splash" (18/11).
 *
 * Regras de acessibilidade (RNF01–RNF07):
 * - texto base nunca menor que 18;
 * - área de toque mínima de 64 px de altura para ações principais;
 * - contraste alto entre texto e fundo.
 */

export const cores = {
  fundo: "#FFFCF5", // creme do fundo das telas
  primaria: "#17594D", // verde escuro: botões principais, títulos
  primariaTexto: "#FFFFFF",
  texto: "#173D35",
  textoSuave: "#4D6259", // contraste 6,4:1 sobre o fundo creme
  superficie: "#FFFFFF",
  superficieSuave: "#EAF2E9", // cartão "Etapa"
  borda: "#C9D9CB", // cartão "Ofensiva"
  audioFundo: "#FFF0BC", // cartão amarelo "Ouvir ajuda"
  audioBorda: "#17594D",
  sucesso: "#2E7D4F",
  atencaoFundo: "#FDF0C4",
  atencaoTexto: "#8A5A00",
  erro: "#B3261E",
} as const;

export const espacos = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const raios = {
  md: 12,
  botao: 22, // botões e cartão "Ouvir ajuda"
  lg: 24, // cartões ("Etapa", "Ofensiva")
} as const;

/** Margens da tela no Figma: 28 dos lados e 20 em cima/embaixo; rodapé "Ouvir ajuda" com 24 × 18. */
export const margensTela = { horizontal: 28, vertical: 20, rodapeHorizontal: 24, rodapeVertical: 18 } as const;

/**
 * Fonte Inter (Figma), carregada no _layout raiz com @expo-google-fonts/inter.
 * No React Native cada peso é uma família: use `fontFamily: familias.negrito`, nunca `fontWeight`
 * (no Android o fontWeight não escolhe o arquivo da fonte).
 */
export const familias = {
  regular: "Inter_400Regular",
  seminegrito: "Inter_600SemiBold",
  negrito: "Inter_700Bold",
  extranegrito: "Inter_800ExtraBold",
  preto: "Inter_900Black",
} as const;

export const fontes = {
  tituloGrande: 38, // "Olá, Maria!"
  titulo: 28, // "Ouvir ajuda", enunciados
  subtitulo: 24, // "Vamos aprender?", "Meu progresso", valores dos cartões
  corpo: 20,
  legenda: 16,
  botaoGrande: 32, // "CONTINUAR"
  marca: 30, // "AJAI" ao lado do símbolo
  marcaGrande: 64, // "AJAI" na splash
  letraAtividade: 120, // a letra grande da tela "Reconhecimento"
  silaba: 48, // peças de sílaba ("Sílabas", "Formar palavra")
  palavraDestaque: 40, // a palavra em destaque ("BONÉ", "CASA")
  ilustracao: 48, // ícone provisório das alternativas sem imagem (urlImagem)
} as const;

export const toqueMinimo = 64;
/** Altura do botão de destaque ("CONTINUAR") e do cartão "Ouvir ajuda" no Figma. */
export const alturaBotaoGrande = 80;

export type Fontes = { [K in keyof typeof fontes]: number };

/**
 * Tamanhos de letra do aluno (passo 10, Aluno.tamanhoFonte = tamanho do texto do corpo).
 * Os valores ficam no banco; a tela de preferências mostra os nomes.
 */
export const tamanhosDeLetra = [
  { valor: 20, nome: "Normal" },
  { valor: 24, nome: "Grande" },
  { valor: 28, nome: "Muito grande" },
] as const;

/** Velocidades da voz do aluno (Aluno.velocidadeVoz); o servidor prepara os áudios nessas três. */
export const velocidadesDaVoz = [
  { valor: 0.8, nome: "Lenta" },
  { valor: 1, nome: "Normal" },
  { valor: 1.2, nome: "Rápida" },
] as const;

/**
 * `fontes` aumentadas para o tamanho de letra escolhido pelo aluno. Aumenta os textos
 * (título, subtítulo, corpo, legenda); letra da atividade, sílabas, palavra em destaque,
 * marca e botão grande já são grandes e ficam como estão, para não quebrar o layout. Use pelo hook useFontes/useEstilos.
 */
export function fontesNoTamanho(tamanhoCorpo: number): Fontes {
  const escala = Math.max(1, tamanhoCorpo / fontes.corpo);
  const aumentar = (n: number) => Math.round(n * escala);
  return {
    ...fontes,
    tituloGrande: aumentar(fontes.tituloGrande),
    titulo: aumentar(fontes.titulo),
    subtitulo: aumentar(fontes.subtitulo),
    corpo: aumentar(fontes.corpo),
    legenda: aumentar(fontes.legenda),
  };
}
