// Conta do professor: dados, contas dos alunos (cadastrar aluno, mudar senha), trocar senha e sair.
// PENDENTE (passo 10): editar nome, gestão de turmas e vínculo de alunos (Matricula).
import { router } from "expo-router";
import { Botao, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";

export default function Conta() {
  const { usuario, sair } = useSessao();
  return (
    <Tela>
      <Titulo>Conta</Titulo>
      <Cartao>
        <Subtitulo>{usuario?.nome}</Subtitulo>
        {usuario?.email ? <Corpo>E-mail: {usuario.email}</Corpo> : null}
        {usuario?.telefone ? <Corpo>Telefone: {usuario.telefone}</Corpo> : null}
      </Cartao>
      <Botao titulo="Contas dos alunos" onPress={() => router.push("/professor/contas")} />
      <Botao titulo="Trocar minha senha" variante="secundario" onPress={() => router.push("/professor/senha")} />
      <Botao
        titulo="Sair"
        variante="secundario"
        onPress={() => {
          sair();
          router.replace("/login");
        }}
      />
    </Tela>
  );
}
