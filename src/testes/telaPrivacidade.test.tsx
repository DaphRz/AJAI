/// <reference types="jest" />
// Testes de tela do passo 12 (segurança e privacidade; `npm run app:test:telas`, jest-expo):
// - o cadastro só cria a conta com "Li e concordo" marcado, e manda `aceitouTermos: true`;
// - quem entrou com a senha provisória cai em "Crie sua senha" antes da área dele e, depois de
//   trocar, segue para a área certa.
// Telas DE VERDADE com o Expo Router de teste; só a API, o armazenamento e a narração são de mentira.
import { Stack } from "expo-router";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import LayoutAluno from "@/app/aluno/_layout";
import CadastroResponsavel from "@/app/cadastro/responsavel";
import Termo from "@/app/termo";
import CrieSuaSenha from "@/app/trocar-senha";
import { PreferenciasProvider } from "@/context/preferencias";
import { SessaoProvider, useSessao } from "@/context/sessao";
import type { Aluno } from "@/domain/modelos";

const mockAlunaBase: Aluno = {
  idUsuario: 2,
  nome: "Ana Souza",
  nomeUsuario: "ana.souza",
  perfil: "ALUNO",
  ativo: true,
  criadoEm: "2026-11-01T00:00:00.000Z",
  atualizadoEm: "2026-11-01T00:00:00.000Z",
  vozPreferida: "pt-BR",
  velocidadeVoz: 1,
  tamanhoFonte: 20,
  idNivelInicial: 1,
  idNivelAtual: 1,
};

/** Quem já está logado ao abrir o app (null = ninguém). Cada teste escolhe. */
let mockSessaoInicial: Aluno | null = null;

type OpcoesApi = { metodo?: string; corpo?: Record<string, unknown> };

const mockChamarApi = jest.fn(async (caminho: string, opcoes?: OpcoesApi): Promise<unknown> => {
  if (caminho === "/auth/cadastro/responsavel" && opcoes?.metodo === "POST") {
    return {
      token: "token-novo",
      usuario: {
        idUsuario: 50,
        nome: String(opcoes.corpo?.nome),
        perfil: "RESPONSAVEL",
        ativo: true,
        criadoEm: "",
        atualizadoEm: "",
        situacao: { status: "APROVADA" },
      },
    };
  }
  if (caminho === "/auth/senha" && opcoes?.metodo === "PATCH") {
    return { mensagem: "Senha trocada.", token: "token-novo", usuario: { ...mockAlunaBase } };
  }
  throw new Error(`Rota não esperada no teste: ${caminho}`);
});

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  chamarApi: (caminho: string, opcoes?: OpcoesApi) => mockChamarApi(caminho, opcoes),
}));

jest.mock("@/services/armazenamento", () => ({
  lerLogin: async () => null,
  guardarLogin: async () => {},
  apagarLogin: async () => {},
  atualizarUsuarioGuardado: async () => {},
}));

jest.mock("@/services/auth", () => ({
  ...jest.requireActual("@/services/auth"),
  restaurarSessao: async () => mockSessaoInicial,
}));

jest.mock("@/services/narracao", () => ({
  falar: async () => {},
  pararFala: () => {},
  definirPreferenciasFala: () => {},
}));

function Navegacao() {
  const { carregando } = useSessao();
  if (carregando) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}

function LayoutRaiz() {
  return (
    <SessaoProvider>
      <PreferenciasProvider>
        <Navegacao />
      </PreferenciasProvider>
    </SessaoProvider>
  );
}

const AreaResponsavel = () => <Text>Área do responsável</Text>;
const HomeAluno = () => <Text>Home do aluno</Text>;

beforeEach(() => {
  mockChamarApi.mockClear();
  mockSessaoInicial = null;
});

describe("aceite do termo no cadastro", () => {
  async function abrirCadastro() {
    await renderRouter(
      { _layout: LayoutRaiz, "cadastro/responsavel": CadastroResponsavel, termo: Termo, "responsavel/index": AreaResponsavel },
      { initialUrl: "/cadastro/responsavel" },
    );
    await fireEvent.changeText(await screen.findByLabelText("Nome completo"), "Rita Souza");
    await fireEvent.changeText(screen.getByLabelText("E-mail"), "rita@email.com");
    await fireEvent.changeText(screen.getByLabelText("Telefone com DDD"), "11911112222");
    await fireEvent.changeText(screen.getByLabelText("Senha"), "senha123");
  }

  it("sem 'Li e concordo' não cria a conta e explica o que fazer", async () => {
    await abrirCadastro();
    await fireEvent.press(screen.getByRole("button", { name: /Criar conta/ }));

    expect(await screen.findByText("Leia o termo de uso e toque em Li e concordo.")).toBeOnTheScreen();
    expect(mockChamarApi).not.toHaveBeenCalled();
  });

  it("com 'Li e concordo' manda aceitouTermos e entra na área", async () => {
    await abrirCadastro();
    const aceite = screen.getByRole("checkbox", { name: /Li e concordo/ });
    expect(aceite).not.toBeChecked();
    await fireEvent.press(aceite);
    expect(aceite).toBeChecked();

    await fireEvent.press(screen.getByRole("button", { name: /Criar conta/ }));

    expect(await screen.findByText("Área do responsável")).toBeOnTheScreen();
    expect(mockChamarApi).toHaveBeenCalledWith(
      "/auth/cadastro/responsavel",
      expect.objectContaining({ metodo: "POST", corpo: expect.objectContaining({ aceitouTermos: true, nome: "Rita Souza" }) }),
    );
  });

  it("'Ler o termo de uso' abre o termo, com cada parte para ouvir", async () => {
    await abrirCadastro();
    await fireEvent.press(screen.getByRole("button", { name: "Ler o termo de uso" }));

    expect(await screen.findByText("Termo de uso e privacidade")).toBeOnTheScreen();
    expect(screen).toHavePathname("/termo");
    expect(screen.getByText("Quem vê os seus dados")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /Ouvir: Quem vê os seus dados/ })).toBeOnTheScreen();
  });
});

describe("senha provisória", () => {
  it("abre 'Crie sua senha' antes da área do aluno e, depois de trocar, segue para ela", async () => {
    mockSessaoInicial = { ...mockAlunaBase, precisaTrocarSenha: true };
    await renderRouter(
      { _layout: LayoutRaiz, "trocar-senha": CrieSuaSenha, "aluno/_layout": LayoutAluno, "aluno/index": HomeAluno },
      { initialUrl: "/aluno" },
    );

    expect(await screen.findByText("Crie sua senha")).toBeOnTheScreen();
    expect(screen).toHavePathname("/trocar-senha");
    expect(screen.queryByRole("button", { name: /Voltar/ })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Senha provisória"), "123456");
    await fireEvent.changeText(screen.getByLabelText("Senha nova"), "minha123");
    await fireEvent.changeText(screen.getByLabelText("Repita a senha nova"), "minha123");
    await fireEvent.press(screen.getByRole("button", { name: "Salvar senha nova" }));

    expect(await screen.findByText("Home do aluno")).toBeOnTheScreen();
    expect(mockChamarApi).toHaveBeenCalledWith(
      "/auth/senha",
      expect.objectContaining({ metodo: "PATCH", corpo: { senhaAtual: "123456", senhaNova: "minha123" } }),
    );
  });
});
