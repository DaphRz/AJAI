// Professor › aba Turmas (passo 8; APF 20–24): criar, renomear, encerrar/reabrir e
// apagar turmas, e pôr, mover ou tirar alunos (só os com vínculo ACEITO; o aluno cria a própria
// conta e aceita o convite em /aluno/acompanhamento). Sem frame no Figma: segue o padrão das telas.
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, Campo, Cartao, Corpo, Opcao, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import { mensagemDeErro } from "@/services/api";
import type { AlunoCurto } from "@/services/relatorios";
import { editarTurma, excluirTurma, incluirTurma, listarTurmas, mudarTurmaDoAluno, type Turma } from "@/services/turmas";
import { familias, cores, fontes } from "@/theme/tokens";

type Mensagem = { texto: string; tipo: "atencao" | "sucesso" } | null;
/** Faz a ação na API; devolve true se deu certo. */
type Executar = (acao: () => Promise<string>) => Promise<boolean>;

export default function MinhasTurmas() {
  const [versao, recarregar] = useVersaoAoFocar();
  const estado = useCarregar(listarTurmas, versao, { manterAnterior: true });
  const [aviso, setAviso] = useState<Mensagem>(null);
  const [nome, setNome] = useState("");
  const [periodo, setPeriodo] = useState(String(new Date().getFullYear()));
  const [enviando, setEnviando] = useState(false);
  const [criando, setCriando] = useState(false);

  /** Faz a ação na API, mostra a mensagem e recarrega a lista. */
  const executar: Executar = async (acao) => {
    setAviso(null);
    try {
      setAviso({ texto: await acao(), tipo: "sucesso" });
      recarregar();
      return true;
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
      return false;
    }
  };

  async function criar() {
    setEnviando(true);
    await executar(async () => {
      const turma = await incluirTurma(nome, periodo);
      setNome("");
      setCriando(false);
      return `Turma ${turma.nome} criada.`;
    });
    setEnviando(false);
  }

  const turmasAtivas = estado.dados?.turmas.filter((t) => t.ativa) ?? [];

  return (
    <Tela>
      <Titulo>Turmas</Titulo>
      <Subtitulo>Veja os alunos de cada turma e organize quem aceitou seu convite.</Subtitulo>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : (
        <>
          {estado.dados.turmas.length === 0 ? <Corpo>Você ainda não criou nenhuma turma.</Corpo> : null}
          {estado.dados.turmas.map((t) => (
            <CartaoTurma key={t.idTurma} turma={t} turmasAtivas={turmasAtivas} executar={executar} />
          ))}
          {criando ? (
            <Cartao destaque>
              <Subtitulo>Criar turma</Subtitulo>
              <Campo rotulo="Nome da turma" placeholder="Exemplo: EJA Noite" value={nome} onChangeText={setNome} maxLength={60} />
              <Campo rotulo="Período" placeholder="Exemplo: 2026/2" value={periodo} onChangeText={setPeriodo} maxLength={30} />
              <Botao titulo={enviando ? "Criando..." : "Criar turma"} desabilitado={enviando} onPress={criar} />
              <Botao titulo="Voltar" variante="secundario" onPress={() => setCriando(false)} />
            </Cartao>
          ) : (
            <Botao titulo="Criar turma nova" onPress={() => setCriando(true)} />
          )}

          <Subtitulo>Alunos sem turma</Subtitulo>
          {estado.dados.semTurma.length === 0 ? <Corpo>Todos os seus alunos estão em uma turma.</Corpo> : null}
          {estado.dados.semTurma.map((a) => (
            <Cartao key={a.idUsuario}>
              <LinhaAluno aluno={a} turmasAtivas={turmasAtivas} executar={executar} />
            </Cartao>
          ))}
          <Botao titulo="Convidar alunos" variante="secundario" onPress={() => router.push("/professor/alunos")} />
        </>
      )}
    </Tela>
  );
}

