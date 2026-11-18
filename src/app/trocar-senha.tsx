// "Crie sua senha" (passo 12): quem entrou com a senha provisória (gerada pelo administrador ou
// pelo `npm run usuario:senha`) cai aqui antes de qualquer outra tela, em todos os perfis. O servidor
// também recusa as outras rotas (403) até a senha ser trocada. Sem tela no Figma.
import { Redirect } from "expo-router";
import { TelaTrocarSenha } from "@/components";
import { useSessao } from "@/context/sessao";
import { rotaInicial } from "@/services/auth";

export default function CrieSuaSenha() {
  const { usuario, carregando } = useSessao();
  if (carregando) return null;
  if (!usuario) return <Redirect href="/login" />;
  if (!usuario.precisaTrocarSenha) return <Redirect href={rotaInicial(usuario)} />;
  return <TelaTrocarSenha obrigatoria />;
}
