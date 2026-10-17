import * as THREE from "three";
import { Molde, placa, retangulo, texturaCanvas } from "./pecas-base";

const ASFALTO = "#3E4654";
const ASFALTO_CLARO = "#566070";

export function posteLuz() {
  const m = new Molde();
  m.caixa(0.62, 0.16, 0.62, ASFALTO, { pos: [0, 0.08, 0] });
  m.cilindro(0.2, 0.28, 0.5, 8, ASFALTO_CLARO, { pos: [0, 0.41, 0] });
  m.cilindro(0.13, 0.2, 0.2, 8, ASFALTO, { pos: [0, 0.76, 0] });
  m.cilindro(0.075, 0.095, 3.7, 8, ASFALTO, { pos: [0, 2.7, 0] });
  m.cilindro(0.12, 0.12, 0.12, 8, ASFALTO_CLARO, { pos: [0, 1.3, 0] });
  m.cilindro(0.12, 0.12, 0.1, 8, ASFALTO_CLARO, { pos: [0, 4.35, 0] });
  m.esfera(0.1, ASFALTO_CLARO, { pos: [0, 4.95, 0] });
  m.cone(0.07, 0.25, 6, ASFALTO, { pos: [0, 5.12, 0] });
  m.anel(0.42, 0.045, 5, 8, ASFALTO, { pos: [0, 4.42, 0.42], rot: [0, Math.PI / 2, 0] }, Math.PI / 2);
  m.barra([0, 4.84, 0.42], [0, 4.84, 1.02], 0.045, ASFALTO);
  m.anel(0.14, 0.03, 4, 8, ASFALTO_CLARO, { pos: [0, 4.6, 0.62], rot: [0, Math.PI / 2, 0] });
  const lz = 1.05;
  m.barra([0, 4.84, lz], [0, 4.62, lz], 0.03, ASFALTO);
  m.cone(0.32, 0.28, 4, ASFALTO, { pos: [0, 4.5, lz], rot: [0, Math.PI / 4, 0] });
  m.caixa(0.34, 0.06, 0.34, ASFALTO_CLARO, { pos: [0, 4.35, lz] });
  m.caixa(0.27, 0.42, 0.27, "#FFE07A", { pos: [0, 4.1, lz], camada: "brilho" });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    m.caixa(0.04, 0.44, 0.04, ASFALTO, { pos: [sx * 0.15, 4.1, lz + sz * 0.15] });
  }
  m.caixa(0.3, 0.06, 0.3, ASFALTO, { pos: [0, 3.86, lz] });
  m.cone(0.1, 0.14, 4, ASFALTO, { pos: [0, 3.76, lz], rot: [Math.PI, Math.PI / 4, 0] });
  return m.pronto();
}

export function posteEletrico() {
  const m = new Molde();
  const MAD = "#8B5A36";
  const MAD_ESC = "#6E4428";
  m.caixa(0.5, 0.45, 0.5, "#9EA3AE", { pos: [0, 0.22, 0] });
  m.cilindro(0.11, 0.15, 7, 7, MAD, { pos: [0, 3.5, 0] });
  for (const [y, w] of [[6.55, 2.3], [5.75, 1.9]] as const) {
    m.caixa(w, 0.14, 0.16, MAD_ESC, { pos: [0, y, 0.12] });
    m.barra([0, y - 0.6, 0.12], [w * 0.32, y - 0.04, 0.12], 0.03, "#7A808C");
    m.barra([0, y - 0.6, 0.12], [-w * 0.32, y - 0.04, 0.12], 0.03, "#7A808C");
    for (const sx of [-0.45, -0.18, 0.18, 0.45]) {
      const x = sx * w;
      m.cilindro(0.05, 0.07, 0.1, 6, "#E8ECF2", { pos: [x, y + 0.12, 0.12] });
      m.cilindro(0.04, 0.06, 0.08, 6, "#C9D0DA", { pos: [x, y + 0.21, 0.12] });
      m.cilindro(0.03, 0.03, 0.06, 6, "#E8ECF2", { pos: [x, y + 0.28, 0.12] });
      m.fio([x, y + 0.3, 0.12], [x - 3.6, y + 0.1, 0.12], 0.45, 0.018, "#20232B", 5);
      m.fio([x, y + 0.3, 0.12], [x + 3.6, y + 0.1, 0.12], 0.45, 0.018, "#20232B", 5);
    }
  }
  m.caixa(0.42, 0.7, 0.34, "#8E949F", { pos: [0, 3.9, 0.28] });
  m.caixa(0.46, 0.08, 0.38, "#6B717C", { pos: [0, 4.28, 0.28] });
  m.caixa(0.46, 0.06, 0.38, "#6B717C", { pos: [0, 3.55, 0.28] });
  m.caixa(0.18, 0.12, 0.02, "#2B2F38", { pos: [0, 3.95, 0.46] });
  m.barra([0, 4.3, 0.28], [0.3, 5.65, 0.12], 0.016, "#20232B");
  m.barra([0, 4.3, 0.28], [-0.3, 5.65, 0.12], 0.016, "#20232B");
  for (let i = 0; i < 6; i++) {
    m.caixa(0.22, 0.04, 0.04, "#7A808C", { pos: [i % 2 ? 0.14 : -0.14, 1.9 + i * 0.5, 0.12] });
  }
  m.cone(0.12, 0.18, 7, MAD_ESC, { pos: [0, 7.08, 0] });
  return m.pronto();
}

