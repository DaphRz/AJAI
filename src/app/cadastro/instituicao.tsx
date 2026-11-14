// Inscrição da instituição (Passo 3.1). Fica PENDENTE até o administrador do AJAI aprovar;
// ao aprovar, ganha o código que os professores informam no cadastro. Sem tela no Figma (passo 11).
import { FormularioCadastro } from "@/components";

export default function CadastroInstituicao() {
  return (
    <FormularioCadastro
      perfil="instituicao"
      titulo="Inscrever instituição"
      subtitulo="Escola, ONG ou projeto de EJA."
      campos={[
        { chave: "nome", rotulo: "Nome da instituição", tipo: "nome" },
        { chave: "cnpj", rotulo: "CNPJ", tipo: "cnpj", placeholder: "Só os 14 números" },
        { chave: "nomeResponsavel", rotulo: "Nome de quem responde pela instituição", tipo: "nome" },
        { chave: "email", rotulo: "E-mail", tipo: "email" },
        { chave: "telefone", rotulo: "Telefone com DDD", tipo: "telefone" },
        { chave: "senha", rotulo: "Senha", tipo: "senha", placeholder: "Pelo menos 6 letras ou números" },
      ]}
      observacao="O AJAI confere os dados. Depois da aprovação, você recebe o código para os seus professores."
    />
  );
}
