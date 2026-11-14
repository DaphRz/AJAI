// Cadastro de atividades (passo 9; APF 25–31), usado pelo administrador (/admin/atividades) e pelo
// professor (/professor/atividades). O administrador mexe em todas; o professor só nas que criou
// (o servidor confere e devolve `podeEditar`). Sem frame no Figma: segue o padrão das telas desenhadas.
// Não é tela do aluno: sem "Ouvir ajuda".
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { TipoAtividade } from "@/domain/modelos";
import { useCarregar } from "@/hooks/useCarregar";
import { useVersaoAoFocar } from "@/hooks/useVersaoAoFocar";
import { mensagemDeErro } from "@/services/api";
import {
  editarAtividade,
  excluirAtividade,
  incluirAtividade,
  listarAtividades,
  listarNiveisGestao,
  mudarStatusAtividade,
  NOMES_TIPO,
  visualizarAtividadeGestao,
  type AtividadeGestao,
  type DadosAtividade,
  type NivelGestao,
} from "@/services/cadastroAtividades";
import { cores, fontes } from "@/theme/tokens";
import { Botao } from "./Botao";
import { Campo } from "./Campo";
import { Opcao } from "./Opcao";
import { Tela } from "./Tela";
import { Aviso, Cartao, Corpo, Subtitulo, Titulo } from "./Textos";

export type AreaCadastro = "admin" | "professor";
type Mensagem = { texto: string; tipo: "atencao" | "sucesso" } | null;

const TIPOS: TipoAtividade[] = ["LETRA", "SILABA", "PALAVRA", "FRASE", "INTERPRETACAO", "ESCRITA"];
const MULTIPLA_MAX = 4;
const PECAS_MAX = 8;
const LINHAS_MIN = 2;

function abrirFormulario(area: AreaCadastro, id?: number) {
  const params = id ? { id: String(id) } : {};
  if (area === "admin") router.push({ pathname: "/admin/atividade", params });
  else router.push({ pathname: "/professor/atividade", params });
}

// ======================= Lista =======================

export function ListaAtividades({ area }: { area: AreaCadastro }) {
  const [versao, recarregar] = useVersaoAoFocar();
  const [idNivel, setIdNivel] = useState<number | undefined>(undefined);
  const [minhas, setMinhas] = useState(area === "professor");
  const niveis = useCarregar(listarNiveisGestao, versao, { manterAnterior: true });
  const nivelEscolhido = idNivel ?? niveis.dados?.[0]?.idNivel;
  const atividades = useCarregar(
    () => (nivelEscolhido || minhas ? listarAtividades({ idNivel: minhas ? undefined : nivelEscolhido, minhas }) : Promise.resolve([])),
    `${versao}|${nivelEscolhido}|${minhas}`,
    { manterAnterior: true },
  );
  const [aviso, setAviso] = useState<Mensagem>(null);

  async function executar(acao: () => Promise<string>) {
    setAviso(null);
    try {
      setAviso({ texto: await acao(), tipo: "sucesso" });
      recarregar();
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    }
  }

  const nomeDoNivel = (id: number) => niveis.dados?.find((n) => n.idNivel === id)?.nome ?? "";

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Atividades</Titulo>
      <Subtitulo>
        {area === "admin"
          ? "Inclua, edite ou inative as atividades de cada etapa."
          : "Inclua atividades para a trilha. Você pode editar e inativar as que você criou."}
      </Subtitulo>
      <Botao titulo="Incluir atividade" onPress={() => abrirFormulario(area)} />

      {area === "professor" ? (
        <View style={styles.opcoes}>
          <Opcao texto="Minhas atividades" ativo={minhas} onPress={() => setMinhas(true)} />
          <Opcao texto="Todas por etapa" ativo={!minhas} onPress={() => setMinhas(false)} />
        </View>
      ) : null}

      {!minhas ? (
        <>
          <Text style={styles.rotulo}>Etapa</Text>
          <View style={styles.opcoes}>
            {niveis.dados?.map((n) => (
              <Opcao
                key={n.idNivel}
                texto={`${n.ordem}. ${n.nome}`}
                rotuloAcessivel={`Etapa ${n.ordem}, ${n.nome}, ${n.totalAtivas} atividades ativas`}
                ativo={nivelEscolhido === n.idNivel}
                onPress={() => setIdNivel(n.idNivel)}
              />
            ))}
          </View>
        </>
      ) : null}

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {niveis.erro || atividades.erro ? (
        <>
          <Aviso>{niveis.erro ?? atividades.erro}</Aviso>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} />
        </>
      ) : !atividades.dados || (!minhas && !niveis.dados) ? (
        <Corpo>Carregando...</Corpo>
      ) : atividades.dados.length === 0 ? (
        <Corpo>{minhas ? "Você ainda não incluiu atividades." : "Esta etapa ainda não tem atividades."}</Corpo>
      ) : (
        atividades.dados.map((a) => (
          <CartaoAtividade
            key={a.idAtividade}
            atividade={a}
            nomeNivel={minhas ? nomeDoNivel(a.idNivel) : undefined}
            editar={() => abrirFormulario(area, a.idAtividade)}
            mudarStatus={() =>
              executar(() => (a.status === "ATIVA" ? excluirAtividade(a.idAtividade) : mudarStatusAtividade(a.idAtividade, "ATIVA")))
            }
          />
        ))
      )}
    </Tela>
  );
}

