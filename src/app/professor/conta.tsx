// Conta do professor: dados, turmas (Professor.IncluirTurma/EditarTurma) e sair.
// PENDENTE: gestão de turmas e vínculo de alunos (Matricula).
import { router } from "expo-router";
import { Botao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";

export default function Conta() {
  const { usuario, sair } = useSessao();
  return (
    <Tela>
      <Titulo>Conta</Titulo>
      <Subtitulo>{usuario?.nome}</Subtitulo>
      <Corpo>{usuario?.email}</Corpo>
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
