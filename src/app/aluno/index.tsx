// Figma: "AJAI · Home do aluno"  |  RF15 – ofensiva e frequência; RF19, RF22 – continuidade do aprendizado
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Carregando, Cartao, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useAluno } from "@/hooks/useAluno";
import { useCarregar } from "@/hooks/useCarregar";
import { mensagemDeErro } from "@/services/api";
import { textoDaOfensiva, textoDaSemana, visualizarProgresso } from "@/services/progresso";
import { escolherProximaAtividade } from "@/services/sessaoDeEstudo";
import { listarConvitesDoAluno } from "@/services/vinculos";
import { familias, cores, type Fontes } from "@/theme/tokens";
import { useEstilos } from "@/context/preferencias";

/**
 * Trilha e etapa atual do aluno, como o servidor guardou (GET /alunos/eu/progresso), e quantos
 * convites de acompanhamento esperam resposta (Passo 3.1). Os convites não impedem a home de abrir.
 */
async function carregarHome() {
  const [progresso, vinculos] = await Promise.all([visualizarProgresso(), listarConvitesDoAluno().catch(() => [])]);
  return {
    trilha: progresso.trilha,
    nivel: progresso.nivelAtual ?? progresso.trilha[0],
    convites: vinculos.filter((v) => v.status === "PENDENTE").length,
    ofensiva: textoDaOfensiva(progresso.ofensiva),
    semana: textoDaSemana(progresso.ultimos7Dias),
  };
}

export default function HomeAluno() {
  const styles = useEstilos(criarEstilos);
  const aluno = useAluno();
  // Recarrega quando o nível da sessão muda (ex.: acabou de subir de etapa).
  const estado = useCarregar(carregarHome, aluno.idNivelAtual ?? 0);
  const [aviso, setAviso] = useState<string>();
  const [indo, setIndo] = useState(false);
  const primeiroNome = aluno.nome.split(" ")[0];

  return (
    <Carregando estado={estado} comAudio>
      {({ trilha, nivel, convites, ofensiva, semana }) => {
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
              // TODO: tela própria de "nível sem atividades" (o Figma tem o frame).
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
            rodape={
              <BotaoAudio
                texto={`Olá, ${primeiroNome}! Toque em continuar para fazer a próxima atividade. Ofensiva: ${ofensiva.numero} ${ofensiva.mensagem} Para mudar a voz ou o tamanho da letra, toque em Voz e letra.${
                  convites > 0 ? " Você tem um convite de acompanhamento. Toque em Ver convite." : ""
                }`}
              />
            }
          >
            {/* Figma "Marca e minha conta" */}
            <View style={styles.cabecalho}>
              <Logo />
              <View style={styles.conta}>
                <Botao titulo="Minha conta" variante="secundario" compacto onPress={() => router.push("/aluno/conta")} />
              </View>
            </View>
            <View style={styles.saudacao}>
              <Titulo>Olá, {primeiroNome}!</Titulo>
              <Subtitulo>Vamos aprender?</Subtitulo>
            </View>

            <Cartao destaque>
              <View style={styles.etapa}>
                <Text style={styles.rotulo}>Etapa</Text>
                <Text style={styles.valor}>{nivel?.nome ?? "–"}</Text>
              </View>
              <Text style={[styles.legenda, styles.centro]}>
                {etapasConcluidas === 0
                  ? "Você está começando. Vamos lá!"
                  : `${etapasConcluidas} etapa${etapasConcluidas > 1 ? "s" : ""} concluída${etapasConcluidas > 1 ? "s" : ""}. Muito bem!`}
              </Text>
            </Cartao>

            <Botao titulo={indo ? "Carregando..." : "CONTINUAR"} seta grande desabilitado={indo} onPress={continuar} />
            {aviso ? <Aviso>{aviso}</Aviso> : null}

            {/* RF15: ofensiva calculada no servidor (dias seguidos, fuso America/Sao_Paulo). */}
            <Cartao>
              <Text style={styles.rotuloOfensiva}>Ofensiva</Text>
              <Text style={styles.ofensiva}>{ofensiva.numero}</Text>
              <Text style={styles.legenda}>{ofensiva.mensagem}</Text>
              <Text style={styles.legenda}>{semana}</Text>
            </Cartao>

            {convites > 0 ? (
              <Cartao destaque>
                <Text style={styles.legenda}>
                  Você tem {convites === 1 ? "1 convite" : `${convites} convites`} de acompanhamento.
                </Text>
                <Botao titulo="Ver convite" variante="secundario" onPress={() => router.push("/aluno/acompanhamento")} />
              </Cartao>
            ) : null}

            <Botao titulo="Meu progresso" variante="secundario" onPress={() => router.push("/aluno/progresso")} />
            {/* Fora do Figma (passo 10): atalho para as preferências de voz e letra. */}
            <Botao titulo="Voz e letra" variante="secundario" onPress={() => router.push("/aluno/preferencias")} />
          </Tela>
        );
      }}
    </Carregando>
  );
}

// Figma "Home do aluno": rótulo "Etapa" 20 seminegrito; valores 24; "12 dias seguidos" em verde e negrito.
const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    cabecalho: { flexDirection: "row", alignItems: "center", gap: 12 },
    conta: { flex: 1 },
    saudacao: { gap: 8 },
    etapa: { gap: 4, marginBottom: 12 },
    rotulo: { fontSize: fontes.corpo, color: cores.textoSuave, fontFamily: familias.seminegrito },
    valor: { fontSize: fontes.subtitulo, fontFamily: familias.seminegrito, color: cores.texto },
    legenda: { fontFamily: familias.regular, fontSize: fontes.corpo, color: cores.texto },
    centro: { textAlign: "center" },
    rotuloOfensiva: { fontSize: fontes.corpo, fontFamily: familias.seminegrito, color: cores.texto },
    ofensiva: { fontSize: fontes.subtitulo, fontFamily: familias.negrito, color: cores.primaria },
  });
