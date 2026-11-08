// Professor › Conta › Contas dos alunos (Professor.ListarAlunos, sem tela no Figma: passo 8).
// Lista os alunos que ESTE professor cadastrou, com o usuário de cada um, e leva para
// cadastrar aluno novo ou mudar a senha de um aluno.
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Aviso, Botao, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { mensagemDeErro } from "@/services/api";
import { listarContasAlunos, type ContaAluno } from "@/services/contasAlunos";
import { cores, fontes } from "@/theme/tokens";

export default function ContasAlunos() {
  const [contas, setContas] = useState<ContaAluno[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Recarrega ao voltar para a tela (ex.: depois de cadastrar um aluno).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setErro(null);
      listarContasAlunos()
        .then((lista) => {
          if (ativo) setContas(lista);
        })
        .catch((e: unknown) => {
          if (ativo) setErro(mensagemDeErro(e));
        });
      return () => {
        ativo = false;
      };
    }, []),
  );

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Contas dos alunos</Titulo>
      <Subtitulo>Só você cria as contas dos seus alunos e muda as senhas deles.</Subtitulo>
      <Botao titulo="Cadastrar aluno" onPress={() => router.push("/professor/contas/nova")} />

      {erro ? <Aviso>{erro}</Aviso> : null}
      {contas === null && !erro ? <Corpo>Carregando...</Corpo> : null}
      {contas?.length === 0 ? <Corpo>Você ainda não cadastrou alunos.</Corpo> : null}

      {contas?.map((c) => (
        <Cartao key={c.idUsuario}>
          <Text style={styles.nome}>{c.nome}</Text>
          <Text style={styles.detalhe}>Usuário: {c.nomeUsuario}</Text>
          {c.turma ? <Text style={styles.detalhe}>Turma: {c.turma}</Text> : null}
          <Botao
            titulo="Mudar senha"
            variante="secundario"
            rotuloAcessivel={`Mudar senha de ${c.nome}`}
            onPress={() =>
              router.push({
                pathname: "/professor/contas/[id]",
                params: { id: String(c.idUsuario), nome: c.nome, usuario: c.nomeUsuario },
              })
            }
          />
        </Cartao>
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  nome: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
  detalhe: { fontSize: fontes.corpo, color: cores.textoSuave },
});
