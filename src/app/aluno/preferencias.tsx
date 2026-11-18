// Aluno.EditarPreferencias (passo 10, APF 17; RNF04): velocidade da voz e tamanho da letra.
// Sem frame no Figma: segue o padrão das telas do aluno (Home). A escolha vale na hora:
// o servidor guarda (PATCH /alunos/eu), a sessão recebe o aluno novo e o PreferenciasProvider
// aplica a letra e a voz no app inteiro. Ao mudar a velocidade, o exemplo toca sozinho.
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Aviso, Botao, BotaoAudio, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { useAluno } from "@/hooks/useAluno";
import { mensagemDeErro } from "@/services/api";
import { falar } from "@/services/narracao";
import { editarPreferencias, type MudancaPreferencias } from "@/services/preferencias";
import { FRASES_FIXAS } from "@/services/textosNarrados";
import { espacos, tamanhosDeLetra, velocidadesDaVoz } from "@/theme/tokens";

/** Frase do "Ouvir exemplo" (já preparada no servidor pelo voz:preparar). */
const EXEMPLO = FRASES_FIXAS[1];

function nomeDe<T extends { valor: number; nome: string }>(lista: readonly T[], valor: number): string {
  return lista.find((item) => item.valor === valor)?.nome ?? "Personalizada";
}

export default function Preferencias() {
  const aluno = useAluno();
  const { entrar } = useSessao();
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" }>();

  const velocidade = aluno.velocidadeVoz;
  const tamanho = aluno.tamanhoFonte;
  const nomeVelocidade = nomeDe(velocidadesDaVoz, velocidade);
  const nomeTamanho = nomeDe(tamanhosDeLetra, tamanho);

  async function mudar(mudanca: MudancaPreferencias) {
    if (salvando) return;
    setSalvando(true);
    setAviso(undefined);
    try {
      const atualizado = await editarPreferencias(mudanca);
      entrar(atualizado);
      setAviso({ texto: "Pronto! Guardamos sua escolha.", tipo: "sucesso" });
      if (mudanca.velocidadeVoz !== undefined) void falar(EXEMPLO, { velocidade: atualizado.velocidadeVoz });
    } catch (erro) {
      setAviso({ texto: mensagemDeErro(erro), tipo: "atencao" });
    }
    setSalvando(false);
  }

  return (
    <Tela
      rodape={
        <BotaoAudio
          texto={`Aqui você escolhe a velocidade da voz e o tamanho da letra. A voz está ${nomeVelocidade}. A letra está ${nomeTamanho}. Toque na opção que preferir. Para escutar a voz, toque em Ouvir exemplo.`}
        />
      }
    >
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Logo />
      <Titulo>Voz e letra</Titulo>

      <Cartao>
        <Subtitulo>Velocidade da voz</Subtitulo>
        <View style={styles.opcoes}>
          {velocidadesDaVoz.map((opcao) => {
            const escolhida = opcao.valor === velocidade;
            return (
              <Botao
                key={opcao.valor}
                titulo={opcao.nome}
                variante={escolhida ? "primario" : "secundario"}
                desabilitado={salvando && !escolhida}
                rotuloAcessivel={escolhida ? `Voz ${opcao.nome}, escolhida` : `Voz ${opcao.nome}`}
                onPress={() => (escolhida ? void falar(EXEMPLO) : void mudar({ velocidadeVoz: opcao.valor }))}
              />
            );
          })}
        </View>
        <Botao titulo="Ouvir exemplo" variante="secundario" onPress={() => void falar(EXEMPLO)} />
      </Cartao>

      <Cartao>
        <Subtitulo>Tamanho da letra</Subtitulo>
        <View style={styles.opcoes}>
          {tamanhosDeLetra.map((opcao) => {
            const escolhida = opcao.valor === tamanho;
            return (
              <Botao
                key={opcao.valor}
                titulo={opcao.nome}
                variante={escolhida ? "primario" : "secundario"}
                desabilitado={salvando && !escolhida}
                rotuloAcessivel={escolhida ? `Letra ${opcao.nome}, escolhida` : `Letra ${opcao.nome}`}
                onPress={() => (escolhida ? undefined : void mudar({ tamanhoFonte: opcao.valor }))}
              />
            );
          })}
        </View>
        <Corpo>Assim fica o texto do aplicativo.</Corpo>
      </Cartao>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  opcoes: { gap: espacos.sm },
});
