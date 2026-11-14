// Tratamento de erro padrão da API: toda resposta de erro é { erro: string },
// com mensagem curta, em português e sem jargão (o app pode mostrar direto ao usuário).
import type { FastifyError, FastifyInstance } from "fastify";

/** Erro com mensagem já pronta para o usuário. Use nas rotas: throw new ErroApi(404, "Aluno não encontrado."). */
export class ErroApi extends Error {
  statusCode: number;
  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.statusCode = statusCode;
  }
}

/** Esquema JSON da resposta de erro, para usar em `response` das rotas. */
export const esquemaErro = {
  type: "object",
  properties: { erro: { type: "string" } },
  required: ["erro"],
} as const;

const mensagensPadrao: Record<number, string> = {
  400: "Confira os dados enviados.",
  401: "Entre de novo para continuar.",
  403: "Você não tem acesso a isso.",
  404: "Não encontramos o que você pediu.",
  413: "Os dados enviados são grandes demais.",
  415: "Formato de dados não aceito.",
  429: "Muitas tentativas. Espere um minuto e tente de novo.",
  500: "Algo deu errado no servidor. Tente de novo.",
  503: "O servidor está indisponível agora. Tente de novo em instantes.",
};

/**
 * Mensagem por campo quando a validação do esquema da rota recusa a entrada.
 * O Fastify só diz QUAL campo falhou; aqui vira uma frase curta e positiva para o usuário.
 * Campo novo com regra própria? Acrescente aqui.
 */
const mensagensPorCampo: Record<string, string> = {
  nome: "Escreva o nome, com pelo menos 2 letras.",
  email: "Confira o e-mail. Exemplo: maria@email.com",
  telefone: "Confira o telefone. Escreva com DDD, só números.",
  nomeUsuario: "O nome de usuário usa só letras sem acento, números e ponto. Exemplo: maria.silva",
  identificador: "Escreva seu usuário, e-mail ou telefone.",
  senha: "A senha precisa ter pelo menos 6 letras ou números.",
  senhaAtual: "Escreva a senha que você usa hoje.",
  senhaNova: "A senha nova precisa ter pelo menos 6 letras ou números.",
  dataNascimento: "Confira a data de nascimento.",
  cnpj: "Confira o CNPJ. São 14 números.",
  nomeResponsavel: "Escreva o nome da pessoa responsável, com pelo menos 2 letras.",
  codigo: "Confira o código da instituição. São 6 letras e números.",
  aluno: "Escreva o usuário, o e-mail ou o telefone do aluno.",
  decisao: "Escolha aprovar ou recusar.",
  motivo: "Escreva o motivo em poucas palavras.",
  aceitar: "Escolha aceitar ou recusar.",
};

function mensagemDeValidacao(erro: FastifyError): string | undefined {
  const primeiro = erro.validation?.[0];
  if (!primeiro) return undefined;
  const params = primeiro.params as { missingProperty?: string } | undefined;
  const campo = params?.missingProperty ?? primeiro.instancePath.split("/").filter(Boolean)[0];
  return campo ? mensagensPorCampo[campo] : undefined;
}

function mensagemPara(status: number): string {
  return mensagensPadrao[status] ?? (status >= 500 ? mensagensPadrao[500] : mensagensPadrao[400]);
}

export function registrarTratamentoDeErros(app: FastifyInstance): void {
  app.setNotFoundHandler((_req, resposta) => {
    resposta.code(404).send({ erro: "Caminho não encontrado." });
  });

  app.setErrorHandler((erro: FastifyError | ErroApi, req, resposta) => {
    const status = erro.statusCode && erro.statusCode >= 400 ? erro.statusCode : 500;

    if (status >= 500) req.log.error(erro);
    else req.log.info({ status, motivo: erro.message }, "requisição recusada");

    // Mensagem própria só quando a rota a escreveu (ErroApi); o resto vira mensagem padrão,
    // para não vazar detalhes internos nem textos em inglês.
    const mensagem =
      erro instanceof ErroApi
        ? erro.message
        : ((status === 400 && mensagemDeValidacao(erro as FastifyError)) || mensagemPara(status));
    resposta.code(status).send({ erro: mensagem });
  });
}
