export class Sorteio {
  private estado: number;
  constructor(readonly seed: number) {
    this.estado = seed >>> 0;
  }

  proximo = (): number => {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  entre(min: number, max: number): number {
    return min + this.proximo() * (max - min);
  }

  escolher<T>(lista: readonly T[]): T {
    if (!lista.length) throw new Error("Não é possível sortear uma lista vazia.");
    return lista[Math.floor(this.proximo() * lista.length)];
  }

  embaralhar<T>(lista: readonly T[]): T[] {
    const out = [...lista];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.proximo() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

export function novaSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}