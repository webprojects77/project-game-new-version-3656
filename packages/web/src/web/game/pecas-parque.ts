import * as THREE from "three";
import { Molde, placa, retangulo, texturaArquivo, texturaCanvas } from "./pecas-base";

type V3 = [number, number, number];

export function muroEscola() {
  const m = new Molde();
  const W = 8;
  const H = 2.1;
  const D = 0.5;
  m.caixa(W, H, D, "#B9BCC4", { pos: [0, H / 2, 0] });
  m.caixa(W + 0.12, 0.14, D + 0.16, "#7D828D", { pos: [0, 0.07, 0] });
  m.caixa(W + 0.1, 0.12, D + 0.12, "#9EA2AB", { pos: [0, H + 0.06, 0] });
  for (const x of [-W / 2 + 0.2, -1.4, 1.4, W / 2 - 0.2]) {
    m.caixa(0.42, H + 0.12, 0.12, "#A9ADB6", { pos: [x, (H + 0.12) / 2, -D / 2 - 0.05] });
  }
  m.extra(placa("muro-grafite", () => texturaArquivo("/textures/muro-grafite.webp"), W, H + 0.12, [0, (H + 0.12) / 2, D / 2 + 0.006]));
  return m.pronto();
}

function texEscola() {
  return texturaCanvas(512, 128, (ctx) => {
    ctx.fillStyle = "#2462D8";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    retangulo(ctx, 10, 10, 492, 108, 10);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 80px Poppins, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ESCOLA", 256, 68);
  });
}

export function portaoEscola() {
  const m = new Molde();
  const AZ = "#2462D8";
  const AZ_ESC = "#1B4BB0";
  const BR = "#F1F3F8";
  const pilar = (x: number, h: number, w: number) => {
    m.caixa(w, 0.45, w, AZ, { pos: [x, 0.225, 0] });
    m.caixa(w - 0.06, h - 0.45, w - 0.06, BR, { pos: [x, 0.45 + (h - 0.45) / 2, 0] });
    m.caixa(w + 0.1, 0.22, w + 0.1, AZ, { pos: [x, h + 0.11, 0] });
    m.add(new THREE.ConeGeometry(0.5, 0.42, 4).rotateY(Math.PI / 4), AZ_ESC, {
      pos: [x, h + 0.43, 0],
      esc: [(w + 0.1) / 0.707, 1, (w + 0.1) / 0.707],
    });
  };
  for (const sx of [-1, 1]) pilar(sx * 2.45, 4.1, 0.85);
  m.caixa(4.3, 0.9, 0.42, AZ, { pos: [0, 3.65, 0] });
  m.caixa(4.4, 0.1, 0.5, BR, { pos: [0, 4.15, 0] });
  m.caixa(4.4, 0.1, 0.5, BR, { pos: [0, 3.15, 0] });
  m.extra(placa("escola-letreiro", texEscola, 3.9, 0.8, [0, 3.65, 0.215]));
  m.extra(placa("escola-letreiro", texEscola, 3.9, 0.8, [0, 3.65, -0.215], [0, Math.PI, 0]));
  m.caixa(4.0, 0.12, 0.12, AZ_ESC, { pos: [0, 0.16, 0] });
  m.caixa(4.0, 0.12, 0.12, AZ_ESC, { pos: [0, 2.6, 0] });
  m.caixa(4.0, 0.08, 0.1, AZ_ESC, { pos: [0, 2.2, 0] });
  for (let i = 0; i <= 16; i++) {
    const x = -1.95 + i * (3.9 / 16);
    m.caixa(0.07, 2.45, 0.07, AZ, { pos: [x, 1.38, 0] });
  }
  m.caixa(0.1, 2.5, 0.16, AZ_ESC, { pos: [0, 1.38, 0] });
  m.caixa(0.18, 0.22, 0.2, "#9EA6B4", { pos: [0.12, 1.25, 0.06] });
  for (const sx of [-1, 1]) {
    pilar(sx * 3.75, 2.2, 1.0);
    m.caixa(0.5, 0.7, 0.06, AZ, { pos: [sx * 3.75, 1.4, 0.48] });
    m.caixa(0.38, 0.56, 0.07, "#4FB6F0", { pos: [sx * 3.75, 1.4, 0.49], camada: "brilho" });
    for (const [a, b] of [[2.9, 3.25], [4.25, 5.4]]) {
      const cx = sx * ((a + b) / 2);
      const w = b - a;
      m.caixa(w, 0.32, 0.5, AZ, { pos: [cx, 0.16, 0] });
      m.caixa(w, 0.32, 0.44, BR, { pos: [cx, 0.48, 0] });
      m.caixa(w, 0.08, 0.1, AZ_ESC, { pos: [cx, 1.72, 0] });
      const n = Math.max(2, Math.round(w / 0.2));
      for (let i = 0; i <= n; i++) {
        m.caixa(0.06, 1.1, 0.06, AZ, { pos: [sx * (a + (w * i) / n), 1.18, 0] });
      }
    }
  }
  return m.pronto();
}

