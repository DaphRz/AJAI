// Professor › Conta (passo 8): dados (editar nome), instituição, "Meus alunos" (convites/vínculos),
// trocar senha e sair. As turmas têm aba própria. Sem frame no Figma: segue o padrão das telas desenhadas.
import { router } from "expo-router";
import { useState } from "react";
import { Aviso, Botao, Campo, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { useSessao } from "@/context/sessao";
import { mensagemDeErro } from "@/services/api";
import { editarMeuNome } from "@/services/auth";

export default function Conta() {
  const { usuario, entrar, sair } = useSessao();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tipo: "atencao" | "sucesso" } | null>(null);

  async function salvarNome() {
    setAviso(null);
    setSalvando(true);
    try {
      entrar(await editarMeuNome(nome));
      setEditando(false);
      setAviso({ texto: "Nome atualizado.", tipo: "sucesso" });
    } catch (e) {
      setAviso({ texto: mensagemDeErro(e), tipo: "atencao" });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Titulo>Conta</Titulo>
      <Cartao>
        {editando ? (
          <>
            <Campo rotulo="Seu nome" value={nome} onChangeText={setNome} autoComplete="name" maxLength={100} />
            <Botao titulo={salvando ? "Salvando..." : "Salvar nome"} desabilitado={salvando} onPress={salvarNome} />
            <Botao
              titulo="Voltar"
              variante="secundario"
              onPress={() => {
                setNome(usuario?.nome ?? "");
                setEditando(false);
              }}
            />
          </>
        ) : (
          <>
            <Subtitulo>{usuario?.nome}</Subtitulo>
            <Botao titulo="Editar nome" variante="secundario" onPress={() => setEditando(true)} />
          </>
        )}
        {usuario?.email ? <Corpo>E-mail: {usuario.email}</Corpo> : null}
        {usuario?.telefone ? <Corpo>Telefone: {usuario.telefone}</Corpo> : null}
        {usuario?.situacao?.nomeInstituicao ? <Corpo>Instituição: {usuario.situacao.nomeInstituicao}</Corpo> : null}
      </Cartao>
      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      <Botao titulo="Meus alunos" onPress={() => router.push("/professor/alunos")} />
      <Botao titulo="Trocar minha senha" variante="secundario" onPress={() => router.push("/professor/senha")} />
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
