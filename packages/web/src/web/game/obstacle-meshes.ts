import * as THREE from "three";
import { BIOMES } from "./biomes";
import { makeModelo, type ModeloKey } from "./models";
import { PALETTE } from "./palette";
import type { ObstacleType } from "./spawn";
import { rand } from "./visual-random";

/**
 * Qual peça modelada em 3D entra em cada área. Devolve `undefined` quando a
 * área usa um obstáculo desenhado em código (praia e shopping têm os seus).
 */
export function modeloDoObstaculo(type: ObstacleType, biomeIdx: number): ModeloKey | undefined {
  if (type === "low" || type === "ride") {
    // pular: cerca de madeira no bairro/praça, barricada na escola, cone no centro
    return ([
      "cercaMadeira",
      "cerquinha",
      "cone",
      "cercaMadeira",
      undefined,
      undefined,
    ] as (ModeloKey | undefined)[])[biomeIdx];
  }
  if (type === "block") {
    // desviar: carro na rua, caixas no pátio da escola, ônibus da linha azul no centro
    return ([
      "carro",
      "caixas",
      "onibus",
      undefined,
      undefined,
      undefined,
    ] as (ModeloKey | undefined)[])[biomeIdx];
  }
  return undefined;
}

/**
 * Obstáculos são geometria low poly de verdade (sem foto), com forma e cor
 * variando por bioma: cerca/muro/placa no bairro, ônibus e semáforo no
 * centro, banco e arbusto na praça...
 */