function mochila(m: Molde, x: number, cor: string, escura: string, emblema: number) {
  const W = 0.5;
  const H = 0.56;
  const D = 0.3;
  m.caixa(W, H, D, cor, { pos: [x, 0.04 + H / 2, 0] });
  m.add(new THREE.CylinderGeometry(W / 2, W / 2, D, 10, 1, false, 0, Math.PI), cor, {
    pos: [x, 0.04 + H, 0],
    rot: [Math.PI / 2, Math.PI / 2, 0],
    esc: [1, 1, 0.55],
  });
  m.caixa(W + 0.02, 0.06, D + 0.02, escura, { pos: [x, 0.03, 0] });
  m.caixa(W - 0.12, 0.26, 0.12, escura, { pos: [x, 0.22, D / 2 + 0.04] });
  m.caixa(W - 0.16, 0.025, 0.02, "#F1F3F8", { pos: [x, 0.34, D / 2 + 0.105] });
  m.caixa(0.04, 0.06, 0.02, "#C9CED8", { pos: [x + 0.1, 0.31, D / 2 + 0.11] });
  m.anel(W / 2 - 0.03, 0.012, 3, 10, "#F1F3F8", { pos: [x, 0.04 + H - 0.02, D / 2 + 0.005] }, Math.PI);
  m.anel(0.08, 0.02, 4, 8, escura, { pos: [x, 0.04 + H + W / 2 * 0.55 + 0.02, 0], rot: [0, Math.PI / 2, 0] }, Math.PI);
  for (const sx of [-1, 1]) m.caixa(0.05, 0.42, 0.06, escura, { pos: [x + sx * 0.14, 0.36, -D / 2 - 0.02] });
  const ey = 0.5;
  const ez = D / 2 + 0.012;
  const branco = "#FFFFFF";
  if (emblema === 0) m.caixa(0.08, 0.08, 0.02, branco, { pos: [x, ey, ez], rot: [0, 0, Math.PI / 4] });
  else if (emblema === 1) m.caixa(0.09, 0.09, 0.02, "#FFD23A", { pos: [x, ey, ez], rot: [0, 0, Math.PI / 4] });
  else if (emblema === 2) m.esfera(0.05, branco, { pos: [x, ey, ez], esc: [1, 1, 0.35] });
  else if (emblema === 3) m.cone(0.06, 0.1, 5, branco, { pos: [x, ey, ez], rot: [Math.PI / 2, 0, 0], esc: [1, 0.3, 1] });
  else {
    m.esfera(0.035, "#FF7FB0", { pos: [x - 0.025, ey + 0.01, ez], esc: [1, 1, 0.4] });
    m.esfera(0.035, "#FF7FB0", { pos: [x + 0.025, ey + 0.01, ez], esc: [1, 1, 0.4] });
    m.cone(0.05, 0.06, 4, "#FF7FB0", { pos: [x, ey - 0.03, ez], rot: [Math.PI, 0, 0], esc: [1, 1, 0.4] });
  }
}

