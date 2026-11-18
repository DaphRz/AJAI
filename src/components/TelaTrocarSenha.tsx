// Usuario.EditarSenha (APF 18): a mesma tela serve todos os perfis (Passo 3.1): /aluno/senha,
// /professor/senha, /responsavel/senha, /instituicao/senha e /admin/senha. Sem tela no Figma.
// Passo 12: com `obrigatoria`, é a tela "Crie sua senha" (/trocar-senha) de quem entrou com a senha
// provisória: sem "Voltar"; ao salvar, segue para a área da pessoa. Trocar a senha tira a conta
// dos outros aparelhos (o servidor devolve um token novo só para este).
import { router } from "expo-router";
import { useState } from "react";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { rotaInicial, trocarSenha } from "@/services/auth";
import { Botao } from "./Botao";
import { BotaoAudio } from "./BotaoAudio";
import { Campo } from "./Campo";
import { Tela } from "./Tela";
import { Aviso, Subtitulo, Titulo } from "./Textos";

const AJUDA =
  "Para trocar a senha, escreva a senha que você usa hoje. Depois, escreva a senha nova duas vezes, com pelo menos 6 letras ou números. Toque em Salvar senha nova. Os outros celulares vão sair da sua conta.";

const AJUDA_PROVISORIA =
  "Você entrou com uma senha provisória. Agora crie a sua senha. Primeiro, escreva a senha provisória que você recebeu. Depois, escreva a senha nova duas vezes, com pelo menos 6 letras ou números. Toque em Salvar senha nova.";

export function TelaTrocarSenha({ obrigatoria = false }: { obrigatoria?: boolean }) {
  const { entrar, sair } = useSessao();
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
      const { mensagem, usuario } = await trocarSenha(senhaAtual, senhaNova);
      entrar(usuario);
      if (obrigatoria) {
        router.replace(rotaInicial(usuario));
        return;
      }
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
    <Tela rodape={<BotaoAudio texto={`${aviso ? `${aviso.texto} ` : ""}${obrigatoria ? AJUDA_PROVISORIA : AJUDA}`} />}>
      {obrigatoria ? null : <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />}
      <Titulo>{obrigatoria ? "Crie sua senha" : "Trocar senha"}</Titulo>
      <Subtitulo>
        {obrigatoria
          ? "Você entrou com uma senha provisória. Agora escolha a sua senha."
          : "Use letras ou números que você lembre."}
      </Subtitulo>
      <Campo
        rotulo={obrigatoria ? "Senha provisória" : "Senha de hoje"}
        placeholder={obrigatoria ? "Os 6 números que você recebeu" : "Digite sua senha"}
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
      {obrigatoria ? (
        <Botao
          titulo="Sair"
          variante="link"
          onPress={() => {
            sair();
            router.replace("/login");
          }}
        />
      ) : null}
    </Tela>
  );
}
