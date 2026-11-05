// Tipos de conectar.mjs, para o servidor em TypeScript (server/src/banco.ts) poder importá-lo.
import type { DatabaseSync } from "node:sqlite";

export const raiz: string;
export const caminhoBanco: string;
export function abrirBanco(): DatabaseSync;
export function executadoDireto(importMetaUrl: string): boolean;