export function mochilas() {
  const m = new Molde();
  const cores: [string, string][] = [
    ["#2F78E0", "#1E56AE"],
    ["#E5352B", "#B5221B"],
    ["#F6C21C", "#D19A0C"],
    ["#31B54A", "#22883A"],
    ["#8E55D8", "#6B3BAE"],
  ];
  cores.forEach(([c, e], i) => mochila(m, (i - 2) * 0.62, c, e, i));
  return m.pronto();
}

export function carrinho() {
  const m = new Molde();
  const MAD = "#F08A24";
  const MAD_ESC = "#C96A12";
  const L = 1.9;
  const W = 0.86;
  for (let i = 0; i < 4; i++) {
    m.caixa(L, 0.08, W / 4 - 0.025, i % 2 ? MAD : "#F59A3A", { pos: [0, 0.46, -W / 2 + W / 8 + (i * W) / 4] });
  }
  for (const sz of [-1, 1]) m.caixa(L, 0.16, 0.08, MAD_ESC, { pos: [0, 0.56, sz * (W / 2 - 0.02)] });
  m.caixa(0.1, 0.42, W, MAD, { pos: [-L / 2 + 0.05, 0.7, 0] });
  m.caixa(0.1, 0.22, W, MAD, { pos: [L / 2 - 0.05, 0.6, 0] });
  for (const x of [-0.62, 0.62]) {
    m.caixa(0.14, 0.12, W + 0.1, MAD_ESC, { pos: [x, 0.36, 0] });
    for (const sz of [-1, 1]) {
      const z = sz * (W / 2 + 0.1);
      m.cilindro(0.22, 0.22, 0.14, 10, "#22262E", { pos: [x, 0.22, z], rot: [Math.PI / 2, 0, 0] });
      m.cilindro(0.09, 0.09, 0.16, 8, "#8E949F", { pos: [x, 0.22, z], rot: [Math.PI / 2, 0, 0] });
    }
  }
  for (const x of [-L / 2 + 0.05, L / 2 - 0.05]) {
    for (const sz of [-1, 1]) m.cilindro(0.035, 0.035, 0.03, 6, "#5A616C", { pos: [x, 0.62, sz * (W / 2 - 0.1)], rot: [0, 0, Math.PI / 2] });
  }
  return m.pronto();
}

