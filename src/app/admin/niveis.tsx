// Administrador › Etapas (passo 9; APF IncluirNivel/EditarNivel). Só o administrador mexe nos níveis.
// Cada etapa: nome, descrição, ordem na trilha e critério de acerto (em %, gravado de 0 a 1).
// Etapa nova sem atividade ativa: o aluno não sobe para ela até ganhar atividades (rotas/progresso.ts).
// Sem frame no Figma: segue o padrão das telas desenhadas.
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, Campo, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import { mensagemDeErro } from "@/services/api";
import { editarNivel, incluirNivel, listarNiveisGestao, type DadosNivel, type NivelGestao } from "@/services/cadastroAtividades";
import { familias, cores, fontes } from "@/theme/tokens";

type Mensagem = { texto: string; tipo: "atencao" | "sucesso" } | null;

/** Campos do formulário como texto (o que a pessoa digita). */
interface Rascunho {
  nome: string;
  descricao: string;
  ordem: string;
  criterio: string;
}

const paraRascunho = (n: Pick<NivelGestao, "nome" | "descricao" | "ordem" | "criterioAcerto">): Rascunho => ({
  nome: n.nome,
  descricao: n.descricao,
  ordem: String(n.ordem),
  criterio: String(Math.round(n.criterioAcerto * 100)),
});

/** Converte o rascunho; devolve a mensagem se algum número estiver errado. */
function lerRascunho(r: Rascunho): DadosNivel | string {
  const ordem = Number(r.ordem);
  const criterio = Number(r.criterio.replace(",", ".").replace("%", ""));
  if (!Number.isInteger(ordem) || ordem < 1) return "A ordem é um número inteiro: 1, 2, 3...";
  if (!Number.isFinite(criterio) || criterio < 10 || criterio > 100) return "O critério de acerto vai de 10 a 100 (%).";
  return { nome: r.nome.trim(), descricao: r.descricao.trim(), ordem, criterioAcerto: criterio / 100 };
}

function CamposNivel({ rascunho, mudar }: { rascunho: Rascunho; mudar: (r: Rascunho) => void }) {
  return (
    <>
      <Campo rotulo="Nome da etapa" placeholder="Exemplo: Lendo Avisos" value={rascunho.nome} onChangeText={(nome) => mudar({ ...rascunho, nome })} maxLength={60} />
      <Campo
        rotulo="Descrição"
        placeholder="Exemplo: Ler avisos e bilhetes do dia a dia."
        value={rascunho.descricao}
        onChangeText={(descricao) => mudar({ ...rascunho, descricao })}
        maxLength={200}
      />
      <Campo rotulo="Ordem na trilha" keyboardType="number-pad" value={rascunho.ordem} onChangeText={(ordem) => mudar({ ...rascunho, ordem })} maxLength={2} />
      <Campo
        rotulo="Critério de acerto para subir (%)"
        placeholder="Exemplo: 70"
        keyboardType="number-pad"
        value={rascunho.criterio}
        onChangeText={(criterio) => mudar({ ...rascunho, criterio })}
        maxLength={3}
      />
    </>
  );
}

export default function NiveisAdmin() {
  const [versao, recarregar] = useVersaoAoFocar();
  const estado = useCarregar(listarNiveisGestao, versao, { manterAnterior: true });
  const [aviso, setAviso] = useState<Mensagem>(null);
  const [novo, setNovo] = useState<Rascunho | null>(null);

  async function executar(acao: () => Promise<string>): Promise<boolean> {
    setAviso(null);
    try {
      setAviso({ texto: await acao(), tipo: "sucesso" });
      recarregar();
      return true;
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
      return false;
    }
  }

  async function criar(r: Rascunho) {
    const dados = lerRascunho(r);
    if (typeof dados === "string") return setAviso({ texto: dados, tipo: "atencao" });
    const ok = await executar(async () => `Etapa ${(await incluirNivel(dados)).nome} incluída. Agora inclua as atividades dela.`);
    if (ok) setNovo(null);
  }

  const proximaOrdem = Math.max(0, ...(estado.dados ?? []).map((n) => n.ordem)) + 1;

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Etapas</Titulo>
      <Subtitulo>As etapas da trilha, em ordem. O aluno sobe de etapa quando atinge o critério de acerto.</Subtitulo>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {novo ? (
        <Cartao destaque>
          <Subtitulo>Nova etapa</Subtitulo>
          <CamposNivel rascunho={novo} mudar={setNovo} />
          <Botao titulo="Incluir etapa" onPress={() => criar(novo)} />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setNovo(null)} />
        </Cartao>
      ) : (
        <Botao
          titulo="Incluir etapa"
          onPress={() => setNovo({ nome: "", descricao: "", ordem: String(proximaOrdem), criterio: "75" })}
        />
      )}

      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : (
        estado.dados.map((n) => <CartaoNivel key={n.idNivel} nivel={n} executar={executar} />)
      )}
    </Tela>
  );
}

function CartaoNivel({ nivel, executar }: { nivel: NivelGestao; executar: (acao: () => Promise<string>) => Promise<boolean> }) {
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [problema, setProblema] = useState<string | null>(null);

  async function salvar(r: Rascunho) {
    const dados = lerRascunho(r);
    if (typeof dados === "string") return setProblema(dados);
    setProblema(null);
    const ok = await executar(async () => `Etapa ${(await editarNivel(nivel.idNivel, dados)).nome} salva.`);
    if (ok) setRascunho(null);
  }

  return (
    <Cartao>
      <Text style={styles.titulo}>
        {nivel.ordem}. {nivel.nome}
      </Text>
      <Corpo>{nivel.descricao}</Corpo>
      <Text style={styles.legenda}>
        Critério: {Math.round(nivel.criterioAcerto * 100)}% · {nivel.totalAtivas === 1 ? "1 atividade ativa" : `${nivel.totalAtivas} atividades ativas`}
        {nivel.totalInativas > 0 ? ` · ${nivel.totalInativas} inativa${nivel.totalInativas > 1 ? "s" : ""}` : ""}
      </Text>
      {nivel.totalAtivas === 0 ? <Aviso>Sem atividades ativas: os alunos ainda não chegam a esta etapa.</Aviso> : null}
      {rascunho ? (
        <View style={styles.botoes}>
          <CamposNivel rascunho={rascunho} mudar={setRascunho} />
          {problema ? <Aviso>{problema}</Aviso> : null}
          <Botao titulo="Salvar" onPress={() => salvar(rascunho)} />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setRascunho(null)} />
        </View>
      ) : (
        <Botao
          titulo="Editar"
          variante="secundario"
          rotuloAcessivel={`Editar a etapa ${nivel.nome}`}
          onPress={() => setRascunho(paraRascunho(nivel))}
        />
      )}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.subtitulo, fontFamily: familias.extranegrito, color: cores.texto },
  legenda: { fontFamily: familias.regular, fontSize: fontes.legenda, color: cores.textoSuave },
  botoes: { gap: 8 },
});
