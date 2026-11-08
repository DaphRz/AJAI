/**
 * DADOS DE DEMONSTRAÇÃO (em memória).
 *
 * Enquanto o backend (Node.js + banco) não existe, os serviços leem e
 * gravam aqui. Tudo é perdido ao recarregar o app.
 * Pendência: substituir por chamadas à API (ver README › Pendências).
 */
import type {
  Administrador,
  Aluno,
  Atividade,
  Matricula,
  Nivel,
  Professor,
  Resposta,
  Turma,
} from "@/domain/modelos";

const agora = new Date().toISOString();

export const niveis: Nivel[] = [
  { idNivel: 1, nome: "Aprendendo Letras", descricao: "Reconhecer as letras do alfabeto e seus sons.", ordem: 1, criterioAcerto: 0.7 },
  { idNivel: 2, nome: "Formando Sílabas", descricao: "Juntar letras para formar sílabas.", ordem: 2, criterioAcerto: 0.7 },
  { idNivel: 3, nome: "Formando Palavras", descricao: "Montar e reconhecer palavras.", ordem: 3, criterioAcerto: 0.75 },
  { idNivel: 4, nome: "Lendo Frases", descricao: "Ler frases curtas do dia a dia.", ordem: 4, criterioAcerto: 0.75 },
  { idNivel: 5, nome: "Entendendo Textos", descricao: "Ler e entender textos simples.", ordem: 5, criterioAcerto: 0.8 },
];

export const atividades: Atividade[] = [
  {
    idAtividade: 1,
    idNivel: 1,
    tipo: "LETRA",
    conteudo: "Letra B",
    enunciado: "Qual imagem começa com a letra B?",
    respostaCorreta: "Bola",
    status: "ATIVA",
    alternativas: [
      { idAlternativa: 1, texto: "Bola", ordem: 1, correta: true, ilustracao: "⚽" },
      { idAlternativa: 2, texto: "Casa", ordem: 2, correta: false, ilustracao: "🏠" },
      { idAlternativa: 3, texto: "Dado", ordem: 3, correta: false, ilustracao: "🎲" },
    ],
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idAtividade: 2,
    idNivel: 1,
    tipo: "LETRA",
    conteudo: "Letra M",
    enunciado: "Qual imagem começa com a letra M?",
    respostaCorreta: "Mão",
    status: "ATIVA",
    alternativas: [
      { idAlternativa: 4, texto: "Pé", ordem: 1, correta: false, ilustracao: "🦶" },
      { idAlternativa: 5, texto: "Mão", ordem: 2, correta: true, ilustracao: "✋" },
      { idAlternativa: 6, texto: "Sol", ordem: 3, correta: false, ilustracao: "☀️" },
    ],
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idAtividade: 3,
    idNivel: 2,
    tipo: "SILABA",
    conteudo: "Sílaba BO",
    enunciado: "Qual sílaba começa a palavra BOLA?",
    respostaCorreta: "BO",
    status: "ATIVA",
    alternativas: [
      { idAlternativa: 7, texto: "BA", ordem: 1, correta: false },
      { idAlternativa: 8, texto: "BO", ordem: 2, correta: true },
      { idAlternativa: 9, texto: "BU", ordem: 3, correta: false },
    ],
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idAtividade: 4,
    idNivel: 3,
    tipo: "PALAVRA",
    conteudo: "Palavra CASA",
    enunciado: "Junte as sílabas: CA + SA",
    respostaCorreta: "CASA",
    status: "ATIVA",
    alternativas: [
      { idAlternativa: 10, texto: "CASA", ordem: 1, correta: true },
      { idAlternativa: 11, texto: "SACA", ordem: 2, correta: false },
      { idAlternativa: 12, texto: "CAÇA", ordem: 3, correta: false },
    ],
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idAtividade: 5,
    idNivel: 4,
    tipo: "FRASE",
    conteudo: "Frase do cotidiano",
    enunciado: "Leia a frase: “O ônibus passa às 7 horas.” Que horas o ônibus passa?",
    respostaCorreta: "7 horas",
    status: "ATIVA",
    alternativas: [
      { idAlternativa: 13, texto: "5 horas", ordem: 1, correta: false },
      { idAlternativa: 14, texto: "7 horas", ordem: 2, correta: true },
      { idAlternativa: 15, texto: "9 horas", ordem: 3, correta: false },
    ],
    criadoEm: agora,
    atualizadoEm: agora,
  },
  {
    idAtividade: 6,
    idNivel: 3,
    tipo: "ESCRITA",
    conteudo: "Escrita do nome",
    enunciado: "Escreva a palavra SOL",
    respostaCorreta: "SOL",
    status: "ATIVA",
    alternativas: [],
    criadoEm: agora,
    atualizadoEm: agora,
  },
];

/** Perguntas usadas no nivelamento inicial (uma por nível, em ordem). */
export const idsAtividadesNivelamento = [1, 3, 4, 5];

export const professores: Professor[] = [
  {
    idUsuario: 100,
    nome: "Rafael Costa",
    email: "rafael@ajai.app",
    telefone: "11900000100",
    perfil: "PROFESSOR",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  },
];

/**
 * Administrador (cadastra atividades e níveis – passo 11; redefine senha de professor).
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

function alunoDemo(idUsuario: number, nome: string, idNivelAtual: number): Aluno {
  return {
    idUsuario,
    nome,
    // Aluno entra com nome de usuário (sem e-mail), e quem criou a conta foi o professor Rafael.
    nomeUsuario: nome.toLowerCase().replace(" ", "."),
    idCriador: 100,
    perfil: "ALUNO",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
    vozPreferida: "pt-BR",
    velocidadeVoz: 0.9,
    tamanhoFonte: 20,
    idNivelInicial: 1,
    idNivelAtual,
  };
}

export const alunos: Aluno[] = [
  alunoDemo(1, "Maria Silva", 1),
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
