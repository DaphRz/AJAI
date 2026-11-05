/**
 * Modelos de domínio do AJAI.
 * Espelham o diagrama de classes (docs/diagrama-classes.png) e as funções
 * de dados (ALI) da planilha de Análise de Pontos de Função.
 *
 * Os métodos das classes do diagrama (Incluir, Editar, Listar...) ficam
 * nos serviços em src/services/, não aqui.
 */

export type Perfil = "ALUNO" | "PROFESSOR" | "ADMINISTRADOR";

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
  email: string;
  senhaHash: string;
  perfil: Perfil;
  dataNascimento?: string; // ISO (Date)
  ativo: boolean;
  criadoEm: string; // ISO (DateTime)
  atualizadoEm: string;
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
  /** PROVISÓRIO: emoji no lugar da imagem até termos os arquivos finais. */
  ilustracao?: string;
}

export interface Atividade {
  idAtividade: number;
  idNivel: number; // associação "classifica"
  tipo: TipoAtividade;
  conteudo: string; // ex.: "Letra B", usado no DesempenhoConteudo
  enunciado: string;
  urlImagem?: string;
  respostaCorreta: string;
  /** EXTRA (fora do diagrama): posição no nivelamento inicial; ausente = fora do nivelamento. */
  ordemNivelamento?: number;
  status: StatusAtividade;
  alternativas: Alternativa[]; // composição
  criadoEm: string;
  atualizadoEm: string;
}

export interface AudioCache {
  idAudio: number;
  textoOrigem: string;
  voz: string;
  velocidade: number;
  caminhoArquivo: string;
  /** EXTRA (fora do diagrama): provedor que gerou o áudio, ex.: "google", "piper". */
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
