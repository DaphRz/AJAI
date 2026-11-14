// Formulário de cadastro compartilhado pelas telas /cadastro/aluno, /professor, /responsavel e
// /instituicao (Passo 3.1). Sem "Ouvir ajuda" (regra das telas de login e cadastro).
import { router } from "expo-router";
import { useState } from "react";
import type { TextInputProps } from "react-native";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { cadastrar, rotaInicial, type PerfilCadastro } from "@/services/auth";
import { Botao } from "./Botao";
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
}

export function FormularioCadastro({ perfil, titulo, subtitulo, campos, observacao }: Props) {
  const { entrar } = useSessao();
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
    setEnviando(true);
    try {
      const usuario = await cadastrar(perfil, valores);
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
      {erro ? <Aviso>{erro}</Aviso> : null}
      <Botao titulo={enviando ? "Criando conta..." : "Criar conta →"} desabilitado={enviando} onPress={aoCadastrar} />
      <Botao titulo="Já tem conta? Entrar" variante="link" onPress={() => router.replace("/login")} />
    </Tela>
  );
}
