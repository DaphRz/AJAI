// Professor › Relatórios (passo 8; RF17, RF21 – VisualizarRelatorioFrequencia / VisualizarDificuldades).
// Por turma ou de todos os alunos com vínculo ACEITO, no período escolhido. Sem frame no Figma:
// segue o padrão do Dashboard. Recarrega ao voltar para a aba.
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, Cartao, Corpo, GraficoBarras, Opcao, SeletorPeriodo, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import {
  AVISO_COMPLEMENTA,
  diaCurto,
  ultimosDias,
  visualizarDificuldades,
  visualizarRelatorioFrequencia,
  type Periodo,
} from "@/services/relatorios";
import { listarTurmas } from "@/services/turmas";
import { cores, fontes, raios } from "@/theme/tokens";

/** Quantos conteúdos aparecem em "Conteúdos com mais dificuldade". */
const MAXIMO_CONTEUDOS = 8;

async function carregar(periodo: Periodo, idTurma?: number) {
  const [frequencia, dificuldades, { turmas }] = await Promise.all([
    visualizarRelatorioFrequencia(periodo, idTurma),
    visualizarDificuldades(periodo, idTurma),
    listarTurmas(),
  ]);
  return { frequencia, dificuldades, turmas: turmas.filter((t) => t.ativa) };
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(() => ultimosDias(7));
  const [idTurma, setIdTurma] = useState<number | undefined>(undefined);
  const [versao, recarregar] = useVersaoAoFocar();
  const estado = useCarregar(() => carregar(periodo, idTurma), `${periodo.inicio}|${periodo.fim}|${idTurma}|${versao}`, {
    manterAnterior: true,
  });

  return (
    <Tela>
      <Titulo>Relatórios</Titulo>
      <SeletorPeriodo periodo={periodo} aoMudar={setPeriodo} />

      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : null}
      {!estado.dados && !estado.erro ? <Corpo>Carregando...</Corpo> : null}

      {estado.dados ? <Conteudo dados={estado.dados} idTurma={idTurma} aoEscolherTurma={setIdTurma} /> : null}
    </Tela>
  );
}

function Conteudo({
  dados,
  idTurma,
  aoEscolherTurma,
}: {
  dados: Awaited<ReturnType<typeof carregar>>;
  idTurma: number | undefined;
  aoEscolherTurma: (idTurma: number | undefined) => void;
}) {
  const { frequencia, dificuldades, turmas } = dados;
  const maximoPorDia = Math.max(1, ...frequencia.porDia.map((p) => p.atividades));
  const comAtividade = frequencia.porDia.filter((p) => p.atividades > 0);
  const conteudos = dificuldades.conteudos.filter((c) => c.erros > 0).slice(0, MAXIMO_CONTEUDOS);
  return (
    <>
      {turmas.length > 0 ? (
        <View style={styles.linha} accessibilityLabel="Turma">
          <Opcao texto="Todos os alunos" ativo={idTurma === undefined} onPress={() => aoEscolherTurma(undefined)} />
          {turmas.map((t) => (
            <Opcao key={t.idTurma} texto={t.nome} ativo={idTurma === t.idTurma} onPress={() => aoEscolherTurma(t.idTurma)} />
          ))}
        </View>
      ) : (
        <Corpo>Crie turmas na aba Turmas para ver os relatórios por turma.</Corpo>
      )}

      <Subtitulo>Frequência de uso</Subtitulo>
      <View style={styles.resumo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resumoNumero}>
            {frequencia.alunosAtivos}/{frequencia.totalAlunos}
          </Text>
          <Text style={styles.resumoLegenda}>Alunos que treinaram</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.resumoNumero}>{frequencia.totalAtividades}</Text>
          <Text style={styles.resumoLegenda}>Atividades feitas</Text>
        </View>
      </View>

      <Cartao>
        <Text style={styles.rotulo}>Atividades por dia (o número em cima de cada barra)</Text>
        <GraficoBarras
          descricao={
            comAtividade.length === 0
              ? "Atividades por dia: nenhuma no período."
              : `Atividades por dia. ${comAtividade.map((p) => `${diaCurto(p.dia)}: ${p.atividades} atividades de ${p.alunos} alunos`).join(". ")}.`
          }
          barras={frequencia.porDia.map((p) => ({
            rotulo: diaCurto(p.dia),
            valor: p.atividades === 0 ? null : p.atividades / maximoPorDia,
            texto: String(p.atividades),
          }))}
        />
      </Cartao>

      <Cartao>
        <Text style={styles.rotulo}>Dias com atividade, por aluno (menos ativos primeiro)</Text>
        {frequencia.porAluno.length === 0 ? <Corpo>Nenhum aluno aqui ainda.</Corpo> : null}
        {frequencia.porAluno.map((p) => (
          <View key={p.aluno.idUsuario} style={styles.itemLinha}>
            <Text style={[styles.item, { flex: 1 }]}>{p.aluno.nome}</Text>
            <Text style={styles.itemValor}>
              {p.diasAtivos}/{frequencia.periodo.dias} dias · {p.totalAtividades} ativ.
            </Text>
          </View>
        ))}
      </Cartao>

      <Subtitulo>Conteúdos com mais dificuldade</Subtitulo>
      <Cartao>
        {conteudos.length === 0 ? <Corpo>Nenhum conteúdo com erro no período. Muito bem!</Corpo> : null}
        {conteudos.map((c) => (
          <View key={c.conteudo} style={styles.conteudo}>
            <Text style={styles.itemForte}>{c.conteudo}</Text>
            <Text style={styles.legenda}>
              {Math.round(c.taxaAcerto * 100)}% de acerto · {c.erros} erros em {c.tentativas} ·{" "}
              {c.alunosComErro === 1 ? "1 aluno" : `${c.alunosComErro} alunos`} com erro
            </Text>
            <View style={styles.trilho} accessibilityElementsHidden importantForAccessibility="no">
              <View style={[styles.preenchido, { width: `${Math.round(c.taxaAcerto * 100)}%` }]} />
            </View>
          </View>
        ))}
      </Cartao>

      <Text style={styles.aviso}>{AVISO_COMPLEMENTA}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  resumo: { flexDirection: "row", backgroundColor: cores.primaria, borderRadius: raios.lg, padding: 20 },
  resumoNumero: { color: cores.primariaTexto, fontSize: 36, fontWeight: "800" },
  resumoLegenda: { color: cores.primariaTexto, fontSize: fontes.legenda },
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontWeight: "600" },
  itemLinha: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  item: { fontSize: fontes.corpo, color: cores.texto },
  itemForte: { fontSize: fontes.corpo, color: cores.texto, fontWeight: "800" },
  itemValor: { fontSize: fontes.legenda, color: cores.primaria, fontWeight: "700" },
  legenda: { fontSize: fontes.legenda, color: cores.textoSuave },
  conteudo: { gap: 4, paddingVertical: 6 },
  trilho: { height: 10, borderRadius: 5, backgroundColor: cores.atencaoFundo, overflow: "hidden" },
  preenchido: { height: "100%", backgroundColor: cores.primaria },
  aviso: { fontSize: 14, color: cores.textoSuave, textAlign: "center" },
});
