// Figma: "AJAI · Métricas de Ana Souza"  |  RF21 – Professor.VisualizarRelatorioAluno (passo 8)
// Dados de GET /professor/alunos/:id (só aluno com vínculo ACEITO): resumo do período, gráfico de
// evolução (taxa de acerto por dia), histórico de níveis, acertos por conteúdo e as respostas
// recentes com a correção manual (Resposta.EditarCorrecao, APF 35).
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, Campo, Cartao, Corpo, GraficoBarras, SeletorPeriodo, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import { mensagemDeErro } from "@/services/api";
import {
  AVISO_COMPLEMENTA,
  corrigirResposta,
  diaCompleto,
  diaCurto,
  rotuloSituacao,
  ultimosDias,
  visualizarRelatorioAluno,
  type RelatorioAluno,
  type RespostaParaCorrigir,
} from "@/services/relatorios";
import { familias, cores, fontes, raios } from "@/theme/tokens";

/** Respostas mostradas antes de "Ver mais respostas". */
const RESPOSTAS_INICIAIS = 5;

const pct = (taxa: number) => `${Math.round(taxa * 100)}%`;

export default function MetricasAluno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idAluno = Number(id);
  const [periodo, setPeriodo] = useState(() => ultimosDias(7));
  const [versao, recarregar] = useVersaoAoFocar();
  const estado = useCarregar(
    () => visualizarRelatorioAluno(idAluno, periodo),
    `${idAluno}|${periodo.inicio}|${periodo.fim}|${versao}`,
    { manterAnterior: true },
  );

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : (
        <Conteudo dados={estado.dados} periodo={periodo} aoMudarPeriodo={setPeriodo} aoCorrigir={recarregar} />
      )}
    </Tela>
  );
}

function Conteudo({
  dados,
  periodo,
  aoMudarPeriodo,
  aoCorrigir,
}: {
  dados: RelatorioAluno;
  periodo: { inicio: string; fim: string };
  aoMudarPeriodo: (p: { inicio: string; fim: string }) => void;
  aoCorrigir: () => void;
}) {
  const [verTodas, setVerTodas] = useState(false);
  const { resumo } = dados;
  const diasComAtividade = dados.serie.filter((p) => p.taxaAcerto !== null);
  const descricaoGrafico =
    diasComAtividade.length === 0
      ? "Gráfico de evolução: nenhuma atividade no período."
      : `Gráfico de evolução da taxa de acerto por dia. ${diasComAtividade
          .map((p) => `${diaCurto(p.dia)}: ${pct(p.taxaAcerto!)} em ${p.atividades} atividades`)
          .join(". ")}.`;
  const respostas = verTodas ? dados.respostas : dados.respostas.slice(0, RESPOSTAS_INICIAIS);

  return (
    <>
      <Titulo>{dados.aluno.nome}</Titulo>
      <Subtitulo>
        {dados.nivel ? `Etapa ${dados.nivel.ordem}: ${dados.nivel.nome}` : "Ainda não fez as perguntas do começo"}
        {dados.turma ? ` · ${dados.turma.nome}` : ""}
      </Subtitulo>
      <SeletorPeriodo periodo={periodo} aoMudar={aoMudarPeriodo} />

      <Cartao>
        <Text style={styles.rotulo}>Situação</Text>
        <Text style={styles.valor}>{rotuloSituacao[resumo.situacao]}</Text>
        <Text style={styles.rotulo}>Frequência</Text>
        <Text style={styles.valor}>
          {resumo.diasAtivos}/{dados.periodo.dias} dias
        </Text>
        <Text style={styles.rotulo}>Atividades realizadas</Text>
        <Text style={styles.valor}>{resumo.totalAtividades}</Text>
        <Text style={styles.rotulo}>Taxa de acerto / erro</Text>
        <Text style={styles.valor}>
          {resumo.totalAtividades === 0 ? "–" : `${pct(resumo.taxaAcerto)} / ${pct(1 - resumo.taxaAcerto)}`}
        </Text>
      </Cartao>

      <Cartao>
        <Text style={styles.rotulo}>Evolução: taxa de acerto por dia</Text>
        <GraficoBarras
          descricao={descricaoGrafico}
          barras={dados.serie.map((p) => ({
            rotulo: diaCurto(p.dia),
            valor: p.taxaAcerto,
            texto: p.taxaAcerto === null ? "" : pct(p.taxaAcerto),
          }))}
        />
        <Text style={styles.legenda}>Em cima de cada barra: a taxa de acerto do dia. Barra cinza: dia sem atividade.</Text>
      </Cartao>

      <Cartao>
        <Text style={styles.rotulo}>Histórico de etapas</Text>
        {dados.historicoNiveis.length === 0 ? <Corpo>Ainda sem etapa.</Corpo> : null}
        {dados.historicoNiveis.map((h, i) => (
          <Text key={`${h.idNivel}-${h.dataMudanca}`} style={styles.item}>
            {diaCompleto(h.dataMudanca)}: {i === 0 ? "começou na" : "passou para a"} etapa {h.ordem} ({h.nome})
          </Text>
        ))}
      </Cartao>

      <Cartao>
        <Text style={styles.rotulo}>Acertos por conteúdo (pior primeiro)</Text>
        {dados.dificuldades.length === 0 ? <Corpo>Nenhuma atividade no período.</Corpo> : null}
        {dados.dificuldades.map((d) => (
          <Text key={d.conteudo} style={styles.item}>
            {d.conteudo}: {pct(d.taxaAcerto)} ({d.erros} erros em {d.tentativas})
          </Text>
        ))}
      </Cartao>

      <Subtitulo>Respostas recentes</Subtitulo>
      <Corpo>Se a correção automática não foi justa, você pode mudar.</Corpo>
      {dados.respostas.length === 0 ? <Corpo>Nenhuma resposta no período.</Corpo> : null}
      {respostas.map((r) => (
        <CartaoResposta key={r.idResposta} resposta={r} aoCorrigir={aoCorrigir} />
      ))}
      {!verTodas && dados.respostas.length > RESPOSTAS_INICIAIS ? (
        <Botao titulo="Ver mais respostas" variante="secundario" onPress={() => setVerTodas(true)} />
      ) : null}

      <Text style={styles.aviso}>{AVISO_COMPLEMENTA}</Text>
    </>
  );
}

