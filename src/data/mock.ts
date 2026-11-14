/**
 * DADOS DE DEMONSTRAÇÃO — fonte do seed do banco (server/db/seed.mjs, `npm run db:seed`).
 *
 * Níveis, atividades, contas, respostas e progressão já vêm da API (passos 3 a 5). Só o painel
 * do professor (services/relatorios.ts) ainda lê estes arrays em memória até o passo 8.
 */
import type {
  Administrador,
  Aluno,
  Atividade,
  Instituicao,
  Matricula,
  Nivel,
  Professor,
  Responsavel,
  Resposta,
  Turma,
  Vinculo,
} from "@/domain/modelos";

const agora = new Date().toISOString();

export const niveis: Nivel[] = [
  { idNivel: 1, nome: "Aprendendo Letras", descricao: "Reconhecer as letras do alfabeto e seus sons.", ordem: 1, criterioAcerto: 0.7 },
  { idNivel: 2, nome: "Formando Sílabas", descricao: "Juntar letras para formar sílabas.", ordem: 2, criterioAcerto: 0.7 },
  { idNivel: 3, nome: "Formando Palavras", descricao: "Montar e reconhecer palavras.", ordem: 3, criterioAcerto: 0.75 },
  { idNivel: 4, nome: "Lendo Frases", descricao: "Ler frases curtas do dia a dia.", ordem: 4, criterioAcerto: 0.75 },
  { idNivel: 5, nome: "Entendendo Textos", descricao: "Ler e entender textos simples.", ordem: 5, criterioAcerto: 0.8 },
];

/**
 * Conteúdo pedagógico (passo 6; RF04–RF11). Público adulto da EJA: situações do cotidiano,
 * nada infantilizado. Tabelas, critérios, nivelamento e imagens: docs/conteudo-pedagogico.md.
 *
 * `conteudo` é padronizado porque agrupa o relatório de dificuldades (DesempenhoConteudo):
 *   nível 1 "Letra B" · nível 2 "Sílaba BO" · nível 3 "Palavra CASA" / "Escrita PÃO"
 *   nível 4 "Frase: <tema>" · nível 5 "Texto: <habilidade de leitura>".
 * LETRA: a letra grande da tela sai do `conteudo` ("Letra B" → "B"), então ele é obrigatório.
 * Os ids 1 a 7 são os mesmos de antes (respostas de exemplo e testes dependem deles).
 */
interface Opcao {
  texto: string;
  correta?: true;
  /** Nome de um ícone do MaterialCommunityIcons até as imagens do passo 11 (nunca emoji). */
  ilustracao?: string;
}

type DadosAtividade = Pick<Atividade, "idAtividade" | "idNivel" | "tipo" | "conteudo" | "enunciado" | "textoApoio"> & {
  opcoes?: Opcao[];
  /** Só ESCRITA precisa informar; nos outros tipos o gabarito sai das opções. */
  respostaCorreta?: string;
};

let ultimaAlternativa = 0;

/**
 * Monta a Atividade e confere o gabarito ao carregar (o seed para se algo estiver errado):
 * múltipla escolha = exatamente 1 opção correta; PALAVRA = as peças corretas formam a palavra
 * do textoApoio; ESCRITA = sem opções e com respostaCorreta.
 */
function atividade({ opcoes = [], respostaCorreta, ...dados }: DadosAtividade): Atividade {
  const alternativas = opcoes.map((o, i) => ({
    idAlternativa: ++ultimaAlternativa,
    texto: o.texto,
    ordem: i + 1,
    correta: o.correta === true,
    ilustracao: o.ilustracao,
  }));
  const corretas = alternativas.filter((a) => a.correta);
  const problema = (msg: string) => new Error(`mock.ts, atividade ${dados.idAtividade}: ${msg}`);
  let gabarito: string;

  if (dados.tipo === "ESCRITA") {
    if (alternativas.length > 0 || !respostaCorreta) throw problema("ESCRITA não tem opções e precisa de respostaCorreta.");
    gabarito = respostaCorreta;
  } else if (dados.tipo === "PALAVRA") {
    const palavra = dados.textoApoio ?? "";
    const tamanho = corretas.reduce((t, a) => t + a.texto.length, 0);
    if (!palavra || tamanho !== palavra.length || !corretas.every((a) => palavra.includes(a.texto))) {
      throw problema("as peças corretas precisam formar a palavra do textoApoio.");
    }
    gabarito = palavra;
  } else {
    if (corretas.length !== 1) throw problema("múltipla escolha precisa de exatamente 1 opção correta.");
    gabarito = corretas[0].texto;
  }

  return { ...dados, respostaCorreta: gabarito, status: "ATIVA", alternativas, criadoEm: agora, atualizadoEm: agora };
}