function CartaoTurma({
  turma,
  turmasAtivas,
  executar,
}: {
  turma: Turma;
  turmasAtivas: Turma[];
  executar: Executar;
}) {
  const [modo, setModo] = useState<"ver" | "opcoes" | "editar" | "apagar">("ver");
  const [nome, setNome] = useState(turma.nome);
  const [periodo, setPeriodo] = useState(turma.periodo);

  return (
    <Cartao>
      <Text style={styles.titulo}>{turma.nome}</Text>
      <Text style={styles.legenda}>
        Período {turma.periodo} · {turma.alunos.length === 1 ? "1 aluno" : `${turma.alunos.length} alunos`}
        {turma.ativa ? "" : " · encerrada"}
      </Text>

      {modo === "editar" ? (
        <>
          <Campo rotulo="Nome da turma" value={nome} onChangeText={setNome} maxLength={60} />
          <Campo rotulo="Período" value={periodo} onChangeText={setPeriodo} maxLength={30} />
          <Botao
            titulo="Salvar"
            onPress={() => executar(() => editarTurma(turma.idTurma, { nome, periodo })).then((ok) => ok && setModo("ver"))}
          />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setModo("ver")} />
        </>
      ) : modo === "apagar" ? (
        <>
          <Corpo>Apagar a turma {turma.nome}? Os alunos continuam com você, sem turma.</Corpo>
          <Botao titulo="Sim, apagar" rotuloAcessivel={`Sim, apagar a turma ${turma.nome}`} onPress={() => executar(() => excluirTurma(turma.idTurma))} />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setModo("ver")} />
        </>
      ) : modo === "ver" ? (
        <Botao
          titulo="Opções da turma"
          variante="secundario"
          rotuloAcessivel={`Opções da turma ${turma.nome}: editar, encerrar ou apagar`}
          onPress={() => setModo("opcoes")}
        />
      ) : (
        <View style={styles.botoes}>
          <Botao titulo="Editar" variante="secundario" rotuloAcessivel={`Editar a turma ${turma.nome}`} onPress={() => setModo("editar")} />
          <Botao
            titulo={turma.ativa ? "Encerrar turma" : "Reabrir turma"}
            variante="secundario"
            rotuloAcessivel={`${turma.ativa ? "Encerrar" : "Reabrir"} a turma ${turma.nome}`}
            onPress={() => executar(() => editarTurma(turma.idTurma, { ativa: !turma.ativa })).then((ok) => ok && setModo("ver"))}
          />
          <Botao titulo="Apagar" variante="secundario" rotuloAcessivel={`Apagar a turma ${turma.nome}`} onPress={() => setModo("apagar")} />
          <Botao titulo="Fechar opções" variante="link" onPress={() => setModo("ver")} />
        </View>
      )}

      {turma.alunos.map((a) => (
        <LinhaAluno key={a.idUsuario} aluno={a} idTurmaAtual={turma.idTurma} turmasAtivas={turmasAtivas} executar={executar} />
      ))}
    </Cartao>
  );
}

/** Um aluno com "Mudar de turma": abre as turmas ativas e "Sem turma". */
function LinhaAluno({
  aluno,
  idTurmaAtual,
  turmasAtivas,
  executar,
}: {
  aluno: AlunoCurto;
  idTurmaAtual?: number;
  turmasAtivas: Turma[];
  executar: Executar;
}) {
  const [escolhendo, setEscolhendo] = useState(false);
  const mudar = (idTurma: number | null) => executar(() => mudarTurmaDoAluno(aluno.idUsuario, idTurma)).then((ok) => ok && setEscolhendo(false));

  return (
    <View style={styles.aluno}>
      <Text style={styles.nome}>{aluno.nome}</Text>
      {!escolhendo ? (
        <Botao
          titulo="Ver métricas"
          rotuloAcessivel={`Ver métricas de ${aluno.nome}`}
          onPress={() => router.push({ pathname: "/professor/aluno/[id]", params: { id: String(aluno.idUsuario) } })}
        />
      ) : null}
      {escolhendo ? (
        <View style={styles.opcoes}>
          {turmasAtivas
            .filter((t) => t.idTurma !== idTurmaAtual)
            .map((t) => (
              <Opcao key={t.idTurma} texto={t.nome} ativo={false} rotuloAcessivel={`Pôr ${aluno.nome} na turma ${t.nome}`} onPress={() => mudar(t.idTurma)} />
            ))}
          {idTurmaAtual !== undefined ? (
            <Opcao texto="Tirar da turma" ativo={false} rotuloAcessivel={`Tirar ${aluno.nome} da turma`} onPress={() => mudar(null)} />
          ) : null}
          <Opcao texto="Voltar" ativo={false} onPress={() => setEscolhendo(false)} />
        </View>
      ) : (
        <Botao
          titulo={idTurmaAtual === undefined ? "Pôr numa turma" : "Mudar de turma"}
          variante="secundario"
          rotuloAcessivel={`${idTurmaAtual === undefined ? "Pôr numa turma" : "Mudar de turma"}: ${aluno.nome}`}
          desabilitado={turmasAtivas.length === 0 && idTurmaAtual === undefined}
          onPress={() => setEscolhendo(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.subtitulo, fontFamily: familias.extranegrito, color: cores.texto },
  legenda: { fontFamily: familias.regular, fontSize: fontes.legenda, color: cores.textoSuave },
  botoes: { gap: 8 },
  aluno: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderColor: cores.borda },
  nome: { fontSize: fontes.corpo, fontFamily: familias.negrito, color: cores.texto },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
