// Consultas de usuário compartilhadas pelas rotas de autenticação.
// O objeto devolvido ao app tem o formato dos tipos de src/domain/modelos.ts
// (Aluno, Professor, Administrador), SEM senhaHash.
import { banco } from "./banco.ts";

export type Perfil = "ALUNO" | "PROFESSOR" | "ADMINISTRADOR";

export interface LinhaUsuario {
  idUsuario: number;
  nome: string;
  nomeUsuario: string | null;
  email: string | null;
  telefone: string | null;
  senhaHash: string;
  perfil: Perfil;
  dataNascimento: string | null;
  ativo: number;
  criadoEm: string;
  atualizadoEm: string;
}

/** Usuário como o app recebe (campos nulos são omitidos, como os opcionais de modelos.ts). */
export type UsuarioPublico = Record<string, unknown> & { idUsuario: number; perfil: Perfil };

/** E-mail em minúsculas e sem espaços nas pontas. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Telefone só com dígitos e DDD (10 ou 11 dígitos). Aceita "+55", parênteses, espaços e traços.
 * Devolve null se não parecer um telefone do Brasil.
 */
export function normalizarTelefone(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) digitos = digitos.slice(2);
  if (digitos.length === 11 && digitos.startsWith("0")) return null;
  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
}

/**
 * Nome de usuário do aluno: letras sem acento e números, separados por ponto, hífen ou "_".
 * Precisa ter pelo menos uma letra (só números seria confundido com telefone no login).
 */
export const PADRAO_NOME_USUARIO = "^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$";

export function normalizarNomeUsuario(nomeUsuario: string): string {
  return nomeUsuario.trim().toLowerCase();
}

/** Primeiro nome de usuário livre a partir de um desejado: maria.silva, maria.silva2, maria.silva3... */
export function nomeUsuarioLivre(desejado: string): string {
  const db = banco();
  const existe = db.prepare("SELECT 1 FROM Usuario WHERE nomeUsuario = ?");
  if (!existe.get(desejado)) return desejado;
  for (let n = 2; ; n++) if (!existe.get(`${desejado}${n}`)) return `${desejado}${n}`;
}

/**
 * Busca pelo que a pessoa digitou no login (um campo só):
 * tem "@" → e-mail (professor/administrador); só números → telefone; senão → nome de usuário (aluno).
 */
export function buscarPorIdentificador(identificador: string): LinhaUsuario | undefined {
  const db = banco();
  const texto = identificador.trim();
  if (texto.includes("@")) {
    return db.prepare("SELECT * FROM Usuario WHERE email = ?").get(normalizarEmail(texto)) as LinhaUsuario | undefined;
  }
  if (/^[0-9()+ .-]+$/.test(texto)) {
    const telefone = normalizarTelefone(texto);
    if (!telefone) return undefined;
    return db.prepare("SELECT * FROM Usuario WHERE telefone = ?").get(telefone) as LinhaUsuario | undefined;
  }
  return db.prepare("SELECT * FROM Usuario WHERE nomeUsuario = ?").get(normalizarNomeUsuario(texto)) as
    | LinhaUsuario
    | undefined;
}

export function buscarPorId(idUsuario: number): LinhaUsuario | undefined {
  return banco().prepare("SELECT * FROM Usuario WHERE idUsuario = ?").get(idUsuario) as LinhaUsuario | undefined;
}

function semNulos(objeto: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(objeto).filter(([, v]) => v !== null && v !== undefined));
}

/** Monta o usuário público (com os dados de Aluno quando for aluno). */
export function usuarioPublico(u: LinhaUsuario): UsuarioPublico {
  const base = {
    idUsuario: u.idUsuario,
    nome: u.nome,
    nomeUsuario: u.nomeUsuario,
    email: u.email,
    telefone: u.telefone,
    perfil: u.perfil,
    dataNascimento: u.dataNascimento,
    ativo: u.ativo === 1,
    criadoEm: u.criadoEm,
    atualizadoEm: u.atualizadoEm,
  };
  if (u.perfil !== "ALUNO") return semNulos(base) as UsuarioPublico;

  const aluno = banco()
    .prepare(
      "SELECT vozPreferida, velocidadeVoz, tamanhoFonte, idNivelInicial, idCriador, idNivelAtual FROM vw_aluno WHERE idUsuario = ?",
    )
    .get(u.idUsuario) as Record<string, unknown> | undefined;
  return semNulos({ ...base, ...aluno }) as UsuarioPublico;
}

/** Esquema JSON da resposta com o usuário público (lista os campos que podem sair). */
export const esquemaUsuario = {
  type: "object",
  properties: {
    idUsuario: { type: "integer" },
    nome: { type: "string" },
    nomeUsuario: { type: "string" },
    email: { type: "string" },
    telefone: { type: "string" },
    perfil: { type: "string" },
    dataNascimento: { type: "string" },
    ativo: { type: "boolean" },
    criadoEm: { type: "string" },
    atualizadoEm: { type: "string" },
    vozPreferida: { type: "string" },
    velocidadeVoz: { type: "number" },
    tamanhoFonte: { type: "integer" },
    idNivelInicial: { type: "integer" },
    idCriador: { type: "integer" },
    idNivelAtual: { type: "integer" },
  },
  required: ["idUsuario", "nome", "perfil"],
} as const;
