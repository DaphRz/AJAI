// Figma: "AJAI · Nivelamento · Resultado"
import { router, useLocalSearchParams } from "expo-router";
import { Botao, BotaoAudio, Carregando, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { buscarNivel } from "@/services/atividades";

export default function NivelamentoResultado() {
  const { idNivel } = useLocalSearchParams<{ idNivel: string }>();
  // `?? null`: nível não encontrado ainda é um resultado válido (mostra o texto padrão).
  const estado = useCarregar(async () => (await buscarNivel(Number(idNivel))) ?? null, idNivel);

  return (
    <Carregando estado={estado} comAudio>
      {(nivel) => {
        const nome = nivel?.nome ?? "Aprendendo Letras";
        const texto = `Pronto! Você vai começar na etapa ${nome}.`;
        return (
          <Tela rodape={<BotaoAudio texto={texto} />}>
            <Titulo>Pronto!</Titulo>
            <Subtitulo>Encontramos o melhor ponto para você começar.</Subtitulo>
            <Cartao destaque>
              <Corpo>Sua etapa inicial</Corpo>
              <Titulo>{nome}</Titulo>
              {nivel ? <Corpo>{nivel.descricao}</Corpo> : null}
            </Cartao>
            <Botao titulo="Começar →" grande onPress={() => router.replace("/aluno")} />
          </Tela>
        );
      }}
    </Carregando>
  );
}
