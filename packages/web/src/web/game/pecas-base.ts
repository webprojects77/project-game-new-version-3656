import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Camada = "cor" | "brilho" | "tinta";

export interface Pose {
  pos?: [number, number, number];
  rot?: [number, number, number];
  esc?: [number, number, number] | number;
  camada?: Camada;
}

const MAT_COR = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.68,
  metalness: 0.04,
});
const MAT_BRILHO = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
const MAT_TINTA_BASE = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.7,
  metalness: 0.04,
});

const tmpCor = new THREE.Color();
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();

export class Molde {
  private partes: Record<Camada, THREE.BufferGeometry[]> = { cor: [], brilho: [], tinta: [] };
  private extras: THREE.Object3D[] = [];

  add(geo: THREE.BufferGeometry, cor: string, p: Pose = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    for (const nome of Object.keys(g.attributes)) if (nome !== "position") g.deleteAttribute(nome);
    tmpCor.set(cor);
    const n = g.attributes.position.count;
    const cores = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      cores[i * 3] = tmpCor.r;
      cores[i * 3 + 1] = tmpCor.g;
      cores[i * 3 + 2] = tmpCor.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(cores, 3));
    const e = p.esc ?? 1;
    tmpS.set(...(typeof e === "number" ? ([e, e, e] as const) : e));
    tmpE.set(...(p.rot ?? [0, 0, 0]));
    tmpQ.setFromEuler(tmpE);
    tmpP.set(...(p.pos ?? [0, 0, 0]));
    tmpM.compose(tmpP, tmpQ, tmpS);
    g.applyMatrix4(tmpM);
    this.partes[p.camada ?? "cor"].push(g);
    return this;
  }

  caixa(w: number, h: number, d: number, cor: string, p: Pose = {}) {
    return this.add(new THREE.BoxGeometry(w, h, d), cor, p);
  }

  cilindro(rTopo: number, rBase: number, h: number, seg: number, cor: string, p: Pose = {}) {
    return this.add(new THREE.CylinderGeometry(rTopo, rBase, h, seg), cor, p);
  }

  cone(r: number, h: number, seg: number, cor: string, p: Pose = {}) {
    return this.add(new THREE.ConeGeometry(r, h, seg), cor, p);
  }

  esfera(r: number, cor: string, p: Pose = {}, detalhe = 0) {
    return this.add(new THREE.IcosahedronGeometry(r, detalhe), cor, p);
  }

  anel(r: number, tubo: number, segTubo: number, segAnel: number, cor: string, p: Pose = {}, arco = Math.PI * 2) {
    return this.add(new THREE.TorusGeometry(r, tubo, segTubo, segAnel, arco), cor, p);
  }

  barra(a: [number, number, number], b: [number, number, number], r: number, cor: string, seg = 6, camada?: Camada) {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const geo = new THREE.CylinderGeometry(r, r, len, seg);
    const meio = va.clone().add(vb).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    const m = new THREE.Matrix4().compose(meio, q, new THREE.Vector3(1, 1, 1));
    geo.applyMatrix4(m);
    return this.add(geo, cor, { camada });
  }

  fio(a: [number, number, number], b: [number, number, number], barriga: number, r: number, cor: string, passos = 6) {
    let ant = a;
    for (let i = 1; i <= passos; i++) {
      const t = i / passos;
      const p: [number, number, number] = [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * barriga,
        a[2] + (b[2] - a[2]) * t,
      ];
      this.barra(ant, p, r, cor, 4);
      ant = p;
    }
    return this;
  }

  extra(obj: THREE.Object3D) {
    this.extras.push(obj);
    return this;
  }

  pronto(): THREE.Group {
    const grupo = new THREE.Group();
    for (const camada of ["cor", "tinta", "brilho"] as Camada[]) {
      const lista = this.partes[camada];
      if (!lista.length) continue;
      const geo = mergeGeometries(lista, false);
      for (const g of lista) g.dispose();
      if (!geo) continue;
      geo.computeBoundingSphere();
      const mat = camada === "cor" ? MAT_COR : camada === "brilho" ? MAT_BRILHO : MAT_TINTA_BASE;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = camada;
      grupo.add(mesh);
    }
    for (const e of this.extras) grupo.add(e);
    return grupo;
  }
}

const matsTextura = new Map<string, THREE.MeshStandardMaterial>();
export function placa(
  chave: string,
  desenhar: () => THREE.Texture,
  w: number,
  h: number,
  pos: [number, number, number],
  rot: [number, number, number] = [0, 0, 0],
  brilho = 0,
): THREE.Mesh {
  let mat = matsTextura.get(chave);
  if (!mat) {
    const map = desenhar();
    mat = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.75,
      metalness: 0,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: brilho > 0 ? map : null,
      emissiveIntensity: brilho,
      transparent: true,
      alphaTest: 0.08,
    });
    matsTextura.set(chave, mat);
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  return mesh;
}

export function texturaCanvas(w: number, h: number, desenhar: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  desenhar(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const loaderTextura = new THREE.TextureLoader();
export function texturaArquivo(url: string) {
  const tex = loaderTextura.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
