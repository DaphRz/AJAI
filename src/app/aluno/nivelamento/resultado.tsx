// Figma: "AJAI · Nivelamento · Resultado"
import { router, useLocalSearchParams } from "expo-router";
import { Botao, BotaoAudio, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { buscarNivel } from "@/services/atividades";

export default function NivelamentoResultado() {
  const { idNivel } = useLocalSearchParams<{ idNivel: string }>();
  const nivel = buscarNivel(Number(idNivel));
  const texto = `Pronto! Você vai começar na etapa ${nivel?.nome ?? ""}.`;

  return (
    <Tela rodape={<BotaoAudio texto={texto} />}>
      <Titulo>Pronto!</Titulo>
      <Subtitulo>Encontramos o melhor ponto para você começar.</Subtitulo>
      <Cartao destaque>
        <Corpo>Sua etapa inicial</Corpo>
        <Titulo>{nivel?.nome ?? "Aprendendo Letras"}</Titulo>
        <Corpo>{nivel?.descricao}</Corpo>
      </Cartao>
      <Botao titulo="Começar →" grande onPress={() => router.replace("/aluno")} />
    </Tela>
  );
}
