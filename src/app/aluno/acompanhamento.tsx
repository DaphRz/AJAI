// Aluno › Quem me acompanha (Passo 3.1). Convites de professor ou responsável (Aceitar / Recusar)
// e quem já acompanha (Desfazer). Só depois do aceite a pessoa vê o progresso do aluno.
// Sem tela no Figma (a desenhar no passo 11).
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Aviso, Botao, BotaoAudio, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { mensagemDeErro } from "@/services/api";
import {
  descreverAcompanhante,
  desfazerVinculoDoAluno,
  listarConvitesDoAluno,
  responderConvite,
} from "@/services/vinculos";
import { cores, fontes } from "@/theme/tokens";

export default function Acompanhamento() {
  const [versao, setVersao] = useState(0);
  const estado = useCarregar(listarConvitesDoAluno, versao);
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function agir(acao: () => Promise<string>) {
    setAviso(null);
    setEnviando(true);
    try {
      setAviso({ texto: await acao(), tipo: "sucesso" });
      setVersao((v) => v + 1);
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setEnviando(false);
    }
  }

  const convites = estado.dados?.filter((v) => v.status === "PENDENTE") ?? [];
  const aceitos = estado.dados?.filter((v) => v.status === "ACEITO") ?? [];

  const textoAudio = [
    convites.length > 0
      ? `Você tem ${convites.length} convite${convites.length > 1 ? "s" : ""}. ${convites.map(descreverAcompanhante).join(". ")} quer acompanhar seu progresso. Toque em Aceitar ou em Recusar.`
      : "Você não tem convites agora.",
    aceitos.length > 0 ? `Acompanham você: ${aceitos.map(descreverAcompanhante).join(". ")}.` : "",
    aviso?.texto ?? "",
  ].join(" ");

  return (
    <Tela rodape={<BotaoAudio texto={textoAudio} />}>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Quem me acompanha</Titulo>
      <Corpo>Quem você aceitar pode ver o seu progresso.</Corpo>

      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={estado.tentarDeNovo} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : null}

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {convites.length > 0 ? <Subtitulo>Convites</Subtitulo> : null}
      {convites.map((v) => (
        <Cartao key={v.idVinculo} destaque>
          <Text style={styles.nome}>{descreverAcompanhante(v)}</Text>
          <Corpo>quer acompanhar seu progresso.</Corpo>
          <Botao
            titulo="Aceitar"
            rotuloAcessivel={`Aceitar ${descreverAcompanhante(v)}`}
            desabilitado={enviando}
            onPress={() => agir(() => responderConvite(v.idVinculo, true))}
          />
          <Botao
            titulo="Recusar"
            variante="secundario"
            rotuloAcessivel={`Recusar ${descreverAcompanhante(v)}`}
            desabilitado={enviando}
            onPress={() => agir(() => responderConvite(v.idVinculo, false))}
          />
        </Cartao>
      ))}

      <Subtitulo>Acompanham você</Subtitulo>
      {estado.dados && aceitos.length === 0 ? <Corpo>Ninguém ainda.</Corpo> : null}
      {aceitos.map((v) => (
        <Cartao key={v.idVinculo}>
          <Text style={styles.nome}>{descreverAcompanhante(v)}</Text>
          <Botao
            titulo="Desfazer"
            variante="secundario"
            rotuloAcessivel={`Desfazer acompanhamento de ${descreverAcompanhante(v)}`}
            desabilitado={enviando}
            onPress={() => agir(() => desfazerVinculoDoAluno(v.idVinculo))}
          />
        </Cartao>
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  nome: { fontSize: fontes.subtitulo, fontWeight: "700", color: cores.texto },
});
