/**
 * Sessão do usuário logado.
 * Ao abrir o app, restaura o login guardado no aparelho (expo-secure-store) e só então
 * libera as telas (`carregando` = false); o _layout raiz mantém a splash até lá.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { quandoSessaoExpirar } from "@/services/api";
import { encerrarSessao, restaurarSessao, type UsuarioSessao } from "@/services/auth";

interface Sessao {
  usuario: UsuarioSessao | null;
  /** true enquanto o login guardado está sendo restaurado. */
  carregando: boolean;
  /** Define (ou substitui) o usuário logado. Passe sempre um objeto novo. */
  entrar: (usuario: UsuarioSessao) => void;
  /** Sai da conta e apaga o login guardado no aparelho. */
  sair: () => void;
}

const SessaoContext = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    restaurarSessao()
      .then((u) => {
        if (ativo) setUsuario(u);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    // Token vencido no meio do uso: volta para o login.
    quandoSessaoExpirar(() => {
      void encerrarSessao();
      setUsuario(null);
    });
    return () => {
      ativo = false;
      quandoSessaoExpirar(null);
    };
  }, []);

  function sair() {
    void encerrarSessao();
    setUsuario(null);
  }

  return (
    <SessaoContext.Provider value={{ usuario, carregando, entrar: setUsuario, sair }}>
      {children}
    </SessaoContext.Provider>
  );
}

export function useSessao(): Sessao {
  const ctx = useContext(SessaoContext);
  if (!ctx) throw new Error("useSessao precisa estar dentro de <SessaoProvider>");
  return ctx;
}
