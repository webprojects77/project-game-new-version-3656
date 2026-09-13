/**
 * Power-ups universais (tabela do documento de specs visuais).
 *
 * Cada power-up tem: ícone para a HUD, cor, duração e uma malha 3D low poly
 * que aparece flutuando na pista. Aparecem em média a cada 30-45 segundos.
 */
import * as THREE from "three";
import { PALETTE } from "./palette";

export type PowerKind = "iman" | "escudo" | "x2" | "pulo" | "turbo" | "fuga" | "fantasma" | "chance";

export interface PowerInfo {
  key: PowerKind;
  nome: string;
  icone: string;
  cor: string;
  /** duração em ms; 0 = efeito instantâneo ou guardado em slot */
  duracao: number;
  /** peso no sorteio (quanto maior, mais comum) */
  peso: number;
  descricao: string;
}

export const POWERS: Record<PowerKind, PowerInfo> = {
  iman: {
    key: "iman",
    nome: "Ímã",
    icone: "🧲",
    cor: PALETTE.cyan,
    duracao: 8000,
    peso: 5,
    descricao: "Puxa as moedas das três faixas",
  },
  escudo: {
    key: "escudo",
    nome: "Escudo",
    icone: "🛡️",
    cor: "#8CC9FF",
    duracao: 0,
    peso: 5,
    descricao: "Bolha que aguenta uma batida",
  },
  x2: {
    key: "x2",
    nome: "Multiplicador x2",
    icone: "✖️",
    cor: PALETTE.gold,
    duracao: 10000,
    peso: 4,
    descricao: "Dobra os pontos por 10 segundos",
  },
  pulo: {
    key: "pulo",
    nome: "Duplo pulo",
    icone: "🪽",
    cor: PALETTE.lime,
    duracao: 12000,
    peso: 4,
    descricao: "Permite pular de novo no ar",
  },
  turbo: {
    key: "turbo",
    nome: "Boost de velocidade",
    icone: "⚡",
    cor: PALETTE.orange,
    duracao: 5000,
    peso: 5,
    descricao: "Dispara para frente atravessando tudo",
  },
  fuga: {
    key: "fuga",
    nome: "Fuga Rápida",
    icone: "💨",
    cor: "#B9A6FF",
    duracao: 9000,
    peso: 3,
    descricao: "O policial some por um tempo",
  },
  fantasma: {
    key: "fantasma",
    nome: "Modo Fantasma",
    icone: "👻",
    cor: "#E9E4FF",
    duracao: 6000,
    peso: 3,
    descricao: "Atravessa obstáculos sem perder vida",
  },
  chance: {
    key: "chance",
    nome: "Segunda Chance",
    icone: "🔁",
    cor: PALETTE.pink,
    duracao: 0,
    peso: 2,
    descricao: "Volta a correr uma vez depois de ser pega",
  },
};

const ORDEM: PowerKind[] = ["iman", "escudo", "x2", "pulo", "turbo", "fuga", "fantasma", "chance"];

/** Sorteia um power-up respeitando os pesos da tabela. */
export function sortearPower(): PowerKind {
  const total = ORDEM.reduce((s, k) => s + POWERS[k].peso, 0);
  let r = Math.random() * total;
  for (const k of ORDEM) {
    r -= POWERS[k].peso;
    if (r <= 0) return k;
  }
  return "iman";
}

function mat(color: string, emissive = 0.7) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: emissive,
    roughness: 0.3,
    metalness: 0.2,
  });
}

/** Cápsula que carrega o power-up: esfera translúcida + símbolo dentro. */
export function makePowerMesh(kind: PowerKind): THREE.Object3D {
  const info = POWERS[kind];
  const g = new THREE.Group();

  const bolha = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.52, 1),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(info.cor),
      emissive: new THREE.Color(info.cor),
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.34,
      roughness: 0.1,
    }),
  );
  g.add(bolha);

  const nucleo = new THREE.Group();
  nucleo.name = "nucleo";
  const m = mat(info.cor);

  switch (kind) {
    case "iman": {
      // ferradura: dois braços e uma base
      for (const sx of [-1, 1]) {
        const braco = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), m);
        braco.position.set(sx * 0.14, 0.08, 0);
        nucleo.add(braco);
      }
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.12), m);
      base.position.y = -0.14;
      nucleo.add(base);
      break;
    }
    case "escudo": {
      const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.02, 0.42, 6), m);
      corpo.rotation.x = Math.PI;
      nucleo.add(corpo);
      break;
    }
    case "x2": {
      for (const rot of [0.7, -0.7]) {
        const barra = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.11, 0.11), m);
        barra.rotation.z = rot;
        nucleo.add(barra);
      }
      break;
    }
    case "pulo": {
      for (const sx of [-1, 1]) {
        const asa = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 4), m);
        asa.position.set(sx * 0.2, 0, 0);
        asa.rotation.z = sx * 0.9;
        nucleo.add(asa);
      }
      break;
    }
    case "turbo": {
      const raio = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.46, 4), m);
      raio.rotation.z = 0.3;
      nucleo.add(raio);
      const raio2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.46, 4), mat(PALETTE.gold));
      raio2.rotation.set(Math.PI, 0, -0.3);
      raio2.position.y = -0.18;
      nucleo.add(raio2);
      break;
    }
    case "fuga": {
      for (let i = 0; i < 3; i++) {
        const risco = new THREE.Mesh(new THREE.BoxGeometry(0.42 - i * 0.1, 0.08, 0.08), m);
        risco.position.set(i * 0.04, 0.16 - i * 0.16, 0);
        nucleo.add(risco);
      }
      break;
    }
    case "fantasma": {
      const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), m);
      cabeca.position.y = 0.06;
      nucleo.add(cabeca);
      const saia = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 8), m);
      saia.position.y = -0.16;
      saia.rotation.x = Math.PI;
      nucleo.add(saia);
      break;
    }
    case "chance": {
      const anel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 6, 14), m);
      nucleo.add(anel);
      const seta = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), m);
      seta.position.set(0.24, 0.1, 0);
      seta.rotation.z = -1.2;
      nucleo.add(seta);
      break;
    }
  }

  g.add(nucleo);
  return g;
}

/** Gira a cápsula e faz o símbolo pulsar. */
export function animatePower(obj: THREE.Object3D, baseY: number, t: number) {
  obj.position.y = baseY + Math.sin(t * 2.6 + obj.position.z * 0.3) * 0.18;
  obj.rotation.y = t * 1.4;
  const nucleo = obj.getObjectByName("nucleo");
  if (nucleo) {
    const s = 1 + Math.sin(t * 5) * 0.12;
    nucleo.scale.setScalar(s);
  }
}
