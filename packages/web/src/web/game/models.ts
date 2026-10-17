import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type ModeloKey =
  | "cerquinha"
  | "cercaMadeira"
  | "caixas"
  | "cone"
  | "placa"
  | "onibus"
  | "carro"
  | "rampa"
  | "casinha";

interface Receita {
  arquivo: string;
  largura: number;
  alturaMax: number;
  giro?: number;
}

const RECEITAS: Record<ModeloKey, Receita> = {
  cerquinha: { arquivo: "cerquinha.glb", largura: 2.15, alturaMax: 1.35 },
  cercaMadeira: { arquivo: "cerca-madeira.glb", largura: 2.15, alturaMax: 1.3 },
  cone: { arquivo: "cone.glb", largura: 1.1, alturaMax: 1.25 },
  rampa: { arquivo: "rampa.glb", largura: 2.2, alturaMax: 1.6 },
  caixas: { arquivo: "caixas.glb", largura: 2.1, alturaMax: 2.7 },
  carro: { arquivo: "carro.glb", largura: 2.15, alturaMax: 2.4, giro: 0.25 },
  onibus: { arquivo: "linha-azul.glb", largura: 2.4, alturaMax: 3.4, giro: 0.25 },
  placa: { arquivo: "placa.glb", largura: 1.5, alturaMax: 3.2 },
  casinha: { arquivo: "casinha.glb", largura: 5.2, alturaMax: 5, giro: 0.5 },
};

const prontos = new Map<ModeloKey, THREE.Object3D>();
let carregamento: Promise<void> | null = null;

function preparar(raiz: THREE.Object3D, r: Receita) {
  raiz.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.metalness = Math.min(m.metalness, 0.15);
        m.roughness = Math.max(m.roughness, 0.55);
        m.envMapIntensity = 0.4;
        m.side = THREE.FrontSide;
        m.needsUpdate = true;
      }
    }
    child.castShadow = false;
    child.receiveShadow = false;
  });

  if (r.giro) raiz.rotation.y = r.giro * Math.PI * 2;

  raiz.updateWorldMatrix(true, true);
  const caixa = new THREE.Box3().setFromObject(raiz);
  const tam = caixa.getSize(new THREE.Vector3());
  const escala = Math.min(r.largura / (tam.x || 1), r.alturaMax / (tam.y || 1));
  raiz.scale.setScalar(escala);

  raiz.updateWorldMatrix(true, true);
  const caixa2 = new THREE.Box3().setFromObject(raiz);
  const centro = caixa2.getCenter(new THREE.Vector3());
  raiz.position.x -= centro.x;
  raiz.position.z -= centro.z;
  raiz.position.y -= caixa2.min.y;

  const suporte = new THREE.Group();
  suporte.add(raiz);
  return suporte;
}

export function carregarModelos(): Promise<void> {
  if (carregamento) return carregamento;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const tarefas = (Object.entries(RECEITAS) as [ModeloKey, Receita][]).map(
    ([key, r]) =>
      new Promise<void>((resolve) => {
        loader.load(
          `/models/${r.arquivo}`,
          (gltf) => {
            prontos.set(key, preparar(gltf.scene, r));
            resolve();
          },
          undefined,
          () => resolve(),
        );
      }),
  );
  carregamento = Promise.all(tarefas).then(() => undefined);
  return carregamento;
}

export function modeloPronto(key: ModeloKey) {
  return prontos.has(key);
}

export function makeModelo(key: ModeloKey): THREE.Object3D | null {
  const base = prontos.get(key);
  if (!base) return null;
  const copia = base.clone(true);
  copia.traverse((child) => {
    child.userData.compartilhado = true;
  });
  return copia;
}
