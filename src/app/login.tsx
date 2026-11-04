// Figma: "AJAI · Login"  |  RF02 – Autenticação e acesso
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Campo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { autenticar } from "@/services/auth";
import { cores, fontes } from "@/theme/tokens";

type Papel = "ALUNO" | "PROFESSOR";

export default function Login() {
  const { entrar } = useSessao();
  const [papel, setPapel] = useState<Papel>("ALUNO");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function aoEntrar() {
    setErro(null);
    try {
      const usuario = await autenticar(identificador, senha, papel);
      entrar(usuario);
      if (usuario.perfil === "PROFESSOR") {
        router.replace("/professor");
      } else if (usuario.idNivelInicial === undefined) {
        router.replace("/aluno/nivelamento");
      } else {
        router.replace("/aluno");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    }
  }

  return (
    <Tela rodape={<BotaoAudio texto="Escolha se você é aluno ou professor. Depois digite seu e-mail e sua senha e toque em Entrar." />}>
      <Logo />
      <View>
        <Titulo>Vamos começar?</Titulo>
        <Subtitulo>É bom ter você aqui.</Subtitulo>
      </View>

      <Text style={styles.rotulo}>Quem você é?</Text>
      <View style={styles.papeis}>
        <View style={{ flex: 1 }}>
          <Botao titulo="Aluno" variante={papel === "ALUNO" ? "primario" : "secundario"} onPress={() => setPapel("ALUNO")} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao
            titulo="Professor/ Responsável"
            variante={papel === "PROFESSOR" ? "primario" : "secundario"}
            onPress={() => setPapel("PROFESSOR")}
          />
        </View>
      </View>

      <Campo
        rotulo="Seu email ou telefone"
        placeholder="Digite aqui"
        autoCapitalize="none"
        keyboardType="email-address"
        value={identificador}
        onChangeText={setIdentificador}
      />
      <Campo rotulo="Senha" placeholder="Digite sua senha" secureTextEntry value={senha} onChangeText={setSenha} />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Botao titulo="Entrar →" onPress={aoEntrar} />
      <Botao
        titulo="Não tem conta? Cadastre-se"
        variante="link"
        onPress={() => router.push(papel === "ALUNO" ? "/cadastro/aluno" : "/cadastro/professor")}
      />
      <Text style={styles.dica}>Modo demonstração: deixe o e-mail vazio para entrar com um usuário de teste.</Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
  papeis: { flexDirection: "row", gap: 12 },
  erro: { fontSize: fontes.corpo, color: cores.erro, fontWeight: "600" },
  dica: { fontSize: fontes.legenda, color: cores.textoSuave, textAlign: "center" },
});
