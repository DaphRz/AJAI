/**
 * Modelos de domínio do AJAI.
 * Espelham o diagrama de classes (docs/diagrama-classes.png) e as funções
 * de dados (ALI) da planilha de Análise de Pontos de Função.
 *
 * Os métodos das classes do diagrama (Incluir, Editar, Listar...) ficam
 * nos serviços em src/services/, não aqui.
 */

/**
 * Perfis (Passo 3.1). ALUNO, PROFESSOR, RESPONSAVEL e INSTITUICAO criam a própria conta;
 * ADMINISTRADOR só por seed/script. RESPONSAVEL e INSTITUICAO são EXTRAS em relação ao diagrama.
 */
export type Perfil = "ALUNO" | "PROFESSOR" | "RESPONSAVEL" | "INSTITUICAO" | "ADMINISTRADOR";

/** Situação da instituição (decidida pelo administrador). */
export type StatusInstituicao = "PENDENTE" | "APROVADA" | "RECUSADA";

/** Situação do professor na instituição (decidida pela instituição). */
export type StatusProfessor = "PENDENTE" | "APROVADO" | "RECUSADO";

/** Situação do vínculo acompanhante ↔ aluno (decidida pelo aluno). */
export type StatusVinculo = "PENDENTE" | "ACEITO" | "RECUSADO";

/**
 * Situação da conta, calculada pela API (login e GET /auth/eu) para o app decidir a tela.
 * Professor e instituição começam PENDENTE; os outros perfis já vêm APROVADA.
 */
export interface SituacaoConta {
  status: StatusInstituicao;
  motivo?: string;
  /** Professor: nome da instituição que vai aprovar. */
  nomeInstituicao?: string;
}

export type StatusAtividade = "ATIVA" | "INATIVA";

export type TipoAtividade =
  | "LETRA"
  | "SILABA"
  | "PALAVRA"
  | "FRASE"
  | "ESCRITA"
  | "INTERPRETACAO";

export interface Usuario {
  idUsuario: number;
  nome: string;
  /**
   * EXTRA (fora do diagrama, migração 003): login do ALUNO, ex.: "maria.silva". Só aluno tem.
   * Aluno tem pelo menos um entre nomeUsuario, email e telefone (migração 005).
   */
  nomeUsuario?: string;
  /** Opcional desde a migração 002. Professor, responsável e instituição: obrigatório no cadastro. */
  email?: string;
  /** EXTRA (fora do diagrama, migração 002): dígitos com DDD. */
  telefone?: string;
  /** Só existe no servidor: a API nunca envia a senha nem o hash para o app. */
  senhaHash?: string;
  perfil: Perfil;
  dataNascimento?: string; // ISO (Date)
  ativo: boolean;
  criadoEm: string; // ISO (DateTime)
  atualizadoEm: string;
  /** Vem da API (não é coluna): situação da conta para o app decidir a tela. */
  situacao?: SituacaoConta;
}

export interface Aluno extends Usuario {
  perfil: "ALUNO";
  vozPreferida: string;
  velocidadeVoz: number; // 0.5 a 1.5
  tamanhoFonte: number;
  idNivelInicial?: number; // associação "nivelInicial" (0..1)
  idNivelAtual?: number; // derivado do HistoricoNivel mais recente
}

export interface Professor extends Usuario {
  perfil: "PROFESSOR";
  /** EXTRA (migração 005): instituição informada pelo código no cadastro. */
  idInstituicao?: number;
  /** EXTRA (migração 005): só com APROVADO o professor usa a área dele. */
  statusVinculo?: StatusProfessor;
  motivoRecusa?: string;
  decididoEm?: string;
}

/** EXTRA (migração 005): acompanha até 2 alunos, sem turma. */
export interface Responsavel extends Usuario {
  perfil: "RESPONSAVEL";
}

/**
 * EXTRA (migração 005): escola/ONG que aprova os professores. `nome` é o nome da instituição.
 * Fica PENDENTE até o administrador aprovar; ao aprovar, ganha o `codigo` que o professor informa.
 */
export interface Instituicao extends Usuario {
  perfil: "INSTITUICAO";
  /** Só os 14 dígitos. */
  cnpj: string;
  nomeResponsavel: string;
  /** 6 caracteres maiúsculos, sem 0/O e 1/I/L. Ausente até a aprovação. */
  codigo?: string;
  status: StatusInstituicao;
  motivoRecusa?: string;
  decididoPor?: number;
  decididoEm?: string;
}

