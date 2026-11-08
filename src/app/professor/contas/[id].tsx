// Professor › Contas dos alunos › Mudar senha (APF 18). Só o professor que criou a conta
// do aluno consegue (o servidor confere). Sem tela no Figma: passo 8.
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Aviso, Botao, Campo, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { mensagemDeErro } from "@/services/api";
import { mudarSenhaDoAluno } from "@/services/contasAlunos";

export default function MudarSenhaAluno() {
  const { id, nome, usuario } = useLocalSearchParams<{ id: string; nome?: string; usuario?: string }>();
  const [senhaNova, setSenhaNova] = useState("");
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSalvar() {
    setAviso(null);
    setEnviando(true);
    try {
      const mensagem = await mudarSenhaDoAluno(Number(id), senhaNova);
      setAviso({ texto: `${mensagem} Senha nova: ${senhaNova}`, tipo: "sucesso" });
      setSenhaNova("");
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Mudar senha</Titulo>
      {nome ? <Subtitulo>{nome}</Subtitulo> : null}
      {usuario ? <Corpo>Usuário: {usuario}</Corpo> : null}
      <Campo
        rotulo="Senha nova"
        placeholder="Pelo menos 6 letras ou números"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        value={senhaNova}
        onChangeText={setSenhaNova}
      />
      <Corpo>A senha aparece para você anotar e entregar ao aluno.</Corpo>
      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      <Botao titulo={enviando ? "Salvando..." : "Salvar senha nova"} desabilitado={enviando} onPress={aoSalvar} />
    </Tela>
  );
}
