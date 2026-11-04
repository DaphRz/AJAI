/**
 * Renderiza qualquer Atividade conforme o TipoAtividade.
 * Usado pelo nivelamento e pelas atividades do dia a dia.
 * Figma: "Reconhecimento", "Sílabas", "Atividade · Formar palavra", "Atividade · Ler frase".
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Atividade } from "@/domain/modelos";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";
import { Botao } from "./Botao";
import { BotaoAudio } from "./BotaoAudio";
import { Campo } from "./Campo";

interface Props {
  atividade: Atividade;
  onResponder: (respostaDada: string) => void;
}

export function AtividadeView({ atividade, onResponder }: Props) {
  const [escrita, setEscrita] = useState("");
  const alternativas = [...atividade.alternativas].sort((a, b) => a.ordem - b.ordem);
  const letraDestaque = atividade.tipo === "LETRA" ? atividade.conteudo.slice(-1) : null;

  return (
    <View style={styles.raiz}>
      <BotaoAudio titulo="Ouvir instrução" texto={atividade.enunciado} />

      <Text accessibilityRole="header" style={styles.enunciado}>
        {atividade.enunciado}
      </Text>

      {letraDestaque ? <Text style={styles.letra}>{letraDestaque}</Text> : null}

      {atividade.tipo === "ESCRITA" ? (
        <View style={{ gap: 16 }}>
          <Campo
            rotulo="Sua resposta"
            placeholder="Escreva aqui"
            autoCapitalize="characters"
            value={escrita}
            onChangeText={setEscrita}
          />
          <Botao titulo="Confirmar" desabilitado={!escrita.trim()} onPress={() => onResponder(escrita)} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {alternativas.map((alt) => (
            <Pressable
              key={alt.idAlternativa}
              accessibilityRole="button"
              accessibilityLabel={alt.texto}
              onPress={() => onResponder(alt.texto)}
              style={({ pressed }) => [styles.alternativa, pressed && { opacity: 0.7 }]}
            >
              {alt.ilustracao ? (
                <View style={styles.ilustracao}>
                  <Text style={{ fontSize: 44 }}>{alt.ilustracao}</Text>
                </View>
              ) : null}
              <Text style={styles.textoAlternativa}>{alt.texto}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 20 },
  enunciado: { fontSize: fontes.titulo, fontWeight: "700", color: cores.texto, textAlign: "center" },
  letra: { fontSize: fontes.letraAtividade, fontWeight: "900", color: cores.primaria, textAlign: "center" },
  alternativa: {
    minHeight: toqueMinimo + 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: cores.primaria,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
  },
  ilustracao: {
    width: 80,
    height: 80,
    borderRadius: raios.md,
    backgroundColor: cores.superficieSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  textoAlternativa: { fontSize: fontes.titulo, fontWeight: "700", color: cores.texto, flexShrink: 1 },
});
