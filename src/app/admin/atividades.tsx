// Administrador › Atividades (passo 9; APF ListarAtividades/ExcluirAtividade): todas as atividades,
// por etapa, com Editar e Inativar/Ativar. A tela fica em components/GestaoAtividades (a mesma do professor).
import { ListaAtividades } from "@/components";

export default function AtividadesAdmin() {
  return <ListaAtividades area="admin" />;
}