export function chafariz() {
  const m = new Molde();
  const PEDRA = "#C8BFB0";
  const PEDRA_ESC = "#A89F91";
  const AGUA = "#4CC3F2";
  const AGUA_CLARA = "#9BE3FF";
  const giro = Math.PI / 8;
  m.cilindro(2.35, 2.45, 0.2, 8, PEDRA_ESC, { pos: [0, 0.1, 0], rot: [0, giro, 0] });
  m.cilindro(2.25, 2.3, 0.62, 8, PEDRA, { pos: [0, 0.5, 0], rot: [0, giro, 0] });
  m.cilindro(2.38, 2.38, 0.14, 8, PEDRA_ESC, { pos: [0, 0.86, 0], rot: [0, giro, 0] });
  m.cilindro(2.0, 2.0, 0.1, 8, AGUA, { pos: [0, 0.78, 0], rot: [0, giro, 0] });
  const apotema = 2.25 * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    m.caixa(0.5, 0.3, 0.05, "#2462D8", {
      pos: [Math.sin(a) * (apotema + 0.02), 0.5, Math.cos(a) * (apotema + 0.02)],
      rot: [0, a, 0],
    });
    m.caixa(0.32, 0.16, 0.06, "#5C93F0", {
      pos: [Math.sin(a) * (apotema + 0.03), 0.5, Math.cos(a) * (apotema + 0.03)],
      rot: [0, a, 0],
    });
  }
  m.cilindro(0.38, 0.5, 1.5, 8, PEDRA, { pos: [0, 1.5, 0], rot: [0, giro, 0] });
  m.cilindro(1.35, 0.55, 0.42, 8, PEDRA, { pos: [0, 2.3, 0], rot: [0, giro, 0] });
  m.cilindro(1.4, 1.4, 0.1, 8, PEDRA_ESC, { pos: [0, 2.53, 0], rot: [0, giro, 0] });
  m.cilindro(1.22, 1.22, 0.06, 8, AGUA, { pos: [0, 2.5, 0], rot: [0, giro, 0] });
  m.cilindro(0.22, 0.32, 0.9, 8, PEDRA, { pos: [0, 3.0, 0], rot: [0, giro, 0] });
  m.cilindro(0.72, 0.32, 0.3, 8, PEDRA, { pos: [0, 3.55, 0], rot: [0, giro, 0] });
  m.cilindro(0.76, 0.76, 0.08, 8, PEDRA_ESC, { pos: [0, 3.72, 0], rot: [0, giro, 0] });
  m.cilindro(0.64, 0.64, 0.05, 8, AGUA, { pos: [0, 3.7, 0], rot: [0, giro, 0] });
  m.cilindro(0.14, 0.2, 0.4, 8, PEDRA, { pos: [0, 3.95, 0] });
  m.cilindro(0.06, 0.12, 0.7, 6, AGUA_CLARA, { pos: [0, 4.5, 0], camada: "brilho" });
  m.add(new THREE.OctahedronGeometry(0.16, 0), AGUA_CLARA, { pos: [0, 4.95, 0], esc: [1, 1.6, 1], camada: "brilho" });
  m.add(new THREE.CylinderGeometry(0.78, 0.86, 1.2, 8, 1, true), AGUA, { pos: [0, 3.1, 0], rot: [0, giro, 0], esc: [1, 1, 1] });
  m.add(new THREE.CylinderGeometry(1.42, 1.6, 1.62, 8, 1, true), AGUA, { pos: [0, 1.68, 0], rot: [0, giro, 0] });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    m.add(new THREE.OctahedronGeometry(0.07, 0), AGUA_CLARA, {
      pos: [Math.sin(a) * 1.75, 0.92, Math.cos(a) * 1.75],
      camada: "brilho",
    });
  }
  return m.pronto();
}

export function camaElastica(raio = 1.05) {
  const m = new Molde();
  const AZ = "#2E8BEA";
  const AM = "#FFC928";
  const altura = 0.72;
  const gomos = 8;
  for (let i = 0; i < gomos; i++) {
    m.anel(raio, 0.13, 5, 4, i % 2 ? AM : AZ, {
      pos: [0, altura, 0],
      rot: [Math.PI / 2, 0, (i / gomos) * Math.PI * 2],
      esc: [1, 1, 0.55],
    }, (Math.PI * 2) / gomos + 0.01);
  }
  m.cilindro(raio - 0.08, raio - 0.08, 0.04, 16, "#22262E", { pos: [0, altura - 0.02, 0] });
  m.cilindro(raio - 0.22, raio - 0.22, 0.045, 16, "#2D323C", { pos: [0, altura - 0.01, 0] });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const a1 = a - 0.22;
    const a2 = a + 0.22;
    const r = raio * 0.92;
    const p1: V3 = [Math.sin(a1) * r, altura - 0.06, Math.cos(a1) * r];
    const p2: V3 = [Math.sin(a2) * r, altura - 0.06, Math.cos(a2) * r];
    const c1: V3 = [Math.sin(a1) * (r + 0.08), 0.06, Math.cos(a1) * (r + 0.08)];
    const c2: V3 = [Math.sin(a2) * (r + 0.08), 0.06, Math.cos(a2) * (r + 0.08)];
    m.barra(p1, c1, 0.045, AZ, 6);
    m.barra(p2, c2, 0.045, AZ, 6);
    m.barra(c1, c2, 0.045, AZ, 6);
    m.cilindro(0.07, 0.08, 0.08, 6, "#1E5DB0", { pos: [c1[0], 0.04, c1[2]] });
    m.cilindro(0.07, 0.08, 0.08, 6, "#1E5DB0", { pos: [c2[0], 0.04, c2[2]] });
  }
  return m.pronto();
}

