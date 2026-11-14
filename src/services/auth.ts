/**
 * Usuario.Autenticar / Usuario.Incluir / Usuario.EditarSenha (RF01, RF02, APF 18).
 * Tudo passa pela API (server/src/rotas/auth.ts). A senha só vai para o servidor, que guarda
 * o hash; o app guarda apenas o token (expo-secure-store, ver armazenamento.ts).
 * Modelo de contas do Passo 3.1: aluno, professor, responsável e instituição criam a própria conta.
 * Professor e instituição começam PENDENTES (`usuario.situacao`) e veem a tela de espera.
 */
import type { Administrador, Aluno, Instituicao, Professor, Responsavel } from "@/domain/modelos";
import { chamarApi, definirToken, ErroDaApi } from "./api";
import { apagarLogin, atualizarUsuarioGuardado, guardarLogin, lerLogin } from "./armazenamento";

export type UsuarioSessao = Aluno | Professor | Responsavel | Instituicao | Administrador;

interface RespostaLogin {
  token: string;
  usuario: UsuarioSessao;
}

async function iniciarSessao(resposta: RespostaLogin): Promise<UsuarioSessao> {
  definirToken(resposta.token);
  await guardarLogin(resposta.token, resposta.usuario);
  return resposta.usuario;
}

/**
 * Entra com nome de usuário, e-mail ou telefone e senha.
 * O perfil vem da própria conta, então a tela de login não pergunta "quem é você".
 */
export async function autenticar(identificador: string, senha: string): Promise<UsuarioSessao> {
  if (!identificador.trim() || !senha) {
    throw new ErroDaApi(400, "Escreva seu usuário e sua senha.");
  }
  const resposta = await chamarApi<RespostaLogin>("/auth/login", {
    metodo: "POST",
    corpo: { identificador: identificador.trim(), senha },
  });
  return iniciarSessao(resposta);
}

/** Campo opcional: texto em branco não vai para a API. */
function opcional(valor?: string): string | undefined {
  return valor?.trim() || undefined;
}

export type PerfilCadastro = "aluno" | "professor" | "responsavel" | "instituicao";

/**
 * Cria a conta e já entra nela. Campos por perfil (o servidor valida):
 * - aluno: nome, senha e pelo menos um entre nomeUsuario, email e telefone;
 * - professor: nome, email, telefone, senha e codigo (da instituição);
 * - responsavel: nome, email, telefone e senha;
 * - instituicao: nome (da instituição), cnpj, nomeResponsavel, email, telefone e senha.
 */
export async function cadastrar(perfil: PerfilCadastro, dados: Record<string, string>): Promise<UsuarioSessao> {
  const corpo = Object.fromEntries(
    Object.entries(dados).map(([chave, valor]) => [chave, chave === "senha" ? valor : opcional(valor)]),
  );
  if (perfil === "aluno" && !corpo.nomeUsuario && !corpo.email && !corpo.telefone) {
    throw new ErroDaApi(400, "Escreva um nome de usuário, um e-mail ou um telefone para entrar depois.");
  }
  const resposta = await chamarApi<RespostaLogin>(`/auth/cadastro/${perfil}`, { metodo: "POST", corpo });
  return iniciarSessao(resposta);
}

/**
 * Sugere um nome de usuário a partir do nome: "Maria da Silva" → "maria.silva".
 * Sem acentos, primeiro e último nome separados por ponto. Função pura (fácil de testar).
 */
export function sugerirNomeUsuario(nome: string): string {
  const partes = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0];
  return `${partes[0]}.${partes[partes.length - 1]}`;
}

/** Pergunta de novo ao servidor como está a conta (botão "Verificar de novo" da tela de espera). */
export async function verificarConta(): Promise<UsuarioSessao> {
  const { usuario } = await chamarApi<{ usuario: UsuarioSessao }>("/auth/eu");
  return usuario;
}

/**
 * Restaura o login guardado ao abrir o app. Sem internet, usa a cópia guardada do usuário;
 * token recusado pelo servidor (vencido) apaga o login.
 */
export async function restaurarSessao(): Promise<UsuarioSessao | null> {
  const guardado = await lerLogin<UsuarioSessao>();
  if (!guardado) return null;
  definirToken(guardado.token);
  try {
    const usuario = await verificarConta();
    await guardarLogin(guardado.token, usuario);
    return usuario;
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 0) return guardado.usuario; // sem conexão
    await encerrarSessao();
    return null;
  }
}

/** Atualiza a cópia guardada do usuário (ex.: nível novo), para o app reabrir certo mesmo sem internet. */
export async function guardarUsuarioDaSessao(usuario: UsuarioSessao): Promise<void> {
  await atualizarUsuarioGuardado(usuario);
}

/** Sai da conta neste aparelho. */
export async function encerrarSessao(): Promise<void> {
  definirToken(null);
  await apagarLogin();
}

/** Qualquer perfil troca a própria senha (inclusive o aluno). Devolve a confirmação. */
export async function trocarSenha(senhaAtual: string, senhaNova: string): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>("/auth/senha", {
    metodo: "PATCH",
    corpo: { senhaAtual, senhaNova },
  });
  return mensagem;
}

/** Conta liberada = professor aprovado pela instituição, instituição aprovada pelo AJAI; os demais sempre. */
export function contaLiberada(usuario: UsuarioSessao): boolean {
  return (usuario.situacao?.status ?? "APROVADA") === "APROVADA";
}

/** Primeira tela de cada perfil depois de entrar (conta ainda não aprovada → tela de espera). */
export function rotaInicial(usuario: UsuarioSessao) {
  if (!contaLiberada(usuario)) return "/espera" as const;
  switch (usuario.perfil) {
    case "PROFESSOR":
      return "/professor" as const;
    case "RESPONSAVEL":
      return "/responsavel" as const;
    case "INSTITUICAO":
      return "/instituicao" as const;
    case "ADMINISTRADOR":
      return "/admin" as const;
    default:
      return usuario.idNivelInicial === undefined ? ("/aluno/nivelamento" as const) : ("/aluno" as const);
  }
}
