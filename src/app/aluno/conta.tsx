// Aluno › Minha conta (sem tela no Figma; a desenhar no passo 11): dados, trocar a própria senha
// (Passo 3.1), quem acompanha você (convites e vínculos) e sair.
// As preferências de voz e letra entram aqui ou na home no passo 10.
import { router } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";

export default function ContaAluno() {
  const aluno = useAluno();
  const { sair } = useSessao();
  const entraCom = aluno.nomeUsuario ?? aluno.email ?? aluno.telefone;

  return (
    <Tela
      rodape={
        <BotaoAudio
          texto={`Sua conta, ${aluno.nome}. Você entra com ${entraCom}. Para mudar a senha, toque em Trocar minha senha. Para ver quem acompanha você, toque em Quem me acompanha. Para sair do aplicativo, toque em Sair.`}
        />
      }
    >
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Logo />
      <Titulo>Minha conta</Titulo>
      <Cartao>
        <Subtitulo>{aluno.nome}</Subtitulo>
        {aluno.nomeUsuario ? <Corpo>Seu usuário: {aluno.nomeUsuario}</Corpo> : null}
        {aluno.email ? <Corpo>Seu e-mail: {aluno.email}</Corpo> : null}
        {aluno.telefone ? <Corpo>Seu telefone: {aluno.telefone}</Corpo> : null}
      </Cartao>
      <Botao titulo="Quem me acompanha" onPress={() => router.push("/aluno/acompanhamento")} />
      <Botao titulo="Trocar minha senha" variante="secundario" onPress={() => router.push("/aluno/senha")} />
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