export function parquinho() {
  const m = new Molde();
  const AZ = "#2E7BE0";
  const AM = "#FFC928";
  const VM = "#E8322A";
  const VM_ESC = "#B8231D";
  const L = 1.5;
  const piso = 1.55;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      m.caixa(0.18, 3.05, 0.18, AZ, { pos: [sx * L / 2, 1.55, sz * L / 2] });
      m.caixa(0.3, 0.14, 0.3, AM, { pos: [sx * L / 2, 0.07, sz * L / 2] });
      m.caixa(0.24, 0.12, 0.24, AM, { pos: [sx * L / 2, piso - 0.12, sz * L / 2] });
    }
  }
  m.caixa(L + 0.1, 0.12, L + 0.1, "#2464C2", { pos: [0, piso, 0] });
  m.caixa(L, 0.08, 0.08, AM, { pos: [0, piso + 0.72, -L / 2] });
  for (let i = 0; i < 6; i++) m.caixa(0.08, 0.66, 0.06, AM, { pos: [-L / 2 + 0.2 + i * 0.22, piso + 0.39, -L / 2] });
  m.caixa(0.08, 0.08, L, AM, { pos: [L / 2, piso + 0.72, 0] });
  for (let i = 0; i < 6; i++) m.caixa(0.06, 0.66, 0.08, AM, { pos: [L / 2, piso + 0.39, -L / 2 + 0.2 + i * 0.22] });
  const topo = 3.08;
  const meia = L / 2 + 0.3;
  const incl = Math.atan2(0.75, meia);
  const comp = Math.hypot(0.75, meia);
  for (const sx of [-1, 1]) {
    m.caixa(comp + 0.06, 0.12, L + 0.5, VM, {
      pos: [sx * meia / 2, topo + 0.375, 0],
      rot: [0, 0, -sx * incl],
    });
  }
  m.caixa(0.16, 0.16, L + 0.55, VM_ESC, { pos: [0, topo + 0.76, 0] });
  for (const sz of [-1, 1]) {
    m.add(new THREE.CylinderGeometry(0.01, 0.9, 0.7, 3), VM_ESC, {
      pos: [0, topo + 0.32, sz * (L / 2 + 0.02)],
      rot: [0, 0, 0],
      esc: [1.05, 1, 0.12],
    });
  }
  const e0: V3 = [-L / 2, piso, 0];
  const e1: V3 = [-L / 2 - 1.2, 0, 0];
  for (const sz of [-1, 1]) {
    m.barra([e0[0], e0[1], sz * 0.42], [e1[0], 0.05, sz * 0.42], 0.06, AZ, 5);
    m.barra([e0[0], e0[1] + 0.8, sz * 0.48], [e1[0], 0.85, sz * 0.48], 0.05, AM, 5);
    for (let i = 1; i < 4; i++) {
      const t = i / 4;
      const x = e0[0] + (e1[0] - e0[0]) * t;
      const y = e0[1] + (e1[1] - e0[1]) * t;
      m.barra([x, y, sz * 0.42], [x, y + 0.8, sz * 0.48], 0.035, AM, 4);
    }
  }
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    m.caixa(0.24, 0.06, 0.84, AZ, { pos: [e0[0] + (e1[0] - e0[0]) * t, e0[1] + (e1[1] - e0[1]) * t, 0] });
  }
  const s0: V3 = [L / 2 + 0.05, piso - 0.02, 0];
  const s1: V3 = [L / 2 + 2.6, 0.32, 0];
  const ang = Math.atan2(s0[1] - s1[1], s1[0] - s0[0]);
  const len = Math.hypot(s1[0] - s0[0], s0[1] - s1[1]);
  const meio: V3 = [(s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2, 0];
  m.caixa(len, 0.08, 0.72, VM, { pos: meio, rot: [0, 0, -ang] });
  for (const sz of [-1, 1]) {
    m.caixa(len, 0.22, 0.08, VM_ESC, { pos: [meio[0], meio[1] + 0.1, sz * 0.38], rot: [0, 0, -ang] });
  }
  m.caixa(0.6, 0.08, 0.72, VM, { pos: [s1[0] + 0.28, 0.3, 0] });
  m.caixa(0.08, 0.3, 0.72, VM_ESC, { pos: [s1[0] + 0.58, 0.18, 0] });
  m.caixa(0.1, 0.3, 0.1, AZ, { pos: [s1[0] + 0.3, 0.15, 0.3] });
  m.caixa(0.1, 0.3, 0.1, AZ, { pos: [s1[0] + 0.3, 0.15, -0.3] });
  return m.pronto();
}

