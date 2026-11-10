import { useEffect, useEffectEvent, useState } from "react";
import { ErroDaApi } from "@/services/api";

export interface Carregamento<T> {
  dados: T | undefined;
  carregando: boolean;
  /** Mensagem amigável quando falha (nunca técnica). */
  erro: string | undefined;
  /** Pede os dados de novo (botão "Toque para tentar de novo"). */
  tentarDeNovo: () => void;
}

/** Mensagem curta para a tela quando não deu para carregar. */
function mensagemDeFalha(erro: unknown): string {
  if (erro instanceof ErroDaApi && erro.status !== 0 && erro.status !== 401) {
    return `${erro.message} Toque para tentar de novo.`;
  }
  return "Sem conexão. Toque para tentar de novo.";
}

/**
 * Carrega dados assíncronos (da API) para uma tela, sem biblioteca.
 * `chave`: quando muda, carrega de novo (ex.: o id da atividade).
 * Uso: const { dados, carregando, erro, tentarDeNovo } = useCarregar(() => visualizarAtividade(id), id);
 */
export function useCarregar<T>(carregar: () => Promise<T>, chave: string | number = ""): Carregamento<T> {
  const [tentativa, setTentativa] = useState(0);
  const pedido = `${chave}#${tentativa}`;
  const [resultado, setResultado] = useState<{ pedido: string; dados?: T; erro?: string }>({ pedido: "" });
  const executar = useEffectEvent(carregar);

  useEffect(() => {
    let ativo = true;
    executar().then(
      (dados) => ativo && setResultado({ pedido, dados }),
      (erro: unknown) => ativo && setResultado({ pedido, erro: mensagemDeFalha(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, [pedido]);

  const pronto = resultado.pedido === pedido;
  return {
    dados: pronto ? resultado.dados : undefined,
    carregando: !pronto,
    erro: pronto ? resultado.erro : undefined,
    tentarDeNovo: () => setTentativa((t) => t + 1),
  };
}