export function semaforo() {
  const m = new Molde();
  const COR = "#3A4250";
  m.caixa(0.6, 0.14, 0.6, COR, { pos: [0, 0.07, 0] });
  m.cilindro(0.18, 0.3, 0.55, 4, ASFALTO_CLARO, { pos: [0, 0.42, 0], rot: [0, Math.PI / 4, 0] });
  m.cilindro(0.08, 0.1, 2.7, 8, COR, { pos: [0, 2.0, 0] });
  m.cilindro(0.12, 0.12, 0.12, 8, ASFALTO_CLARO, { pos: [0, 0.95, 0] });
  m.cilindro(0.14, 0.14, 0.14, 8, ASFALTO_CLARO, { pos: [0, 3.35, 0] });
  m.caixa(0.56, 1.5, 0.42, "#2C323D", { pos: [0, 4.15, 0] });
  m.caixa(0.62, 0.08, 0.46, COR, { pos: [0, 4.92, 0] });
  m.caixa(0.62, 0.08, 0.46, COR, { pos: [0, 3.38, 0] });
  const luzes: [string, number][] = [["#FF3B30", 4.6], ["#FFC21A", 4.15], ["#2BD15A", 3.7]];
  for (const [cor, y] of luzes) {
    m.cilindro(0.17, 0.17, 0.06, 10, "#1A1E26", { pos: [0, y, 0.21], rot: [Math.PI / 2, 0, 0] });
    m.cilindro(0.14, 0.14, 0.05, 10, cor, { pos: [0, y, 0.24], rot: [Math.PI / 2, 0, 0], camada: "brilho" });
    m.anel(0.18, 0.03, 4, 8, "#2C323D", { pos: [0, y, 0.3], rot: [0, 0, 0] }, Math.PI);
  }
  return m.pronto();
}

export function posteCaido() {
  const m = new Molde();
  const COR = "#566070";
  m.caixa(0.62, 0.55, 0.62, "#A3A6AE", { pos: [1.02, 0.3, 0], rot: [0.12, 0.3, 0.2] });
  m.caixa(0.36, 0.28, 0.4, "#BFC2C9", { pos: [1.2, 0.5, 0.12], rot: [0.4, 0.1, 0.5] });
  for (const [x, z, s] of [[0.6, 0.45, 0.14], [1.45, -0.4, 0.12], [0.75, -0.42, 0.1], [1.5, 0.38, 0.09], [0.4, 0.3, 0.08]]) {
    m.esfera(s, "#9A9DA6", { pos: [x, s * 0.7, z] });
  }
  for (const [y, z] of [[0.45, -0.12], [0.62, 0.1], [0.36, 0.18]]) {
    m.barra([1.25, y, z], [1.55, y + 0.12, z + 0.05], 0.025, "#8A3E1E", 4);
  }
  m.barra([0.85, 0.42, 0], [-1.1, 0.24, 0.05], 0.1, COR, 8);
  m.caixa(0.22, 0.24, 0.26, "#3A4250", { pos: [-0.05, 0.36, 0.05] });
  m.caixa(0.08, 0.3, 0.3, "#2C323D", { pos: [0.18, 0.34, 0.03] });
  m.barra([-1.1, 0.24, 0.05], [-1.35, 0.42, 0.12], 0.07, COR, 8);
  m.barra([-1.35, 0.42, 0.12], [-1.5, 0.46, 0.25], 0.06, COR, 8);
  m.caixa(0.5, 0.14, 0.3, "#3A4250", { pos: [-1.62, 0.34, 0.32], rot: [0.5, 0.4, 0.2] });
  m.caixa(0.38, 0.04, 0.2, "#FFE7A6", { pos: [-1.63, 0.28, 0.37], rot: [0.5, 0.4, 0.2], camada: "brilho" });
  m.fio([-0.05, 0.42, 0.18], [-0.6, 0.02, 0.6], 0.05, 0.022, "#1D2027", 4);
  m.fio([0.05, 0.42, 0.18], [-0.35, 0.02, 0.75], 0.05, 0.022, "#1D2027", 4);
  m.barra([-0.6, 0.02, 0.6], [-0.66, 0.02, 0.66], 0.024, "#D9822B", 4);
  m.barra([-0.35, 0.02, 0.75], [-0.4, 0.02, 0.82], 0.024, "#D9822B", 4);
  return m.pronto();
}

