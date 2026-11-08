// Figma: "AJAI · Cadastro de aluno" (Professor.IncluirAluno, RF01), agora DENTRO da conta do
// professor. Sem o campo "Telefone do Professor/Responsável": quem cadastra já é o professor, e o
// aluno entra na turma dele. Acrescentado: "Nome de usuário" (o aluno não tem e-mail).
import { router } from "expo-router";
import { useState } from "react";
import { Aviso, Botao, Campo, Cartao, Corpo, Subtitulo, Tela, Titulo } from "@/components";
import { mensagemDeErro } from "@/services/api";
import { cadastrarAluno, sugerirNomeUsuario, type ContaAluno } from "@/services/contasAlunos";

export default function NovoAluno() {
  const [nome, setNome] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [usuarioEditado, setUsuarioEditado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState<{ conta: ContaAluno; senha: string } | null>(null);

  function aoMudarNome(texto: string) {
    setNome(texto);
    // Sugere o usuário pelo nome até o professor escrever um por conta própria.
    if (!usuarioEditado) setNomeUsuario(sugerirNomeUsuario(texto));
  }

  async function aoCadastrar() {
    setErro(null);
    setEnviando(true);
    try {
      const conta = await cadastrarAluno({ nome, nomeUsuario, senha });
      setCriado({ conta, senha });
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  function cadastrarOutro() {
    setCriado(null);
    setNome("");
    setNomeUsuario("");
    setUsuarioEditado(false);
    setSenha("");
  }

  if (criado) {
    return (
      <Tela>
        <Titulo>Aluno cadastrado</Titulo>
        <Subtitulo>Entregue estes dados ao aluno. Ele usa para entrar no aplicativo.</Subtitulo>
        <Cartao destaque>
          <Corpo>Nome: {criado.conta.nome}</Corpo>
          <Corpo>Usuário: {criado.conta.nomeUsuario}</Corpo>
          <Corpo>Senha: {criado.senha}</Corpo>
          {criado.conta.turma ? <Corpo>Turma: {criado.conta.turma}</Corpo> : null}
        </Cartao>
        <Botao titulo="Cadastrar outro aluno" onPress={cadastrarOutro} />
        <Botao titulo="Ver contas dos alunos" variante="secundario" onPress={() => router.replace("/professor/contas")} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Botao titulo="‹ Voltar" variante="link" onPress={() => router.back()} />
      <Titulo>Cadastrar aluno</Titulo>
      <Campo rotulo="Nome do aluno" placeholder="Digite aqui" autoComplete="off" value={nome} onChangeText={aoMudarNome} />
      <Campo
        rotulo="Nome de usuário"
        placeholder="Exemplo: maria.silva"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        value={nomeUsuario}
        onChangeText={(texto) => {
          setUsuarioEditado(true);
          setNomeUsuario(texto);
        }}
      />
      <Campo
        rotulo="Senha"
        placeholder="Pelo menos 6 letras ou números"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        value={senha}
        onChangeText={setSenha}
      />
      <Corpo>A senha aparece para você anotar e entregar ao aluno. Só você pode mudá-la depois.</Corpo>
      {erro ? <Aviso>{erro}</Aviso> : null}
      <Botao titulo={enviando ? "Cadastrando..." : "Cadastrar aluno →"} desabilitado={enviando} onPress={aoCadastrar} />
    </Tela>
  );
}
