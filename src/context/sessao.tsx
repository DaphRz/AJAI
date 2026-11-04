/**
 * Sessão do usuário logado (em memória).
 * Pendência: persistir o token com expo-secure-store e restaurar ao abrir o app.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { UsuarioSessao } from "@/services/auth";

interface Sessao {
  usuario: UsuarioSessao | null;
  /** Define (ou substitui) o usuário logado. Passe sempre um objeto novo. */
  entrar: (usuario: UsuarioSessao) => void;
  sair: () => void;
}

const SessaoContext = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  return (
    <SessaoContext.Provider value={{ usuario, entrar: setUsuario, sair: () => setUsuario(null) }}>
      {children}
    </SessaoContext.Provider>
  );
}

export function useSessao(): Sessao {
  const ctx = useContext(SessaoContext);
  if (!ctx) throw new Error("useSessao precisa estar dentro de <SessaoProvider>");
  return ctx;
}
