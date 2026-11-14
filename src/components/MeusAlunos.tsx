// "Meus alunos" do acompanhante (Passo 3.1): convidar aluno pelo usuário, e-mail ou telefone,
// ver a situação de cada convite e desfazer. Usado em /professor/alunos e /responsavel.
// O nome do aluno só aparece depois que ele aceita (o servidor não manda antes).
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StatusVinculo } from "@/domain/modelos";
import { useCarregar } from "@/hooks/useCarregar";
import { mensagemDeErro } from "@/services/api";
import { convidarAluno, desfazerVinculo, listarMeusAlunos, type VinculoDoAcompanhante } from "@/services/vinculos";
import { cores, fontes } from "@/theme/tokens";
import { Botao } from "./Botao";
import { Campo } from "./Campo";
import { Aviso, Cartao, Corpo, Subtitulo } from "./Textos";

const rotuloStatus: Record<StatusVinculo, string> = {
  PENDENTE: "Esperando o aluno aceitar",
  ACEITO: "Acompanhando",
  RECUSADO: "O aluno recusou o convite",
};

export function MeusAlunos() {
  const [versao, setVersao] = useState(0);
  const estado = useCarregar(listarMeusAlunos, versao);
  const [aluno, setAluno] = useState("");
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const recarregar = () => setVersao((v) => v + 1);

  async function aoConvidar() {
    setAviso(null);
    setEnviando(true);
    try {
      await convidarAluno(aluno);
      setAluno("");
      setAviso({ texto: "Convite enviado. O aluno aceita no aplicativo, em Minha conta.", tipo: "sucesso" });
      recarregar();
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setEnviando(false);
    }
  }

  async function aoDesfazer(v: VinculoDoAcompanhante) {
    setAviso(null);
    try {
      setAviso({ texto: await desfazerVinculo(v.idVinculo), tipo: "sucesso" });
      recarregar();
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    }
  }

  if (estado.erro) {
    return (
      <>
        <Aviso>{estado.erro}</Aviso>
        <Botao titulo="Tentar de novo" variante="secundario" onPress={estado.tentarDeNovo} />
      </>
    );
  }
  if (!estado.dados) return <Corpo>Carregando...</Corpo>;

  const { vinculos, limite } = estado.dados;
  const ocupados = vinculos.filter((v) => v.status !== "RECUSADO").length;
  const podeConvidar = limite === null || ocupados < limite;

  return (
    <>
      {limite !== null ? (
        <Corpo>
          Você acompanha {ocupados} de {limite} pessoas.
        </Corpo>
      ) : null}

      {podeConvidar ? (
        <Cartao destaque>
          <Subtitulo>Convidar aluno</Subtitulo>
          <Campo
            rotulo="Usuário, e-mail ou telefone do aluno"
            placeholder="Exemplo: maria.silva"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            value={aluno}
            onChangeText={setAluno}
            onSubmitEditing={aoConvidar}
          />
          <Botao titulo={enviando ? "Enviando..." : "Enviar convite"} desabilitado={enviando} onPress={aoConvidar} />
        </Cartao>
      ) : (
        <Corpo>Você já acompanha o máximo de pessoas. Para convidar outra, desfaça um acompanhamento.</Corpo>
      )}

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {vinculos.length === 0 ? <Corpo>Você ainda não convidou nenhum aluno.</Corpo> : null}
      {vinculos.map((v) => {
        const nome = v.aluno?.nome ?? v.identificadorConvite ?? "Convite";
        return (
          <Cartao key={v.idVinculo}>
            <Text style={styles.nome}>{nome}</Text>
            <View style={styles.linha}>
              <Text style={[styles.status, v.status === "ACEITO" && { color: cores.sucesso }]}>{rotuloStatus[v.status]}</Text>
            </View>
            <Botao
              titulo={v.status === "PENDENTE" ? "Cancelar convite" : "Desfazer"}
              variante="secundario"
              rotuloAcessivel={`${v.status === "PENDENTE" ? "Cancelar convite de" : "Desfazer acompanhamento de"} ${nome}`}
              onPress={() => aoDesfazer(v)}
            />
          </Cartao>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  nome: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
  status: { fontSize: fontes.corpo, color: cores.textoSuave, fontWeight: "600" },
});
