import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

/**
 * Número que aumenta cada vez que a tela (ou aba) volta a ficar em foco, e uma função para
 * aumentar na hora. Passe como `chave` do useCarregar para recarregar os dados ao voltar à aba.
 */
export function useVersaoAoFocar(): [number, () => void] {
  const [versao, setVersao] = useState(0);
  const primeiraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // Na primeira vez a tela já está carregando; só recarrega nas voltas.
      if (primeiraVez.current) {
        primeiraVez.current = false;
        return;
      }
      setVersao((v) => v + 1);
    }, []),
  );
  return [versao, () => setVersao((v) => v + 1)];
}
