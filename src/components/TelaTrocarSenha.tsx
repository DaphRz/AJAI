// Usuario.EditarSenha (APF 18): a mesma tela serve todos os perfis (Passo 3.1): /aluno/senha,
// /professor/senha, /responsavel/senha, /instituicao/senha e /admin/senha. Sem tela no Figma (passo 11).
import { router } from "expo-router";
import { useState } from "react";
import { mensagemDeErro } from "@/services/api";
import { trocarSenha } from "@/services/auth";
import { Botao } from "./Botao";
import { BotaoAudio } from "./BotaoAudio";
import { Campo } from "./Campo";
import { Tela } from "./Tela";
import { Aviso, Subtitulo, Titulo } from "./Textos";

const AJUDA =
  "Para trocar a senha, escreva a senha que você usa hoje. Depois, escreva a senha nova duas vezes, com pelo menos 6 letras ou números. Toque em Salvar senha nova.";

export function TelaTrocarSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [repetida, setRepetida] = useState("");
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSalvar() {
    setAviso(null);
    if (senhaNova !== repetida) {
      setAviso({ texto: "As duas senhas novas estão diferentes. Escreva igual nas duas.", tipo: "atencao" });
      return;
    }
    setEnviando(true);
    try {
      const mensagem = await trocarSenha(senhaAtual, senhaNova);
      setAviso({ texto: mensagem, tipo: "sucesso" });
      setSenhaAtual("");
      setSenhaNova("");
      setRepetida("");
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela rodape={<BotaoAudio texto={aviso ? `${aviso.texto} ${AJUDA}` : AJUDA} />}>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Trocar senha</Titulo>
      <Subtitulo>Use letras ou números que você lembre.</Subtitulo>
      <Campo
        rotulo="Senha de hoje"
        placeholder="Digite sua senha"
        secureTextEntry
        autoComplete="current-password"
        value={senhaAtual}
        onChangeText={setSenhaAtual}
      />
      <Campo
        rotulo="Senha nova"
        placeholder="Pelo menos 6 letras ou números"
        secureTextEntry
        autoComplete="new-password"
        value={senhaNova}
        onChangeText={setSenhaNova}
      />
      <Campo
        rotulo="Repita a senha nova"
        placeholder="Digite de novo"
        secureTextEntry
        autoComplete="new-password"
        value={repetida}
        onChangeText={setRepetida}
      />
      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      <Botao titulo={enviando ? "Salvando..." : "Salvar senha nova"} desabilitado={enviando} onPress={aoSalvar} />
    </Tela>
  );
}
