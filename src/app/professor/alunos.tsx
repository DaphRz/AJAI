// Professor › Meus alunos (Passo 3.1). O aluno tem conta própria: o professor convida pelo usuário,
// e-mail ou telefone, e o aluno aceita no app. Sem limite de alunos. Sem tela no Figma (passo 11).
// Substitui as antigas telas professor/contas/* (o professor não cadastra mais aluno).
import { router } from "expo-router";
import { Botao, MeusAlunos, Subtitulo, Tela, Titulo } from "@/components";

export default function MeusAlunosProfessor() {
  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Meus alunos</Titulo>
      <Subtitulo>Convide seus alunos. Eles aceitam no aplicativo.</Subtitulo>
      <MeusAlunos />
    </Tela>
  );
}
