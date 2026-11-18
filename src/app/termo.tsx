// Termo de uso e privacidade (passo 12, RNF11, RNF12, LGPD). Sem tela no Figma: segue o padrão
// das telas desenhadas. Abre sem login (pelos cadastros). Cada parte tem o próprio "Ouvir"
// (a narração do servidor aceita até 800 letras por vez). Texto em src/services/termo.ts.
import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useEstilos } from "@/context/preferencias";
import { RESUMO_TERMO, TERMO, textoDaSecao, VERSAO_TERMO } from "@/services/termo";
import { cores, familias, type Fontes } from "@/theme/tokens";

/** "2026-11-18" → "18/11/2026" */
function dataBrasil(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function Termo() {
  const styles = useEstilos(criarEstilos);
  return (
    <Tela rodape={<BotaoAudio titulo="Ouvir o resumo" texto={RESUMO_TERMO} />}>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Logo />
      <Titulo>Termo de uso e privacidade</Titulo>
      <Subtitulo>Versão de {dataBrasil(VERSAO_TERMO)}</Subtitulo>
      {TERMO.map((secao) => (
        <Cartao key={secao.titulo}>
          <Text style={styles.tituloSecao} accessibilityRole="header">
            {secao.titulo}
          </Text>
          {secao.frases.map((frase) => (
            <Corpo key={frase}>{frase}</Corpo>
          ))}
          <BotaoAudio titulo={`Ouvir: ${secao.titulo}`} texto={textoDaSecao(secao)} />
        </Cartao>
      ))}
      <Botao titulo="Voltar" onPress={() => router.back()} />
    </Tela>
  );
}

const criarEstilos = (fontes: Fontes) =>
  StyleSheet.create({
    tituloSecao: { fontSize: fontes.subtitulo, fontFamily: familias.negrito, color: cores.texto },
  });