export function construirObstaculo(type: ObstacleType, biomeIdx: number): THREE.Object3D {
  const b = BIOMES[biomeIdx];
  const group = new THREE.Group();
  const mat = (color: string, emissive = 0) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.75,
      metalness: 0.05,
      emissive: new THREE.Color(color),
      emissiveIntensity: emissive,
    });

  // --- obstáculos exclusivos da PRAIA (área 5) -------------------------
  if (biomeIdx === 4 && type === "high") {
    // guarda-sol aberto: passa deslizando por baixo
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.9, 8), mat("#B98A4A"));
    poste.position.y = 1.45;
    group.add(poste);
    for (let i = 0; i < 8; i++) {
      const gomo = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 0.7, 3),
        mat(i % 2 === 0 ? "#FF6B6B" : b.obstacle.accent, 0.2),
      );
      gomo.position.y = 2.75;
      gomo.rotation.y = (i / 8) * Math.PI * 2;
      gomo.scale.set(0.42, 1, 0.42);
      group.add(gomo);
    }
    const cupula = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.75, 8), mat("#2BD9C9", 0.25));
    cupula.position.y = 2.72;
    group.add(cupula);
    return group;
  }
  if (biomeIdx === 4 && type === "low") {
    // cadeira de praia: pular por cima
    const assento = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.9), mat("#FF6B6B"));
    assento.position.y = 0.6;
    group.add(assento);
    const costas = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.14), mat(b.obstacle.accent, 0.15));
    costas.position.set(0, 1.0, -0.42);
    costas.rotation.x = -0.35;
    group.add(costas);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), mat("#B98A4A"));
        pe.position.set(sx * 0.72, 0.3, sz * 0.36);
        group.add(pe);
      }
    }
    return group;
  }

  // --- obstáculos exclusivos do SHOPPING (área 6) ----------------------
  if (biomeIdx === 5 && type === "ride") {
    // escada rolante: dá para subir em cima pulando
    const rampa = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 3.2), mat("#9AA3AE"));
    rampa.position.set(0, 0.95, 0);
    rampa.rotation.x = 0.22;
    group.add(rampa);
    for (let i = 0; i < 6; i++) {
      const degrau = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.4), mat("#CFA94A", 0.3));
      degrau.position.set(0, 0.55 + i * 0.14, 1.4 - i * 0.55);
      group.add(degrau);
    }
    for (const sx of [-1, 1]) {
      const corrimao = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.3), mat("#FFFFFF", 0.2));
      corrimao.position.set(sx * 0.95, 1.45, 0);
      corrimao.rotation.x = 0.22;
      group.add(corrimao);
    }
    return group;
  }
  if (biomeIdx === 5 && type === "low") {
    // carrinho de compras largado no meio do corredor
    const cesta = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.9), mat("#C0392B"));
    cesta.position.y = 0.75;
    group.add(cesta);
    for (let i = 0; i < 4; i++) {
      const grade = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.95), mat("#FFFFFF", 0.2));
      grade.position.y = 0.5 + i * 0.2;
      group.add(grade);
    }
    const cabo = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.1), mat("#9AA3AE"));
    cabo.position.set(0, 1.2, 0.45);
    group.add(cabo);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 8), mat(PALETTE.ink));
        roda.rotation.z = Math.PI / 2;
        roda.position.set(sx * 0.6, 0.13, sz * 0.34);
        group.add(roda);
      }
    }
    return group;
  }

  if (type === "ride") {
    // rampa turbo: dá para pular em cima dela (modelo .glb)
    const rampa = makeModelo("rampa");
    if (rampa) {
      group.add(rampa);
      return group;
    }
  }

  if (type === "ride" || type === "low") {
    // baixo: pular. Cada área tem a sua peça modelada em 3D.
    const modelo = modeloDoObstaculo(type, biomeIdx);
    const peca = modelo ? makeModelo(modelo) : null;
    if (peca) {
      group.add(peca);
      // uma leve variação de ângulo para não parecer tudo igual
      peca.rotation.y += rand(-0.06, 0.06);
      return group;
    }

    // reserva: se o modelo ainda não carregou, usamos a cerca desenhada em código
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 0.5), mat(b.obstacle.low));
    body.position.y = 0.72;
    group.add(body);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.35), mat(b.obstacle.low));
      leg.position.set(sx * 0.72, 0.36, 0);
      group.add(leg);
    }
    if (biomeIdx === 2) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 6), mat(b.obstacle.accent, 0.25));
      cone.position.set(0, 0.4, 0.5);
      group.add(cone);
    } else {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.56), mat(b.obstacle.accent, 0.3));
      stripe.position.y = 0.95;
      group.add(stripe);
    }
  } else if (type === "high") {
    // alto: deslizar. Varal (bairro), placa (escola), semáforo (centro), galho (praça)
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.4), mat(b.obstacle.high, 0.35));
    bar.position.y = 2.55;
    group.add(bar);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.06), mat(b.obstacle.accent, 0.5));
    face.position.set(0, 2.55, 0.24);
    group.add(face);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.1, 0.18), mat(PALETTE.ink));
      post.position.set(sx * 1.05, 1.55, 0);
      group.add(post);
    }
    if (biomeIdx === 3) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), mat("#2A7A4A"));
      leaf.position.set(0, 3.2, 0);
      group.add(leaf);
    }
  } else {
    // bloqueia a faixa: carro (bairro), caixas (escola), ônibus (centro)...
    const modelo = modeloDoObstaculo(type, biomeIdx);
    const peca = modelo ? makeModelo(modelo) : null;
    if (peca) {
      group.add(peca);
      peca.rotation.y += rand(-0.04, 0.04);
      return group;
    }
    if (biomeIdx === 2) {
      const bus = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1.5), mat(b.obstacle.block));
      bus.position.y = 1.25;
      group.add(bus);
      for (let i = 0; i < 3; i++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), mat(b.obstacle.accent, 0.4));
        win.position.set(-0.6 + i * 0.6, 1.85, 0.78);
        group.add(win);
      }
    } else if (biomeIdx === 3) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), mat(b.obstacle.block));
      rock.position.y = 1.05;
      rock.rotation.set(0.3, 0.6, 0.2);
      group.add(rock);
    } else if (biomeIdx === 4) {
      // jangada encostada na areia com castelo de areia na frente
      const casco = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1.4), mat("#B98A4A"));
      casco.position.y = 0.3;
      group.add(casco);
      const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), mat("#8A6534"));
      mastro.position.y = 1.4;
      group.add(mastro);
      const vela = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 1.1), mat(b.obstacle.accent, 0.2));
      vela.position.set(0.05, 1.5, 0.2);
      group.add(vela);
      for (let i = 0; i < 3; i++) {
        const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.5 + i * 0.15, 6), mat("#E8D2A0"));
        torre.position.set(-0.6 + i * 0.6, 0.3 + i * 0.07, 0.9);
        group.add(torre);
      }
    } else if (biomeIdx === 5) {
      // vitrine de loja fechada bloqueando o corredor
      const vidro = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.7, 0.16),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color("#D8E6F2"),
          emissive: new THREE.Color("#FFFFFF"),
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.72,
          roughness: 0.05,
          metalness: 0.4,
        }),
      );
      vidro.position.y = 1.35;
      group.add(vidro);
      const moldura = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 0.3), mat("#CFA94A", 0.3));
      moldura.position.y = 2.78;
      group.add(moldura);
      for (const sx of [-1, 1]) {
        const lateral = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 0.3), mat("#CFA94A", 0.25));
        lateral.position.set(sx, 1.4, 0);
        group.add(lateral);
      }
      const roupa = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 8), mat("#F2D8E4", 0.15));
      roupa.position.set(0, 0.7, -0.2);
      group.add(roupa);
    } else {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 2.7, 0.7), mat(b.obstacle.block));
      wall.position.y = 1.35;
      group.add(wall);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 0.85), mat(b.obstacle.accent, 0.25));
      top.position.y = 2.78;
      group.add(top);
    }
  }
  return group;
}
