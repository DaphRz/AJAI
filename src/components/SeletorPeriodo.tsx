// Seletor de período da área do professor (passo 8): Últimos 7 dias / 30 dias / personalizado.
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { diaCompleto, lerDataBrasileira, ultimosDias, type Periodo } from "@/services/relatorios";
import { espacos } from "@/theme/tokens";
import { Botao } from "./Botao";
import { Campo } from "./Campo";
import { Opcao } from "./Opcao";
import { Aviso, Corpo } from "./Textos";

type Escolha = "7" | "30" | "personalizado";

interface Props {
  periodo: Periodo;
  aoMudar: (periodo: Periodo) => void;
}

export function SeletorPeriodo({ periodo, aoMudar }: Props) {
  const [escolha, setEscolha] = useState<Escolha>("7");
  const [de, setDe] = useState(diaCompleto(periodo.inicio));
  const [ate, setAte] = useState(diaCompleto(periodo.fim));
  const [aviso, setAviso] = useState<string | null>(null);

  function escolher(nova: Escolha) {
    setEscolha(nova);
    setAviso(null);
    if (nova !== "personalizado") aoMudar(ultimosDias(Number(nova)));
  }

  function aplicar() {
    const inicio = lerDataBrasileira(de);
    const fim = lerDataBrasileira(ate);
    if (!inicio || !fim) return setAviso("Escreva as datas assim: 01/11/2026.");
    if (inicio > fim) return setAviso("A data de início precisa vir antes da data de fim.");
    setAviso(null);
    aoMudar({ inicio, fim });
  }

  return (
    <View style={styles.grupo}>
      <View style={styles.linha} accessibilityRole="radiogroup" accessibilityLabel="Período">
        <Opcao texto="Últimos 7 dias" ativo={escolha === "7"} onPress={() => escolher("7")} />
        <Opcao texto="30 dias" rotuloAcessivel="Últimos 30 dias" ativo={escolha === "30"} onPress={() => escolher("30")} />
        <Opcao texto="Escolher datas" ativo={escolha === "personalizado"} onPress={() => escolher("personalizado")} />
      </View>
      {escolha === "personalizado" ? (
        <>
          <Campo rotulo="De (dia/mês/ano)" placeholder="01/11/2026" value={de} onChangeText={setDe} keyboardType="numbers-and-punctuation" />
          <Campo rotulo="Até (dia/mês/ano)" placeholder="14/11/2026" value={ate} onChangeText={setAte} keyboardType="numbers-and-punctuation" />
          <Botao titulo="Ver este período" variante="secundario" onPress={aplicar} />
          {aviso ? <Aviso>{aviso}</Aviso> : null}
        </>
      ) : null}
      <Corpo>
        De {diaCompleto(periodo.inicio)} até {diaCompleto(periodo.fim)}
      </Corpo>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: espacos.sm },
  linha: { flexDirection: "row", flexWrap: "wrap", gap: espacos.sm },
});
