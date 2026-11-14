// Figma: "AJAI · Login"  |  RF02 – Autenticação e acesso
// Diferenças do Figma: sem "Quem você é?" (o perfil vem da conta) e
// sem "Ouvir ajuda" nas telas de login e cadastro. Um campo só: aluno entra com usuário (ex.: maria.silva),
// e-mail ou telefone; professor, responsável, instituição e administrador, com e-mail ou telefone.
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Aviso, Botao, Campo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { autenticar, rotaInicial } from "@/services/auth";

export default function Login() {
  const { entrar } = useSessao();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    setErro(null);
    setEnviando(true);
    try {
      const usuario = await autenticar(identificador, senha);
      entrar(usuario);
      router.replace(rotaInicial(usuario));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Logo />
      <View>
        <Titulo>Vamos começar?</Titulo>
        <Subtitulo>É bom ter você aqui.</Subtitulo>
      </View>

      <Campo
        rotulo="Seu usuário ou e-mail"
        placeholder="Exemplo: maria.silva"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        keyboardType="email-address"
        value={identificador}
        onChangeText={setIdentificador}
      />
      <Campo
        rotulo="Senha"
        placeholder="Digite sua senha"
        secureTextEntry
        autoComplete="current-password"
        value={senha}
        onChangeText={setSenha}
        onSubmitEditing={aoEntrar}
      />

      {erro ? <Aviso>{erro}</Aviso> : null}

      <Botao titulo={enviando ? "Entrando..." : "Entrar →"} desabilitado={enviando} onPress={aoEntrar} />
      <Botao titulo="Esqueci minha senha" variante="link" onPress={() => router.push("/esqueci-senha")} />
      <Botao
        titulo="Ainda não tem conta? Crie a sua"
        variante="link"
        onPress={() => router.push("/cadastro")}
      />
    </Tela>
  );
}
