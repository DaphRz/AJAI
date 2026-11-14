// Recuperar senha (APF 18) — sem tela no Figma (segue o padrão das telas desenhadas).
// TODO: MVP sem serviço de e-mail. A tela pede o e-mail e diz que mandou o link de redefinição,
// mas NADA é enviado nem chamado no servidor. Enquanto isso, quem esqueceu a senha recebe uma senha
// provisória do administrador (POST /admin/usuarios/:id/senha-provisoria ou `npm run usuario:senha`).
import { useState } from "react";
import { router } from "expo-router";
import { Aviso, Botao, BotaoAudio, Campo, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";

const TEXTO_PEDIR = "Escreva o seu e-mail. Vamos mandar uma mensagem para você criar uma senha nova.";
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  function aoEnviar() {
    const limpo = email.trim();
    if (!EMAIL_VALIDO.test(limpo)) {
      setAviso("Confira o e-mail. Ele tem um @, como maria@email.com.");
      return;
    }
    setAviso(null);
    setEnviadoPara(limpo);
  }

  if (enviadoPara) {
    const textoEnviado = `Pronto! Mandamos uma mensagem para ${enviadoPara}. Abra o seu e-mail e toque no link para criar uma senha nova. Se não encontrar, olhe também na caixa de spam.`;
    return (
      <Tela rodape={<BotaoAudio texto={textoEnviado} />}>
        <Logo />
        <Titulo>E-mail enviado</Titulo>
        <Aviso tipo="sucesso">{textoEnviado}</Aviso>
        <Botao titulo="Voltar para entrar" onPress={() => router.back()} />
        <Botao titulo="Usar outro e-mail" variante="link" onPress={() => setEnviadoPara(null)} />
      </Tela>
    );
  }

  return (
    <Tela rodape={<BotaoAudio texto={`Esqueceu a senha? Tudo bem. ${TEXTO_PEDIR}`} />}>
      <Logo />
      <Titulo>Esqueceu a senha?</Titulo>
      <Subtitulo>Tudo bem, acontece.</Subtitulo>
      <Cartao destaque>
        <Corpo>{TEXTO_PEDIR}</Corpo>
      </Cartao>
      <Campo
        rotulo="Seu e-mail"
        placeholder="Exemplo: maria@email.com"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={aoEnviar}
      />
      {aviso ? <Aviso>{aviso}</Aviso> : null}
      <Botao titulo="Enviar →" onPress={aoEnviar} />
      <Botao titulo="Voltar para entrar" variante="link" onPress={() => router.back()} />
    </Tela>
  );
}
