// Recuperar senha (APF 18) — sem tela no Figma (a desenhar no passo 8).
// Sem serviço de e-mail. Aluno: só o professor que criou a conta muda a senha
// (Conta › Contas dos alunos). Professor/responsável: pede ao administrador.
import { router } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";

const TEXTO_ALUNO =
  "Aluno: peça ao seu professor uma senha nova. Ele muda a senha no aplicativo e entrega para você.";
const TEXTO_PROFESSOR = "Professor ou responsável: peça uma senha nova ao administrador do AJAI.";

export default function EsqueciSenha() {
  return (
    <Tela rodape={<BotaoAudio texto={`Esqueceu a senha? Tudo bem. ${TEXTO_ALUNO} ${TEXTO_PROFESSOR}`} />}>
      <Logo />
      <Titulo>Esqueceu a senha?</Titulo>
      <Subtitulo>Tudo bem, acontece.</Subtitulo>
      <Cartao destaque>
        <Corpo>{TEXTO_ALUNO}</Corpo>
      </Cartao>
      <Cartao>
        <Corpo>{TEXTO_PROFESSOR}</Corpo>
      </Cartao>
      <Botao titulo="Voltar para entrar" onPress={() => router.back()} />
    </Tela>
  );
}
