/**
 * Renderiza qualquer atividade conforme o TipoAtividade (RF04–RF11).
 * Usado pelo nivelamento e pelas atividades do dia a dia.
 * Figma: "Reconhecimento" (LETRA), "Sílabas" (SILABA), "Atividade · Formar palavra" (PALAVRA),
 * "Atividade · Ler frase" (FRASE). ESCRITA e INTERPRETACAO seguem o mesmo estilo (sem frame ainda).
 *
 * O app não sabe a resposta certa: só envia a resposta dada (onResponder) e o servidor corrige.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AlternativaDoAluno, AtividadeDoAluno } from "@/domain/modelos";
import { cores, fontes, raios, toqueMinimo } from "@/theme/tokens";
import { Botao } from "./Botao";
import { BotaoAudio } from "./BotaoAudio";
import { Campo } from "./Campo";

interface Props {
  atividade: AtividadeDoAluno;
  onResponder: (respostaDada: string) => void;
  /** Enquanto o servidor corrige: bloqueia novos toques. */
  ocupado?: boolean;
  /** Algo entre o "Ouvir instrução" e a atividade (ex.: "Pergunta 2 de 5" no nivelamento). */
  cabecalho?: ReactNode;
}

export function AtividadeView({ atividade, onResponder, ocupado = false, cabecalho }: Props) {
  const alternativas = [...atividade.alternativas].sort((a, b) => a.ordem - b.ordem);
  const props = { atividade, alternativas, onResponder, ocupado };

  return (
    <View style={styles.raiz}>
      <BotaoAudio titulo="Ouvir instrução" texto={textoNarrado(atividade, alternativas)} />
      {cabecalho}
      {atividade.tipo === "LETRA" ? <Letra {...props} /> : null}
      {atividade.tipo === "SILABA" ? <Silaba {...props} /> : null}
      {atividade.tipo === "PALAVRA" ? <MontarPalavra {...props} /> : null}
      {atividade.tipo === "FRASE" ? <ComTexto {...props} tituloAudio="Ouvir frase" /> : null}
      {atividade.tipo === "INTERPRETACAO" ? <ComTexto {...props} tituloAudio="Ouvir texto" /> : null}
      {atividade.tipo === "ESCRITA" ? <Escrita {...props} /> : null}
      {ocupado ? (
        <Text style={styles.aguarde} accessibilityLiveRegion="polite">
          Conferindo sua resposta...
        </Text>
      ) : null}
    </View>
  );
}

/** O que o "Ouvir instrução" fala: o enunciado e, se houver, as opções (para quem ainda não lê). */
function textoNarrado(atividade: AtividadeDoAluno, alternativas: AlternativaDoAluno[]): string {
  const opcoes = alternativas.map((a) => a.texto);
  switch (atividade.tipo) {
    case "PALAVRA":
      return `${atividade.enunciado} para formar a palavra ${atividade.textoApoio ?? ""}. Toque nas sílabas na ordem certa.`;
    case "ESCRITA":
      return `${atividade.enunciado}. Depois, toque em Confirmar.`;
    case "FRASE":
    case "INTERPRETACAO":
      return `${atividade.textoApoio ?? ""} ${atividade.enunciado} As opções são: ${juntar(opcoes)}.`;
    default:
      return `${atividade.enunciado} As opções são: ${juntar(opcoes)}.`;
  }
}

function juntar(lista: string[]): string {
  return lista.length <= 1 ? lista.join("") : `${lista.slice(0, -1).join(", ")} ou ${lista[lista.length - 1]}`;
}

interface PropsTipo {
  atividade: AtividadeDoAluno;
  alternativas: AlternativaDoAluno[];
  onResponder: (respostaDada: string) => void;
  ocupado: boolean;
}

function Enunciado({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.enunciado}>
      {children}
    </Text>
  );
}

// LETRA (Figma "Reconhecimento"): enunciado, a letra bem grande e alternativas com imagem.
function Letra({ atividade, alternativas, onResponder, ocupado }: PropsTipo) {
  // conteudo padronizado "Letra B" → "B"
  const letra = atividade.conteudo.replace(/^Letra\s+/i, "").trim();
  return (
    <>
      <Enunciado>{atividade.enunciado}</Enunciado>
      {letra.length <= 2 ? (
        <Text style={styles.letra} accessibilityLabel={`Letra ${letra}`}>
          {letra}
        </Text>
      ) : null}
      <ListaOpcoes alternativas={alternativas} onEscolher={onResponder} ocupado={ocupado} />
    </>
  );
}