function CartaoAtividade({
  atividade: a,
  nomeNivel,
  editar,
  mudarStatus,
}: {
  atividade: AtividadeGestao;
  nomeNivel?: string;
  editar: () => void;
  mudarStatus: () => void;
}) {
  const inativa = a.status === "INATIVA";
  const detalhes = [
    NOMES_TIPO[a.tipo],
    nomeNivel ? `Etapa ${nomeNivel}` : null,
    a.ordemNivelamento ? "Nivelamento" : null,
    inativa ? "Inativa" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Cartao destaque={!inativa && a.podeEditar}>
      <Text style={styles.titulo}>{a.conteudo}</Text>
      <Text style={[styles.legenda, inativa && { color: cores.erro }]}>{detalhes}</Text>
      <Corpo>{a.enunciado}</Corpo>
      {a.textoApoio ? (
        <Text style={styles.legenda} numberOfLines={3}>
          {a.textoApoio}
        </Text>
      ) : null}
      <Corpo>Resposta certa: {a.respostaCorreta}</Corpo>
      <Text style={styles.legenda}>{a.nomeCriador ? `Criada por ${a.nomeCriador}` : "Conteúdo do AJAI"}</Text>
      {a.podeEditar ? (
        <View style={styles.botoes}>
          <Botao titulo="Editar" variante="secundario" rotuloAcessivel={`Editar a atividade ${a.conteudo}`} onPress={editar} />
          {/* Pergunta do nivelamento não é inativada (o servidor recusa com 409). */}
          {a.ordemNivelamento ? null : (
            <Botao
              titulo={inativa ? "Ativar" : "Inativar"}
              variante="secundario"
              rotuloAcessivel={`${inativa ? "Ativar" : "Inativar"} a atividade ${a.conteudo}`}
              onPress={mudarStatus}
            />
          )}
        </View>
      ) : null}
    </Cartao>
  );
}

// ======================= Formulário =======================

interface Linha {
  texto: string;
  correta: boolean;
  /** Ícone provisório (passo 11): não aparece no formulário, mas é mantido ao editar. */
  ilustracao?: string;
}

const linhasVazias = (n: number): Linha[] => Array.from({ length: n }, () => ({ texto: "", correta: false }));

/** Dicas que mudam com o tipo (rótulos e exemplos). */
const DICAS: Record<TipoAtividade, { conteudo: string; enunciado: string; apoio?: string; apoioExemplo?: string }> = {
  LETRA: { conteudo: "Exemplo: Letra B", enunciado: "Exemplo: Qual figura começa com a letra B?" },
  SILABA: {
    conteudo: "Exemplo: Sílaba BO",
    enunciado: "Exemplo: Qual sílaba começa a palavra?",
    apoio: "Palavra em destaque",
    apoioExemplo: "Exemplo: BONÉ",
  },
  PALAVRA: {
    conteudo: "Exemplo: Palavra CASA",
    enunciado: "Exemplo: Toque nas sílabas para formar a palavra",
    apoio: "Palavra que o aluno vai formar",
    apoioExemplo: "Exemplo: CASA",
  },
  FRASE: {
    conteudo: "Exemplo: Frase: horário",
    enunciado: "Exemplo: Que horas o ônibus passa?",
    apoio: "Frase que o aluno vai ler",
    apoioExemplo: "Exemplo: O ônibus passa às 7 horas.",
  },
  INTERPRETACAO: {
    conteudo: "Exemplo: Texto: achar informação",
    enunciado: "Exemplo: Que dia é a consulta?",
    apoio: "Texto que o aluno vai ler (2 a 4 linhas)",
    apoioExemplo: "Exemplo: Dona Rosa, sua consulta é na terça-feira, às 9 horas.",
  },
  ESCRITA: { conteudo: "Exemplo: Escrita PÃO", enunciado: "Exemplo: Escreva o nome do que você come no café da manhã" },
};

