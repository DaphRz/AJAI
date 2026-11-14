// Cadastro do responsável (Passo 3.1, RF01; Figma "Cadastro de professor ou responsável").
// Familiar que acompanha até 2 pessoas. Não usa código de instituição e não tem turma.
import { FormularioCadastro } from "@/components";

export default function CadastroResponsavel() {
  return (
    <FormularioCadastro
      perfil="responsavel"
      titulo="Conta de responsável"
      subtitulo="Para acompanhar até 2 pessoas da família."
      campos={[
        { chave: "nome", rotulo: "Nome completo", tipo: "nome" },
        { chave: "email", rotulo: "E-mail", tipo: "email" },
        { chave: "telefone", rotulo: "Telefone com DDD", tipo: "telefone" },
        { chave: "senha", rotulo: "Senha", tipo: "senha", placeholder: "Pelo menos 6 letras ou números" },
      ]}
    />
  );
}
