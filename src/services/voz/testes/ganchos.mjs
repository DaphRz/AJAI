// Ganchos de resolução usados por carregador.mjs (rodam numa thread separada do Node).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const falsos = {
  "expo-speech": "./falsos/expo-speech.mjs",
  "expo-audio": "./falsos/expo-audio.mjs",
  "expo-constants": "./falsos/expo-constants.mjs",
  "react-native": "./falsos/react-native.mjs",
};

export async function resolve(especificador, contexto, proximo) {
  if (falsos[especificador]) {
    return { url: new URL(falsos[especificador], import.meta.url).href, shortCircuit: true };
  }
  if ((especificador.startsWith("./") || especificador.startsWith("../")) && contexto.parentURL) {
    const base = new URL(especificador, contexto.parentURL);
    for (const final of ["", ".ts", ".tsx", "/index.ts"]) {
      const candidato = new URL(base.href + final);
      if (existsSync(fileURLToPath(candidato)) && (final || /\.(m?js|tsx?)$/.test(base.pathname))) {
        return { url: candidato.href, shortCircuit: true };
      }
    }
  }
  return proximo(especificador, contexto);
}
