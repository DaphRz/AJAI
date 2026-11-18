// Instituição › Turmas (passo 8): cria turmas e escolhe o professor (aprovado) de cada uma; renomeia,
// encerra/reabre, troca o professor e apaga. A instituição vê só QUANTOS alunos cada turma tem: quem
// põe os alunos é o professor (alunos com vínculo aceito com ele). Sem frame no Figma.
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Aviso, Botao, Campo, Cartao, Corpo, Opcao, Subtitulo, Tela, Titulo } from "@/components";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import { mensagemDeErro } from "@/services/api";
import {
  editarTurmaDaInstituicao,
  excluirTurmaDaInstituicao,
  incluirTurmaDaInstituicao,
  listarTurmasDaInstituicao,
  type TurmaDaInstituicao,
} from "@/services/instituicoes";
import { familias, cores, fontes } from "@/theme/tokens";

type Mensagem = { texto: string; tipo: "atencao" | "sucesso" } | null;
/** Faz a ação na API; devolve true se deu certo. */
type Executar = (acao: () => Promise<string>) => Promise<boolean>;
type Professor = { idUsuario: number; nome: string };

export default function TurmasDaInstituicao() {
  const [versao, recarregar] = useVersaoAoFocar();
  const estado = useCarregar(listarTurmasDaInstituicao, versao, { manterAnterior: true });
  const [aviso, setAviso] = useState<Mensagem>(null);
  const [nome, setNome] = useState("");
  const [periodo, setPeriodo] = useState(String(new Date().getFullYear()));
  const [idProfessor, setIdProfessor] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

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
    if (idProfessor === null) return setAviso({ texto: "Escolha o professor da turma.", tipo: "atencao" });
    setEnviando(true);
    const ok = await executar(async () => {
      const turma = await incluirTurmaDaInstituicao(nome, periodo, idProfessor);
      return `Turma ${turma.nome} criada para ${turma.professor.nome}.`;
    });
    if (ok) setNome("");
    setEnviando(false);
  }

  const professores = estado.dados?.professores ?? [];

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Turmas</Titulo>
      <Subtitulo>Crie as turmas e escolha o professor de cada uma. O professor coloca os alunos.</Subtitulo>

      {estado.erro ? (
        <>
          <Aviso>{estado.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : !estado.dados ? (
        <Corpo>Carregando...</Corpo>
      ) : (
        <>
          <Cartao destaque>
            <Subtitulo>Criar turma</Subtitulo>
            {professores.length === 0 ? (
              <Corpo>Aprove um professor primeiro. Depois, crie a turma para ele.</Corpo>
            ) : (
              <>
                <Campo rotulo="Nome da turma" placeholder="Exemplo: EJA Noite" value={nome} onChangeText={setNome} maxLength={60} />
                <Campo rotulo="Período" placeholder="Exemplo: 2026/2" value={periodo} onChangeText={setPeriodo} maxLength={30} />
                <Text style={styles.rotulo}>Professor da turma</Text>
                <EscolherProfessor professores={professores} escolhido={idProfessor} aoEscolher={setIdProfessor} />
                <Botao titulo={enviando ? "Criando..." : "Criar turma"} desabilitado={enviando} onPress={criar} />
              </>
            )}
          </Cartao>

          {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

          {estado.dados.turmas.length === 0 ? <Corpo>Ainda não há turmas.</Corpo> : null}
          {estado.dados.turmas.map((t) => (
            <CartaoTurma key={t.idTurma} turma={t} professores={professores} executar={executar} />
          ))}
        </>
      )}
    </Tela>
  );
}

function EscolherProfessor({
  professores,
  escolhido,
  aoEscolher,
}: {
  professores: Professor[];
  escolhido: number | null;
  aoEscolher: (idProfessor: number) => void;
}) {
  return (
    <View style={styles.opcoes} accessibilityLabel="Professor da turma">
      {professores.map((p) => (
        <Opcao key={p.idUsuario} texto={p.nome} ativo={escolhido === p.idUsuario} onPress={() => aoEscolher(p.idUsuario)} />
      ))}
    </View>
  );
}

function CartaoTurma({ turma, professores, executar }: { turma: TurmaDaInstituicao; professores: Professor[]; executar: Executar }) {
  const [modo, setModo] = useState<"ver" | "editar" | "apagar">("ver");
  const [nome, setNome] = useState(turma.nome);
  const [periodo, setPeriodo] = useState(turma.periodo);
  const [idProfessor, setIdProfessor] = useState(turma.professor.idUsuario);
  const trocaProfessor = idProfessor !== turma.professor.idUsuario;

  return (
    <Cartao>
      <Text style={styles.titulo}>{turma.nome}</Text>
      <Corpo>Professor: {turma.professor.nome}</Corpo>
      <Text style={styles.legenda}>
        Período {turma.periodo} · {turma.totalAlunos === 1 ? "1 aluno" : `${turma.totalAlunos} alunos`}
        {turma.ativa ? "" : " · encerrada"}
      </Text>

      {modo === "editar" ? (
        <>
          <Campo rotulo="Nome da turma" value={nome} onChangeText={setNome} maxLength={60} />
          <Campo rotulo="Período" value={periodo} onChangeText={setPeriodo} maxLength={30} />
          <Text style={styles.rotulo}>Professor da turma</Text>
          <EscolherProfessor professores={professores} escolhido={idProfessor} aoEscolher={setIdProfessor} />
          {trocaProfessor && turma.totalAlunos > 0 ? (
            <Aviso>Ao trocar o professor, os alunos saem da turma. O novo professor convida e coloca os alunos dele.</Aviso>
          ) : null}
          <Botao
            titulo="Salvar"
            onPress={() =>
              executar(() =>
                editarTurmaDaInstituicao(turma.idTurma, { nome, periodo, ...(trocaProfessor ? { idProfessor } : {}) }),
              ).then((ok) => ok && setModo("ver"))
            }
          />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setModo("ver")} />
        </>
      ) : modo === "apagar" ? (
        <>
          <Corpo>Apagar a turma {turma.nome}? Os alunos continuam com o professor, sem turma.</Corpo>
          <Botao
            titulo="Sim, apagar"
            rotuloAcessivel={`Sim, apagar a turma ${turma.nome}`}
            onPress={() => executar(() => excluirTurmaDaInstituicao(turma.idTurma))}
          />
          <Botao titulo="Voltar" variante="secundario" onPress={() => setModo("ver")} />
        </>
      ) : (
        <View style={styles.botoes}>
          <Botao titulo="Editar" variante="secundario" rotuloAcessivel={`Editar a turma ${turma.nome}`} onPress={() => setModo("editar")} />
          <Botao
            titulo={turma.ativa ? "Encerrar turma" : "Reabrir turma"}
            variante="secundario"
            rotuloAcessivel={`${turma.ativa ? "Encerrar" : "Reabrir"} a turma ${turma.nome}`}
            onPress={() => executar(() => editarTurmaDaInstituicao(turma.idTurma, { ativa: !turma.ativa }))}
          />
          <Botao titulo="Apagar" variante="secundario" rotuloAcessivel={`Apagar a turma ${turma.nome}`} onPress={() => setModo("apagar")} />
        </View>
      )}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.subtitulo, fontFamily: familias.extranegrito, color: cores.texto },
  legenda: { fontFamily: familias.regular, fontSize: fontes.legenda, color: cores.textoSuave },
  rotulo: { fontSize: fontes.corpo, fontFamily: familias.negrito, color: cores.texto },
  botoes: { gap: 8 },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