export function coneDesenhado() {
  const m = new Molde();
  const LAR = "#FF6A1A";
  m.caixa(1.04, 0.1, 1.04, LAR, { pos: [0, 0.05, 0] });
  m.cilindro(0.48, 0.52, 0.08, 4, "#E85A10", { pos: [0, 0.14, 0], rot: [0, Math.PI / 4, 0] });
  m.cilindro(0.11, 0.38, 1.0, 8, LAR, { pos: [0, 0.68, 0] });
  m.cilindro(0.305, 0.335, 0.16, 8, "#F4F4F6", { pos: [0, 0.48, 0] });
  m.cilindro(0.2, 0.23, 0.14, 8, "#F4F4F6", { pos: [0, 0.86, 0] });
  m.cilindro(0.12, 0.12, 0.04, 8, "#7A2A08", { pos: [0, 1.17, 0] });
  return m.pronto();
}

const AZUL = "#2D62D6";
const AZUL_ESC = "#1E46A8";

function texJornal() {
  return texturaCanvas(512, 128, (ctx) => {
    ctx.fillStyle = AZUL;
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 7;
    retangulo(ctx, 70, 30, 78, 68, 10);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < 3; i++) ctx.fillRect(100, 46 + i * 15, 36, 6);
    ctx.fillRect(82, 46, 12, 34);
    ctx.font = "900 78px Poppins, Arial Black, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("JORNAL", 168, 68);
  });
}

function texLateral() {
  return texturaCanvas(256, 512, (ctx) => {
    ctx.fillStyle = AZUL;
    ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 8;
    retangulo(ctx, 26, 26, 204, 460, 16);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 34px Poppins, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("JORNAIS", 128, 104);
    ctx.fillText("REVISTAS", 128, 150);
    ctx.font = "800 26px Poppins, Arial, sans-serif";
    ctx.fillText("ATUALIDADES", 128, 192);
    ctx.lineWidth = 8;
    retangulo(ctx, 70, 270, 116, 150, 12);
    ctx.stroke();
    for (let i = 0; i < 4; i++) ctx.fillRect(110, 300 + i * 28, 56, 10);
    ctx.fillRect(86, 300, 16, 70);
  });
}

function texRevistas() {
  const cores = ["#FF5A36", "#3FA9F5", "#FFC21A", "#2BD15A", "#FF5A36", "#8B4FE0", "#FFC21A", "#FF4F8B"];
  return texturaCanvas(512, 256, (ctx) => {
    ctx.fillStyle = "#16213D";
    ctx.fillRect(0, 0, 512, 256);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 18 + c * 124;
        const y = 14 + r * 120;
        const cor = cores[r * 4 + c];
        ctx.fillStyle = cor;
        retangulo(ctx, x, y, 104, 104, 8);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        const tipo = (r * 4 + c) % 4;
        if (tipo === 0) {
          ctx.beginPath();
          ctx.arc(x + 52, y + 54, 24, 0, Math.PI * 2);
          ctx.fill();
        } else if (tipo === 1) {
          ctx.beginPath();
          ctx.moveTo(x + 18, y + 84);
          ctx.lineTo(x + 46, y + 40);
          ctx.lineTo(x + 64, y + 66);
          ctx.lineTo(x + 76, y + 52);
          ctx.lineTo(x + 90, y + 84);
          ctx.fill();
        } else if (tipo === 2) {
          ctx.beginPath();
          ctx.arc(x + 52, y + 42, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x + 28, y + 64, 48, 24);
        } else {
          ctx.beginPath();
          ctx.moveTo(x + 52, y + 86);
          ctx.bezierCurveTo(x + 6, y + 50, x + 34, y + 14, x + 52, y + 38);
          ctx.bezierCurveTo(x + 70, y + 14, x + 98, y + 50, x + 52, y + 86);
          ctx.fill();
        }
      }
    }
  });
}

