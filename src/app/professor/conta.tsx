// Conta do professor: dados, instituição, "Meus alunos" (convites/vínculos), trocar senha e sair.
// PENDENTE (passo 8): editar nome e gestão de turmas (Matricula).
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
        {usuario?.situacao?.nomeInstituicao ? <Corpo>Instituição: {usuario.situacao.nomeInstituicao}</Corpo> : null}
      </Cartao>
      <Botao titulo="Meus alunos" onPress={() => router.push("/professor/alunos")} />
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
