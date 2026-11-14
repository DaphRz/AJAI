// Recuperar senha (APF 18) — sem tela no Figma (a desenhar no passo 11).
// Sem serviço de e-mail: para TODOS os perfis, o administrador do AJAI gera uma senha provisória
// (POST /admin/usuarios/:id/senha-provisoria ou `npm run usuario:senha`). Depois de entrar, a pessoa
// troca a senha em Minha conta / Conta.
import { router } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";

const TEXTO_PEDIR =
  "Peça uma senha nova ao administrador do AJAI. Ele cria uma senha provisória, só com números, para você entrar.";
const TEXTO_DEPOIS = "Depois de entrar, troque a senha em Minha conta. Se precisar, peça ajuda ao seu professor ou à sua família.";

export default function EsqueciSenha() {
  return (
    <Tela rodape={<BotaoAudio texto={`Esqueceu a senha? Tudo bem. ${TEXTO_PEDIR} ${TEXTO_DEPOIS}`} />}>
      <Logo />
      <Titulo>Esqueceu a senha?</Titulo>
      <Subtitulo>Tudo bem, acontece.</Subtitulo>
      <Cartao destaque>
        <Corpo>{TEXTO_PEDIR}</Corpo>
      </Cartao>
      <Cartao>
        <Corpo>{TEXTO_DEPOIS}</Corpo>
      </Cartao>
      <Botao titulo="Voltar para entrar" onPress={() => router.back()} />
    </Tela>
  );
}
