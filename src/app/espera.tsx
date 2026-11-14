// Conta esperando aprovação ou recusada (Passo 3.1). Sem tela no Figma (a desenhar no passo 11).
// - Professor: espera a instituição aprovar; se recusado, vê o motivo e pode informar outro código.
// - Instituição: espera o administrador do AJAI aprovar; se recusada, vê o motivo.
// "Verificar de novo" pergunta ao servidor (GET /auth/eu); aprovada, a tela leva à área certa.
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Aviso, Botao, BotaoAudio, Campo, Cartao, Corpo, Logo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { contaLiberada, rotaInicial, verificarConta } from "@/services/auth";
import { informarCodigoInstituicao } from "@/services/instituicoes";

export default function EsperaAprovacao() {
  const { usuario, carregando, entrar, sair } = useSessao();
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (carregando) return null;
  if (!usuario) return <Redirect href="/login" />;
  if (contaLiberada(usuario)) return <Redirect href={rotaInicial(usuario)} />;

  const situacao = usuario.situacao ?? { status: "PENDENTE" as const };
  const professor = usuario.perfil === "PROFESSOR";
  const recusada = situacao.status === "RECUSADA";

  const titulo = recusada
    ? professor
      ? "A instituição não aprovou sua conta"
      : "O cadastro não foi aprovado"
    : professor
      ? "Aguardando a instituição aprovar"
      : "Aguardando aprovação";

  const explicacao = recusada
    ? professor
      ? "Confira o código com a instituição onde você dá aula e envie de novo."
      : "Confira os dados e fale com o AJAI para tentar de novo."
    : professor
      ? `Sua conta foi criada. Agora ${situacao.nomeInstituicao ?? "a instituição"} precisa aprovar você.`
      : "Recebemos a inscrição. O AJAI vai conferir os dados da instituição.";

  async function verificar() {
    setAviso(null);
    setEnviando(true);
    try {
      const atualizado = await verificarConta();
      entrar(atualizado); // aprovada → o Redirect acima leva à área certa
      if (!contaLiberada(atualizado)) setAviso({ texto: "Ainda não foi aprovada. Tente de novo mais tarde.", tipo: "atencao" });
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setEnviando(false);
    }
  }

  async function enviarCodigo() {
    setAviso(null);
    setEnviando(true);
    try {
      const mensagem = await informarCodigoInstituicao(codigo);
      entrar(await verificarConta());
      setCodigo("");
      setAviso({ texto: mensagem, tipo: "sucesso" });
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setEnviando(false);
    }
  }

  const textoAudio = [titulo, situacao.motivo ? `Motivo: ${situacao.motivo}.` : "", explicacao].join(" ");

  return (
    <Tela rodape={<BotaoAudio texto={textoAudio} />}>
      <Logo />
      <Titulo>{titulo}</Titulo>
      <Subtitulo>{usuario.nome}</Subtitulo>
      <Cartao destaque>
        {situacao.motivo ? <Corpo>Motivo: {situacao.motivo}</Corpo> : null}
        <Corpo>{explicacao}</Corpo>
      </Cartao>

      {professor && recusada ? (
        <>
          <Campo
            rotulo="Código da instituição"
            placeholder="Exemplo: EJAVV2"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            maxLength={12}
            value={codigo}
            onChangeText={setCodigo}
          />
          <Botao titulo={enviando ? "Enviando..." : "Enviar código novo"} desabilitado={enviando} onPress={enviarCodigo} />
        </>
      ) : null}

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <Botao
        titulo={enviando ? "Verificando..." : "Verificar de novo"}
        variante={professor && recusada ? "secundario" : "primario"}
        desabilitado={enviando}
        onPress={verificar}
      />
      <Botao
        titulo="Sair"
        variante="secundario"
        onPress={() => {
          sair();
          router.replace("/login");
        }}
      />
    </Tela>
  );
}
