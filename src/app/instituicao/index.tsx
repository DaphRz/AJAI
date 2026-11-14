// Área da instituição (Passo 3.1): mostra o código para os professores e aprova ou recusa os
// professores que se cadastraram com ele. Só depois que o AJAI aprovou a instituição (o _layout
// manda para /espera antes disso). Sem tela no Figma (a desenhar no passo 11).
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Aviso, Botao, Cartao, CartaoDecisao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useCarregar } from "@/hooks/useCarregar";
import {
  decidirProfessor,
  listarProfessoresDaInstituicao,
  visualizarMinhaInstituicao,
} from "@/services/instituicoes";
import { cores, fontes } from "@/theme/tokens";

async function carregar() {
  const [instituicao, professores] = await Promise.all([visualizarMinhaInstituicao(), listarProfessoresDaInstituicao()]);
  return { instituicao, professores };
}

export default function InicioInstituicao() {
  const { sair } = useSessao();
  const [versao, setVersao] = useState(0);
  const estado = useCarregar(carregar, versao);

  return (
    <Tela>
      <Logo />
      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={estado.tentarDeNovo} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : (
        <>
          <Titulo>{estado.dados.instituicao.nome}</Titulo>
          <Cartao destaque>
            <Text style={styles.rotulo}>Código da instituição</Text>
            <Text style={styles.codigo} accessibilityLabel={`Código: ${[...(estado.dados.instituicao.codigo ?? "")].join(" ")}`}>
              {estado.dados.instituicao.codigo}
            </Text>
            <Corpo>Passe este código para os seus professores. Eles informam o código ao criar a conta.</Corpo>
          </Cartao>

          <Subtitulo>Professores esperando aprovação</Subtitulo>
          {estado.dados.professores.filter((p) => p.status === "PENDENTE").length === 0 ? (
            <Corpo>Nenhum professor esperando agora.</Corpo>
          ) : null}
          {estado.dados.professores
            .filter((p) => p.status === "PENDENTE")
            .map((p) => (
              <CartaoDecisao
                key={p.idUsuario}
                nome={p.nome}
                decidir={async (decisao, motivo) => {
                  await decidirProfessor(p.idUsuario, decisao, motivo);
                  setVersao((v) => v + 1);
                }}
              >
                <Text style={styles.nome}>{p.nome}</Text>
                {p.email ? <Corpo>E-mail: {p.email}</Corpo> : null}
                {p.telefone ? <Corpo>Telefone: {p.telefone}</Corpo> : null}
              </CartaoDecisao>
            ))}

          <Subtitulo>Professores aprovados</Subtitulo>
          {estado.dados.professores.filter((p) => p.status === "APROVADO").length === 0 ? (
            <Corpo>Ainda não há professores aprovados.</Corpo>
          ) : null}
          {estado.dados.professores
            .filter((p) => p.status === "APROVADO")
            .map((p) => (
              <Cartao key={p.idUsuario}>
                <Text style={styles.nome}>{p.nome}</Text>
                {p.email ? <Corpo>{p.email}</Corpo> : null}
              </Cartao>
            ))}
          <Botao titulo="Atualizar lista" variante="secundario" onPress={() => setVersao((v) => v + 1)} />
        </>
      )}

      <Botao titulo="Trocar minha senha" variante="secundario" onPress={() => router.push("/instituicao/senha")} />
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
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  codigo: { fontSize: fontes.palavraDestaque, fontWeight: "800", color: cores.primaria, letterSpacing: 4 },
  nome: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
});
