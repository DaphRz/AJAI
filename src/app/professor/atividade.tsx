// Professor › Incluir ou editar atividade (passo 9). Sem `id` = nova; com `id` = editar uma que ele criou
// (o servidor recusa as dos outros com 403).
import { useLocalSearchParams } from "expo-router";
import { FormularioAtividade } from "@/components";

export default function AtividadeProfessor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <FormularioAtividade area="professor" id={id ? Number(id) : undefined} />;
}
