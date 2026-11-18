/// <reference types="jest" />
// Teste de tela (passo 11, item 7; `npm run app:test:telas`, jest-expo): o aluno toca na
// alternativa certa e chega à tela "Muito bem!". Usa as telas DE VERDADE (atividade e resultado)
// com o Expo Router de teste; só a API, a sessão guardada e a narração são de mentira.
// Fica fora de src/app/ para o Expo Router não achar que é uma rota.
// (O jest só deixa o jest.mock usar variáveis de fora que começam com "mock".)
import { Stack } from "expo-router";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import TelaAtividade from "@/app/aluno/atividade/[id]";
import Resultado from "@/app/aluno/resultado";
import { PreferenciasProvider } from "@/context/preferencias";
import { SessaoProvider, useSessao } from "@/context/sessao";
import type { Aluno, AtividadeDoAluno } from "@/domain/modelos";

const mockAluna: Aluno = {
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

// Como o app recebe a atividade: SEM gabarito (quem corrige é o servidor).
const mockAtividade: AtividadeDoAluno = {
  idAtividade: 2,
  idNivel: 1,
  tipo: "LETRA",
  conteudo: "Letra M",
  enunciado: "Qual figura começa com a letra M?",
  alternativas: [
    { idAlternativa: 1, texto: "Pato", ordem: 1, ilustracao: "duck" },
    { idAlternativa: 2, texto: "Mão", ordem: 2, ilustracao: "hand-back-left" },
    { idAlternativa: 3, texto: "Casa", ordem: 3, ilustracao: "home" },
  ],
};

/** O gabarito fica só no "servidor" de mentira. */
const mockRespostaCerta = "Mão";

type OpcoesApi = { metodo?: string; corpo?: { respostaDada?: string } };

// "Servidor" de mentira: devolve a atividade e corrige pelo gabarito que só ele conhece.
const mockChamarApi = jest.fn(async (caminho: string, opcoes?: OpcoesApi): Promise<unknown> => {
  if (caminho === "/atividades/2") return { atividade: mockAtividade };
  if (caminho === "/respostas" && opcoes?.metodo === "POST") {
    return {
      correta: opcoes.corpo?.respostaDada === mockRespostaCerta,
      subiuDeNivel: false,
      nivelAtual: { idNivel: 1, nome: "Aprendendo Letras", descricao: "", ordem: 1, criterioAcerto: 0.7 },
    };
  }
  throw new Error(`Rota não esperada no teste: ${caminho}`);
});

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  chamarApi: (caminho: string, opcoes?: OpcoesApi) => mockChamarApi(caminho, opcoes),
}));

jest.mock("@/services/auth", () => ({
  ...jest.requireActual("@/services/auth"),
  restaurarSessao: async () => mockAluna,
  guardarUsuarioDaSessao: async () => {},
  encerrarSessao: async () => {},
}));

// A narração não toca som no teste.
jest.mock("@/services/narracao", () => ({
  falar: async () => {},
  pararFala: () => {},
  definirPreferenciasFala: () => {},
}));

/** Como o layout raiz do app: só mostra as telas depois de restaurar o login guardado. */
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

async function abrirAtividade() {
  await renderRouter(
    {
      _layout: LayoutRaiz,
      "aluno/atividade/[id]": TelaAtividade,
      "aluno/resultado": Resultado,
    },
    { initialUrl: "/aluno/atividade/2" },
  );
  expect(await screen.findByText(mockAtividade.enunciado)).toBeOnTheScreen();
}

beforeEach(() => mockChamarApi.mockClear());

describe("tela da atividade", () => {
  it("tocar na alternativa certa leva à tela 'Muito bem!'", async () => {
    await abrirAtividade();
    expect(screen.getByText("Atividade 1 de 5")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: mockRespostaCerta }));

    expect(await screen.findByText("Muito bem!")).toBeOnTheScreen();
    expect(screen.getByText("Você acertou.")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /Continuar/ })).toBeOnTheScreen();
    expect(screen).toHavePathname("/aluno/resultado");
    expect(screen).toHaveSearchParams({ id: "2", correta: "1", subiu: "0", concluidas: "1" });

    // Quem corrigiu foi o servidor: a resposta foi enviada para POST /respostas.
    expect(mockChamarApi).toHaveBeenCalledWith(
      "/respostas",
      expect.objectContaining({ metodo: "POST", corpo: expect.objectContaining({ idAtividade: 2, respostaDada: "Mão" }) }),
    );
  });

  it("tocar numa alternativa errada mostra 'Quase lá!' com 'Tentar novamente' (nunca 'Erro')", async () => {
    await abrirAtividade();

    await fireEvent.press(screen.getByRole("button", { name: "Pato" }));

    expect(await screen.findByText("Quase lá!")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeOnTheScreen();
    expect(screen.queryByText("Muito bem!")).toBeNull();
    expect(screen.queryByText(/erro|inválid|falha/i)).toBeNull();
  });
});