export interface Administrador extends Usuario {
  perfil: "ADMINISTRADOR";
}

export interface Turma {
  idTurma: number;
  nome: string;
  periodo: string;
  ativa: boolean;
  idProfessor: number; // associação "leciona"
}

/**
 * EXTRA (migração 005): ligação acompanhante (professor ou responsável) ↔ aluno.
 * Só com ACEITO o acompanhante vê dados do aluno. Responsável: no máximo 2 (PENDENTE + ACEITO).
 */
export interface Vinculo {
  idVinculo: number;
  idAluno: number;
  idAcompanhante: number;
  status: StatusVinculo;
  /** O que o acompanhante digitou ao convidar (usuário, e-mail ou telefone do aluno). */
  identificadorConvite?: string;
  criadoEm: string;
  decididoEm?: string;
}

/** Classe de associação Aluno–Turma. */
export interface Matricula {
  idAluno: number;
  idTurma: number;
  dataVinculo: string;
}

export interface Nivel {
  idNivel: number;
  nome: string;
  descricao: string;
  ordem: number;
  /** Taxa mínima de acerto (0 a 1) para avançar ao próximo nível. */
  criterioAcerto: number;
}

export interface Alternativa {
  idAlternativa: number;
  texto: string;
  ordem: number;
  correta: boolean;
  urlImagem?: string;
  /**
   * PROVISÓRIO: nome de um ícone do MaterialCommunityIcons (@expo/vector-icons) no lugar
   * da imagem até termos os arquivos finais (urlImagem). Nunca emoji.
   */
  ilustracao?: string;
}

export interface Atividade {
  idAtividade: number;
  idNivel: number; // associação "classifica"
  tipo: TipoAtividade;
  conteudo: string; // ex.: "Letra B", usado no DesempenhoConteudo
  enunciado: string;
  /**
   * EXTRA (fora do diagrama, migração 004): texto mostrado à parte do enunciado.
   * SILABA/PALAVRA: a palavra ("CASA"); FRASE: a frase; INTERPRETACAO: o texto de 2 a 4 linhas.
   */
  textoApoio?: string;
  urlImagem?: string;
  /** Gabarito: só existe no servidor (a API nunca envia para o app). */
  respostaCorreta: string;
  /** EXTRA (fora do diagrama): posição no nivelamento inicial; ausente = fora do nivelamento. */
  ordemNivelamento?: number;
  status: StatusAtividade;
  alternativas: Alternativa[]; // composição
  criadoEm: string;
  atualizadoEm: string;
}

/** Alternativa como o app recebe da API: sem o gabarito (`correta`). */
export type AlternativaDoAluno = Omit<Alternativa, "correta">;

/**
 * Atividade como o app recebe da API (GET /atividades/:id, /niveis/:id/atividades, /nivelamento):
 * sem `respostaCorreta` e sem `Alternativa.correta`. A correção é feita no servidor.
 * PALAVRA: as alternativas são as peças (sílabas) para montar a palavra, e a resposta é a junção.
 */
export interface AtividadeDoAluno
  extends Omit<Atividade, "respostaCorreta" | "alternativas" | "status" | "ordemNivelamento" | "criadoEm" | "atualizadoEm"> {
  alternativas: AlternativaDoAluno[];
}

export interface AudioCache {
  idAudio: number;
  textoOrigem: string;
  voz: string;
  velocidade: number;
  caminhoArquivo: string;
  /** EXTRA (fora do diagrama): provedor que gerou o áudio, ex.: "google", "polly". */
  provedor: string;
}

export interface Resposta {
  idResposta: number;
  idAluno: number; // "realiza"
  idAtividade: number; // "recebe"
  respostaDada: string;
  correta: boolean;
  dataHora: string;
  tempoRespostaSeg: number;
  correcaoProfessor?: string; // "corrige"
}

export interface DesempenhoConteudo {
  idDesempenho: number;
  idAluno: number; // "possui"
  idNivel: number;
  conteudo: string;
  totalTentativas: number;
  totalAcertos: number;
  taxaAcerto: number; // 0 a 1
  atualizadoEm: string;
}

export interface HistoricoNivel {
  idHistorico: number;
  idAluno: number; // "registra"
  idNivel: number;
  dataMudanca: string;
}
