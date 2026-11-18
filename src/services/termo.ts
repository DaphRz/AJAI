/**
 * Termo de uso e privacidade (passo 12, RNF11, RNF12, LGPD), em linguagem muito simples:
 * frases curtas, para quem está aprendendo a ler. Aparece em /termo e é lido em voz alta.
 * O MESMO texto está na parte 1 de docs/privacidade.md: mudou aqui, mude lá também, e mude
 * VERSAO_TERMO aqui e VERSAO_TERMOS em server/src/rotas/auth.ts (o servidor guarda qual versão
 * cada pessoa aceitou).
 */

export const VERSAO_TERMO = "2026-11-18";

export interface SecaoTermo {
  titulo: string;
  frases: string[];
}

export const TERMO: SecaoTermo[] = [
  {
    titulo: "O que é o AJAI",
    frases: [
      "O AJAI ajuda você a ler e escrever.",
      "O AJAI é de graça.",
      "O AJAI ajuda o professor. Ele não toma o lugar do professor.",
    ],
  },
  {
    titulo: "O que guardamos",
    frases: [
      "Seu nome.",
      "O jeito de entrar: usuário, e-mail ou telefone.",
      "Sua senha, toda embaralhada. Ninguém consegue ler a senha. Nem a gente.",
      "Do aluno: as respostas, os acertos, a etapa e os dias de estudo. A voz e o tamanho da letra que você escolheu.",
      "Do professor: o e-mail, o telefone e a escola onde ele dá aula.",
      "Da escola: o CNPJ, o e-mail, o telefone e o nome de quem cuida da conta.",
      "Não pedimos CPF, endereço, foto nem data de nascimento.",
      "Não usamos a câmera, o microfone nem o lugar onde você está.",
    ],
  },
  {
    titulo: "Para que usamos",
    frases: [
      "Para você entrar no aplicativo.",
      "Para mostrar o seu progresso e escolher a próxima atividade.",
      "Para o professor e a família ajudarem você, se você deixar.",
      "Não vendemos seus dados. Não mostramos propaganda.",
    ],
  },
  {
    titulo: "Quem vê os seus dados",
    frases: [
      "Você vê tudo o que é seu.",
      "Um professor ou um familiar pode pedir para acompanhar você. Ele só vê se você aceitar.",
      "Quem você aceitar vê o seu nome, a sua etapa, os dias de estudo e os seus acertos.",
      "O professor também vê as suas respostas e pode corrigir.",
      "Ninguém vê o seu e-mail, o seu telefone ou a sua senha.",
      "Você pode desfazer quando quiser. Vá em Minha conta e toque em Quem me acompanha.",
      "A escola vê o nome, o e-mail e o telefone dos professores que pedem para entrar nela. Assim ela sabe se a pessoa trabalha lá.",
      "A equipe do AJAI vê os dados da escola, como o CNPJ, para saber se a escola existe.",
    ],
  },
  {
    titulo: "A voz do aplicativo",
    frases: [
      "Para ler em voz alta, o texto da tela vai para um serviço de voz da Microsoft.",
      "Pode ir o seu primeiro nome. Não vai e-mail, telefone nem senha.",
      "Se não der certo, a voz do próprio celular lê o texto.",
    ],
  },
  {
    titulo: "Segurança",
    frases: [
      "Não conte a sua senha para ninguém.",
      "Se você trocar a senha, os outros celulares saem da sua conta.",
      "Esqueceu a senha? A equipe do AJAI cria uma senha provisória. Ao entrar, você cria uma senha nova.",
    ],
  },
  {
    titulo: "Seus direitos",
    frases: [
      "Você pode pedir para ver, corrigir ou apagar os seus dados.",
      "Para apagar a sua conta, fale com o seu professor ou com a sua escola. Eles avisam a equipe do AJAI.",
      "Quando a conta é apagada, apagamos também as suas respostas.",
      "Se o termo mudar, o aplicativo avisa você.",
    ],
  },
];

/** Texto de uma parte do termo para ouvir (cada parte cabe no limite de 800 letras da narração). */
export function textoDaSecao(secao: SecaoTermo): string {
  return `${secao.titulo}. ${secao.frases.join(" ")}`;
}

/**
 * Resumo do termo para o "Ouvir o termo" do cadastro do aluno (até 800 letras, o limite da
 * narração do servidor). O termo inteiro fica em /termo, com uma parte para ouvir de cada vez.
 */
export const RESUMO_TERMO =
  "Termo de uso do AJAI. O AJAI guarda o seu nome, o jeito de entrar, a sua senha embaralhada e as suas atividades. " +
  "Usamos isso para mostrar o seu progresso. Não vendemos seus dados. " +
  "Um professor ou um familiar só vê o seu progresso se você aceitar o convite. Você pode desfazer quando quiser. " +
  "Ninguém vê o seu e-mail, o seu telefone ou a sua senha. " +
  "Para ler em voz alta, o texto da tela vai para um serviço de voz da Microsoft. " +
  "Você pode pedir para apagar a sua conta. Fale com o seu professor ou com a sua escola. " +
  "Se você concorda, toque em Li e concordo.";
