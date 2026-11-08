// Hash de senha com scrypt (node:crypto): nativo do Node, sem módulo para compilar.
// Usado pelo servidor (server/src/rotas/auth.ts) e pelos scripts (seed, senha provisória).
// Formato guardado em Usuario.senhaHash:  scrypt$N$r$p$<sal base64>$<hash base64>
// Parâmetros da recomendação da OWASP para scrypt (N = 2^17, r = 8, p = 1).
import { randomBytes, randomInt, scrypt, scryptSync, timingSafeEqual } from "node:crypto";

const N = 2 ** 17;
const R = 8;
const P = 1;
const TAMANHO = 64;
// scrypt usa ~128 * N * r bytes de memória (128 MB aqui); o limite padrão do Node é 32 MB.
const maxmem = 256 * 1024 * 1024;

function montar(n, r, p, sal, hash) {
  return `scrypt$${n}$${r}$${p}$${sal.toString("base64")}$${hash.toString("base64")}`;
}

function separar(guardado) {
  const partes = String(guardado).split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return null;
  const [, n, r, p, sal, hash] = partes;
  return { n: Number(n), r: Number(r), p: Number(p), sal: Buffer.from(sal, "base64"), hash: Buffer.from(hash, "base64") };
}

/** Gera o hash de uma senha (assíncrono: não trava o servidor). */
export function gerarHashSenha(senha) {
  const sal = randomBytes(16);
  return new Promise((ok, falha) => {
    scrypt(senha, sal, TAMANHO, { N, r: R, p: P, maxmem }, (erro, hash) =>
      erro ? falha(erro) : ok(montar(N, R, P, sal, hash)),
    );
  });
}

/** Versão síncrona, para scripts (seed). */
export function gerarHashSenhaSync(senha) {
  const sal = randomBytes(16);
  return montar(N, R, P, sal, scryptSync(senha, sal, TAMANHO, { N, r: R, p: P, maxmem }));
}

/** Confere a senha contra o hash guardado, em tempo constante. Hash desconhecido = false. */
export function conferirSenha(senha, guardado) {
  const partes = separar(guardado);
  if (!partes) return Promise.resolve(false);
  const { n, r, p, sal, hash } = partes;
  return new Promise((ok) => {
    scrypt(senha, sal, hash.length, { N: n, r, p, maxmem }, (erro, calculado) =>
      ok(!erro && calculado.length === hash.length && timingSafeEqual(calculado, hash)),
    );
  });
}

/** Senha provisória de 6 números (fácil de ditar e digitar para o público da EJA). */
export function gerarSenhaProvisoria() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash fixo usado quando o usuário não existe, para o login levar o mesmo tempo. */
export const HASH_FALSO = montar(N, R, P, Buffer.alloc(16), Buffer.alloc(TAMANHO));
