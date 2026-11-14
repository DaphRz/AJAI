// Cadastro do aluno (Passo 3.1, RF01; Figma "Cadastro de aluno", sem o telefone do professor).
// O aluno cria a própria conta: nome, senha e pelo menos um entre usuário, e-mail ou telefone.
// O nome de usuário é sugerido a partir do nome. Sem "Ouvir ajuda" (regra do cadastro).
import { FormularioCadastro } from "@/components";
import { sugerirNomeUsuario } from "@/services/auth";

export default function CadastroAluno() {
  return (
    <FormularioCadastro
      perfil="aluno"
      titulo="Conta de aluno"
      subtitulo="Você vai entrar com o seu usuário e a sua senha."
      campos={[
        { chave: "nome", rotulo: "Seu nome", tipo: "nome" },
        {
          chave: "nomeUsuario",
          rotulo: "Nome de usuário",
          tipo: "usuario",
          placeholder: "Exemplo: maria.silva",
          sugerir: { de: "nome", com: sugerirNomeUsuario },
        },
        { chave: "email", rotulo: "E-mail", tipo: "email", dica: "se tiver" },
        { chave: "telefone", rotulo: "Telefone com DDD", tipo: "telefone", dica: "se tiver" },
        { chave: "senha", rotulo: "Senha", tipo: "senha", placeholder: "Pelo menos 6 letras ou números" },
      ]}
      observacao="Para entrar, use o usuário, o e-mail ou o telefone. Anote sua senha num lugar seguro."
    />
  );
}
