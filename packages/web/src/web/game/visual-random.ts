/**
 * Sorteios só de aparência (cenário, partículas, rotação). Ficam fora da seed
 * da pista de propósito: mudar um efeito visual não altera a corrida.
 */
export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
