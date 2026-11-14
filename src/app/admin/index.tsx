// Área do administrador. Passo 3.1: aprova ou recusa as instituições inscritas (ao aprovar, o servidor
// gera o código que os professores informam no cadastro). Também: trocar senha e sair.
// Senha esquecida (qualquer perfil): POST /admin/usuarios/:id/senha-provisoria ou `npm run usuario:senha`.
// TODO (passo 9): cadastro de atividades e níveis (ou rotas REST + server/admin.http).
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Aviso, Botao, Cartao, CartaoDecisao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useCarregar } from "@/hooks/useCarregar";
import { decidirInstituicao, formatarCnpj, listarInstituicoes } from "@/services/instituicoes";
import { cores, fontes } from "@/theme/tokens";

export default function InicioAdmin() {
  const { usuario, sair } = useSessao();
  const [versao, setVersao] = useState(0);
  const estado = useCarregar(() => listarInstituicoes(), versao);
  const [aprovada, setAprovada] = useState<{ nome: string; codigo?: string } | null>(null);

  const pendentes = estado.dados?.filter((i) => i.status === "PENDENTE") ?? [];
  const aprovadas = estado.dados?.filter((i) => i.status === "APROVADA") ?? [];

  return (
    <Tela>
      <Logo />
      <Titulo>Administração</Titulo>
      <Subtitulo>{usuario?.nome}</Subtitulo>

      {aprovada ? (
        <Aviso tipo="sucesso">
          {aprovada.nome} foi aprovada. Código: {aprovada.codigo}
        </Aviso>
      ) : null}

      <Subtitulo>Instituições esperando aprovação</Subtitulo>
      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={estado.tentarDeNovo} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : pendentes.length === 0 ? (
        <Corpo>Nenhuma instituição esperando agora.</Corpo>
      ) : null}
      {pendentes.map((i) => (
        <CartaoDecisao
          key={i.idUsuario}
          nome={i.nome}
          decidir={async (decisao, motivo) => {
            const decidida = await decidirInstituicao(i.idUsuario, decisao, motivo);
            setAprovada(decidida.status === "APROVADA" ? { nome: decidida.nome, codigo: decidida.codigo } : null);
            setVersao((v) => v + 1);
          }}
        >
          <Text style={styles.nome}>{i.nome}</Text>
          <Corpo>CNPJ: {formatarCnpj(i.cnpj)}</Corpo>
          {i.nomeResponsavel ? <Corpo>Responsável: {i.nomeResponsavel}</Corpo> : null}
          {i.email ? <Corpo>E-mail: {i.email}</Corpo> : null}
          {i.telefone ? <Corpo>Telefone: {i.telefone}</Corpo> : null}
        </CartaoDecisao>
      ))}

      {aprovadas.length > 0 ? <Subtitulo>Instituições aprovadas</Subtitulo> : null}
      {aprovadas.map((i) => (
        <Cartao key={i.idUsuario}>
          <Text style={styles.nome}>{i.nome}</Text>
          <Corpo>Código: {i.codigo}</Corpo>
        </Cartao>
      ))}
      <Botao titulo="Atualizar lista" variante="secundario" onPress={() => setVersao((v) => v + 1)} />

      <Cartao>
        <Corpo>
          Senha esquecida (de qualquer perfil): POST /admin/usuarios/:id/senha-provisoria, ou no servidor: npm run
          usuario:senha -- usuário, e-mail ou telefone.
        </Corpo>
        <Corpo>O cadastro de atividades e níveis chega no passo 9.</Corpo>
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

const styles = StyleSheet.create({
  nome: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
});
