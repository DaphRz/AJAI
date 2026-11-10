// Figma: "AJAI · Home do aluno"  |  RF19, RF22 – continuidade do aprendizado
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Carregando, Cartao, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useAluno } from "@/hooks/useAluno";
import { useCarregar } from "@/hooks/useCarregar";
import { mensagemDeErro } from "@/services/api";
import { visualizarProgresso } from "@/services/progresso";
import { escolherProximaAtividade } from "@/services/sessaoDeEstudo";
import { cores, fontes } from "@/theme/tokens";

/** Trilha e etapa atual do aluno, como o servidor guardou (GET /alunos/eu/progresso). */
async function carregarHome() {
  const progresso = await visualizarProgresso();
  return { trilha: progresso.trilha, nivel: progresso.nivelAtual ?? progresso.trilha[0] };
}

export default function HomeAluno() {
  const aluno = useAluno();
  // Recarrega quando o nível da sessão muda (ex.: acabou de subir de etapa).
  const estado = useCarregar(carregarHome, aluno.idNivelAtual ?? 0);
  const [aviso, setAviso] = useState<string>();
  const [indo, setIndo] = useState(false);
  const primeiroNome = aluno.nome.split(" ")[0];

  return (
    <Carregando estado={estado} comAudio>
      {({ trilha, nivel }) => {
        const etapasConcluidas = trilha.filter((n) => n.status === "CONCLUIDA").length;

        async function continuar() {
          // RF22: começa uma sessão de estudo pela atividade que o servidor indicar
          // (a primeira da etapa ainda não acertada). Pergunta na hora, para não usar dado velho.
          if (indo) return;
          setIndo(true);
          setAviso(undefined);
          try {
            const proxima = await escolherProximaAtividade();
            if (proxima === undefined) {
              // TODO (passo 8): tela própria de "nível sem atividades".
              setAviso("Esta etapa ainda não tem atividades. Fale com seu professor.");
            } else {
              router.push({ pathname: "/aluno/atividade/[id]", params: { id: String(proxima), concluidas: "0" } });
            }
          } catch (erro) {
            setAviso(mensagemDeErro(erro));
          }
          setIndo(false);
        }

        return (
          <Tela
            rodape={<BotaoAudio texto={`Olá, ${primeiroNome}! Toque em continuar para fazer a próxima atividade.`} />}
          >
            <Logo />
            <View>
              <Titulo>Olá, {primeiroNome}!</Titulo>
              <Subtitulo>Vamos aprender?</Subtitulo>
            </View>

            <Cartao destaque>
              <Text style={styles.rotulo}>Etapa</Text>
              <Text style={styles.valor}>{nivel?.nome ?? "–"}</Text>
              <Text style={styles.legenda}>
                {etapasConcluidas === 0
                  ? "Você está começando. Vamos lá!"
                  : `${etapasConcluidas} etapa${etapasConcluidas > 1 ? "s" : ""} concluída${etapasConcluidas > 1 ? "s" : ""}. Muito bem!`}
              </Text>
            </Cartao>

            <Botao titulo={indo ? "Carregando..." : "CONTINUAR →"} grande desabilitado={indo} onPress={continuar} />
            {aviso ? <Aviso>{aviso}</Aviso> : null}

            <Cartao>
              <Text style={styles.rotulo}>Ofensiva</Text>
              {/* TODO: calcular dias seguidos a partir das Respostas (RF15, passo 9) */}
              <Text style={[styles.valor, { color: cores.primaria, fontSize: fontes.titulo }]}>– dias seguidos</Text>
            </Cartao>

            <Botao titulo="Ver meu progresso" variante="secundario" onPress={() => router.push("/aluno/progresso")} />
            <Botao titulo="Minha conta" variante="link" onPress={() => router.push("/aluno/conta")} />
          </Tela>
        );
      }}
    </Carregando>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  valor: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.texto },
  legenda: { fontSize: fontes.legenda, color: cores.texto },
});
