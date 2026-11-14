// Cadastro › "Eu sou:" (Passo 3.1, RF01). Cada perfil cria a própria conta; sem tela no Figma
// (a desenhar no passo 11). Sem "Ouvir ajuda" (regra das telas de login e cadastro).
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Botao, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";

interface Opcao {
  titulo: string;
  descricao: string;
  icone: ComponentProps<typeof Ionicons>["name"];
  rota: Href;
}

const opcoes: Opcao[] = [
  { titulo: "Aluno", descricao: "Quero aprender a ler e escrever.", icone: "book", rota: "/cadastro/aluno" },
  { titulo: "Professor", descricao: "Dou aula numa escola ou projeto.", icone: "school", rota: "/cadastro/professor" },
  { titulo: "Responsável", descricao: "Quero acompanhar um familiar.", icone: "people", rota: "/cadastro/responsavel" },
  { titulo: "Instituição", descricao: "Escola, ONG ou projeto de EJA.", icone: "business", rota: "/cadastro/instituicao" },
];

export default function EscolherPerfil() {
  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Logo />
      <Titulo>Criar sua conta</Titulo>
      <Subtitulo>Eu sou:</Subtitulo>
      {opcoes.map((o) => (
        <Pressable
          key={o.titulo}
          accessibilityRole="button"
          accessibilityLabel={`${o.titulo}. ${o.descricao}`}
          onPress={() => router.push(o.rota)}
          style={({ pressed }) => [styles.opcao, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.icone} accessibilityElementsHidden importantForAccessibility="no">
            <Ionicons name={o.icone} size={32} color={cores.primaria} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>{o.titulo}</Text>
            <Text style={styles.descricao}>{o.descricao}</Text>
          </View>
        </Pressable>
      ))}
      <Botao titulo="Já tem conta? Entrar" variante="link" onPress={() => router.replace("/login")} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  opcao: {
    minHeight: toqueMinimo + 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: raios.lg,
    borderWidth: 2,
    borderColor: cores.primaria,
    backgroundColor: cores.superficie,
  },
  icone: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: cores.superficieSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.primaria },
  descricao: { fontSize: fontes.legenda, color: cores.texto },
});
