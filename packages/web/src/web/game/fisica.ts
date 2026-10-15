/**
 * Números da física do pulo, separados do motor para dar para testar.
 *
 * Alturas de referência (pés da Luiza):
 *  - pulo normal ............ ~2,33
 *  - pulo duplo (no ápice) .. ~4,3  (só com o power-up "pulo")
 *  - saída da rampa ......... ~3,86
 *
 * Por isso um obstáculo "de 2 de altura" usa topo 2,45: o pulo normal não
 * passa, o pulo duplo e a rampa passam com folga.
 */
export const GRAVIDADE = 34;
export const PULO_V = 12.6;
export const PULO_DUPLO_V = PULO_V * 0.92;
/** impulso da rampa / cama elástica / escada rolante */
export const RAMPA_V = 16.2;

/** altura máxima atingida saindo do chão com essa velocidade */
export function apice(v: number) {
  return (v * v) / (2 * GRAVIDADE);
}

/** altura dos pés t segundos depois de sair com velocidade v */
export function alturaNoTempo(v: number, t: number) {
  return v * t - (GRAVIDADE / 2) * t * t;
}

/** tempo até o ponto mais alto saindo da rampa */
export const T_PICO_RAMPA = RAMPA_V / GRAVIDADE;

/** topo dos obstáculos "de 2 de altura" (barraca quebrada, carro) */
export const ALTURA_DE_DOIS = 2.45;
