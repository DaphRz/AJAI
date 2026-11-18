// RF15, RF17, RF18, RF19 – histórico, frequência e evolução do aluno (passo 7)
// Sem frame no Figma: segue o padrão visual das telas desenhadas (Home do aluno: cartões,
// cartão "Etapa" em destaque, cartão amarelo "Ouvir ajuda" no rodapé).
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Carregando, Cartao, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import {
  textoDaOfensiva,
  textoDaSemana,
  visualizarProgresso,
  type ProgressoDoAluno,
  type StatusEtapa,
} from "@/services/progresso";
import { cores, raios, type Fontes } from "@/theme/tokens";
import { useEstilos } from "@/context/preferencias";

export default function Progresso() {
  // Tudo vem calculado do servidor (GET /alunos/eu/progresso).
  const estado = useCarregar(() => visualizarProgresso());
  return (
    <Carregando estado={estado} comAudio>
      {(dados) => <ConteudoProgresso {...dados} />}
    </Carregando>
  );
}

const ROTULO_ETAPA: Record<StatusEtapa, string> = {
  CONCLUIDA: "Concluída",
  ATUAL: "Você está aqui",
  BLOQUEADA: "Próxima",
};

const ICONE_ETAPA: Record<StatusEtapa, "checkmark-circle" | "play-circle" | "ellipse-outline"> = {
  CONCLUIDA: "checkmark-circle",
  ATUAL: "play-circle",
  BLOQUEADA: "ellipse-outline",
};

function ConteudoProgresso({
  trilha,
  totalAtividades,
  totalAcertos,
  taxaAcerto,
  dificuldades,
  ofensiva,
  ultimos7Dias,
}: ProgressoDoAluno) {
  const styles = useEstilos(criarEstilos);
  const taxa = Math.round(taxaAcerto * 100);
  const concluidas = trilha.filter((n) => n.status === "CONCLUIDA").length;
  const atual = trilha.find((n) => n.status === "ATUAL");
  const textoOfensiva = textoDaOfensiva(ofensiva);
  const semana = textoDaSemana(ultimos7Dias);

  const narracao = [
    atual ? `Você está na etapa ${atual.nome}.` : "",
    concluidas > 0 ? `Já concluiu ${concluidas} de ${trilha.length} etapas.` : `A trilha tem ${trilha.length} etapas.`,
    `Você fez ${totalAtividades} atividades e acertou ${totalAcertos}. Isso é ${taxa} por cento.`,
    `Ofensiva: ${textoOfensiva.numero}. ${semana}`,
    dificuldades.length > 0 ? `Vale a pena treinar: ${dificuldades.map((d) => d.conteudo).join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tela rodape={<BotaoAudio texto={narracao} />}>
      <View>
        <Titulo>Meu progresso</Titulo>
        <Subtitulo>Veja até onde você já chegou.</Subtitulo>
      </View>

      {/* Trilha de níveis (RF19) */}
      <Cartao destaque>
        <Text style={styles.rotulo}>Sua trilha</Text>
        <Text style={styles.texto}>
          {concluidas} de {trilha.length} etapas concluídas
        </Text>
        <View style={styles.trilha}>
          {trilha.map((n) => {
            const agora = n.status === "ATUAL";
            const feito = n.status === "CONCLUIDA";
            return (
              <View
                key={n.idNivel}
                accessible
                accessibilityLabel={`${n.nome}: ${ROTULO_ETAPA[n.status]}`}
                style={[styles.etapa, agora && styles.etapaAtual]}
              >
                <Ionicons
                  name={ICONE_ETAPA[n.status]}
                  size={32}
                  color={feito ? cores.sucesso : agora ? cores.primaria : cores.textoSuave}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <View style={styles.etapaTextos}>
                  <Text style={[styles.etapaNome, n.status === "BLOQUEADA" && { color: cores.textoSuave }]}>{n.nome}</Text>
                  <Text style={[styles.etapaStatus, agora && { color: cores.primaria }]}>{ROTULO_ETAPA[n.status]}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Cartao>

      {/* Atividades feitas e taxa de acerto (RF18) */}
      <View style={styles.numeros}>
        <View style={styles.coluna}>
          <Cartao>
            <Text style={styles.rotulo}>Atividades feitas</Text>
            <Text style={styles.valor}>{totalAtividades}</Text>
          </Cartao>
        </View>
        <View style={styles.coluna}>
          <Cartao>
            <Text style={styles.rotulo}>Acertos</Text>
            <Text style={styles.valor}>{taxa}%</Text>
          </Cartao>
        </View>
      </View>
      <View
        style={styles.barra}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Você acertou ${totalAcertos} de ${totalAtividades} atividades`}
        accessibilityValue={{ min: 0, max: 100, now: taxa }}
      >
        <View style={[styles.barraCheia, { width: `${taxa}%` }]} />
      </View>

      {/* Frequência (RF15) */}
      <Cartao>
        <Text style={styles.rotulo}>Ofensiva</Text>
        <View style={styles.linha}>
          <Ionicons name="flame" size={28} color={cores.primaria} accessibilityElementsHidden importantForAccessibility="no" />
          <Text style={styles.destaque}>{textoOfensiva.numero}</Text>
        </View>
        <Text style={styles.texto}>{semana}</Text>
      </Cartao>

      {/* Dificuldades (RF17) */}
      <Cartao>
        <Text style={styles.rotulo}>Vale a pena treinar</Text>
        {dificuldades.length > 0 ? (
          dificuldades.map((d) => (
            <View key={d.conteudo} style={styles.linha}>
              <Ionicons name="bulb-outline" size={24} color={cores.primaria} accessibilityElementsHidden importantForAccessibility="no" />
              <Text style={styles.texto}>{d.conteudo}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.texto}>Você está indo bem em tudo. Continue assim!</Text>
        )}
      </Cartao>

      <Botao titulo="Voltar" variante="secundario" onPress={() => router.back()} />
    </Tela>
  );
}

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
    texto: { fontSize: fontes.corpo, color: cores.texto, flexShrink: 1 },
    valor: { fontSize: fontes.tituloGrande, fontWeight: "800", color: cores.primaria },
    destaque: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.primaria, flexShrink: 1 },
    linha: { flexDirection: "row", alignItems: "center", gap: 8 },
    trilha: { gap: 4, marginTop: 8 },
    etapa: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: raios.md },
    etapaAtual: { backgroundColor: cores.superficie, borderWidth: 2, borderColor: cores.primaria },
    etapaTextos: { flexShrink: 1 },
    etapaNome: { fontSize: fontes.corpo, fontWeight: "700", color: cores.texto },
    etapaStatus: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
    numeros: { flexDirection: "row", gap: 12 },
    coluna: { flex: 1 },
    barra: { height: 16, borderRadius: 8, backgroundColor: cores.superficieSuave, overflow: "hidden" },
    barraCheia: { height: "100%", backgroundColor: cores.sucesso },
  });
