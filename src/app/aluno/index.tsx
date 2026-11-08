// Figma: "AJAI · Home do aluno"  |  RF19, RF22 – continuidade do aprendizado
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Cartao, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useAluno } from "@/hooks/useAluno";
import { buscarNivel, listarAtividadesDoNivel, listarTrilha } from "@/services/atividades";
import { listarRespostasDoAluno } from "@/services/respostas";
import { cores, fontes } from "@/theme/tokens";

export default function HomeAluno() {
  const aluno = useAluno();
  const nivel = buscarNivel(aluno.idNivelAtual) ?? listarTrilha()[0];
  const etapasConcluidas = listarTrilha().filter((n) => n.ordem < nivel.ordem).length;
  const primeiroNome = aluno.nome.split(" ")[0];

  function continuar() {
    // RF22: retoma a primeira atividade do nível ainda não acertada.
    const feitas = listarRespostasDoAluno(aluno.idUsuario);
    const atividades = listarAtividadesDoNivel(nivel.idNivel);
    const proxima =
      atividades.find((a) => !feitas.some((r) => r.idAtividade === a.idAtividade && r.correta)) ?? atividades[0];
    if (!proxima) return; // TODO: tela de "nível sem atividades"
    router.push({ pathname: "/aluno/atividade/[id]", params: { id: String(proxima.idAtividade) } });
  }

  return (
    <Tela rodape={<BotaoAudio texto={`Olá, ${primeiroNome}! Toque em continuar para fazer a próxima atividade.`} />}>
      <Logo />
      <View>
        <Titulo>Olá, {primeiroNome}!</Titulo>
        <Subtitulo>Vamos aprender?</Subtitulo>
      </View>

      <Cartao destaque>
        <Text style={styles.rotulo}>Etapa</Text>
        <Text style={styles.valor}>{nivel.nome}</Text>
        <Text style={styles.legenda}>
          {etapasConcluidas === 0
            ? "Você está começando. Vamos lá!"
            : `${etapasConcluidas} etapa${etapasConcluidas > 1 ? "s" : ""} concluída${etapasConcluidas > 1 ? "s" : ""}. Muito bem!`}
        </Text>
      </Cartao>

      <Botao titulo="CONTINUAR →" grande onPress={continuar} />

      <Cartao>
        <Text style={styles.rotulo}>Ofensiva</Text>
        {/* TODO: calcular dias seguidos a partir das Respostas (RF15) */}
        <Text style={[styles.valor, { color: cores.primaria, fontSize: fontes.titulo }]}>– dias seguidos</Text>
      </Cartao>

      <Botao titulo="Ver meu progresso" variante="secundario" onPress={() => router.push("/aluno/progresso")} />
      <Botao titulo="Minha conta" variante="link" onPress={() => router.push("/aluno/conta")} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  valor: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.texto },
  legenda: { fontSize: fontes.legenda, color: cores.texto },
});
