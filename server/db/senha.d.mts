// Tipos de senha.mjs, para o servidor em TypeScript importá-lo.
export function gerarHashSenha(senha: string): Promise<string>;
export function gerarHashSenhaSync(senha: string): string;
export function conferirSenha(senha: string, guardado: string): Promise<boolean>;
export function gerarSenhaProvisoria(): string;
export const HASH_FALSO: string;