export const atividades: Atividade[] = [
  // ── Nível 1 · Aprendendo Letras (RF04, RF05: reconhecer a letra e associar ao som) ──────────
  // Distratores com letras que se confundem: B/P/V, M/N, C/G, T/D, O/U/A.
  atividade({
    idAtividade: 1, idNivel: 1, tipo: "LETRA", conteudo: "Letra B",
    enunciado: "Qual figura começa com a letra B?",
    opcoes: [
      { texto: "Pão", ilustracao: "bread-slice" },
      { texto: "Banco", correta: true, ilustracao: "bank" },
      { texto: "Vaca", ilustracao: "cow" },
    ],
  }),
  atividade({
    idAtividade: 2, idNivel: 1, tipo: "LETRA", conteudo: "Letra M",
    enunciado: "Qual figura começa com a letra M?",
    opcoes: [
      { texto: "Pé", ilustracao: "foot-print" },
      { texto: "Mão", correta: true, ilustracao: "hand-back-right" },
      { texto: "Sol", ilustracao: "white-balance-sunny" },
    ],
  }),
  atividade({
    idAtividade: 8, idNivel: 1, tipo: "LETRA", conteudo: "Letra P",
    enunciado: "Qual palavra começa com o som da letra P?",
    opcoes: [
      { texto: "Mão", ilustracao: "hand-back-right" },
      { texto: "Banco", ilustracao: "bank" },
      { texto: "Pão", correta: true, ilustracao: "bread-slice" },
    ],
  }),
  atividade({
    idAtividade: 9, idNivel: 1, tipo: "LETRA", conteudo: "Letra R",
    enunciado: "Qual figura começa com a letra R?",
    opcoes: [
      { texto: "Arroz", ilustracao: "rice" },
      { texto: "Remédio", correta: true, ilustracao: "pill" },
      { texto: "Lâmpada", ilustracao: "lightbulb-on" },
    ],
  }),
  atividade({
    idAtividade: 10, idNivel: 1, tipo: "LETRA", conteudo: "Letra C",
    enunciado: "Qual palavra começa com o som da letra C?",
    opcoes: [
      { texto: "Garrafa", ilustracao: "bottle-wine" },
      { texto: "Sapato", ilustracao: "shoe-formal" },
      { texto: "Café", correta: true, ilustracao: "coffee" },
    ],
  }),
  atividade({
    idAtividade: 11, idNivel: 1, tipo: "LETRA", conteudo: "Letra T",
    enunciado: "Qual figura começa com a letra T?",
    opcoes: [
      { texto: "Televisão", correta: true, ilustracao: "television" },
      { texto: "Dinheiro", ilustracao: "cash" },
      { texto: "Chave", ilustracao: "key" },
    ],
  }),
  atividade({
    idAtividade: 12, idNivel: 1, tipo: "LETRA", conteudo: "Letra O",
    enunciado: "Qual figura começa com a letra O?",
    opcoes: [
      { texto: "Água", ilustracao: "water" },
      { texto: "Ônibus", correta: true, ilustracao: "bus" },
      { texto: "Uva", ilustracao: "fruit-grapes" },
    ],
  }),

  // ── Nível 2 · Formando Sílabas (RF06) ───────────────────────────────────────────────────────
  // Distratores: mesma consoante com outra vogal, ou consoante parecida (B/P, C/G, T/D, M/N, R/L).
  atividade({
    idAtividade: 3, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba BO",
    enunciado: "Qual sílaba começa a palavra BONÉ?", textoApoio: "BONÉ",
    opcoes: [{ texto: "BA" }, { texto: "BO", correta: true }, { texto: "BU" }],
  }),
  atividade({
    idAtividade: 13, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba CA",
    enunciado: "Qual sílaba começa a palavra CAFÉ?", textoApoio: "CAFÉ",
    opcoes: [{ texto: "GA" }, { texto: "CA", correta: true }, { texto: "CO" }],
  }),
  atividade({
    idAtividade: 14, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba PA",
    enunciado: "Qual sílaba começa a palavra PANELA?", textoApoio: "PANELA",
    opcoes: [{ texto: "PA", correta: true }, { texto: "BA" }, { texto: "PO" }],
  }),
  atividade({
    idAtividade: 15, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba ME",
    enunciado: "Qual sílaba começa a palavra MÉDICO?", textoApoio: "MÉDICO",
    opcoes: [{ texto: "MA" }, { texto: "NÉ" }, { texto: "MÉ", correta: true }],
  }),
  atividade({
    idAtividade: 16, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba TA",
    enunciado: "Qual sílaba termina a palavra CONTA?", textoApoio: "CONTA",
    opcoes: [{ texto: "DA" }, { texto: "TA", correta: true }, { texto: "CA" }],
  }),
  atividade({
    idAtividade: 17, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba DI",
    enunciado: "Qual sílaba começa a palavra DINHEIRO?", textoApoio: "DINHEIRO",
    opcoes: [{ texto: "DI", correta: true }, { texto: "TI" }, { texto: "DE" }],
  }),
  atividade({
    idAtividade: 18, idNivel: 2, tipo: "SILABA", conteudo: "Sílaba RE",
    enunciado: "Qual sílaba começa a palavra REMÉDIO?", textoApoio: "REMÉDIO",
    opcoes: [{ texto: "RA" }, { texto: "LE" }, { texto: "RE", correta: true }],
  }),

  // ── Nível 3 · Formando Palavras (RF07, RF09) ────────────────────────────────────────────────
  // PALAVRA: a palavra aparece em destaque e as opções são as PEÇAS (correta = faz parte da
  // palavra; 1 peça a mais para distrair). A resposta é a junção das peças tocadas.
  atividade({
    idAtividade: 4, idNivel: 3, tipo: "PALAVRA", conteudo: "Palavra CASA",
    enunciado: "Junte as sílabas", textoApoio: "CASA",
    opcoes: [{ texto: "SA", correta: true }, { texto: "BO" }, { texto: "CA", correta: true }, { texto: "LA" }],
  }),
  atividade({
    idAtividade: 6, idNivel: 3, tipo: "ESCRITA", conteudo: "Escrita PÃO",
    enunciado: "Escreva a palavra PÃO", respostaCorreta: "PÃO",
  }),
  atividade({
    idAtividade: 19, idNivel: 3, tipo: "PALAVRA", conteudo: "Palavra SAPATO",
    enunciado: "Junte as sílabas", textoApoio: "SAPATO",
    opcoes: [{ texto: "TO", correta: true }, { texto: "SA", correta: true }, { texto: "BA" }, { texto: "PA", correta: true }],
  }),
  atividade({
    idAtividade: 20, idNivel: 3, tipo: "PALAVRA", conteudo: "Palavra LEITE",
    enunciado: "Junte as sílabas", textoApoio: "LEITE",
    opcoes: [{ texto: "TE", correta: true }, { texto: "LE" }, { texto: "LEI", correta: true }],
  }),
  atividade({
    idAtividade: 21, idNivel: 3, tipo: "PALAVRA", conteudo: "Palavra REMÉDIO",
    enunciado: "Junte as sílabas", textoApoio: "REMÉDIO",
    opcoes: [{ texto: "DIO", correta: true }, { texto: "RE", correta: true }, { texto: "MA" }, { texto: "MÉ", correta: true }],
  }),
  atividade({
    idAtividade: 22, idNivel: 3, tipo: "PALAVRA", conteudo: "Palavra ÔNIBUS",
    enunciado: "Junte as sílabas", textoApoio: "ÔNIBUS",
    opcoes: [{ texto: "NI", correta: true }, { texto: "BUS", correta: true }, { texto: "NO" }, { texto: "Ô", correta: true }],
  }),
  atividade({
    idAtividade: 23, idNivel: 3, tipo: "ESCRITA", conteudo: "Escrita LUZ",
    enunciado: "Escreva a palavra LUZ", respostaCorreta: "LUZ",
  }),

  // ── Nível 4 · Lendo Frases do dia a dia (RF08, RF11) ────────────────────────────────────────
  // Distratores: números e lugares parecidos, ou o contrário do que a frase diz.
  atividade({
    idAtividade: 5, idNivel: 4, tipo: "FRASE", conteudo: "Frase: horário",
    enunciado: "Que horas o ônibus passa?", textoApoio: "O ônibus passa às 7 horas.",
    opcoes: [{ texto: "5 horas" }, { texto: "7 horas", correta: true }, { texto: "9 horas" }],
  }),
  atividade({
    idAtividade: 24, idNivel: 4, tipo: "FRASE", conteudo: "Frase: preço",
    enunciado: "Quanto custa o quilo do feijão?", textoApoio: "O quilo do feijão custa 8 reais.",
    opcoes: [{ texto: "6 reais" }, { texto: "18 reais" }, { texto: "8 reais", correta: true }],
  }),
  atividade({
    idAtividade: 25, idNivel: 4, tipo: "FRASE", conteudo: "Frase: remédio",
    enunciado: "Quando tomar o remédio?", textoApoio: "Tome 1 comprimido depois do almoço.",
    opcoes: [{ texto: "Antes do café" }, { texto: "Depois do almoço", correta: true }, { texto: "Antes de dormir" }],
  }),
  atividade({
    idAtividade: 26, idNivel: 4, tipo: "FRASE", conteudo: "Frase: mensagem",
    enunciado: "Para que dia mudou a reunião?", textoApoio: "A reunião da escola mudou para sexta-feira.",
    opcoes: [{ texto: "Sexta-feira", correta: true }, { texto: "Sábado" }, { texto: "Segunda-feira" }],
  }),
  atividade({
    idAtividade: 27, idNivel: 4, tipo: "FRASE", conteudo: "Frase: placa",
    enunciado: "O que essa placa quer dizer?", textoApoio: "Proibido estacionar.",
    opcoes: [{ texto: "Pode parar o carro aqui" }, { texto: "Aqui é o ponto de ônibus" }, { texto: "Não pode parar o carro aqui", correta: true }],
  }),
  atividade({
    idAtividade: 28, idNivel: 4, tipo: "FRASE", conteudo: "Frase: documento",
    enunciado: "O que precisa levar?", textoApoio: "Leve o RG e o CPF para fazer o cadastro.",
    opcoes: [{ texto: "A conta de luz" }, { texto: "O RG e o CPF", correta: true }, { texto: "A carteira de trabalho" }],
  }),
  atividade({
    idAtividade: 29, idNivel: 4, tipo: "FRASE", conteudo: "Frase: conta",
    enunciado: "Quando vence a conta de luz?", textoApoio: "A conta de luz vence no dia 10.",
    opcoes: [{ texto: "Dia 1" }, { texto: "Dia 20" }, { texto: "Dia 10", correta: true }],
  }),

  // ── Nível 5 · Entendendo Textos (RF10, RF11) ────────────────────────────────────────────────
  // `conteudo` = habilidade de leitura: achar informação, entender o objetivo, tirar conclusão.
  atividade({
    idAtividade: 7, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: achar informação",
    enunciado: "O que Dona Rosa precisa levar?",
    textoApoio:
      "A consulta de Dona Rosa é na quinta-feira, às 9 horas. Ela precisa levar o cartão do SUS e chegar meia hora antes.",
    opcoes: [{ texto: "A conta de luz" }, { texto: "O cartão do SUS", correta: true }, { texto: "O título de eleitor" }],
  }),
  atividade({
    idAtividade: 30, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: achar informação",
    enunciado: "Quanto tempo o bolo fica no forno?",
    textoApoio: "Bolo de fubá: misture 2 ovos, 1 copo de leite e 2 copos de fubá. Leve ao forno por 40 minutos.",
    opcoes: [{ texto: "2 minutos" }, { texto: "40 minutos", correta: true }, { texto: "1 hora" }],
  }),
  atividade({
    idAtividade: 31, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: achar informação",
    enunciado: "Por quantos dias tomar o remédio?",
    textoApoio: "Receita: tome 1 comprimido a cada 8 horas, durante 5 dias. Se a dor não passar, volte ao posto.",
    opcoes: [{ texto: "1 dia" }, { texto: "8 dias" }, { texto: "5 dias", correta: true }],
  }),
  atividade({
    idAtividade: 32, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: entender o objetivo",
    enunciado: "Para que serve esse aviso?",
    textoApoio: "Aviso: na terça-feira, vai faltar água no bairro das 8 às 14 horas, para conserto. Guarde água.",
    opcoes: [
      { texto: "Cobrar a conta de água" },
      { texto: "Avisar que vai faltar água", correta: true },
      { texto: "Chamar para uma reunião" },
    ],
  }),
  atividade({
    idAtividade: 33, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: entender o objetivo",
    enunciado: "Por que a farmácia mandou essa mensagem?",
    textoApoio: "Oi, Seu João! Aqui é da Farmácia Popular. O seu remédio chegou. Pode buscar até sábado.",
    opcoes: [
      { texto: "Para marcar uma consulta" },
      { texto: "Para cobrar uma dívida" },
      { texto: "Para avisar que o remédio chegou", correta: true },
    ],
  }),
  atividade({
    idAtividade: 34, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: tirar conclusão",
    enunciado: "Que horas passa o próximo ônibus?",
    textoApoio: "O ônibus 210 passa de meia em meia hora. O último ônibus passou às 8 horas.",
    opcoes: [{ texto: "8 horas" }, { texto: "8 e meia", correta: true }, { texto: "9 horas" }],
  }),
  atividade({
    idAtividade: 35, idNivel: 5, tipo: "INTERPRETACAO", conteudo: "Texto: tirar conclusão",
    enunciado: "Em qual mercado o arroz está mais barato?",
    textoApoio: "No Mercado Bom Preço, o pacote de arroz de 5 quilos custa 25 reais. No Mercado Economia, custa 22 reais.",
    opcoes: [{ texto: "No Bom Preço" }, { texto: "No Economia", correta: true }, { texto: "O preço é igual" }],
  }),
];

