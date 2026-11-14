// Consultas de usuário compartilhadas pelas rotas de autenticação.
// O objeto devolvido ao app tem o formato dos tipos de src/domain/modelos.ts
// (Aluno, Professor, Responsavel, Instituicao, Administrador), SEM senhaHash.
import { randomInt } from "node:crypto";
import { banco } from "./banco.ts";

export type Perfil = "ALUNO" | "PROFESSOR" | "RESPONSAVEL" | "INSTITUICAO" | "ADMINISTRADOR";

/** Situação da conta para o app decidir a tela (igual a SituacaoConta de modelos.ts). */
export interface SituacaoConta {
  status: "PENDENTE" | "APROVADA" | "RECUSADA";
  motivo?: string;
  nomeInstituicao?: string;
}

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

/** Só os dígitos do CNPJ, ou null se os dígitos verificadores não conferirem. */
export function normalizarCnpj(cnpj: string): string | null {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return null;
  const digito = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = [...base].reduce((soma, c, i) => soma + Number(c) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = digito(d.slice(0, 12));
  const segundo = digito(d.slice(0, 12) + primeiro);
  return d.endsWith(`${primeiro}${segundo}`) ? d : null;
}

/** Caracteres do código da instituição: maiúsculas e números, sem os ambíguos 0/O e 1/I/L. */
export const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const TAMANHO_CODIGO = 6;

/** Código novo e único da instituição (6 caracteres, sorteados com crypto). */
export function gerarCodigoInstituicao(): string {
  const existe = banco().prepare("SELECT 1 FROM Instituicao WHERE codigo = ?");
  for (;;) {
    let codigo = "";
    for (let i = 0; i < TAMANHO_CODIGO; i++) codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
    if (!existe.get(codigo)) return codigo;
  }
}

/** Código como a pessoa digitou → como fica no banco (maiúsculas, sem espaços nem traços). */
export function normalizarCodigo(codigo: string): string {
  return codigo.replace(/[\s-]/g, "").toUpperCase();
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
 * tem "@" → e-mail; só números → telefone; senão → nome de usuário (só aluno tem).
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

/**
 * Situação da conta: professor depende da instituição; instituição, do administrador.
 * Aluno, responsável e administrador já entram liberados.
 */
export function situacaoDaConta(u: Pick<LinhaUsuario, "idUsuario" | "perfil">): SituacaoConta {
  const db = banco();
  if (u.perfil === "PROFESSOR") {
    const p = db
      .prepare(
        `SELECT p.statusVinculo, p.motivoRecusa, iu.nome AS nomeInstituicao
           FROM Professor p LEFT JOIN Usuario iu ON iu.idUsuario = p.idInstituicao
          WHERE p.idUsuario = ?`,
      )
      .get(u.idUsuario) as { statusVinculo: string; motivoRecusa: string | null; nomeInstituicao: string | null } | undefined;
    if (!p) return { status: "PENDENTE" };
    const status = p.statusVinculo === "APROVADO" ? "APROVADA" : p.statusVinculo === "RECUSADO" ? "RECUSADA" : "PENDENTE";
    return semNulos({ status, motivo: p.motivoRecusa, nomeInstituicao: p.nomeInstituicao }) as unknown as SituacaoConta;
  }
  if (u.perfil === "INSTITUICAO") {
    const i = db.prepare("SELECT status, motivoRecusa FROM Instituicao WHERE idUsuario = ?").get(u.idUsuario) as
      | { status: SituacaoConta["status"]; motivoRecusa: string | null }
      | undefined;
    if (!i) return { status: "PENDENTE" };
    return semNulos({ status: i.status, motivo: i.motivoRecusa }) as unknown as SituacaoConta;
  }
  return { status: "APROVADA" };
}

/** Monta o usuário público (com os dados de Aluno quando for aluno) e a situação da conta. */
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
    situacao: situacaoDaConta(u),
  };
  if (u.perfil !== "ALUNO") return semNulos(base) as UsuarioPublico;

  const aluno = banco()
    .prepare("SELECT vozPreferida, velocidadeVoz, tamanhoFonte, idNivelInicial, idNivelAtual FROM vw_aluno WHERE idUsuario = ?")
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
    idNivelAtual: { type: "integer" },
    situacao: {
      type: "object",
      properties: {
        status: { type: "string" },
        motivo: { type: "string" },
        nomeInstituicao: { type: "string" },
      },
      required: ["status"],
    },
  },
  required: ["idUsuario", "nome", "perfil"],
} as const;
