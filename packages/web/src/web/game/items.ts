/**
 * Itens coletáveis em 3D low poly (specs visuais v2).
 *
 * Nada de billboard/foto: cada item é uma malha de verdade, com contorno de
 * cor forte, flutuando e girando devagar para chamar atenção na pista.
 */
import * as THREE from "three";
import { PALETTE } from "./palette";

export type ItemKind = "coin" | "heart" | "boost" | "special";

function glowMat(color: string, emissive = 0.55) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: emissive,
    roughness: 0.35,
    metalness: 0.15,
  });
}

/**
 * Gravação temática da moeda: cada área tem um símbolo diferente no meio.
 * 0 bairro (casinha) · 1 escola (lápis) · 2 centro (prédio) · 3 praça (folha)
 * 4 praia (concha) · 5 shopping (sacola)
 */
function makeMotif(motif: number): THREE.Object3D {
  const m = glowMat("#FFE9A8", 0.85);
  const g = new THREE.Group();
  switch (motif) {
    case 1: {
      // lápis: corpo comprido + ponta
      const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), m);
      g.add(corpo);
      const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), m);
      ponta.position.y = 0.2;
      g.add(ponta);
      break;
    }
    case 2: {
      // prédio: dois blocos de alturas diferentes
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.07), m);
      a.position.x = -0.07;
      g.add(a);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.07), m);
      b.position.set(0.08, -0.06, 0);
      g.add(b);
      break;
    }
    case 3: {
      // folha: losango achatado
      const folha = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), m);
      folha.scale.set(0.6, 1, 0.3);
      folha.rotation.z = 0.5;
      g.add(folha);
      break;
    }
    case 4: {
      // concha: leque de nervuras
      for (let i = -2; i <= 2; i++) {
        const nervura = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.26, 0.06), m);
        nervura.position.x = i * 0.055;
        nervura.rotation.z = i * 0.18;
        g.add(nervura);
      }
      break;
    }
    case 5: {
      // sacola: corpo + alça
      const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.07), m);
      corpo.position.y = -0.04;
      g.add(corpo);
      const alca = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 4, 10, Math.PI), m);
      alca.position.y = 0.08;
      g.add(alca);
      break;
    }
    default: {
      // casinha: quadrado + telhado
      const parede = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.07), m);
      parede.position.y = -0.05;
      g.add(parede);
      const telhado = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.15, 4), m);
      telhado.position.y = 0.11;
      telhado.rotation.y = Math.PI / 4;
      g.add(telhado);
      break;
    }
  }
  return g;
}

/** Moeda: cilindro dourado achatado, sempre girando no próprio eixo. */
function makeCoin(motif = 0) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), glowMat(PALETTE.gold, 0.6));
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.13, 12), glowMat("#FFE9A8", 0.75));
  core.rotation.z = Math.PI / 2;
  g.add(core);
  // símbolo gravado nas duas faces da moeda
  for (const sx of [-1, 1]) {
    const face = makeMotif(motif);
    face.position.x = sx * 0.075;
    face.rotation.y = Math.PI / 2;
    g.add(face);
  }
  return g;
}

/** Coração de vida — VERDE (#3CE87A), a cor de cura do documento. */
function makeHeart() {
  const g = new THREE.Group();
  const m = glowMat(PALETTE.lime, 0.65);
  for (const sx of [-1, 1]) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), m);
    lobe.position.set(sx * 0.18, 0.16, 0);
    g.add(lobe);
  }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.52, 8), m);
  tip.position.y = -0.22;
  tip.rotation.x = Math.PI;
  g.add(tip);
  g.rotation.z = 0;
  return g;
}

/** Boost: raio laranja/amarelo (dois prismas cruzados). */
function makeBoost() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 4), glowMat(PALETTE.gold, 0.8));
  top.position.set(0.06, 0.22, 0);
  top.rotation.set(Math.PI, 0, 0.35);
  g.add(top);
  const bottom = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 4), glowMat(PALETTE.orange, 0.8));
  bottom.position.set(-0.06, -0.2, 0);
  bottom.rotation.z = 0.35;
  g.add(bottom);
  return g;
}

/** Item especial: moldura polaroid rosa/ciano — o mais raro da pista. */
function makeSpecial() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 0.08), glowMat(PALETTE.paper, 0.25));
  g.add(frame);
  const photo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.12), glowMat(PALETTE.cyan, 0.7));
  photo.position.y = 0.08;
  g.add(photo);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.14), glowMat(PALETTE.pink, 0.7));
  tape.position.y = 0.42;
  tape.rotation.z = 0.3;
  g.add(tape);
  return g;
}

/** Cria a malha 3D do item (motif = índice da área, usado na moeda). */
export function makeItemMesh(kind: ItemKind, motif = 0): THREE.Object3D {
  if (kind === "coin") return makeCoin(motif);
  if (kind === "heart") return makeHeart();
  if (kind === "boost") return makeBoost();
  return makeSpecial();
}

/** Flutuação + rotação lenta, chamada a cada quadro. */
export function animateItem(kind: ItemKind, obj: THREE.Object3D, baseY: number, t: number) {
  obj.position.y = baseY + Math.sin(t * 3 + obj.position.z * 0.4) * 0.15;
  if (kind === "coin") obj.rotation.x = t * 3.4;
  else if (kind === "special") obj.rotation.y = t * 1.6;
  else obj.rotation.y = t * 1.1;
}

/** Libera geometria e material do item. */
export function disposeItem(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const m = child.material as THREE.Material | THREE.Material[];
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m.dispose();
    }
  });
}
