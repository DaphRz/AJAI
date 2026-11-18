/**
 * Preferências de acessibilidade do aluno (passo 10, Aluno.EditarPreferencias; RNF04):
 * tamanho da letra e velocidade da voz. Vêm do aluno da sessão (o servidor guarda), então
 * mudam sozinhas quando a tela de preferências chama entrar(...) com o aluno novo.
 *
 * - Letra: as telas e componentes pegam os tamanhos por useFontes() / useEstilos(...),
 *   sem `if` espalhado. Outros perfis ficam no tamanho normal.
 * - Voz: a velocidade vira o padrão da narração (definirPreferenciasFala), e toda chamada a
 *   falar(texto) já sai na velocidade do aluno.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { definirPreferenciasFala } from "@/services/narracao";
import { fontes, fontesNoTamanho, type Fontes } from "@/theme/tokens";
import { useSessao } from "./sessao";

interface Preferencias {
  fontes: Fontes;
  tamanhoFonte: number;
  velocidadeVoz: number;
}

const PreferenciasContext = createContext<Preferencias>({
  fontes,
  tamanhoFonte: fontes.corpo,
  velocidadeVoz: 1,
});

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const aluno = usuario?.perfil === "ALUNO" ? usuario : null;
  const tamanhoFonte = aluno?.tamanhoFonte ?? fontes.corpo;
  const velocidadeVoz = aluno?.velocidadeVoz ?? 1;
  const vozPreferida = aluno?.vozPreferida ?? "pt-BR";

  useEffect(() => {
    definirPreferenciasFala({ velocidade: velocidadeVoz, voz: vozPreferida });
  }, [velocidadeVoz, vozPreferida]);

  const valor = useMemo(
    () => ({ fontes: fontesNoTamanho(tamanhoFonte), tamanhoFonte, velocidadeVoz }),
    [tamanhoFonte, velocidadeVoz],
  );
  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export function usePreferencias(): Preferencias {
  return useContext(PreferenciasContext);
}

/** Tamanhos de letra no tamanho escolhido pelo aluno (normal para os outros perfis). */
export function useFontes(): Fontes {
  return useContext(PreferenciasContext).fontes;
}

/**
 * Estilos que dependem do tamanho da letra. Troque o `StyleSheet.create({...})` do arquivo por
 * `const criarEstilos = (fontes: Fontes) => StyleSheet.create({...})` e, no componente,
 * `const styles = useEstilos(criarEstilos)`. Só recria quando o tamanho muda.
 */
export function useEstilos<T>(criar: (fontes: Fontes) => T): T {
  const atuais = useFontes();
  return useMemo(() => criar(atuais), [criar, atuais]);
}
