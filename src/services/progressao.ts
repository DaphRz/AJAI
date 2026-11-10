/**
 * Regras de nivelamento e progressão (RF03, RF16, RF17, RF19).
 *
 * Desde o passo 5, as regras moram no SERVIDOR (server/src/progressao.ts, com testes):
 * é lá que a resposta é corrigida e o nível sobe. Este arquivo só as reexporta para o
 * painel do professor (services/relatorios.ts), que ainda calcula em cima do mock até o
 * passo 10. Não escreva regra nova aqui: escreva no servidor.
 * TODO (passo 10): apagar quando o painel vier de GET /professor/painel.
 */
export {
  JANELA_PROGRESSAO,
  definirNivelInicial,
  deveAvancar,
  identificarDificuldades,
  taxaDeAcerto,
} from "../../server/src/progressao";