export function FormularioAtividade({ area, id }: { area: AreaCadastro; id?: number }) {
  const niveis = useCarregar(listarNiveisGestao);
  const existente = useCarregar(() => (id ? visualizarAtividadeGestao(id) : Promise.resolve(undefined)), id ?? 0);

  if (niveis.erro || existente.erro) {
    return (
      <Tela>
        <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
        <Aviso>{niveis.erro ?? existente.erro}</Aviso>
        <Botao
          titulo="Tentar de novo"
          variante="secundario"
          onPress={() => {
            niveis.tentarDeNovo();
            existente.tentarDeNovo();
          }}
        />
      </Tela>
    );
  }
  if (!niveis.dados || existente.carregando) {
    return (
      <Tela>
        <Corpo>Carregando...</Corpo>
      </Tela>
    );
  }
  if (existente.dados && !existente.dados.podeEditar) {
    return (
      <Tela>
        <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
        <Aviso>Você só pode mudar as atividades que você criou.</Aviso>
      </Tela>
    );
  }
  // `key` recria o formulário com os dados carregados (sem copiar props para o estado num efeito).
  return <Formulario key={existente.dados?.idAtividade ?? "nova"} area={area} niveis={niveis.dados} atividade={existente.dados} />;
}

function Formulario({ area, niveis, atividade }: { area: AreaCadastro; niveis: NivelGestao[]; atividade?: AtividadeGestao }) {
  const [idNivel, setIdNivel] = useState<number | undefined>(atividade?.idNivel);
  const [tipo, setTipo] = useState<TipoAtividade>(atividade?.tipo ?? "LETRA");
  const [conteudo, setConteudo] = useState(atividade?.conteudo ?? "");
  const [enunciado, setEnunciado] = useState(atividade?.enunciado ?? "");
  const [textoApoio, setTextoApoio] = useState(atividade?.textoApoio ?? "");
  const [respostaEscrita, setRespostaEscrita] = useState(atividade?.tipo === "ESCRITA" ? atividade.respostaCorreta : "");
  const [linhas, setLinhas] = useState<Linha[]>(
    atividade && atividade.alternativas.length > 0
      ? atividade.alternativas.map((a) => ({ texto: a.texto, correta: a.correta, ilustracao: a.ilustracao }))
      : linhasVazias(3),
  );
  const [aviso, setAviso] = useState<Mensagem>(null);
  const [salvando, setSalvando] = useState(false);

  const dica = DICAS[tipo];
  const ehPalavra = tipo === "PALAVRA";
  const ehEscrita = tipo === "ESCRITA";
  const maximo = ehPalavra ? PECAS_MAX : MULTIPLA_MAX;
  const travadaNoNivelamento = Boolean(atividade?.ordemNivelamento);

  function trocarTipo(novo: TipoAtividade) {
    setTipo(novo);
    // Múltipla escolha tem uma só certa: ao sair de PALAVRA, desmarca as peças (o usuário marca de novo).
    if (ehPalavra && novo !== "PALAVRA") setLinhas((ls) => ls.slice(0, MULTIPLA_MAX).map((l) => ({ ...l, correta: false })));
    if (novo !== "ESCRITA" && linhas.length === 0) setLinhas(linhasVazias(3));
  }

  function mudarLinha(indice: number, mudanca: Partial<Linha>) {
    setLinhas((ls) => ls.map((l, i) => (i === indice ? { ...l, ...mudanca } : l)));
  }

  function marcarCerta(indice: number) {
    if (ehPalavra) mudarLinha(indice, { correta: !linhas[indice].correta });
    else setLinhas((ls) => ls.map((l, i) => ({ ...l, correta: i === indice })));
  }

  async function salvar() {
    setAviso(null);
    if (!idNivel) return setAviso({ texto: "Escolha a etapa da atividade.", tipo: "atencao" });
    const dados: DadosAtividade = {
      idNivel,
      tipo,
      conteudo,
      enunciado,
      textoApoio: dica.apoio ? textoApoio : undefined,
      respostaCorreta: ehEscrita ? respostaEscrita : undefined,
      alternativas: ehEscrita
        ? []
        : linhas
            .filter((l) => l.texto.trim())
            .map((l) => ({ texto: l.texto, correta: l.correta, ...(l.ilustracao ? { ilustracao: l.ilustracao } : {}) })),
    };
    setSalvando(true);
    try {
      if (atividade) await editarAtividade(atividade.idAtividade, dados);
      else await incluirAtividade(dados);
      router.back(); // a lista recarrega ao voltar
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>{atividade ? "Editar atividade" : "Incluir atividade"}</Titulo>
      {area === "professor" && !atividade ? (
        <Subtitulo>A atividade entra na trilha dos alunos assim que você salvar.</Subtitulo>
      ) : null}

      <Text style={styles.rotulo}>Etapa</Text>
      {travadaNoNivelamento ? <Corpo>Esta atividade está no nivelamento: a etapa não muda.</Corpo> : null}
      <View style={styles.opcoes}>
        {niveis.map((n) => (
          <Opcao
            key={n.idNivel}
            texto={`${n.ordem}. ${n.nome}`}
            ativo={idNivel === n.idNivel}
            onPress={() => !travadaNoNivelamento && setIdNivel(n.idNivel)}
          />
        ))}
      </View>

      <Text style={styles.rotulo}>Tipo</Text>
      <View style={styles.opcoes}>
        {TIPOS.map((t) => (
          <Opcao key={t} texto={NOMES_TIPO[t]} ativo={tipo === t} onPress={() => trocarTipo(t)} />
        ))}
      </View>

      <Campo rotulo="Conteúdo" placeholder={dica.conteudo} value={conteudo} onChangeText={setConteudo} maxLength={60} />
      {tipo === "LETRA" ? <Text style={styles.legenda}>A letra grande da tela sai daqui: escreva &quot;Letra&quot; e a letra.</Text> : null}
      <Campo
        rotulo="Enunciado (a pergunta)"
        placeholder={dica.enunciado}
        value={enunciado}
        onChangeText={setEnunciado}
        maxLength={300}
        multiline
        style={styles.multilinha}
      />
      {dica.apoio ? (
        <Campo
          rotulo={dica.apoio}
          placeholder={dica.apoioExemplo}
          value={textoApoio}
          onChangeText={setTextoApoio}
          maxLength={600}
          multiline={tipo === "INTERPRETACAO" || tipo === "FRASE"}
          style={tipo === "INTERPRETACAO" ? styles.multilinha : undefined}
        />
      ) : null}

      {ehEscrita ? (
        <Campo
          rotulo="Resposta certa"
          placeholder="Exemplo: PÃO"
          value={respostaEscrita}
          onChangeText={setRespostaEscrita}
          maxLength={100}
          autoCapitalize="characters"
        />
      ) : (
        <Cartao>
          <Subtitulo>{ehPalavra ? "Peças (sílabas)" : "Alternativas"}</Subtitulo>
          <Text style={styles.legenda}>
            {ehPalavra
              ? "Marque as peças que formam a palavra. As outras confundem de propósito."
              : "Marque qual é a certa. Só uma."}
          </Text>
          {linhas.map((l, i) => {
            const nome = `${ehPalavra ? "Peça" : "Alternativa"} ${i + 1}`;
            return (
              <View key={i} style={styles.linha}>
                <Campo rotulo={nome} value={l.texto} onChangeText={(texto) => mudarLinha(i, { texto })} maxLength={40} />
                <View style={styles.opcoes}>
                  <Opcao
                    texto={ehPalavra ? "Faz parte da palavra" : "É a certa"}
                    rotuloAcessivel={`${nome}: ${ehPalavra ? "faz parte da palavra" : "é a certa"}`}
                    ativo={l.correta}
                    onPress={() => marcarCerta(i)}
                  />
                  {linhas.length > LINHAS_MIN ? (
                    <Opcao
                      texto="Tirar"
                      rotuloAcessivel={`Tirar a ${nome}`}
                      ativo={false}
                      onPress={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
          {linhas.length < maximo ? (
            <Botao
              titulo={ehPalavra ? "Mais uma peça" : "Mais uma alternativa"}
              variante="secundario"
              onPress={() => setLinhas((ls) => [...ls, { texto: "", correta: false }])}
            />
          ) : null}
        </Cartao>
      )}

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      <Botao titulo={salvando ? "Salvando..." : "Salvar atividade"} desabilitado={salvando} onPress={salvar} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.subtitulo, fontWeight: "800", color: cores.texto },
  legenda: { fontSize: fontes.legenda, color: cores.textoSuave },
  rotulo: { fontSize: fontes.corpo, fontWeight: "700", color: cores.texto },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  botoes: { gap: 8 },
  linha: { gap: 8, paddingVertical: 4 },
  multilinha: { minHeight: 110, paddingVertical: 12, textAlignVertical: "top" },
});
