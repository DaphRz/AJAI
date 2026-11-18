// Aluno › Minha conta (o Figma tem o frame "Minha conta"): dados, trocar a própria senha
// (Passo 3.1), quem acompanha você (convites e vínculos) e sair.
// As preferências de voz e letra ficam em /aluno/preferencias (botão "Voz e letra" na home e aqui).
import { router } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";

export default function ContaAluno() {
  const aluno = useAluno();
  const { sair } = useSessao();
  // Passo 12 (privacidade): o texto narrado vai para o serviço de voz (Azure) e fica no cache de
  // áudio do servidor. Por isso a narração diz só o primeiro nome e o usuário, nunca o e-mail
  // nem o telefone (eles continuam escritos na tela).
  const primeiroNome = aluno.nome.split(" ")[0];
  const entraCom = aluno.nomeUsuario
    ? `o usuário ${aluno.nomeUsuario}`
    : aluno.email
      ? "o seu e-mail, que está escrito na tela"
      : "o seu telefone, que está escrito na tela";

  return (
    <Tela
      rodape={
        <BotaoAudio
          texto={`Sua conta, ${primeiroNome}. Você entra com ${entraCom}. Para mudar a senha, toque em Trocar minha senha. Para ver quem acompanha você, toque em Quem me acompanha. Para mudar a voz ou o tamanho da letra, toque em Voz e letra. Para sair do aplicativo, toque em Sair.`}
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
      <Botao titulo="Voz e letra" variante="secundario" onPress={() => router.push("/aluno/preferencias")} />
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
