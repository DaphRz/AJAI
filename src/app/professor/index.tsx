// Figma: "AJAI · Dashboard do professor"  |  RF20, RF21 – Professor.VisualizarPainel
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Campo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { visualizarPainel, type ResumoAluno, type Situacao } from "@/services/relatorios";
import { cores, fontes, raios } from "@/theme/tokens";

const rotuloSituacao: Record<Situacao, string> = {
  EM_DIA: "Em dia",
  ATENCAO: "Atenção",
  REFORCO: "Reforço pontual",
};

export default function DashboardProfessor() {
  const { usuario } = useSessao();
  const [busca, setBusca] = useState("");
  const [soReforco, setSoReforco] = useState(false);

  // TODO: recarregar ao focar a aba (useFocusEffect) quando vier da API.
  const resumos = usuario ? visualizarPainel(usuario.idUsuario) : [];
  const precisamReforco = resumos.filter((r) => r.situacao !== "EM_DIA");
  const visiveis = (soReforco ? precisamReforco : resumos).filter((r) =>
    r.aluno.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  return (
    <Tela>
      <Logo />
      <View>
        <Titulo>Acompanhamento</Titulo>
        <Subtitulo>Olá, {usuario?.nome.split(" ")[0]}. Veja como seus alunos estão.</Subtitulo>
      </View>
      {/* TODO: seletor de período ("Últimos 7 dias") */}

      <View style={styles.resumo}>
        <Text style={styles.resumoTitulo}>RESUMO DOS ALUNOS</Text>
        <View style={styles.resumoLinha}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumoNumero}>{resumos.length}</Text>
            <Text style={styles.resumoLegenda}>Alunos vinculados</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumoNumero}>{precisamReforco.length}</Text>
            <Text style={styles.resumoLegenda}>Precisam de reforço</Text>
          </View>
        </View>
      </View>

      <Campo rotulo="Buscar aluno" placeholder="Buscar aluno pelo nome" value={busca} onChangeText={setBusca} />

      <View style={styles.filtros}>
        <Filtro ativo={!soReforco} texto={`Todos · ${resumos.length}`} onPress={() => setSoReforco(false)} />
        <Filtro ativo={soReforco} texto={`Precisam de reforço · ${precisamReforco.length}`} onPress={() => setSoReforco(true)} />
      </View>

      {visiveis.map((r) => (
        <CartaoAluno key={r.aluno.idUsuario} resumo={r} />
      ))}
    </Tela>
  );
}

function Filtro({ ativo, texto, onPress }: { ativo: boolean; texto: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={[styles.filtro, ativo && styles.filtroAtivo]}
    >
      <Text style={[styles.filtroTexto, ativo && { color: cores.primariaTexto }]}>{texto}</Text>
    </Pressable>
  );
}

function CartaoAluno({ resumo }: { resumo: ResumoAluno }) {
  const iniciais = resumo.aluno.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const taxa = Math.round(resumo.taxaAcerto * 100);

  return (
    <View style={styles.cartao}>
      <View style={styles.linha}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{resumo.aluno.nome}</Text>
          <Text style={styles.legenda}>{resumo.nomeNivel}</Text>
        </View>
        <Text style={styles.selo}>{rotuloSituacao[resumo.situacao]}</Text>
      </View>

      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <Text style={styles.legenda}>Frequência</Text>
          <Text style={styles.metrica}>{resumo.diasAtivos}/7 dias</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.legenda}>Acertos / erros</Text>
          <Text style={styles.metrica}>
            {taxa}% <Text style={styles.legenda}>/ {100 - taxa}%</Text>
          </Text>
        </View>
      </View>

      {resumo.maiorDificuldade ? (
        <View style={styles.dificuldade}>
          <Text style={styles.dificuldadeRotulo}>Maior dificuldade</Text>
          <Text style={styles.nome}>{resumo.maiorDificuldade.conteudo}</Text>
          <Text style={styles.legenda}>
            {resumo.maiorDificuldade.erros} erros em {resumo.maiorDificuldade.tentativas} tentativas
          </Text>
        </View>
      ) : null}

      <View style={styles.linha}>
        <Text style={[styles.legenda, { flex: 1 }]}>{resumo.totalAtividades} atividades no período</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/professor/aluno/[id]", params: { id: String(resumo.aluno.idUsuario) } })
          }
        >
          <Text style={styles.link}>Ver métricas ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: { backgroundColor: cores.primaria, borderRadius: raios.lg, padding: 20, gap: 12 },
  resumoTitulo: { color: cores.primariaTexto, fontWeight: "700", fontSize: 14 },
  resumoLinha: { flexDirection: "row" },
  resumoNumero: { color: cores.primariaTexto, fontSize: 36, fontWeight: "800" },
  resumoLegenda: { color: cores.primariaTexto, fontSize: fontes.legenda },
  filtros: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filtro: { borderWidth: 2, borderColor: cores.borda, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  filtroAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  filtroTexto: { fontSize: fontes.legenda, fontWeight: "700", color: cores.texto },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raios.lg,
    borderWidth: 2,
    borderColor: cores.borda,
    padding: 16,
    gap: 14,
  },
  linha: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.superficieSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { fontWeight: "800", color: cores.primaria },
  nome: { fontSize: fontes.corpo, fontWeight: "800", color: cores.texto },
  legenda: { fontSize: 14, color: cores.textoSuave },
  selo: {
    fontSize: 13,
    fontWeight: "700",
    color: cores.atencaoTexto,
    backgroundColor: cores.atencaoFundo,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  metrica: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.primaria },
  dificuldade: { backgroundColor: cores.atencaoFundo, borderRadius: raios.md, padding: 12, gap: 2 },
  dificuldadeRotulo: { fontSize: 13, fontWeight: "700", color: cores.atencaoTexto },
  link: { fontSize: fontes.legenda, fontWeight: "800", color: cores.primaria },
});
