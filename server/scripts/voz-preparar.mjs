// npm run voz:preparar (passo 10): gera, UMA vez, o áudio de todas as atividades ATIVAS do banco
// (instrução com o enunciado e as opções, frase/texto de apoio e cada alternativa), nas
// velocidades 0.8, 1.0 e 1.2. Assim a demonstração não depende da API de voz na hora: o
// servidor do AJAI só serve os arquivos de server/storage/audio/.
// Rodar de novo só gera o que falta (o resto vem do AudioCache).
// Precisa da API de voz configurada em server/.env (VOZ_PROVEDOR=azure, AZURE_SPEECH_KEY...; ver README › Narração por voz).
// Aqui ninguém está esperando na tela: cada áudio pode esperar até 2 minutos. No plano gratuito da
// Azure (F0, 20 pedidos por minuto) o sintetizador espera e tenta de novo quando ouve "429";
// então os ~414 áudios levam uns 20 minutos no F0 (no plano pago S0, cerca de 1 minuto).
// As variáveis precisam estar definidas ANTES de importar o servidor (são lidas ao importar).
process.env.VOZ_TEMPO_LIMITE_MS = String(Math.max(120000, Number(process.env.VOZ_TEMPO_LIMITE_MS) || 0));

const { textosDaAtividade, FRASES_FIXAS } = await import("../../src/services/textosNarrados.ts");
const { banco, fecharBanco } = await import("../src/banco.ts");
const { sintetizadorAtivo } = await import("../src/voz/index.ts");
const { VELOCIDADES_PREPARADAS, normalizarTexto, obterNarracao } = await import("../src/voz/narracao.ts");

const sintetizador = sintetizadorAtivo();
if (!sintetizador) {
  console.error("A narração do servidor está desligada. Defina VOZ_PROVEDOR em server/.env (veja README › Narração por voz).");
  process.exit(1);
}

const db = banco();
const atividades = db
  .prepare("SELECT idAtividade, tipo, enunciado, textoApoio FROM Atividade WHERE status = 'ATIVA' ORDER BY idAtividade")
  .all();
const buscarAlternativas = db.prepare("SELECT texto, ordem FROM Alternativa WHERE idAtividade = ? ORDER BY ordem");

const textos = new Set(FRASES_FIXAS.map(normalizarTexto));
for (const atividade of atividades) {
  const alternativas = buscarAlternativas.all(atividade.idAtividade);
  for (const texto of textosDaAtividade({ ...atividade, alternativas })) {
    const limpo = normalizarTexto(texto);
    if (limpo) textos.add(limpo);
  }
}

const total = textos.size * VELOCIDADES_PREPARADAS.length;
console.log(
  `Voz "${sintetizador.nome}" (${sintetizador.vozPadrao}): ${atividades.length} atividades ativas, ` +
    `${textos.size} textos × ${VELOCIDADES_PREPARADAS.length} velocidades = ${total} áudios.`,
);

let feitos = 0;
let gerados = 0;
const falhas = [];
todos: for (const velocidade of VELOCIDADES_PREPARADAS) {
  for (const texto of textos) {
    try {
      const { gerado } = await obterNarracao(texto, velocidade);
      if (gerado) gerados++;
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro);
      falhas.push(`[${velocidade}] ${texto.slice(0, 60)}: ${motivo}`);
      // 5 falhas sem nenhum sucesso: chave/região erradas ou sem internet. Não adianta insistir.
      if (falhas.length >= 5 && gerados === 0) {
        console.error("\nParei depois de 5 falhas seguidas. O motivo está nas linhas [voz:...] acima.");
        break todos;
      }
    }
    feitos++;
    if (feitos % 25 === 0 || feitos === total) process.stdout.write(`\r${feitos}/${total}`);
  }
}

console.log(`\nPronto: ${gerados} gerados agora, ${feitos - gerados - falhas.length} já estavam prontos, ${falhas.length} falharam.`);
if (falhas.length) {
  console.log("Falharam (o motivo está nas linhas [voz:...] acima; confira a chave/região em server/.env e a internet):");
  for (const f of falhas.slice(0, 10)) console.log(`  - ${f}`);
  if (falhas.length > 10) console.log(`  ... e mais ${falhas.length - 10}.`);
}
fecharBanco();
process.exit(falhas.length ? 1 : 0);