function CartaoResposta({ resposta: r, aoCorrigir }: { resposta: RespostaParaCorrigir; aoCorrigir: () => void }) {
  const [abrindo, setAbrindo] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const novaCorreta = !r.correta;

  async function confirmar() {
    setAviso(null);
    setEnviando(true);
    try {
      await corrigirResposta(r.idResposta, novaCorreta, observacao);
      setAbrindo(false);
      setObservacao("");
      aoCorrigir();
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao>
      <Text style={styles.legenda}>
        {diaCompleto(r.dataHora)} · {r.conteudo}
      </Text>
      <Text style={styles.item}>{r.enunciado}</Text>
      <Text style={styles.item}>Resposta do aluno: {r.respostaDada}</Text>
      <Text style={styles.item}>Resposta esperada: {r.respostaEsperada}</Text>
      <View style={[styles.selo, r.correta ? styles.seloCerta : styles.seloErrada]}>
        <Text style={[styles.seloTexto, { color: r.correta ? cores.sucesso : cores.atencaoTexto }]}>
          {r.correta ? "Acertou" : "Não acertou"}
        </Text>
      </View>
      {r.correcaoProfessor ? <Text style={styles.legenda}>Sua correção: {r.correcaoProfessor}</Text> : null}
      {abrindo ? (
        <>
          <Campo
            rotulo="Observação (opcional)"
            placeholder="Exemplo: escreveu certo, só faltou o acento"
            value={observacao}
            onChangeText={setObservacao}
            maxLength={200}
          />
          <Botao
            titulo={enviando ? "Salvando..." : novaCorreta ? "Confirmar: considerar certa" : "Confirmar: considerar errada"}
            desabilitado={enviando}
            onPress={confirmar}
          />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setAbrindo(false)} />
        </>
      ) : (
        <Botao
          titulo={novaCorreta ? "Considerar certa" : "Considerar errada"}
          variante="secundario"
          rotuloAcessivel={`${novaCorreta ? "Considerar certa" : "Considerar errada"} a resposta ${r.respostaDada}`}
          onPress={() => setAbrindo(true)}
        />
      )}
      {aviso ? <Aviso>{aviso}</Aviso> : null}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontSize: fontes.legenda, color: cores.textoSuave, fontFamily: familias.seminegrito },
  valor: { fontSize: fontes.titulo, fontFamily: familias.extranegrito, color: cores.primaria },
  item: { fontFamily: familias.regular, fontSize: fontes.corpo, color: cores.texto },
  legenda: { fontFamily: familias.regular, fontSize: fontes.legenda, color: cores.textoSuave },
  aviso: { fontFamily: familias.regular, fontSize: fontes.legenda, color: cores.textoSuave, textAlign: "center" },
  selo: { alignSelf: "flex-start", borderRadius: raios.md, paddingHorizontal: 10, paddingVertical: 4 },
  seloCerta: { backgroundColor: cores.superficieSuave },
  seloErrada: { backgroundColor: cores.atencaoFundo },
  seloTexto: { fontSize: fontes.legenda, fontFamily: familias.negrito },
});
