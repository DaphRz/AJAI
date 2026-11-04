// Figma: "AJAI · Cadastro de aluno"  |  RF01 – Cadastro de usuários
// TODO: conferir campos e textos com a tela do Figma; validar e-mail/senha.
import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Botao, BotaoAudio, Campo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { cadastrarAluno } from "@/services/auth";
import { cores, fontes } from "@/theme/tokens";

export default function CadastroAluno() {
  const { entrar } = useSessao();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function aoCadastrar() {
    if (!nome.trim() || !email.trim() || senha.length < 4) {
      setErro("Preencha nome, e-mail e uma senha com pelo menos 4 letras ou números.");
      return;
    }
    const aluno = await cadastrarAluno({ nome, email, senha });
    entrar(aluno);
    router.replace("/aluno/nivelamento");
  }

  return (
    <Tela rodape={<BotaoAudio texto="Escreva seu nome, seu e-mail ou telefone e crie uma senha." />}>
      <Logo />
      <Titulo>Criar conta</Titulo>
      <Subtitulo>Vamos aprender juntos.</Subtitulo>
      <Campo rotulo="Seu nome" placeholder="Digite aqui" value={nome} onChangeText={setNome} />
      <Campo
        rotulo="Seu email ou telefone"
        placeholder="Digite aqui"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Campo rotulo="Crie uma senha" placeholder="Digite sua senha" secureTextEntry value={senha} onChangeText={setSenha} />
      {erro ? <Text style={{ color: cores.erro, fontSize: fontes.corpo }}>{erro}</Text> : null}
      <Botao titulo="Criar conta →" onPress={aoCadastrar} />
      <Botao titulo="Já tenho conta" variante="link" onPress={() => router.back()} />
    </Tela>
  );
}