// SILABA (Figma "Sílabas"): palavra em destaque, enunciado e sílabas grandes.
function Silaba({ atividade, alternativas, onResponder, ocupado }: PropsTipo) {
  return (
    <>
      {atividade.textoApoio ? <PalavraDestaque palavra={atividade.textoApoio} /> : null}
      <Enunciado>{atividade.enunciado}</Enunciado>
      <View style={styles.coluna}>
        {alternativas.map((alt) => (
          <Peca
            key={alt.idAlternativa}
            texto={alt.texto}
            rotulo={`Sílaba ${alt.texto}`}
            onPress={() => onResponder(alt.texto)}
            ocupado={ocupado}
            larga
          />
        ))}
      </View>
    </>
  );
}

// PALAVRA (Figma "Formar palavra"): toque nas sílabas para montar a palavra; "Apagar" tira a última.
function MontarPalavra({ atividade, alternativas, onResponder, ocupado }: PropsTipo) {
  const [usadas, setUsadas] = useState<number[]>([]); // idAlternativa, na ordem tocada
  const montada = usadas.map((id) => alternativas.find((a) => a.idAlternativa === id)?.texto ?? "");
  const disponiveis = alternativas.filter((a) => !usadas.includes(a.idAlternativa));

  return (
    <>
      {atividade.textoApoio ? <PalavraDestaque palavra={atividade.textoApoio} /> : null}
      <Enunciado>{atividade.enunciado}</Enunciado>

      <View
        style={styles.linha}
        accessible
        accessibilityLabel={montada.length ? `Sua palavra: ${montada.join(", ")}` : "Sua palavra ainda está vazia"}
      >
        {montada.map((texto, i) => (
          <View key={`${texto}-${i}`} style={[styles.peca, styles.pecaMontada]}>
            <Text style={styles.textoPeca}>{texto}</Text>
          </View>
        ))}
        {disponiveis.length > 0 ? (
          <View style={[styles.peca, styles.espacoVazio]}>
            <Text style={styles.textoPeca}>?</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.linha}>
        {disponiveis.map((alt) => (
          <Peca
            key={alt.idAlternativa}
            texto={alt.texto}
            rotulo={`Sílaba ${alt.texto}`}
            onPress={() => setUsadas([...usadas, alt.idAlternativa])}
            ocupado={ocupado}
          />
        ))}
      </View>

      <View style={styles.acoes}>
        <View style={styles.acao}>
          <Botao
            titulo="Apagar"
            variante="secundario"
            desabilitado={ocupado || usadas.length === 0}
            rotuloAcessivel="Apagar a última sílaba"
            onPress={() => setUsadas(usadas.slice(0, -1))}
          />
        </View>
        <View style={styles.acao}>
          <Botao
            titulo="Confirmar"
            desabilitado={ocupado || usadas.length === 0}
            onPress={() => onResponder(montada.join(""))}
          />
        </View>
      </View>
    </>
  );
}

// FRASE (Figma "Ler frase") e INTERPRETACAO: o texto fica visível durante a pergunta,
// com botão próprio para ouvir só o texto.
function ComTexto({ atividade, alternativas, onResponder, ocupado, tituloAudio }: PropsTipo & { tituloAudio: string }) {
  return (
    <>
      {atividade.textoApoio ? (
        <View style={styles.cartaoTexto}>
          <Text style={atividade.tipo === "FRASE" ? styles.frase : styles.texto}>{atividade.textoApoio}</Text>
          <BotaoAudio titulo={tituloAudio} texto={atividade.textoApoio} />
        </View>
      ) : null}
      <Enunciado>{atividade.enunciado}</Enunciado>
      <ListaOpcoes alternativas={alternativas} onEscolher={onResponder} ocupado={ocupado} />
    </>
  );
}

// ESCRITA: campo de texto; o servidor aceita maiúsculas/minúsculas e com ou sem acento.
function Escrita({ atividade, onResponder, ocupado }: PropsTipo) {
  const [escrita, setEscrita] = useState("");
  return (
    <>
      <Enunciado>{atividade.enunciado}</Enunciado>
      <Campo
        rotulo="Sua resposta"
        placeholder="Escreva aqui"
        autoCapitalize="characters"
        autoCorrect={false}
        value={escrita}
        onChangeText={setEscrita}
        editable={!ocupado}
      />
      <Botao titulo="Confirmar" desabilitado={ocupado || !escrita.trim()} onPress={() => onResponder(escrita)} />
    </>
  );
}

function PalavraDestaque({ palavra }: { palavra: string }) {
  // TODO (passo 8): foto/ilustração da palavra (Figma mostra a imagem acima da palavra).
  return (
    <View style={styles.cartaoPalavra}>
      <Text style={styles.palavra}>{palavra}</Text>
    </View>
  );
}

/** Alternativas em lista: imagem (se houver) + texto grande. */
function ListaOpcoes({
  alternativas,
  onEscolher,
  ocupado,
}: {
  alternativas: AlternativaDoAluno[];
  onEscolher: (texto: string) => void;
  ocupado: boolean;
}) {
  return (
    <View style={styles.coluna}>
      {alternativas.map((alt) => (
        <Pressable
          key={alt.idAlternativa}
          accessibilityRole="button"
          accessibilityLabel={alt.texto}
          accessibilityState={{ disabled: ocupado }}
          disabled={ocupado}
          onPress={() => onEscolher(alt.texto)}
          style={({ pressed }) => [styles.alternativa, (pressed || ocupado) && styles.apertado]}
        >
          {alt.ilustracao && alt.ilustracao in MaterialCommunityIcons.glyphMap ? (
            <View style={styles.ilustracao} importantForAccessibility="no" accessibilityElementsHidden>
              {/* TODO (passo 8): trocar o ícone provisório pela imagem (alt.urlImagem). */}
              <MaterialCommunityIcons
                name={alt.ilustracao as keyof typeof MaterialCommunityIcons.glyphMap}
                size={fontes.ilustracao}
                color={cores.primaria}
              />
            </View>
          ) : null}
          <Text style={styles.textoAlternativa}>{alt.texto}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Peça grande de sílaba (tocável). */
function Peca({
  texto,
  rotulo,
  onPress,
  ocupado,
  larga = false,
}: {
  texto: string;
  rotulo: string;
  onPress: () => void;
  ocupado: boolean;
  larga?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: ocupado }}
      disabled={ocupado}
      onPress={onPress}
      style={({ pressed }) => [styles.peca, larga && styles.pecaLarga, (pressed || ocupado) && styles.apertado]}
    >
      <Text style={styles.textoPeca}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 20 },
  coluna: { gap: 12 },
  linha: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  acoes: { flexDirection: "row", gap: 12 },
  acao: { flex: 1 },
  apertado: { opacity: 0.7 },
  aguarde: { fontSize: fontes.corpo, color: cores.textoSuave, textAlign: "center", fontWeight: "600" },
  enunciado: { fontSize: fontes.titulo, fontWeight: "700", color: cores.texto, textAlign: "center" },
  letra: { fontSize: fontes.letraAtividade, fontWeight: "900", color: cores.primaria, textAlign: "center" },
  cartaoPalavra: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: raios.lg,
    backgroundColor: cores.superficieSuave,
  },
  palavra: { fontSize: fontes.palavraDestaque, fontWeight: "900", color: cores.primaria, letterSpacing: 2 },
  cartaoTexto: {
    gap: 16,
    padding: 20,
    borderRadius: raios.lg,
    borderWidth: 2,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  frase: { fontSize: fontes.titulo, fontWeight: "700", color: cores.texto, textAlign: "center" },
  texto: { fontSize: fontes.subtitulo, color: cores.texto, lineHeight: 32 },
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
  peca: {
    minWidth: 96,
    minHeight: toqueMinimo + 32,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: cores.primaria,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
  },
  pecaLarga: { alignSelf: "stretch" },
  pecaMontada: { backgroundColor: cores.superficieSuave },
  espacoVazio: { borderStyle: "dashed", backgroundColor: "transparent" },
  textoPeca: { fontSize: fontes.silaba, fontWeight: "800", color: cores.texto },
});
