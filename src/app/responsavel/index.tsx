// Área do responsável (Passo 3.1 e passo 8): acompanha até 2 pessoas, sem turma. Convida o aluno pelo
// usuário, e-mail ou telefone, e o aluno aceita no app. Embaixo de cada pessoa que aceitou, algumas
// recomendações (GET /responsavel/recomendacoes), sem métricas detalhadas. Sem frame no Figma.
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Botao, BotaoAudio, Logo, MeusAlunos, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import { listarRecomendacoes } from "@/services/relatorios";
import { cores, fontes, raios } from "@/theme/tokens";

export default function InicioResponsavel() {
  const { usuario, sair } = useSessao();
  const [versao, recarregar] = useVersaoAoFocar();
  const recomendacoes = useCarregar(listarRecomendacoes, versao, { manterAnterior: true });
  const pessoas = recomendacoes.dados ?? [];
  const textoParaOuvir =
    pessoas.length === 0
      ? "Aqui você acompanha até 2 pessoas da família. Convide pelo usuário, e-mail ou telefone da pessoa."
      : pessoas.map((p) => `${p.aluno.nome}. ${p.frases.join(" ")}`).join(" ");

  return (
    <Tela>
      <Logo />
      <Titulo>Olá, {usuario?.nome.split(" ")[0]}!</Titulo>
      <Subtitulo>Aqui você acompanha até 2 pessoas da família.</Subtitulo>
      <BotaoAudio titulo="Ouvir dicas" texto={textoParaOuvir} />
      <MeusAlunos
        aoMudar={recarregar}
        extraDoAluno={(v) => {
          const frases = pessoas.find((p) => p.idVinculo === v.idVinculo)?.frases;
          if (!frases) return recomendacoes.erro ? <Text style={styles.legenda}>Não deu para carregar as dicas agora.</Text> : null;
          return (
            <View style={styles.dicas}>
              <Text style={styles.dicasTitulo}>Dicas para ajudar</Text>
              {frases.map((f) => (
                <Text key={f} style={styles.frase}>
                  {f}
                </Text>
              ))}
            </View>
          );
        }}
      />
      <Botao titulo="Trocar minha senha" variante="secundario" onPress={() => router.push("/responsavel/senha")} />
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
  dicas: { backgroundColor: cores.superficieSuave, borderRadius: raios.md, padding: 12, gap: 6 },
  dicasTitulo: { fontSize: fontes.legenda, fontWeight: "700", color: cores.primaria },
  frase: { fontSize: fontes.corpo, color: cores.texto },
  legenda: { fontSize: fontes.legenda, color: cores.textoSuave },
});
