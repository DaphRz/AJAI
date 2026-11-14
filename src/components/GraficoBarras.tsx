// Gráfico de barras simples, só com View (sem biblioteca). Passo 8: evolução da taxa de acerto
// por dia (métricas do aluno) e atividades por dia (relatórios).
// Cada barra mostra o número EM CIMA (ex.: "60%" ou "3") e o dia embaixo. Com muitos dias, as barras
// ficam com largura fixa e o gráfico rola para o lado, para os números não ficarem espremidos.
import { useRef } from "react";
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { cores, fontes, raios } from "@/theme/tokens";

export interface Barra {
  /** Texto embaixo da barra (ex.: "14/11"). */
  rotulo: string;
  /** Altura de 0 a 1; null = sem dado (barra cinza baixinha). */
  valor: number | null;
  /** Número escrito em cima da barra (ex.: "60%", "3"). Vazio = nada escrito. */
  texto?: string;
}

interface Props {
  barras: Barra[];
  /** Lido pelo leitor de tela no lugar do desenho (resuma o que o gráfico mostra). */
  descricao: string;
  altura?: number;
}

/** Até quantas barras cabem dividindo a largura da tela; acima disso, rola para o lado. */
const MAXIMO_SEM_ROLAR = 10;
const LARGURA_FIXA = 44;

export function GraficoBarras({ barras, descricao, altura = 140 }: Props) {
  const rola = barras.length > MAXIMO_SEM_ROLAR;
  const rolagem = useRef<ScrollViewInstance>(null);
  const colunas = (
    <View style={[styles.colunas, rola && { width: barras.length * (LARGURA_FIXA + 4) }]}>
      {barras.map((b, i) => (
        <View key={`${b.rotulo}-${i}`} style={rola ? { width: LARGURA_FIXA } : styles.colunaFlex}>
          <View style={[styles.area, { height: altura + 24 }]}>
            <Text style={styles.numero} numberOfLines={1}>
              {b.texto ?? ""}
            </Text>
            <View
              style={[
                styles.barra,
                b.valor === null
                  ? { height: 4, backgroundColor: cores.borda }
                  : { height: Math.max(4, Math.round(b.valor * altura)), backgroundColor: cores.primaria },
              ]}
            />
          </View>
          <Text style={styles.rotulo} numberOfLines={1}>
            {b.rotulo}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao}>
      {rola ? (
        <ScrollView
          ref={rolagem}
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={{ paddingBottom: 6 }}
          // Abre nos dias mais recentes (o fim do período).
          onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: false })}
        >
          {colunas}
        </ScrollView>
      ) : (
        colunas
      )}
      {rola ? <Text style={styles.dica}>Os dias mais recentes estão à direita. Arraste para ver os dias anteriores.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  colunas: { flexDirection: "row", gap: 4 },
  colunaFlex: { flex: 1 },
  area: { justifyContent: "flex-end", alignItems: "stretch", borderBottomWidth: 2, borderColor: cores.borda },
  numero: { fontSize: 13, fontWeight: "800", color: cores.texto, textAlign: "center", marginBottom: 2 },
  barra: { borderTopLeftRadius: raios.md / 3, borderTopRightRadius: raios.md / 3, marginHorizontal: 2 },
  rotulo: { fontSize: 12, color: cores.textoSuave, textAlign: "center", marginTop: 4 },
  dica: { fontSize: fontes.legenda, color: cores.textoSuave, marginTop: 4 },
});
