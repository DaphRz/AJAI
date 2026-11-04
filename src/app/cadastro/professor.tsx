// Figma: "AJAI · Cadastro de professor ou responsável"  |  RF01
// TODO: conferir campos com o Figma (instituição? turma?) e vincular alunos (Matricula).
import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Botao, BotaoAudio, Campo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { cadastrarProfessor } from "@/services/auth";
import { cores, fontes } from "@/theme/tokens";

export default function CadastroProfessor() {
  const { entrar } = useSessao();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function aoCadastrar() {
    if (!nome.trim() || !email.includes("@") || senha.length < 6) {
      setErro("Preencha nome, um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }
    const professor = await cadastrarProfessor({ nome, email, senha });
    entrar(professor);
    router.replace("/professor");
  }

  return (
    <Tela rodape={<BotaoAudio texto="Cadastro de professor ou responsável. Preencha seu nome, e-mail e senha." />}>
      <Logo />
      <Titulo>Cadastro de professor ou responsável</Titulo>
      <Subtitulo>Acompanhe a evolução dos seus alunos.</Subtitulo>
      <Campo rotulo="Nome completo" placeholder="Digite aqui" value={nome} onChangeText={setNome} />
      <Campo rotulo="E-mail" placeholder="Digite aqui" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Campo rotulo="Senha" placeholder="Digite sua senha" secureTextEntry value={senha} onChangeText={setSenha} />
      {erro ? <Text style={{ color: cores.erro, fontSize: fontes.corpo }}>{erro}</Text> : null}
      <Botao titulo="Criar conta →" onPress={aoCadastrar} />
      <Botao titulo="Já tenho conta" variante="link" onPress={() => router.back()} />
    </Tela>
  );
}