function copa(m: Molde, bolas: [number, number, number, number][], verdes: string[]) {
  bolas.forEach(([x, y, z, r], i) => {
    m.esfera(r, verdes[i % verdes.length], { pos: [x, y, z], rot: [i * 0.7, i * 1.3, 0] }, 1);
  });
}

function grama(m: Molde, raio: number) {
  m.cilindro(raio, raio * 1.08, 0.12, 7, "#5FC23A", { pos: [0, 0.06, 0] });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    m.cone(0.08, 0.32, 3, i % 2 ? "#3FA52A" : "#58C43A", {
      pos: [Math.sin(a) * raio * 0.55, 0.26, Math.cos(a) * raio * 0.55],
      rot: [0.25 * Math.cos(a), 0, -0.25 * Math.sin(a)],
    });
  }
}

export function arvoreGrande() {
  const m = new Molde();
  const TR = "#8A5530";
  const TR_ESC = "#6E4224";
  grama(m, 1.0);
  m.cilindro(0.26, 0.42, 2.2, 7, TR, { pos: [0, 1.1, 0] });
  for (const [a, b] of [[[-0.45, 0.2, 0.1], [-0.2, 0.05, 0.6]], [[0.45, 0.2, -0.05], [0.25, 0.05, -0.55]]] as [V3, V3][]) {
    m.barra([0, 0.2, 0], a, 0.16, TR_ESC, 5);
    m.barra(a, b, 0.1, TR_ESC, 5);
  }
  m.barra([0, 2.1, 0], [-1.1, 3.6, 0.2], 0.2, TR, 6);
  m.barra([0, 2.1, 0], [1.05, 3.5, -0.1], 0.19, TR, 6);
  m.barra([0, 2.1, 0], [0.1, 4.0, -0.4], 0.2, TR, 6);
  m.barra([-1.1, 3.6, 0.2], [-1.6, 4.1, 0.5], 0.11, TR, 5);
  m.barra([1.05, 3.5, -0.1], [1.7, 4.0, 0.2], 0.11, TR, 5);
  copa(m, [
    [0, 5.0, 0, 1.55],
    [-1.55, 4.3, 0.3, 1.2],
    [1.6, 4.2, 0.1, 1.2],
    [-0.7, 5.7, -0.4, 1.15],
    [0.8, 5.6, 0.5, 1.1],
    [0.1, 4.2, 1.1, 1.05],
    [-0.2, 4.4, -1.2, 1.1],
    [-2.0, 3.6, -0.4, 0.75],
    [2.1, 3.5, -0.3, 0.75],
  ], ["#3DB83A", "#4FCB3E", "#2FA233", "#5AD446", "#36AE38"]);
  return m.pronto();
}

