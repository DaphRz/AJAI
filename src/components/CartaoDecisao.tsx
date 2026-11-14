// Cartão com "Aprovar" e "Recusar" (o recusar pede um motivo curto). Usado pelo administrador
// (instituições) e pela instituição (professores). Passo 3.1.
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { mensagemDeErro } from "@/services/api";
import type { Decisao } from "@/services/instituicoes";
import { Botao } from "./Botao";
import { Campo } from "./Campo";
import { Aviso, Cartao } from "./Textos";

interface Props {
  /** Nome de quem está sendo decidido (para o leitor de tela: "Aprovar Escola X"). */
  nome: string;
  children: ReactNode;
  /** Faz a decisão na API. Depois, a tela recarrega a lista. */
  decidir: (decisao: Decisao, motivo?: string) => Promise<void>;
}

export function CartaoDecisao({ nome, children, decidir }: Props) {
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(decisao: Decisao) {
    setErro(null);
    setEnviando(true);
    try {
      await decidir(decisao, decisao === "RECUSAR" ? motivo : undefined);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <Cartao>
      {children}
      {recusando ? (
        <>
          <Campo
            rotulo="Motivo da recusa"
            placeholder="Exemplo: dados não conferem"
            value={motivo}
            onChangeText={setMotivo}
            maxLength={200}
          />
          <View style={styles.botoes}>
            <Botao
              titulo={enviando ? "Enviando..." : "Confirmar recusa"}
              rotuloAcessivel={`Confirmar recusa de ${nome}`}
              desabilitado={enviando}
              onPress={() => enviar("RECUSAR")}
            />
            <Botao titulo="Voltar" variante="secundario" onPress={() => setRecusando(false)} />
          </View>
        </>
      ) : (
        <View style={styles.botoes}>
          <Botao
            titulo={enviando ? "Enviando..." : "Aprovar"}
            rotuloAcessivel={`Aprovar ${nome}`}
            desabilitado={enviando}
            onPress={() => enviar("APROVAR")}
          />
          <Botao titulo="Recusar" rotuloAcessivel={`Recusar ${nome}`} variante="secundario" onPress={() => setRecusando(true)} />
        </View>
      )}
      {erro ? <Aviso>{erro}</Aviso> : null}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  botoes: { gap: 8, marginTop: 8 },
});
