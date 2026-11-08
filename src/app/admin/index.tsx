// Área do administrador (APF 25–31). Por enquanto só conta e sair.
// TODO (passo 11): cadastro de atividades e níveis (ou rotas REST + server/admin.http).
import { router } from "expo-router";
import { Botao, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";

export default function InicioAdmin() {
  const { usuario, sair } = useSessao();
  return (
    <Tela>
      <Logo />
      <Titulo>Administração</Titulo>
      <Subtitulo>{usuario?.nome}</Subtitulo>
      <Cartao>
        <Corpo>O cadastro de atividades e níveis chega no passo 11.</Corpo>
        <Corpo>
          Senha esquecida de professor ou aluno: POST /admin/usuarios/:id/senha-provisoria, ou no
          servidor: npm run usuario:senha -- e-mail-ou-telefone.
        </Corpo>
      </Cartao>
      <Botao titulo="Trocar senha" variante="secundario" onPress={() => router.push("/admin/senha")} />
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