export function arvorePequena() {
  const m = new Molde();
  const TR = "#8A5530";
  grama(m, 0.85);
  m.cilindro(0.14, 0.22, 1.6, 6, TR, { pos: [0, 0.8, 0] });
  m.barra([0, 1.5, 0], [-0.6, 2.4, 0], 0.11, TR, 5);
  m.barra([0, 1.5, 0], [0.55, 2.2, 0.1], 0.1, TR, 5);
  m.barra([0, 1.5, 0], [0.05, 2.6, -0.1], 0.11, TR, 5);
  copa(m, [
    [0, 3.25, 0, 1.15],
    [-0.95, 2.55, 0.2, 0.75],
    [0.95, 2.45, 0.15, 0.7],
  ], ["#3DB83A", "#4FCB3E", "#2FA233"]);
  return m.pronto();
}

export function bebedouro() {
  const m = new Molde();
  const AZ = "#2E6FE0";
  const AZ_ESC = "#1E50B0";
  const CINZA = "#C7CCD6";
  m.caixa(0.78, 0.16, 0.66, AZ, { pos: [0, 0.08, 0] });
  m.caixa(0.62, 0.08, 0.5, AZ_ESC, { pos: [0, 0.2, 0] });
  m.caixa(0.44, 0.78, 0.38, AZ, { pos: [0, 0.62, 0] });
  for (let i = 0; i < 4; i++) m.caixa(0.03, 0.03, 0.22, AZ_ESC, { pos: [0.225, 0.48 + i * 0.07, 0] });
  m.caixa(0.5, 0.06, 0.44, AZ_ESC, { pos: [0, 1.03, 0] });
  m.caixa(0.86, 0.26, 0.62, CINZA, { pos: [0, 1.18, 0.04] });
  m.caixa(0.7, 0.04, 0.46, "#9AA1AE", { pos: [0, 1.3, 0.06] });
  m.cilindro(0.04, 0.04, 0.02, 8, "#6B7280", { pos: [0, 1.32, 0.06] });
  m.caixa(0.86, 0.5, 0.1, AZ, { pos: [0, 1.52, -0.25] });
  m.cilindro(0.43, 0.43, 0.1, 10, AZ, { pos: [0, 1.77, -0.25], rot: [Math.PI / 2, 0, 0], esc: [1, 1, 0.4] });
  m.caixa(0.1, 0.14, 0.1, "#9AA1AE", { pos: [0.22, 1.38, -0.16] });
  m.anel(0.1, 0.025, 4, 8, "#9AA1AE", { pos: [0.22, 1.46, -0.06], rot: [0, Math.PI / 2, 0] }, Math.PI);
  m.add(new THREE.OctahedronGeometry(0.03, 0), "#7FD8FF", { pos: [0.22, 1.42, 0.04], camada: "brilho" });
  m.caixa(0.3, 0.18, 0.02, AZ, { pos: [0, 1.17, 0.36] });
  m.esfera(0.045, "#FFFFFF", { pos: [0, 1.16, 0.375], esc: [1, 1, 0.3] });
  m.cone(0.045, 0.06, 6, "#FFFFFF", { pos: [0, 1.21, 0.375], esc: [1, 1, 0.3] });
  return m.pronto();
}

