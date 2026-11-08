// Aluno › Minha conta (sem tela no Figma; a desenhar no passo 8): dados e sair.
// O aluno NÃO troca a própria senha: só o professor que criou a conta (decisão de 08/11).
// As preferências de voz e letra entram aqui ou na home no passo 6.
import { router } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";

export default function ContaAluno() {
  const aluno = useAluno();
  const { sair } = useSessao();

  return (
    <Tela
      rodape={
        <BotaoAudio
          texto={`Sua conta, ${aluno.nome}. Seu usuário é ${aluno.nomeUsuario}. Para mudar a senha, fale com seu professor. Para sair do aplicativo, toque em Sair.`}
        />
      }
    >
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Logo />
      <Titulo>Minha conta</Titulo>
      <Cartao>
        <Subtitulo>{aluno.nome}</Subtitulo>
        <Corpo>Seu usuário: {aluno.nomeUsuario}</Corpo>
        <Corpo>Para mudar a senha, fale com seu professor.</Corpo>
      </Cartao>
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
