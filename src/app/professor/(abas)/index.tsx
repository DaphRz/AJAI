// Figma: "AJAI · Dashboard do professor"  |  RF20, RF21 – Professor.VisualizarPainel (passo 8)
// Dados de GET /professor/painel: só alunos com vínculo ACEITO, no período escolhido.
// Recarrega ao voltar para a aba (useFocusEffect, via useVersaoAoFocar).
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, Campo, Corpo, Logo, Opcao, SeletorPeriodo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import {
  AVISO_COMPLEMENTA,
  rotuloSituacao,
  ultimosDias,
  visualizarPainel,
  type ResumoAluno,
} from "@/services/relatorios";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";

export default function DashboardProfessor() {
  const { usuario } = useSessao();
  const [busca, setBusca] = useState("");
  const [soReforco, setSoReforco] = useState(false);
  /** Filtro de turma: "todas", "sem" (sem turma) ou o id da turma. */
  const [turma, setTurma] = useState<"todas" | "sem" | number>("todas");
  const [periodo, setPeriodo] = useState(() => ultimosDias(7));
  const [versao, recarregar] = useVersaoAoFocar();
  const estado = useCarregar(() => visualizarPainel(periodo), `${periodo.inicio}|${periodo.fim}|${versao}`, {
    manterAnterior: true,
  });

  const resumos = estado.dados?.alunos ?? [];
  const dias = estado.dados?.periodo.dias ?? 7;
  const precisamReforco = resumos.filter((r) => r.situacao !== "EM_DIA");
  const turmas = [...new Map(resumos.filter((r) => r.turma).map((r) => [r.turma!.idTurma, r.turma!])).values()];
  const naTurma = (r: ResumoAluno) =>
    turma === "todas" ? true : turma === "sem" ? !r.turma : r.turma?.idTurma === turma;
  const visiveis = (soReforco ? precisamReforco : resumos)
    .filter(naTurma)
    .filter((r) => r.aluno.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <Tela>
      <Logo />
      <View>
        <Titulo>Acompanhamento</Titulo>
        <Subtitulo>Olá, {usuario?.nome.split(" ")[0]}. Veja como seus alunos estão.</Subtitulo>
      </View>
      <SeletorPeriodo periodo={periodo} aoMudar={setPeriodo} />
      <Botao titulo="Meus alunos: convidar" variante="secundario" onPress={() => router.push("/professor/alunos")} />

      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : null}
      {!estado.dados && !estado.erro ? <Corpo>Carregando...</Corpo> : null}

      {estado.dados ? (
        <>
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

          {resumos.length === 0 ? (
            <Corpo>Você ainda não acompanha nenhum aluno. Toque em &quot;Meus alunos: convidar&quot; e convide pelo usuário, e-mail ou telefone.</Corpo>
          ) : (
            <>
              <Campo rotulo="Buscar aluno" placeholder="Buscar aluno pelo nome" value={busca} onChangeText={setBusca} />
              {turmas.length > 0 ? (
                <View style={styles.filtros} accessibilityLabel="Turma">
                  <Opcao ativo={turma === "todas"} texto="Todas as turmas" onPress={() => setTurma("todas")} />
                  {turmas.map((t) => (
                    <Opcao
                      key={t.idTurma}
                      ativo={turma === t.idTurma}
                      texto={`${t.nome} · ${resumos.filter((r) => r.turma?.idTurma === t.idTurma).length}`}
                      rotuloAcessivel={`Turma ${t.nome}`}
                      onPress={() => setTurma(t.idTurma)}
                    />
                  ))}
                  {resumos.some((r) => !r.turma) ? (
                    <Opcao ativo={turma === "sem"} texto={`Sem turma · ${resumos.filter((r) => !r.turma).length}`} onPress={() => setTurma("sem")} />
                  ) : null}
                </View>
              ) : null}
              <View style={styles.filtros}>
                <Opcao ativo={!soReforco} texto={`Todos · ${resumos.length}`} onPress={() => setSoReforco(false)} />
                <Opcao
                  ativo={soReforco}
                  texto={`Precisam de reforço · ${precisamReforco.length}`}
                  onPress={() => setSoReforco(true)}
                />
              </View>
              {visiveis.length === 0 ? <Corpo>Nenhum aluno encontrado.</Corpo> : null}
              {visiveis.map((r) => (
                <CartaoAluno key={r.aluno.idUsuario} resumo={r} dias={dias} />
              ))}
            </>
          )}
          <Text style={styles.aviso}>{AVISO_COMPLEMENTA}</Text>
        </>
      ) : null}
    </Tela>
  );
}

function CartaoAluno({ resumo, dias }: { resumo: ResumoAluno; dias: number }) {
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
          <Text style={styles.legenda}>
            {resumo.nivel?.nome ?? "Ainda não fez as perguntas do começo"}
            {resumo.turma ? ` · ${resumo.turma.nome}` : ""}
          </Text>
        </View>
        <Text style={[styles.selo, resumo.situacao === "EM_DIA" && styles.seloEmDia]}>{rotuloSituacao[resumo.situacao]}</Text>
      </View>

      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <Text style={styles.legenda}>Frequência</Text>
          <Text style={styles.metrica}>
            {resumo.diasAtivos}/{dias} dias
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.legenda}>Acertos / erros</Text>
          {resumo.totalAtividades === 0 ? (
            <Text style={styles.metrica}>–</Text>
          ) : (
            <Text style={styles.metrica}>
              {taxa}% <Text style={styles.legenda}>/ {100 - taxa}%</Text>
            </Text>
          )}
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
          accessibilityLabel={`Ver métricas de ${resumo.aluno.nome}`}
          style={styles.botaoLink}
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
  seloEmDia: { color: cores.sucesso, backgroundColor: cores.superficieSuave },
  botaoLink: { minHeight: toqueMinimo, justifyContent: "center", paddingHorizontal: 8 },
  aviso: { fontSize: 14, color: cores.textoSuave, textAlign: "center" },
  metrica: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.primaria },
  dificuldade: { backgroundColor: cores.atencaoFundo, borderRadius: raios.md, padding: 12, gap: 2 },
  dificuldadeRotulo: { fontSize: 13, fontWeight: "700", color: cores.atencaoTexto },
  link: { fontSize: fontes.legenda, fontWeight: "800", color: cores.primaria },
});