export function basquete() {
  const m = new Molde();
  const VM = "#E8322A";
  const VM_ESC = "#B8231D";
  const AM = "#FFC928";
  m.caixa(1.0, 0.16, 1.0, VM, { pos: [0, 0.08, 0] });
  m.caixa(0.9, 0.06, 0.9, AM, { pos: [0, 0.19, 0] });
  m.add(new THREE.CylinderGeometry(0.2, 0.42, 0.34, 4).rotateY(Math.PI / 4), VM, { pos: [0, 0.39, 0] });
  m.caixa(0.16, 2.0, 0.16, VM, { pos: [0, 1.56, 0] });
  m.barra([0, 2.5, 0], [0, 3.1, 0.55], 0.09, VM, 4);
  m.barra([0, 2.0, 0], [0, 2.75, 0.5], 0.05, VM_ESC, 4);
  m.caixa(1.5, 1.05, 0.08, VM, { pos: [0, 3.25, 0.62] });
  m.caixa(1.34, 0.89, 0.09, AM, { pos: [0, 3.25, 0.63] });
  m.caixa(0.6, 0.06, 0.1, VM, { pos: [0, 3.48, 0.64] });
  m.caixa(0.6, 0.06, 0.1, VM, { pos: [0, 3.0, 0.64] });
  m.caixa(0.06, 0.48, 0.1, VM, { pos: [-0.27, 3.24, 0.64] });
  m.caixa(0.06, 0.48, 0.1, VM, { pos: [0.27, 3.24, 0.64] });
  const aroY = 2.88;
  const aroZ = 0.98;
  m.anel(0.3, 0.03, 4, 14, "#F05A1E", { pos: [0, aroY, aroZ], rot: [Math.PI / 2, 0, 0] });
  m.caixa(0.1, 0.04, 0.12, "#F05A1E", { pos: [0, aroY, 0.7] });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const b = a + Math.PI / 5;
    m.barra(
      [Math.sin(a) * 0.29, aroY - 0.02, aroZ + Math.cos(a) * 0.29],
      [Math.sin(b) * 0.18, aroY - 0.5, aroZ + Math.cos(b) * 0.18],
      0.012,
      "#F4F6FA",
      3,
    );
  }
  m.anel(0.18, 0.012, 3, 10, "#F4F6FA", { pos: [0, aroY - 0.5, aroZ], rot: [Math.PI / 2, 0, 0] });
  return m.pronto();
}

export function banco() {
  const m = new Molde();
  const MAD = "#E8822A";
  const MAD2 = "#F0943C";
  const FERRO = "#3A4250";
  const W = 2.2;
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - 0.25);
    m.caixa(0.12, 0.5, 0.12, FERRO, { pos: [x, 0.25, 0.22] });
    m.caixa(0.12, 0.5, 0.12, FERRO, { pos: [x, 0.25, -0.2] });
    m.caixa(0.22, 0.08, 0.28, FERRO, { pos: [x, 0.04, 0.24] });
    m.caixa(0.22, 0.08, 0.28, FERRO, { pos: [x, 0.04, -0.22] });
    m.caixa(0.12, 0.1, 0.62, FERRO, { pos: [x, 0.5, 0] });
    m.caixa(0.12, 0.95, 0.1, FERRO, { pos: [x, 0.95, -0.32], rot: [-0.18, 0, 0] });
    m.caixa(0.12, 0.08, 0.5, FERRO, { pos: [x, 0.78, 0.02] });
    m.caixa(0.1, 0.28, 0.08, FERRO, { pos: [x, 0.65, 0.24] });
  }
  for (let i = 0; i < 3; i++) {
    m.caixa(W, 0.07, 0.17, i % 2 ? MAD : MAD2, { pos: [0, 0.58, 0.2 - i * 0.2] });
  }
  for (let i = 0; i < 3; i++) {
    m.caixa(W, 0.17, 0.06, i % 2 ? MAD : MAD2, { pos: [0, 0.82 + i * 0.24, -0.34 - i * 0.045], rot: [-0.18, 0, 0] });
  }
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      m.cilindro(0.03, 0.03, 0.02, 6, "#8E949F", { pos: [sx * (W / 2 - 0.25), 0.83 + i * 0.24, -0.3 - i * 0.045], rot: [Math.PI / 2 - 0.18, 0, 0] });
    }
  }
  return m.pronto();
}
