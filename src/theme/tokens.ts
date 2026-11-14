/**
 * Tokens visuais do AJAI, extraídos do protótipo no Figma.
 * Arquivo Figma: https://www.figma.com/design/hXu6QCdfo7r7Qau5Rbia8M/AJAI
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
  texto: "#173B32",
  textoSuave: "#6E8076",
  superficie: "#FFFFFF",
  superficieSuave: "#EAF2E9", // cartão "Etapa"
  borda: "#C9D6CC",
  audioFundo: "#FFF0BC", // cartão amarelo "Ouvir ajuda"
  audioBorda: "#3E4A2E",
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
  lg: 20,
} as const;

export const fontes = {
  // A fonte do Figma é Inter; enquanto não carregamos a fonte com expo-font,
  // usamos a fonte do sistema com os mesmos tamanhos.
  tituloGrande: 32,
  titulo: 26,
  subtitulo: 22,
  corpo: 20,
  legenda: 16,
  letraAtividade: 120, // a letra grande da tela "Reconhecimento"
  silaba: 48, // peças de sílaba ("Sílabas", "Formar palavra")
  palavraDestaque: 40, // a palavra em destaque ("BONÉ", "CASA")
  ilustracao: 48, // PROVISÓRIO: ícone das alternativas até as imagens do passo 11
} as const;

export const toqueMinimo = 64;
