/**
 * Usuario.Autenticar / Usuario.Incluir / Usuario.EditarSenha (RF01, RF02, APF 18).
 * Tudo passa pela API (server/src/rotas/auth.ts). A senha só vai para o servidor, que guarda
 * o hash; o app guarda apenas o token (expo-secure-store, ver armazenamento.ts).
 * Cadastro público: só professor/responsável. Aluno é criado pelo professor (contasAlunos.ts).
 */
import type { Administrador, Aluno, Professor } from "@/domain/modelos";
import { chamarApi, definirToken, ErroDaApi } from "./api";
import { apagarLogin, atualizarUsuarioGuardado, guardarLogin, lerLogin } from "./armazenamento";

export type UsuarioSessao = Aluno | Professor | Administrador;

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
 * Entra com nome de usuário (aluno), e-mail ou telefone (professor/administrador) e senha.
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

export interface DadosCadastroProfessor {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}

export async function cadastrarProfessor(dados: DadosCadastroProfessor): Promise<Professor> {
  const resposta = await chamarApi<RespostaLogin>("/auth/cadastro", {
    metodo: "POST",
    corpo: {
      nome: dados.nome,
      email: dados.email.trim() || undefined,
      telefone: dados.telefone.trim() || undefined,
      senha: dados.senha,
    },
  });
  return (await iniciarSessao(resposta)) as Professor;
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
    const { usuario } = await chamarApi<{ usuario: UsuarioSessao }>("/auth/eu");
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

/** Professor/administrador troca a própria senha (o aluno não pode). Devolve a confirmação. */
export async function trocarSenha(senhaAtual: string, senhaNova: string): Promise<string> {
  const { mensagem } = await chamarApi<{ mensagem: string }>("/auth/senha", {
    metodo: "PATCH",
    corpo: { senhaAtual, senhaNova },
  });
  return mensagem;
}

/** Primeira tela de cada perfil depois de entrar. */
export function rotaInicial(usuario: UsuarioSessao) {
  if (usuario.perfil === "PROFESSOR") return "/professor" as const;
  if (usuario.perfil === "ADMINISTRADOR") return "/admin" as const;
  return usuario.idNivelInicial === undefined ? ("/aluno/nivelamento" as const) : ("/aluno" as const);
}
