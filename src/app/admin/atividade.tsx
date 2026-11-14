// Administrador › Incluir ou editar atividade (passo 9; APF IncluirAtividade/EditarAtividade).
// Sem `id` = atividade nova; com `id` = editar (o administrador edita todas).
import { useLocalSearchParams } from "expo-router";
import { FormularioAtividade } from "@/components";

export default function AtividadeAdmin() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <FormularioAtividade area="admin" id={id ? Number(id) : undefined} />;
}
