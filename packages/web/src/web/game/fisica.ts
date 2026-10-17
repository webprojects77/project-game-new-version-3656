export const GRAVIDADE = 34;
export const PULO_V = 12.6;
export const PULO_DUPLO_V = PULO_V * 0.92;
export const RAMPA_V = 16.2;

export function apice(v: number) {
  return (v * v) / (2 * GRAVIDADE);
}

export function alturaNoTempo(v: number, t: number) {
  return v * t - (GRAVIDADE / 2) * t * t;
}

export const T_PICO_RAMPA = RAMPA_V / GRAVIDADE;

export const ALTURA_DE_DOIS = 2.45;
