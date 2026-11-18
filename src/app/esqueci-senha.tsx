// Recuperar senha (APF 18) — sem tela no Figma (segue o padrão das telas desenhadas).
// O MVP não tem serviço de e-mail: quem esqueceu a senha recebe uma senha provisória do
// administrador (POST /admin/usuarios/:id/senha-provisoria ou `npm run usuario:senha`) e, ao entrar,
// cria uma nova ("Crie sua senha", passo 12). Até o passo 13 esta tela dizia que mandava um e-mail
// sem mandar nada; agora explica o caminho de verdade, igual ao termo de uso (src/services/termo.ts).
import { router } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";

const PASSOS =
  "Peça ajuda ao seu professor, à sua escola ou a quem acompanha você. A equipe do AJAI cria uma senha provisória. Ao entrar com ela, você escolhe uma senha nova.";

export default function EsqueciSenha() {
  return (
    <Tela rodape={<BotaoAudio texto={`Esqueceu a senha? Tudo bem, acontece. ${PASSOS}`} />}>
      <Logo />
      <Titulo>Esqueceu a senha?</Titulo>
      <Subtitulo>Tudo bem, acontece.</Subtitulo>
      <Cartao destaque>
        <Corpo>{PASSOS}</Corpo>
      </Cartao>
      <Botao titulo="Voltar para entrar" onPress={() => router.back()} />
    </Tela>
  );
}
