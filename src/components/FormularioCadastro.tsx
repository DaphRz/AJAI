// Formulário de cadastro compartilhado pelas telas /cadastro/aluno, /professor, /responsavel e
// /instituicao (Passo 3.1). Sem "Ouvir ajuda" (regra das telas de login e cadastro).
// Passo 12: "Li e concordo" com o termo de uso e privacidade (/termo) antes de criar a conta. No
// cadastro do aluno há também "Ouvir o termo" (resumo narrado; o termo inteiro fica em /termo).
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type TextInputProps } from "react-native";
import { useEstilos } from "@/context/preferencias";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { cadastrar, rotaInicial, type PerfilCadastro } from "@/services/auth";
import { RESUMO_TERMO } from "@/services/termo";
import { cores, espacos, familias, raios, toqueMinimo, type Fontes } from "@/theme/tokens";
import { Botao } from "./Botao";
import { BotaoAudio } from "./BotaoAudio";
import { Campo } from "./Campo";
import { Tela } from "./Tela";
import { Aviso, Corpo, Logo, Subtitulo, Titulo } from "./Textos";

type TipoCampo = "nome" | "email" | "telefone" | "senha" | "usuario" | "codigo" | "cnpj";

export interface CampoCadastro {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  placeholder?: string;
  /** Texto curto embaixo do campo (ex.: "Opcional"). */
  dica?: string;
  /** Preenche sozinho a partir de outro campo até a pessoa escrever por conta própria. */
  sugerir?: { de: string; com: (valor: string) => string };
}

/** Teclado, correção e preenchimento automático de cada tipo de campo. */
const propsPorTipo: Record<TipoCampo, TextInputProps> = {
  nome: { autoComplete: "name", autoCapitalize: "words" },
  email: { autoComplete: "email", keyboardType: "email-address", autoCapitalize: "none", autoCorrect: false },
  telefone: { autoComplete: "tel", keyboardType: "phone-pad" },
  senha: { autoComplete: "new-password", secureTextEntry: true, autoCapitalize: "none" },
  usuario: { autoComplete: "username-new", autoCapitalize: "none", autoCorrect: false },
  codigo: { autoComplete: "off", autoCapitalize: "characters", autoCorrect: false, maxLength: 12 },
  cnpj: { autoComplete: "off", keyboardType: "number-pad", maxLength: 18 },
};

interface Props {
  perfil: PerfilCadastro;
  titulo: string;
  subtitulo?: string;
  campos: CampoCadastro[];
  /** Observação no fim do formulário (ex.: "Depois, o AJAI confere os dados"). */
  observacao?: string;
  /** Mostra "Ouvir o termo" ao lado do aceite (cadastro do aluno). */
  ouvirTermo?: boolean;
}

/** Caixa "Li e concordo": marcar é obrigatório para criar a conta. */
function Aceite({ marcado, onPress }: { marcado: boolean; onPress: () => void }) {
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      accessibilityLabel="Li e concordo com o termo de uso e privacidade"
      onPress={onPress}
      style={({ pressed }) => [styles.aceite, marcado && styles.aceiteMarcado, pressed && { opacity: 0.7 }]}
    >
      <Ionicons
        name={marcado ? "checkbox" : "square-outline"}
        size={32}
        color={cores.primaria}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.textoAceite}>Li e concordo</Text>
    </Pressable>
  );
}

export function FormularioCadastro({ perfil, titulo, subtitulo, campos, observacao, ouvirTermo = false }: Props) {
  const styles = useEstilos(criarEstilos);
  const { entrar } = useSessao();
  const [aceitou, setAceitou] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [editados, setEditados] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function mudar(chave: string, texto: string) {
    const novos = { ...valores, [chave]: texto };
    // Campos que se preenchem a partir deste, enquanto a pessoa não mexeu neles.
    for (const c of campos) {
      if (c.sugerir?.de === chave && !editados[c.chave]) novos[c.chave] = c.sugerir.com(texto);
    }
    setValores(novos);
    if (campos.some((c) => c.chave === chave && c.sugerir)) setEditados({ ...editados, [chave]: true });
  }

  async function aoCadastrar() {
    setErro(null);
    if (!aceitou) {
      setErro("Leia o termo de uso e toque em Li e concordo.");
      return;
    }
    setEnviando(true);
    try {
      const usuario = await cadastrar(perfil, valores, aceitou);
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
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Logo />
      <Titulo>{titulo}</Titulo>
      {subtitulo ? <Subtitulo>{subtitulo}</Subtitulo> : null}
      {campos.map((c) => (
        <Campo
          key={c.chave}
          rotulo={c.dica ? `${c.rotulo} (${c.dica})` : c.rotulo}
          placeholder={c.placeholder ?? "Digite aqui"}
          value={valores[c.chave] ?? ""}
          onChangeText={(texto) => mudar(c.chave, texto)}
          {...propsPorTipo[c.tipo]}
        />
      ))}
      {observacao ? <Corpo>{observacao}</Corpo> : null}
      <View style={styles.termo}>
        <Corpo>Antes de criar a conta, leia o termo de uso. Ele diz que dados guardamos e quem pode ver.</Corpo>
        <Botao titulo="Ler o termo de uso" variante="secundario" onPress={() => router.push("/termo")} />
        {ouvirTermo ? <BotaoAudio titulo="Ouvir o termo" texto={RESUMO_TERMO} /> : null}
        <Aceite marcado={aceitou} onPress={() => setAceitou(!aceitou)} />
      </View>
      {erro ? <Aviso>{erro}</Aviso> : null}
      <Botao titulo={enviando ? "Criando conta..." : "Criar conta"} seta desabilitado={enviando} onPress={aoCadastrar} />
      <Botao titulo="Já tem conta? Entrar" variante="link" onPress={() => router.replace("/login")} />
    </Tela>
  );
}

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    termo: { gap: espacos.md },
    aceite: {
      minHeight: toqueMinimo,
      flexDirection: "row",
      alignItems: "center",
      gap: espacos.md,
      paddingHorizontal: espacos.md,
      borderWidth: 2,
      borderColor: cores.borda,
      borderRadius: raios.md,
      backgroundColor: cores.superficie,
    },
    aceiteMarcado: { borderColor: cores.primaria, backgroundColor: cores.superficieSuave },
    textoAceite: { flex: 1, fontSize: fontes.corpo, fontFamily: familias.negrito, color: cores.texto },
  });