/**
 * Perguntas do nivelamento inicial (RF03): 2 por nível, da mais fácil para a mais difícil.
 * O seed grava a posição em Atividade.ordemNivelamento; o app recebe por GET /nivelamento.
 * O aluno para no primeiro erro e só passa de nível acertando as 2 perguntas do par
 * (definirNivelInicial, server/src/progressao.ts; ver docs/conteudo-pedagogico.md).
 */
export const idsAtividadesNivelamento = [12, 1, 13, 3, 4, 21, 5, 25, 7, 34];

/**
 * Administrador (aprova instituições; cadastra atividades e níveis – passo 9; gera senha provisória).
 * A senha de TODOS os usuários de demonstração é a do seed (server/db/seed.mjs, SENHA_DEMO).
 */
export const administradores: Administrador[] = [
  {
    idUsuario: 900,
    nome: "Administração AJAI",
    email: "admin@ajai.app",
    perfil: "ADMINISTRADOR",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
];

/** Código fixo da instituição aprovada de demonstração (o professor informa no cadastro). */
export const CODIGO_INSTITUICAO_DEMO = "EJAVV2";

/** Instituições (Passo 3.1): uma APROVADA (com código) e uma PENDENTE, esperando o administrador. */
export const instituicoes: Instituicao[] = [
  {
    idUsuario: 800,
    nome: "Escola EJA Centro (demonstração)",
    email: "instituicao@ajai.app",
    telefone: "11900000800",
    perfil: "INSTITUICAO",
    cnpj: "11222333000181",
    nomeResponsavel: "Helena Martins",
    codigo: CODIGO_INSTITUICAO_DEMO,
    status: "APROVADA",
    decididoPor: 900,
    decididoEm: agora,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idUsuario: 801,
    nome: "Instituto Aprender Sempre",
    email: "aprender@ajai.app",
    telefone: "11900000801",
    perfil: "INSTITUICAO",
    cnpj: "45287196000185",
    nomeResponsavel: "Carlos Pereira",
    status: "PENDENTE",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
];

/** Professores: Rafael já APROVADO pela instituição; Paula ainda PENDENTE. */
export const professores: Professor[] = [
  {
    idUsuario: 100,
    nome: "Rafael Costa",
    email: "rafael@ajai.app",
    telefone: "11900000100",
    perfil: "PROFESSOR",
    idInstituicao: 800,
    statusVinculo: "APROVADO",
    decididoEm: agora,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idUsuario: 101,
    nome: "Paula Ramos",
    email: "paula@ajai.app",
    telefone: "11900000101",
    perfil: "PROFESSOR",
    idInstituicao: 800,
    statusVinculo: "PENDENTE",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
];

/** Responsável (familiar): acompanha no máximo 2 pessoas, sem turma. */
export const responsaveis: Responsavel[] = [
  {
    idUsuario: 700,
    nome: "Joana Lima",
    email: "joana@ajai.app",
    telefone: "11900000700",
    perfil: "RESPONSAVEL",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
];

/** idNivelAtual ausente = aluno que ainda não fez o nivelamento (entra direto nele). */
function alunoDemo(idUsuario: number, nome: string, idNivelAtual?: number): Aluno {
  return {
    idUsuario,
    nome,
    // Aluno de demonstração entra com nome de usuário (ex.: maria.silva).
    nomeUsuario: nome.toLowerCase().replace(" ", "."),
    perfil: "ALUNO",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
    vozPreferida: "pt-BR",
    velocidadeVoz: 0.9,
    tamanhoFonte: 20,
    idNivelInicial: idNivelAtual === undefined ? undefined : 1,
    idNivelAtual,
  };
}

export const alunos: Aluno[] = [
  alunoDemo(1, "Maria Silva"), // aluna nova: o login leva ao nivelamento
  alunoDemo(2, "Ana Souza", 1),
  alunoDemo(3, "Bruno Lima", 2),
  alunoDemo(4, "Clara Santos", 1),
];

export const turmas: Turma[] = [
  { idTurma: 1, nome: "EJA – Noite", periodo: "2026/2", ativa: true, idProfessor: 100 },
];

export const matriculas: Matricula[] = alunos.map((a) => ({
  idAluno: a.idUsuario,
  idTurma: 1,
  dataVinculo: agora,
}));

/** Vínculos aceitos: os 4 alunos com o professor Rafael, e Bruno também com a responsável Joana. */
export const vinculos: Vinculo[] = [
  ...alunos.map((a, i) => ({
    idVinculo: i + 1,
    idAluno: a.idUsuario,
    idAcompanhante: 100,
    status: "ACEITO" as const,
    identificadorConvite: a.nomeUsuario,
    criadoEm: agora,
    decididoEm: agora,
  })),
  {
    idVinculo: alunos.length + 1,
    idAluno: 3,
    idAcompanhante: 700,
    status: "ACEITO",
    identificadorConvite: "bruno.lima",
    criadoEm: agora,
    decididoEm: agora,
  },
];

/**
 * Respostas: começa com um histórico fictício para Ana, Bruno e Clara
 * (para o painel do professor ter o que mostrar). Maria (aluna de teste
 * do login) começa sem respostas.
 */
export const respostas: Resposta[] = [];

function semear(idAluno: number, idAtividade: number, padrao: boolean[]) {
  padrao.forEach((correta, i) => {
    const dias = i % 7;
    respostas.push({
      idResposta: respostas.length + 1,
      idAluno,
      idAtividade,
      respostaDada: correta ? "certa" : "errada",
      correta,
      dataHora: new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString(),
      tempoRespostaSeg: 8 + (i % 5),
    });
  });
}

semear(2, 1, [true, false, false, true, false, true, false]); // Ana: dificuldade na letra B
semear(2, 2, [true, true, true]);
semear(3, 3, [true, false, true, false, true]); // Bruno: sílaba BO
semear(3, 4, [true, true, true, true]);
semear(4, 2, [true, true, true, true, true, true, false, true]); // Clara: em dia