function texJornais() {
  return texturaCanvas(256, 128, (ctx) => {
    ctx.fillStyle = "#F2F2EE";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#3A3F4A";
    ctx.fillRect(14, 12, 228, 16);
    ctx.fillStyle = "#9EA4AF";
    ctx.fillRect(14, 40, 100, 70);
    for (let i = 0; i < 6; i++) ctx.fillRect(126, 40 + i * 12, 116, 6);
  });
}

export function banca() {
  const m = new Molde();
  const W = 2.5;
  const D = 2.1;
  const H = 2.45;
  m.caixa(W + 0.2, 0.24, D + 0.2, "#6B7385", { pos: [0, 0.12, 0] });
  m.caixa(W, H, D, AZUL, { pos: [0, 0.24 + H / 2, 0] });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      m.caixa(0.14, H, 0.14, AZUL_ESC, { pos: [sx * (W / 2 - 0.02), 0.24 + H / 2, sz * (D / 2 - 0.02)] });
    }
  }
  m.caixa(W + 0.24, 0.5, D + 0.24, AZUL, { pos: [0, 0.24 + H + 0.25, 0] });
  m.caixa(W + 0.3, 0.07, D + 0.3, AZUL_ESC, { pos: [0, 0.24 + H + 0.53, 0] });
  m.add(new THREE.ConeGeometry(1.0, 0.7, 4).rotateY(Math.PI / 4), "#7C8597", {
    pos: [0, 0.24 + H + 0.92, 0],
    esc: [(W + 0.3) / 1.414, 1, (D + 0.3) / 1.414],
  });
  m.caixa(0.5, 0.12, 0.5, "#6B7385", { pos: [0, 0.24 + H + 1.3, 0] });
  const jy = 1.35;
  m.caixa(W - 0.5, 1.15, 0.12, "#121A30", { pos: [0, jy + 0.05, D / 2 - 0.02] });
  m.caixa(W - 0.4, 0.08, 0.5, AZUL_ESC, { pos: [0, 0.78, D / 2 + 0.2] });
  for (const x of [-0.7, 0, 0.7]) {
    m.caixa(0.6, 0.05, 0.42, "#D9DCE2", { pos: [x, 0.92, D / 2 + 0.22], rot: [0.5, 0, 0] });
  }
  const listras = 9;
  for (let i = 0; i < listras; i++) {
    const w = (W + 0.1) / listras;
    const x = -W / 2 - 0.05 + w * (i + 0.5);
    const cor = i % 2 === 0 ? "#2F64DA" : "#F4F6FA";
    m.caixa(w, 0.05, 0.62, cor, { pos: [x, 2.08, D / 2 + 0.26], rot: [0.42, 0, 0] });
    m.cilindro(w / 2, w / 2, 0.05, 6, cor, { pos: [x, 1.94, D / 2 + 0.56], rot: [Math.PI / 2, 0, 0], esc: [1, 1, 1] });
  }
  for (let i = 0; i < 3; i++) {
    m.caixa(0.05, 0.36, 0.28, ["#2BD15A", "#FFC21A", "#FF4F8B"][i], { pos: [W / 2 + 0.06, 1.75 - i * 0.42, D / 2 - 0.35] });
  }
  m.extra(placa("banca-jornal", texJornal, W - 0.1, 0.42, [0, 0.24 + H + 0.25, D / 2 + 0.125]));
  m.extra(placa("banca-revistas", texRevistas, W - 0.62, 0.62, [0, 1.62, D / 2 + 0.05]));
  for (const x of [-0.7, 0, 0.7]) {
    m.extra(placa("banca-jornais", texJornais, 0.52, 0.32, [x, 0.955, D / 2 + 0.235], [-(Math.PI / 2 - 0.5), 0, 0]));
  }
  for (const sx of [-1, 1]) {
    m.extra(placa("banca-lateral", texLateral, 1.15, 2.1, [sx * (W / 2 + 0.005), 1.42, -0.15], [0, (sx * Math.PI) / 2, 0]));
  }
  return m.pronto();
}

