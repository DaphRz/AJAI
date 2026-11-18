// Carregador dos testes de voz do app no Node (`npm run app:test`), até o jest-expo do passo 12.
// Faz o Node entender os imports do app sem extensão ("./voz", "../api") e troca os módulos
// nativos do Expo por versões de mentira (pasta falsos/), que registram o que foi chamado.
import { register } from "node:module";

register("./ganchos.mjs", import.meta.url);
