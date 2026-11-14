// Cadastro do professor (Passo 3.1, RF01; Figma "Cadastro de professor ou responsável" + código).
// Informa o código da instituição e fica esperando a instituição aprovar (tela /espera).
import { FormularioCadastro } from "@/components";

export default function CadastroProfessor() {
  return (
    <FormularioCadastro
      perfil="professor"
      titulo="Conta de professor"
      subtitulo="Peça o código da instituição onde você dá aula."
      campos={[
        { chave: "nome", rotulo: "Nome completo", tipo: "nome" },
        { chave: "email", rotulo: "E-mail", tipo: "email" },
        { chave: "telefone", rotulo: "Telefone com DDD", tipo: "telefone" },
        { chave: "codigo", rotulo: "Código da instituição", tipo: "codigo", placeholder: "Exemplo: EJAVV2" },
        { chave: "senha", rotulo: "Senha", tipo: "senha", placeholder: "Pelo menos 6 letras ou números" },
      ]}
      observacao="Depois de criar a conta, a instituição precisa aprovar você."
    />
  );
}