export function predio(andares: number) {
  const m = new Molde();
  const W = 6;
  const D = 6;
  const terreo = 3;
  const andar = 2.2;
  const H = terreo + andares * andar;
  const TINTA = "#FFFFFF";
  const FRISO = "#D6D9DE";
  const VIDRO = "#3F9DB8";
  const MOLD = "#2C3844";
  m.caixa(W, H, D, TINTA, { pos: [0, H / 2, 0], camada: "tinta" });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      m.caixa(0.5, H + 0.1, 0.5, FRISO, { pos: [sx * (W / 2 - 0.15), H / 2, sz * (D / 2 - 0.15)], camada: "tinta" });
    }
  }
  m.caixa(W + 0.1, terreo, D + 0.1, "#9AA0A8", { pos: [0, terreo / 2, 0], camada: "tinta" });
  m.caixa(1.6, 2.2, 0.12, MOLD, { pos: [0, 1.1, D / 2 + 0.06] });
  m.caixa(0.7, 2.0, 0.14, VIDRO, { pos: [-0.38, 1.05, D / 2 + 0.07] });
  m.caixa(0.7, 2.0, 0.14, VIDRO, { pos: [0.38, 1.05, D / 2 + 0.07] });
  m.caixa(2.2, 0.16, 0.6, "#6B7380", { pos: [0, 2.4, D / 2 + 0.3] });
  let semente = andares * 7919;
  const sorteio = () => {
    semente = (semente * 16807) % 2147483647;
    return semente / 2147483647;
  };
  const cols = [-1.7, 0, 1.7];
  for (let a = 0; a < andares; a++) {
    const y = terreo + a * andar + andar / 2 + 0.05;
    m.caixa(W + 0.16, 0.12, D + 0.16, FRISO, { pos: [0, terreo + a * andar, 0], camada: "tinta" });
    for (const c of cols) {
      for (const face of ["frente", "esq", "dir"] as const) {
        const acesa = sorteio() < 0.28;
        const corVidro = acesa ? "#FFD27A" : VIDRO;
        const camada = acesa ? "brilho" : "cor";
        if (face === "frente") {
          m.caixa(1.2, 1.4, 0.1, MOLD, { pos: [c, y, D / 2 + 0.02] });
          m.caixa(1.0, 1.2, 0.12, corVidro, { pos: [c, y, D / 2 + 0.04], camada });
          m.caixa(0.06, 1.2, 0.14, MOLD, { pos: [c, y, D / 2 + 0.05] });
        } else {
          const sx = face === "esq" ? -1 : 1;
          m.caixa(0.1, 1.4, 1.2, MOLD, { pos: [sx * (W / 2 + 0.02), y, c] });
          m.caixa(0.12, 1.2, 1.0, corVidro, { pos: [sx * (W / 2 + 0.04), y, c], camada });
          m.caixa(0.14, 1.2, 0.06, MOLD, { pos: [sx * (W / 2 + 0.05), y, c] });
        }
      }
    }
  }
  m.caixa(W + 0.3, 0.4, D + 0.3, FRISO, { pos: [0, H + 0.2, 0], camada: "tinta" });
  m.caixa(2.0, 1.0, 1.6, "#8E949F", { pos: [0.8, H + 0.9, -0.8] });
  m.cilindro(0.05, 0.05, 2.2, 5, "#5A616C", { pos: [-1.6, H + 1.5, -1.2] });
  m.caixa(0.5, 0.06, 0.06, "#5A616C", { pos: [-1.6, H + 2.2, -1.2] });
  m.esfera(0.08, "#FF3B30", { pos: [-1.6, H + 2.62, -1.2], camada: "brilho" });
  return m.pronto();
}

export const ANDARES_PREDIO = [4, 6, 8, 10] as const;

export const CORES_PREDIO = ["#7D8A9B", "#B8735A", "#D8C6A2", "#5E80B8", "#8E6FAE", "#6FA58C", "#C9867D", "#9AA7B0"];

export function alturaPredio(andares: number) {
  return 3 + andares * 2.2;
}

export function pintarPredio(obj: THREE.Object3D, cor: string) {
  obj.traverse((c) => {
    if (c instanceof THREE.Mesh && c.name === "tinta") {
      (c.material as THREE.MeshStandardMaterial).color.set(cor);
    }
  });
}
