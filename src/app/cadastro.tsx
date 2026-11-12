// Figma: "AJAI · Cadastro de professor ou responsável"  |  RF01
// Único cadastro público: o ALUNO é cadastrado pelo professor, dentro da conta dele
// (/professor/contas/nova). Campos do Figma: Nome completo, E-mail, Telefone e Senha.
// Sem "Ouvir ajuda" nas telas de login e cadastro.
import { router } from "expo-router";
import { useState } from "react";
import { Aviso, Botao, Campo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { cadastrarProfessor } from "@/services/auth";

export default function CadastroProfessor() {
  const { entrar } = useSessao();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoCadastrar() {
    setErro(null);
    setEnviando(true);
    try {
      const professor = await cadastrarProfessor({ nome, email, telefone, senha });
      entrar(professor);
      router.replace("/professor");
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Logo />
      <Titulo>Criar sua conta</Titulo>
      <Subtitulo>Para professor ou responsável. Depois você cadastra seus alunos.</Subtitulo>
      <Campo rotulo="Nome completo" placeholder="Digite aqui" autoComplete="name" value={nome} onChangeText={setNome} />
      <Campo
        rotulo="E-mail"
        placeholder="Digite aqui"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Campo
        rotulo="Telefone"
        placeholder="Digite aqui"
        autoComplete="tel"
        keyboardType="phone-pad"
        value={telefone}
        onChangeText={setTelefone}
      />
      <Campo
        rotulo="Senha"
        placeholder="Digite sua senha"
        secureTextEntry
        autoComplete="new-password"
        value={senha}
        onChangeText={setSenha}
      />
      {erro ? <Aviso>{erro}</Aviso> : null}
      <Botao titulo={enviando ? "Criando conta..." : "Criar conta →"} desabilitado={enviando} onPress={aoCadastrar} />
      <Botao titulo="Já tem conta? Entrar" variante="link" onPress={() => router.back()} />
    </Tela>
  );
}
