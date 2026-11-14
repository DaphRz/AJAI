// Área do responsável (Passo 3.1): acompanha até 2 pessoas, sem turma. Convida o aluno pelo usuário,
// e-mail ou telefone, e o aluno aceita no app. Sem tela no Figma (a desenhar no passo 11).
// A FAZER (passo 8): algumas recomendações sobre o progresso de quem ele acompanha (sem métricas detalhadas).
import { router } from "expo-router";
import { Botao, Cartao, Corpo, Logo, MeusAlunos, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";

export default function InicioResponsavel() {
  const { usuario, sair } = useSessao();
  return (
    <Tela>
      <Logo />
      <Titulo>Olá, {usuario?.nome.split(" ")[0]}!</Titulo>
      <Subtitulo>Aqui você acompanha até 2 pessoas da família.</Subtitulo>
      <MeusAlunos />
      <Cartao>
        <Corpo>Em breve: dicas para ajudar no aprendizado de quem você acompanha.</Corpo>
      </Cartao>
      <Botao titulo="Trocar minha senha" variante="secundario" onPress={() => router.push("/responsavel/senha")} />
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
